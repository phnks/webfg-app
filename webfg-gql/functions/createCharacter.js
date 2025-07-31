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
  
  console.log("DEBUG createCharacter - input.penetration:", JSON.stringify(input.penetration, null, 2));

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
    penetration: input.penetration,
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

  // Define which attributes have dynamic dice
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

  // Initialize attributes with default values if not provided
  const getDefaultAttribute = (attributeName) => {
    const dynamicInfo = DYNAMIC_ATTRIBUTES[attributeName];
    return { 
      attribute: { 
        attributeValue: 0, 
        isGrouped: true,
        diceCount: dynamicInfo ? dynamicInfo.defaultCount : null
      } 
    };
  };

  // Process attributes to ensure they have correct structure with diceCount
  const processAttribute = (input, attributeName) => {
    if (!input) return getDefaultAttribute(attributeName);
    
    const dynamicInfo = DYNAMIC_ATTRIBUTES[attributeName];
    const defaultDiceCount = dynamicInfo ? dynamicInfo.defaultCount : null;
    
    // If input is already in nested format, return as-is
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
  
  item.speed = processAttribute(item.speed, 'speed');
  item.weight = processAttribute(item.weight, 'weight');
  item.size = processAttribute(item.size, 'size');
  item.armour = processAttribute(item.armour, 'armour');
  item.endurance = processAttribute(item.endurance, 'endurance');
  item.lethality = processAttribute(item.lethality, 'lethality');
  item.penetration = processAttribute(item.penetration, 'penetration');
  item.complexity = processAttribute(item.complexity, 'complexity');
  item.strength = processAttribute(item.strength, 'strength');
  item.dexterity = processAttribute(item.dexterity, 'dexterity');
  item.agility = processAttribute(item.agility, 'agility');
  item.obscurity = processAttribute(item.obscurity, 'obscurity');
  item.resolve = processAttribute(item.resolve, 'resolve');
  item.morale = processAttribute(item.morale, 'morale');
  item.intelligence = processAttribute(item.intelligence, 'intelligence');
  item.charisma = processAttribute(item.charisma, 'charisma');
  item.seeing = processAttribute(item.seeing, 'seeing');
  item.hearing = processAttribute(item.hearing, 'hearing');
  item.light = processAttribute(item.light, 'light');
  item.noise = processAttribute(item.noise, 'noise');

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