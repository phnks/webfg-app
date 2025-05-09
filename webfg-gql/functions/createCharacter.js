const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

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
  const characterId = uuidv4();

  const item = {
    characterId: characterId,
    name: args.name,
    attributeData: args.attributeData || [],
    skillData: args.skillData || [],
    stats: args.stats || {},
    conditions: args.conditions || [],
    actionIds: args.actionIds || [],
    traitIds: args.traitIds || [],
    valueData: args.valueData || [],
    bodyId: args.bodyId || null, // bodyId is a single ID now
  };

  const params = {
    TableName: tableName,
    Item: item,
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    console.log("Successfully created character:", item);
    return item; // Return the created item
  } catch (error) {
    console.error("Error creating character:", error);
    throw error;
  }
};
