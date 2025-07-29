const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { calculateReadyGroupedAttributes } = require('../utils/attributeGrouping');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  // console.log("Received event for resolveReadyGroupedAttributes:", JSON.stringify(event, null, 2));

  // Source contains the parent Character
  const character = event.source;
  
  if (!character) {
    // console.log("No character found, returning empty ready grouped attributes.");
    return {
      speed: null,
      weight: null,
      size: null,
      intensity: null,
      lethality: null,
      armour: null,
      endurance: null,
      strength: null,
      dexterity: null,
      agility: null,
      obscurity: null,
      charisma: null,
      intelligence: null,
      resolve: null,
      morale: null
    };
  }

  try {
    // Enrich character with both equipment and ready objects
    const enrichedCharacter = await enrichCharacterWithEquipmentAndReady(character);
    // console.log("Enriched character with equipment and ready objects:", {
    //   equipment: enrichedCharacter.equipment?.length || 0,
    //   ready: enrichedCharacter.ready?.length || 0
    // });
    
    // Calculate ready grouped attributes (includes character + equipment + ready)
    const readyGroupedAttributes = calculateReadyGroupedAttributes(enrichedCharacter);

    // Ensure all fields are present, but preserve 0 values (don't convert to null)
    const result = {
      speed: readyGroupedAttributes.speed !== undefined ? readyGroupedAttributes.speed : null,
      weight: readyGroupedAttributes.weight !== undefined ? readyGroupedAttributes.weight : null,
      size: readyGroupedAttributes.size !== undefined ? readyGroupedAttributes.size : null,
      intensity: readyGroupedAttributes.intensity !== undefined ? readyGroupedAttributes.intensity : null,
      lethality: readyGroupedAttributes.lethality !== undefined ? readyGroupedAttributes.lethality : null,
      armour: readyGroupedAttributes.armour !== undefined ? readyGroupedAttributes.armour : null,
      endurance: readyGroupedAttributes.endurance !== undefined ? readyGroupedAttributes.endurance : null,
      strength: readyGroupedAttributes.strength !== undefined ? readyGroupedAttributes.strength : null,
      dexterity: readyGroupedAttributes.dexterity !== undefined ? readyGroupedAttributes.dexterity : null,
      agility: readyGroupedAttributes.agility !== undefined ? readyGroupedAttributes.agility : null,
      obscurity: readyGroupedAttributes.obscurity !== undefined ? readyGroupedAttributes.obscurity : null,
      charisma: readyGroupedAttributes.charisma !== undefined ? readyGroupedAttributes.charisma : null,
      intelligence: readyGroupedAttributes.intelligence !== undefined ? readyGroupedAttributes.intelligence : null,
      resolve: readyGroupedAttributes.resolve !== undefined ? readyGroupedAttributes.resolve : null,
      morale: readyGroupedAttributes.morale !== undefined ? readyGroupedAttributes.morale : null
    };

    // console.log("Calculated ready grouped attributes:", JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error("Error calculating ready grouped attributes:", error);
    throw new Error(`Failed to calculate ready grouped attributes: ${error.message}`);
  }
};

async function enrichCharacterWithEquipmentAndReady(character) {
  // Create quantity maps from inventoryItems
  const inventoryItems = character.inventoryItems || [];
  const equipmentQuantityMap = new Map();
  const readyQuantityMap = new Map();
  
  inventoryItems.forEach(invItem => {
    if (invItem.inventoryLocation === 'EQUIPMENT') {
      equipmentQuantityMap.set(invItem.objectId, invItem.quantity || 1);
    } else if (invItem.inventoryLocation === 'READY') {
      readyQuantityMap.set(invItem.objectId, invItem.quantity || 1);
    }
  });

  // Enrich with equipment (with quantities)
  let equipment = [];
  if (character.equipmentIds && character.equipmentIds.length > 0) {
    for (const objectId of character.equipmentIds) {
      try {
        const result = await docClient.send(new GetCommand({
          TableName: process.env.OBJECTS_TABLE,
          Key: { objectId }
        }));
        
        if (result.Item) {
          const quantity = equipmentQuantityMap.get(objectId) || 1;
          // Add the item multiple times based on quantity
          for (let i = 0; i < quantity; i++) {
            equipment.push(result.Item);
          }
        }
      } catch (error) {
        console.error(`Error fetching equipment object ${objectId}:`, error);
      }
    }
  }

  // Enrich with ready objects (with quantities)
  let ready = [];
  if (character.readyIds && character.readyIds.length > 0) {
    for (const objectId of character.readyIds) {
      try {
        const result = await docClient.send(new GetCommand({
          TableName: process.env.OBJECTS_TABLE,
          Key: { objectId }
        }));
        
        if (result.Item) {
          const quantity = readyQuantityMap.get(objectId) || 1;
          // Add the item multiple times based on quantity
          for (let i = 0; i < quantity; i++) {
            ready.push(result.Item);
          }
        }
      } catch (error) {
        console.error(`Error fetching ready object ${objectId}:`, error);
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

  return { ...character, equipment, ready, conditions };
}