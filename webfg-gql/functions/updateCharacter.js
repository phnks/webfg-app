const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const tableName = process.env.CHARACTERS_TABLE;
  if (!tableName) {
    console.error("CHARACTERS_TABLE environment variable not set.");
    throw new Error("Internal server error.");
  }

  const args = event.arguments;
  const characterId = args.characterId;

  if (!characterId) {
    console.error("characterId is required for updateCharacter.");
    throw new Error("characterId is required.");
  }

  const updateExpressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  // Dynamically build update expression based on provided arguments
  if (args.name !== undefined) {
    updateExpressionParts.push("#name = :name");
    expressionAttributeNames["#name"] = "name";
    expressionAttributeValues[":name"] = args.name;
  }
  if (args.attributeData !== undefined) {
    updateExpressionParts.push("#attributeData = :attributeData");
    expressionAttributeNames["#attributeData"] = "attributeData";
    expressionAttributeValues[":attributeData"] = args.attributeData;
  }
  if (args.skillData !== undefined) {
    updateExpressionParts.push("#skillData = :skillData");
    expressionAttributeNames["#skillData"] = "skillData";
    expressionAttributeValues[":skillData"] = args.skillData;
  }
  if (args.stats !== undefined) {
    updateExpressionParts.push("#stats = :stats");
    expressionAttributeNames["#stats"] = "stats";
    expressionAttributeValues[":stats"] = args.stats;
  }
  if (args.conditions !== undefined) {
    updateExpressionParts.push("#conditions = :conditions");
    expressionAttributeNames["#conditions"] = "conditions";
    expressionAttributeValues[":conditions"] = args.conditions;
  }
  if (args.actionIds !== undefined) {
    updateExpressionParts.push("#actionIds = :actionIds");
    expressionAttributeNames["#actionIds"] = "actionIds";
    expressionAttributeValues[":actionIds"] = args.actionIds;
  }
  if (args.traitIds !== undefined) {
    updateExpressionParts.push("#traitIds = :traitIds");
    expressionAttributeNames["#traitIds"] = "traitIds";
    expressionAttributeValues[":traitIds"] = args.traitIds;
  }
  if (args.valueData !== undefined) {
    updateExpressionParts.push("#valueData = :valueData");
    expressionAttributeNames["#valueData"] = "valueData";
    expressionAttributeValues[":valueData"] = args.valueData;
  }
  if (args.bodyId !== undefined) {
     // Handle null explicitly if bodyId is nullable
    if (args.bodyId === null) {
       updateExpressionParts.push("#bodyId = :bodyId");
       expressionAttributeNames["#bodyId"] = "bodyId";
       expressionAttributeValues[":bodyId"] = null;
    } else {
       updateExpressionParts.push("#bodyId = :bodyId");
       expressionAttributeNames["#bodyId"] = "bodyId";
       expressionAttributeValues[":bodyId"] = args.bodyId;
    }
  }


  if (updateExpressionParts.length === 0) {
    console.log("No updatable arguments provided.");
    // Optionally fetch and return the existing item if no updates were requested
    // For now, just return the characterId
    return { characterId: characterId };
  }

  const updateExpression = "SET " + updateExpressionParts.join(", ");

  const params = {
    TableName: tableName,
    Key: {
      characterId: characterId,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW", // Return the updated item
  };

  try {
    const result = await ddbDocClient.send(new UpdateCommand(params));
    console.log("Successfully updated character:", result.Attributes);
    return result.Attributes; // Return the updated item
  } catch (error) {
    console.error("Error updating character:", error);
    throw error;
  }
};
