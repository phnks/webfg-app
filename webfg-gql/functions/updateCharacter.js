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

  const characterId = event.characterId;

  if (!characterId) {
    console.error("characterId is required for updateCharacter.");
    throw new Error("characterId is required.");
  }

  const updateExpressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  if (event.name !== undefined) {
    updateExpressionParts.push("#name = :name");
    expressionAttributeNames["#name"] = "name";
    expressionAttributeValues[":name"] = event.name;
  }
  if (event.attributeData !== undefined) {
    updateExpressionParts.push("#attributeData = :attributeData");
    expressionAttributeNames["#attributeData"] = "attributeData";
    expressionAttributeValues[":attributeData"] = event.attributeData;
  }
  if (event.skillData !== undefined) {
    updateExpressionParts.push("#skillData = :skillData");
    expressionAttributeNames["#skillData"] = "skillData";
    expressionAttributeValues[":skillData"] = event.skillData;
  }
  if (event.stats !== undefined) {
    updateExpressionParts.push("#stats = :stats");
    expressionAttributeNames["#stats"] = "stats";
    expressionAttributeValues[":stats"] = event.stats;
  }
  if (event.conditions !== undefined) {
    updateExpressionParts.push("#conditions = :conditions");
    expressionAttributeNames["#conditions"] = "conditions";
    expressionAttributeValues[":conditions"] = event.conditions;
  }
  if (event.valueData !== undefined) {
    updateExpressionParts.push("#valueData = :valueData");
    expressionAttributeNames["#valueData"] = "valueData";
    expressionAttributeValues[":valueData"] = event.valueData;
  }
  if (event.bodyId !== undefined) {
    updateExpressionParts.push("#bodyId = :bodyId");
    expressionAttributeNames["#bodyId"] = "bodyId";
    expressionAttributeValues[":bodyId"] = event.bodyId;
  }
  if (event.inventoryIds !== undefined) {
    updateExpressionParts.push("#inventoryIds = :inventoryIds");
    expressionAttributeNames["#inventoryIds"] = "inventoryIds";
    expressionAttributeValues[":inventoryIds"] = event.inventoryIds;
  }
  if (event.equipmentIds !== undefined) {
    updateExpressionParts.push("#equipmentIds = :equipmentIds");
    expressionAttributeNames["#equipmentIds"] = "equipmentIds";
    expressionAttributeValues[":equipmentIds"] = event.equipmentIds;
  }
  if (event.actionIds !== undefined) {
    updateExpressionParts.push("#actionIds = :actionIds");
    expressionAttributeNames["#actionIds"] = "actionIds";
    expressionAttributeValues[":actionIds"] = event.actionIds;
  }

  if (updateExpressionParts.length === 0) {
    console.warn("UpdateCharacter called with only characterId and no actual fields to update. This is not a valid update operation.");
    throw new Error("No fields specified for update. At least one field (e.g., name) must be provided to update a character.");
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

  console.log("Attempting to update character with params:", JSON.stringify(params, null, 2));

  try {
    const result = await ddbDocClient.send(new UpdateCommand(params));
    if (result && result.Attributes && Object.keys(result.Attributes).length > 0) {
      console.log("Successfully updated character:", result.Attributes);
      return result.Attributes;
    } else {
      console.error(`UpdateCharacter Lambda: Character with ID ${characterId} not found, or UpdateCommand returned no/empty attributes. Explicitly returning null.`);
      return null; 
    }
  } catch (error) {
    console.error("Error during DynamoDB UpdateCommand for updateCharacter:", error);
    throw error;
  }
};
