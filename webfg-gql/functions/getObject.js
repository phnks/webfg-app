// Removed: const AWS = require('aws-sdk');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb'); // Added GetCommand
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
    // console.log('Received event:', JSON.stringify(event, null, 2));

    const { objectId } = event; // Corrected: Access arguments directly from event

    try {
        const params = {
            TableName: OBJECTS_TABLE_NAME,
            Key: {
                objectId: objectId,
            },
        };

        // Corrected to use send with GetCommand
        const command = new GetCommand(params); 
        const result = await ddbDocClient.send(command); 
        // console.log('DynamoDB Get result:', JSON.stringify(result, null, 2));
        
        const object = result.Item;
        
        if (!object) {
            return undefined; // Return undefined when object not found instead of throwing
        }

        // Ensure all attributes have default values if they don't exist
        const defaultAttribute = {
            attributeValue: 0.0,
            isGrouped: true
        };

        // List of all expected attributes
        const allAttributes = [
            'speed', 'weight', 'size', 'armour', 'endurance', 'lethality', 'complexity',
            'strength', 'dexterity', 'agility', 'perception', 'resolve', 
            'morale', 'intelligence', 'charisma', 'seeing', 'hearing', 
            'smelling', 'light', 'noise', 'scent'
        ];

        // Add default values for any missing attributes and fix legacy data format
        allAttributes.forEach(attr => {
            if (!object[attr]) {
                // Missing attribute - add default
                object[attr] = defaultAttribute;
            } else if (typeof object[attr] === 'number') {
                // Legacy format - convert plain number to GraphQL structure
                object[attr] = {
                    attributeValue: parseFloat(object[attr]),
                    isGrouped: true
                };
            }
        });

        console.log(`Successfully retrieved object: ${object.name} (${objectId})`);
        return object;
    } catch (error) {
        console.error('Error getting object from DynamoDB:', error);
        throw new Error('Error fetching object.');
    }
};
