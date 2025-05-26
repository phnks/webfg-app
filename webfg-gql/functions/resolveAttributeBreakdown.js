const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { calculateAttributeBreakdown, calculateObjectAttributeBreakdown } = require('../utils/attributeBreakdown');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log("Received event for resolveAttributeBreakdown:", JSON.stringify(event, null, 2));

  // Source contains the parent Character or Object
  const entity = event.source;
  const typeName = event.info.parentTypeName; // 'Character' or 'Object'
  const attributeName = event.arguments.attributeName;

  if (!entity) {
    console.log("No entity found, returning empty breakdown.");
    return [];
  }

  if (!attributeName) {
    console.log("No attribute name provided, returning empty breakdown.");
    return [];
  }

  try {
    let breakdown;
    
    if (typeName === 'Character') {
      // For characters, we need to ensure we have full equipment data
      const enrichedCharacter = await enrichCharacterWithEquipment(entity);
      console.log("Enriched character for breakdown:", JSON.stringify(enrichedCharacter, null, 2));
      breakdown = calculateAttributeBreakdown(enrichedCharacter, attributeName);
    } else if (typeName === 'Object') {
      // For objects, we need to ensure we have full equipment data
      const enrichedObject = await enrichObjectWithEquipment(entity);
      console.log("Enriched object for breakdown:", JSON.stringify(enrichedObject, null, 2));
      breakdown = calculateObjectAttributeBreakdown(enrichedObject, attributeName);
    } else {
      throw new Error(`Unknown entity type: ${typeName}`);
    }

    console.log(`Calculated breakdown for ${attributeName}:`, JSON.stringify(breakdown, null, 2));
    return breakdown;

  } catch (error) {
    console.error("Error calculating attribute breakdown:", error);
    throw new Error(`Failed to calculate attribute breakdown: ${error.message}`);
  }
};

async function enrichCharacterWithEquipment(character) {
  if (!character.equipmentIds || character.equipmentIds.length === 0) {
    return { ...character, equipment: [] };
  }

  const equipment = [];
  
  for (const objectId of character.equipmentIds) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: process.env.OBJECTS_TABLE,
        Key: { objectId }
      }));
      
      if (result.Item) {
        // Recursively enrich equipment if they have their own equipment
        const enrichedEquipment = await enrichObjectWithEquipment(result.Item);
        equipment.push(enrichedEquipment);
      }
    } catch (error) {
      console.error(`Error fetching object ${objectId}:`, error);
    }
  }

  return { ...character, equipment };
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