const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

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
    console.error("characterId is required for deleteCharacter.");
    throw new Error("characterId is required.");
  }

  const params = {
    TableName: tableName,
    Key: {
      characterId: characterId,
    },
    ReturnValues: "ALL_OLD", // Return the deleted item
  };

  try {
    const result = await ddbDocClient.send(new DeleteCommand(params));
    console.log("Successfully deleted character:", result.Attributes);
    return result.Attributes; // Return the deleted item
  } catch (error) {
    console.error("Error deleting character:", error);
    throw error;
  }
};
