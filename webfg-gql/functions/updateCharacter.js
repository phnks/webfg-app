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

  const updateExpressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  // Helper function to add update expression parts
  const addUpdateField = (fieldName, fieldValue, attributeName = fieldName) => {
    if (fieldValue !== undefined) {
      updateExpressionParts.push(`#${attributeName} = :${attributeName}`);
      expressionAttributeNames[`#${attributeName}`] = fieldName;
      expressionAttributeValues[`:${attributeName}`] = fieldValue;
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
  addUpdateField("will", input.will);
  addUpdateField("fatigue", input.fatigue);
  addUpdateField("values", input.values);
  addUpdateField("speed", input.speed);
  addUpdateField("weight", input.weight);
  addUpdateField("size", input.size);
  addUpdateField("armour", input.armour);
  addUpdateField("endurance", input.endurance);
  addUpdateField("lethality", input.lethality);
  addUpdateField("complexity", input.complexity);
  addUpdateField("strength", input.strength);
  addUpdateField("dexterity", input.dexterity);
  addUpdateField("agility", input.agility);
  addUpdateField("perception", input.perception);
  addUpdateField("resolve", input.resolve);
  addUpdateField("morale", input.morale);
  addUpdateField("intelligence", input.intelligence);
  addUpdateField("charisma", input.charisma);
  addUpdateField("seeing", input.seeing);
  addUpdateField("hearing", input.hearing);
  addUpdateField("smelling", input.smelling);
  addUpdateField("light", input.light);
  addUpdateField("noise", input.noise);
  addUpdateField("scent", input.scent);
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
      // console.log("Successfully updated character:", result.Attributes);
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