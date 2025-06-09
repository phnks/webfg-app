const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { calculateGroupedAttributes, calculateObjectGroupedAttributes } = require('../utils/attributeGrouping');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log("Received event for resolveGroupedAttributes:", JSON.stringify(event, null, 2));

  // Source contains the parent Character or Object
  const entity = event.source;
  const typeName = event.info.parentTypeName; // 'Character' or 'Object'
  
  // Log if character has conditions
  if (typeName === 'Character' && entity.characterConditions && entity.characterConditions.length > 0) {
    console.log(`[DEBUG] Character ${entity.name || 'unknown'} has ${entity.characterConditions.length} conditions:`, entity.characterConditions);
  }

  if (!entity) {
    console.log("No entity found, returning empty grouped attributes.");
    return {
      lethality: null,
      armour: null,
      endurance: null,
      strength: null,
      dexterity: null,
      agility: null,
      perception: null,
      charisma: null,
      intelligence: null,
      resolve: null,
      morale: null
    };
  }

  try {
    let groupedAttributes;
    
    if (typeName === 'Character') {
      // For characters, we need to ensure we have full equipment data
      const enrichedCharacter = await enrichCharacterWithEquipment(entity);
      console.log("Enriched character equipment:", JSON.stringify(enrichedCharacter.equipment, null, 2));
      
      // Log if we found conditions during enrichment
      if (enrichedCharacter.conditions && enrichedCharacter.conditions.length > 0) {
        console.log(`[DEBUG] Enriched character with ${enrichedCharacter.conditions.length} conditions:`, JSON.stringify(enrichedCharacter.conditions, null, 2));
      } else {
        console.log(`[DEBUG] Enriched character has NO conditions`); 
      }
      
      groupedAttributes = calculateGroupedAttributes(enrichedCharacter);
    } else if (typeName === 'Object') {
      // For objects, we need to ensure we have full equipment data
      const enrichedObject = await enrichObjectWithEquipment(entity);
      console.log("Enriched object equipment:", JSON.stringify(enrichedObject.equipment, null, 2));
      groupedAttributes = calculateObjectGroupedAttributes(enrichedObject);
    } else {
      throw new Error(`Unknown entity type: ${typeName}`);
    }

    // Ensure all fields are present even if null
    const result = {
      lethality: groupedAttributes.lethality || null,
      armour: groupedAttributes.armour || null,
      endurance: groupedAttributes.endurance || null,
      strength: groupedAttributes.strength || null,
      dexterity: groupedAttributes.dexterity || null,
      agility: groupedAttributes.agility || null,
      perception: groupedAttributes.perception || null,
      charisma: groupedAttributes.charisma || null,
      intelligence: groupedAttributes.intelligence || null,
      resolve: groupedAttributes.resolve || null,
      morale: groupedAttributes.morale || null
    };

    console.log("Calculated grouped attributes:", JSON.stringify(result, null, 2));
    
    // Debug: Check for expected attribute changes due to conditions
    if (typeName === 'Character' && entity.characterConditions && entity.characterConditions.length > 0) {
      console.log(`[DEBUG] Checking for expected condition effects:`);
      const enrichedCharacter = await enrichCharacterWithEquipment(entity);
      
      if (enrichedCharacter.conditions) {
        enrichedCharacter.conditions.forEach(condition => {
          if (condition.conditionTarget && condition.amount) {
            const targetAttr = condition.conditionTarget.toLowerCase();
            const baseValue = entity[targetAttr]?.attribute?.attributeValue;
            const groupedValue = result[targetAttr];
            
            console.log(`[DEBUG] Condition '${condition.name}' targeting ${targetAttr}:`);
            console.log(`  - Base value: ${baseValue}`);
            console.log(`  - Expected ${condition.conditionType === 'HELP' ? '+' : '-'}${condition.amount}`);
            console.log(`  - Grouped value: ${groupedValue}`);
          }
        });
      }
    }
    
    return result;

  } catch (error) {
    console.error("Error calculating grouped attributes:", error);
    throw new Error(`Failed to calculate grouped attributes: ${error.message}`);
  }
};

async function enrichCharacterWithEquipment(character) {
  // Enrich with equipment
  let equipment = [];
  if (character.equipmentIds && character.equipmentIds.length > 0) {
    for (const objectId of character.equipmentIds) {
      try {
        const result = await docClient.send(new GetCommand({
          TableName: process.env.OBJECTS_TABLE,
          Key: { objectId }
        }));
        
        if (result.Item) {
          equipment.push(result.Item);
        }
      } catch (error) {
        console.error(`Error fetching object ${objectId}:`, error);
      }
    }
  }

  // Enrich with conditions
  let conditions = [];
  if (character.characterConditions && character.characterConditions.length > 0) {
    for (const characterCondition of character.characterConditions) {
      try {
        const conditionId = characterCondition.conditionId;
        const result = await docClient.send(new GetCommand({
          TableName: process.env.CONDITIONS_TABLE,
          Key: { conditionId }
        }));
        
        if (result.Item) {
          // Add the amount from characterCondition to the condition object
          conditions.push({
            ...result.Item,
            amount: characterCondition.amount
          });
        }
      } catch (error) {
        console.error(`Error fetching condition ${characterCondition.conditionId}:`, error);
      }
    }
  }

  return { ...character, equipment, conditions };
}

async function enrichObjectWithEquipment(object) {
  if (!object.equipmentIds || object.equipmentIds.length === 0) {
    return { ...object, equipment: [] };
  }

  const equipment = [];
  
  for (const objectId of object.equipmentIds) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: process.env.OBJECTS_TABLE,
        Key: { objectId }
      }));
      
      if (result.Item) {
        equipment.push(result.Item);
      }
    } catch (error) {
      console.error(`Error fetching object ${objectId}:`, error);
    }
  }

  return { ...object, equipment };
}