const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const THOUGHTS_TABLE_NAME = process.env.THOUGHTS_TABLE_NAME;

exports.handler = async (event) => {
    const { input } = event;
    const thoughtId = uuidv4();
    const createdAt = new Date().toISOString();

    const item = {
        thoughtId: thoughtId,
        createdAt: createdAt,
        ...input,
    };

    // Ensure required fields have values
    if (item.name === undefined || item.name === null) item.name = '';
    
    // Add lowercase name for case-insensitive searching
    item.nameLowerCase = item.name.toLowerCase();
    
    // Add lowercase description for case-insensitive searching if description exists
    if (item.description) {
        item.descriptionLowerCase = item.description.toLowerCase();
    }

    try {
        const params = {
            TableName: THOUGHTS_TABLE_NAME,
            Item: item,
        };

        await ddbDocClient.send(new PutCommand(params));

        return item;
    } catch (error) {
        console.error('Error creating thought in DynamoDB:', error);
        throw new Error('Error creating thought.');
    }
};