const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
    // console.log('Received event:', JSON.stringify(event, null, 2));

    const { input } = event;
    const objectId = uuidv4();
    const createdAt = new Date().toISOString();

    const item = {
        objectId: objectId,
        createdAt: createdAt,
        ...input,
    };

    // Ensure required fields have values
    if (item.name === undefined || item.name === null) item.name = '';
    if (item.objectCategory === undefined || item.objectCategory === null) item.objectCategory = 'TOOL';
    if (item.isEquipment === undefined || item.isEquipment === null) item.isEquipment = true; // Default to true for backwards compatibility
    
    // Add lowercase name for case-insensitive searching
    item.nameLowerCase = item.name.toLowerCase();
    
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
            attributeValue: 0, 
            isGrouped: true,
            diceCount: dynamicInfo ? dynamicInfo.defaultCount : null
        };
    };

    // Process attributes to ensure they have correct diceCount
    const processAttribute = (input, attributeName) => {
        if (!input) return getDefaultAttribute(attributeName);
        
        const dynamicInfo = DYNAMIC_ATTRIBUTES[attributeName];
        const defaultDiceCount = dynamicInfo ? dynamicInfo.defaultCount : null;
        
        return {
            attributeValue: input.attributeValue || 0,
            isGrouped: input.isGrouped !== undefined ? input.isGrouped : true,
            diceCount: input.diceCount !== undefined ? input.diceCount : defaultDiceCount
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
    
    // Handle arrays
    if (item.special === undefined || item.special === null) item.special = [];
    if (item.equipmentIds === undefined || item.equipmentIds === null) item.equipmentIds = [];

    try {
        const params = {
            TableName: OBJECTS_TABLE_NAME,
            Item: item,
        };

        await ddbDocClient.send(new PutCommand(params));
        // console.log('DynamoDB Put result: Success');

        return item;
    } catch (error) {
        console.error('Error creating object in DynamoDB:', error);
        throw new Error('Error creating object.');
    }
};