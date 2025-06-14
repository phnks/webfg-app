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
    fatigue: input.fatigue || 0,
    values: input.values || [],
    speed: input.speed,
    weight: input.weight,
    size: input.size,
    armour: input.armour,
    endurance: input.endurance,
    lethality: input.lethality,
    strength: input.strength,
    dexterity: input.dexterity,
    agility: input.agility,
    perception: input.perception,
    intensity: input.intensity,
    resolve: input.resolve,
    morale: input.morale,
    intelligence: input.intelligence,
    charisma: input.charisma,
    actionIds: input.actionIds || [],
    special: input.special || [],
    stashIds: input.stashIds || [],
    equipmentIds: input.equipmentIds || [],
    readyIds: input.readyIds || []
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