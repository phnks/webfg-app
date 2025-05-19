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

  const { input } = event;
  const characterId = uuidv4();

  const item = {
    characterId: characterId,
    name: input.name,
    characterCategory: input.characterCategory,
    will: input.will || 0,
    values: input.values || [],
    lethality: input.lethality,
    armour: input.armour,
    endurance: input.endurance,
    strength: input.strength,
    dexterity: input.dexterity,
    agility: input.agility,
    perception: input.perception,
    charisma: input.charisma,
    intelligence: input.intelligence,
    resolve: input.resolve,
    morale: input.morale,
    actionIds: input.actionIds || [],
    special: input.special || [],
    inventoryIds: input.inventoryIds || [],
    equipmentIds: input.equipmentIds || []
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