const AWS = require('aws-sdk');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const input = event.arguments.input;
    const objectId = uuidv4();
    const createdAt = new Date().toISOString();

    const item = {
        objectId: objectId,
        createdAt: createdAt,
        ...input, // Spread input fields onto the item
    };

    // Ensure non-nullable fields have values, even if not provided in input
    // This is a safeguard, schema validation should ideally catch this earlier,
    // but adding defaults here makes the resolver more robust.
    if (item.name === undefined || item.name === null) item.name = ''; // Assuming name cannot be empty string
    if (item.objectCategory === undefined || item.objectCategory === null) item.objectCategory = 'ITEM'; // Default category
    if (item.width === undefined || item.width === null) item.width = 0.0;
    if (item.length === undefined || item.length === null) item.length = 0.0;
    if (item.height === undefined || item.height === null) item.height = 0.0;
    if (item.weight === undefined || item.weight === null) item.weight = 0.0;
    if (item.penetration === undefined || item.penetration === null) item.penetration = 0.0;
    if (item.deflection === undefined || item.deflection === null) item.deflection = 0.0;
    if (item.impact === undefined || item.impact === null) item.impact = 0.0;
    if (item.absorption === undefined || item.absorption === null) item.absorption = 0.0;
    // hitPoints is a complex type (StatValueInput), handle separately if needed
    if (item.damageMin === undefined || item.damageMin === null) item.damageMin = 0.0;
    if (item.damageMax === undefined || item.damageMax === null) item.damageMax = 0.0;
    if (item.damageType === undefined || item.damageType === null) item.damageType = 'KINETIC'; // Default damage type
    if (item.isLimb === undefined || item.isLimb === null) item.isLimb = false;
    if (item.noise === undefined || item.noise === null) item.noise = 0.0;
    if (item.duration === undefined || item.duration === null) item.duration = 0.0;
    if (item.handling === undefined || item.handling === null) item.handling = 0.0;
    if (item.capacity === undefined || item.capacity === null) item.capacity = 0.0;
    if (item.falloff === undefined || item.falloff === null) item.falloff = 0.0;

    // Handle nested StatValueInput for hitPoints
    if (item.hitPoints) {
        if (item.hitPoints.current === undefined || item.hitPoints.current === null) item.hitPoints.current = 0;
        // max can be null based on schema
    } else {
         // If hitPoints is not provided, create a default StatValue
         item.hitPoints = { current: 0, max: null };
    }

    // Handle lists: partsIds and usage
    if (item.partsIds === undefined || item.partsIds === null) item.partsIds = [];
    if (item.usage === undefined || item.usage === null) item.usage = [];


    try {
        const params = {
            TableName: OBJECTS_TABLE_NAME,
            Item: item,
        };

        await ddbDocClient.send(new PutCommand(params));
        console.log('DynamoDB Put result: Success');

        return item; // Return the created item
    } catch (error) {
        console.error('Error creating object in DynamoDB:', error);
        throw new Error('Error creating object.');
    }
};
