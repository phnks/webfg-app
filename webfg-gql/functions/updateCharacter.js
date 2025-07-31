const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("Received event for updateCharacter:", JSON.stringify(event, null, 2));

  const tableName = process.env.CHARACTERS_TABLE;
  if (!tableName) {
    console.error("CHARACTERS_TABLE environment variable not set.");
    throw new Error("Internal server error: CHARACTERS_TABLE not set.");
  }

  const { characterId, input } = event;

  if (!characterId) {
    console.error("characterId is required for updateCharacter.");
    throw new Error("characterId is required.");
  }

  // Debug logging for raceOverride and penetration
  console.log("DEBUG updateCharacter - input.raceOverride:", input.raceOverride, "type:", typeof input.raceOverride);
  console.log("DEBUG updateCharacter - input.penetration:", JSON.stringify(input.penetration, null, 2));

  // Define which attributes have dynamic dice - same as createCharacter.js
  const DYNAMIC_ATTRIBUTES = {
    speed: { diceType: 'd4', defaultCount: 1 },
    agility: { diceType: 'd6', defaultCount: 1 },
    dexterity: { diceType: 'd8', defaultCount: 1 },
    strength: { diceType: 'd10', defaultCount: 1 },
    charisma: { diceType: 'd12', defaultCount: 1 },
    seeing: { diceType: 'd20', defaultCount: 1 },
    hearing: { diceType: 'd20', defaultCount: 1 },
    intelligence: { diceType: 'd100', defaultCount: 1 }
  };

  // Process attributes to ensure they have correct diceCount - same logic as createCharacter.js
  const processAttribute = (input, attributeName) => {
    if (!input) return null;
    
    const dynamicInfo = DYNAMIC_ATTRIBUTES[attributeName];
    const defaultDiceCount = dynamicInfo ? dynamicInfo.defaultCount : null;
    
    // If input is already in nested format, process it
    if (input.attribute) {
      return {
        attribute: {
          attributeValue: input.attribute.attributeValue || 0,
          isGrouped: input.attribute.isGrouped !== undefined ? input.attribute.isGrouped : true,
          diceCount: input.attribute.diceCount !== undefined ? input.attribute.diceCount : defaultDiceCount
        }
      };
    }
    
    // If input is in GraphQL input format, wrap it
    return {
      attribute: {
        attributeValue: input.attributeValue || 0,
        isGrouped: input.isGrouped !== undefined ? input.isGrouped : true,
        diceCount: input.diceCount !== undefined ? input.diceCount : defaultDiceCount
      }
    };
  };

  const updateExpressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  // Helper function to add update expression parts
  const addUpdateField = (fieldName, fieldValue, attributeName = fieldName) => {
    if (fieldValue !== undefined) {
      updateExpressionParts.push(`#${attributeName} = :${attributeName}`);
      expressionAttributeNames[`#${attributeName}`] = fieldName;
      // Special handling for boolean fields to ensure they're stored as proper booleans
      if (fieldName === 'raceOverride' && fieldValue !== null) {
        expressionAttributeValues[`:${attributeName}`] = Boolean(fieldValue);
      } else {
        expressionAttributeValues[`:${attributeName}`] = fieldValue;
      }
    }
  };

  // Update fields from input
  addUpdateField("name", input.name);
  // Update nameLowerCase whenever name is updated
  if (input.name !== undefined) {
    addUpdateField("nameLowerCase", input.name.toLowerCase());
  }
  addUpdateField("description", input.description);
  addUpdateField("characterCategory", input.characterCategory);
  addUpdateField("race", input.race);
  addUpdateField("raceOverride", input.raceOverride);
  addUpdateField("will", input.will);
  addUpdateField("fatigue", input.fatigue);
  addUpdateField("values", input.values);
  addUpdateField("speed", processAttribute(input.speed, 'speed'));
  addUpdateField("weight", processAttribute(input.weight, 'weight'));
  addUpdateField("size", processAttribute(input.size, 'size'));
  addUpdateField("armour", processAttribute(input.armour, 'armour'));
  addUpdateField("endurance", processAttribute(input.endurance, 'endurance'));
  addUpdateField("lethality", processAttribute(input.lethality, 'lethality'));
  addUpdateField("penetration", processAttribute(input.penetration, 'penetration'));
  addUpdateField("complexity", processAttribute(input.complexity, 'complexity'));
  addUpdateField("strength", processAttribute(input.strength, 'strength'));
  addUpdateField("dexterity", processAttribute(input.dexterity, 'dexterity'));
  addUpdateField("agility", processAttribute(input.agility, 'agility'));
  addUpdateField("obscurity", processAttribute(input.obscurity, 'obscurity'));
  addUpdateField("resolve", processAttribute(input.resolve, 'resolve'));
  addUpdateField("morale", processAttribute(input.morale, 'morale'));
  addUpdateField("intelligence", processAttribute(input.intelligence, 'intelligence'));
  addUpdateField("charisma", processAttribute(input.charisma, 'charisma'));
  addUpdateField("seeing", processAttribute(input.seeing, 'seeing'));
  addUpdateField("hearing", processAttribute(input.hearing, 'hearing'));
  addUpdateField("light", processAttribute(input.light, 'light'));
  addUpdateField("noise", processAttribute(input.noise, 'noise'));
  addUpdateField("actionIds", input.actionIds);
  addUpdateField("special", input.special);
  addUpdateField("stashIds", input.stashIds);
  addUpdateField("equipmentIds", input.equipmentIds);
  addUpdateField("readyIds", input.readyIds);
  addUpdateField("targetAttributeTotal", input.targetAttributeTotal);
  addUpdateField("mind", input.mind);
  addUpdateField("characterConditions", input.characterConditions);

  if (updateExpressionParts.length === 0) {
    console.warn("UpdateCharacter called with only characterId and no actual fields to update.");
    throw new Error("No fields specified for update.");
  }

  const updateExpression = "SET " + updateExpressionParts.join(", ");

  const params = {
    TableName: tableName,
    Key: { characterId: characterId },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  };

  // console.log("Attempting to update character with params:", JSON.stringify(params, null, 2));

  try {
    const result = await ddbDocClient.send(new UpdateCommand(params));
    if (result && result.Attributes && Object.keys(result.Attributes).length > 0) {
      // Debug logging for raceOverride after update
      console.log("DEBUG updateCharacter - result.Attributes.raceOverride:", result.Attributes.raceOverride, "type:", typeof result.Attributes.raceOverride);
      return result.Attributes;
    } else {
      console.error(`UpdateCharacter Lambda: Character with ID ${characterId} not found`);
      return null; 
    }
  } catch (error) {
    console.error("Error during DynamoDB UpdateCommand for updateCharacter:", error);
    throw error;
  }
};