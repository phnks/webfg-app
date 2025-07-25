const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  // console.log("Received event:", JSON.stringify(event, null, 2));

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
    nameLowerCase: input.name.toLowerCase(),
    description: input.description,
    characterCategory: input.characterCategory,
    race: input.race || 'HUMAN', // Default to HUMAN for backwards compatibility
    raceOverride: input.raceOverride !== undefined ? Boolean(input.raceOverride) : false, // Ensure proper boolean
    will: input.will || 0,
    fatigue: input.fatigue || 0,
    values: input.values || [],
    speed: input.speed,
    weight: input.weight,
    size: input.size,
    armour: input.armour,
    endurance: input.endurance,
    lethality: input.lethality,
    complexity: input.complexity,
    strength: input.strength,
    dexterity: input.dexterity,
    agility: input.agility,
    obscurity: input.obscurity,
    resolve: input.resolve,
    morale: input.morale,
    intelligence: input.intelligence,
    charisma: input.charisma,
    seeing: input.seeing,
    hearing: input.hearing,
    light: input.light,
    noise: input.noise,
    actionIds: input.actionIds || [],
    special: input.special || [],
    stashIds: input.stashIds || [],
    equipmentIds: input.equipmentIds || [],
    readyIds: input.readyIds || [],
    targetAttributeTotal: input.targetAttributeTotal || null,
    mind: input.mind || [],
    characterConditions: input.characterConditions || []
  };

  // Initialize attributes with default values if not provided
  const defaultAttribute = { 
    attribute: { 
      attributeValue: 0, 
      isGrouped: true 
    } 
  };
  
  if (!item.speed) item.speed = defaultAttribute;
  if (!item.weight) item.weight = defaultAttribute;
  if (!item.size) item.size = defaultAttribute;
  if (!item.armour) item.armour = defaultAttribute;
  if (!item.endurance) item.endurance = defaultAttribute;
  if (!item.lethality) item.lethality = defaultAttribute;
  if (!item.complexity) item.complexity = defaultAttribute;
  if (!item.strength) item.strength = defaultAttribute;
  if (!item.dexterity) item.dexterity = defaultAttribute;
  if (!item.agility) item.agility = defaultAttribute;
  if (item.obscurity === undefined || item.obscurity === null) item.obscurity = defaultAttribute;
  if (!item.resolve) item.resolve = defaultAttribute;
  if (!item.morale) item.morale = defaultAttribute;
  if (!item.intelligence) item.intelligence = defaultAttribute;
  if (!item.charisma) item.charisma = defaultAttribute;
  if (!item.seeing) item.seeing = defaultAttribute;
  if (!item.hearing) item.hearing = defaultAttribute;
  if (!item.light) item.light = defaultAttribute;
  if (!item.noise) item.noise = defaultAttribute;

  const params = {
    TableName: tableName,
    Item: item,
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    // console.log("Successfully created character:", item);
    return item; // Return the created item
  } catch (error) {
    console.error("Error creating character:", error);
    throw error;
  }
};