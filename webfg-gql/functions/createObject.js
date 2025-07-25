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
    
    // Initialize attributes with default values if not provided
    const defaultAttribute = { current: 0, max: 0, base: 0 };
    
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
    if (!item.obscurity) item.obscurity = defaultAttribute;
    if (!item.resolve) item.resolve = defaultAttribute;
    if (!item.morale) item.morale = defaultAttribute;
    if (!item.intelligence) item.intelligence = defaultAttribute;
    if (!item.charisma) item.charisma = defaultAttribute;
    if (!item.seeing) item.seeing = defaultAttribute;
    if (!item.hearing) item.hearing = defaultAttribute;
    if (!item.light) item.light = defaultAttribute;
    if (!item.noise) item.noise = defaultAttribute;
    
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