const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const CHARACTERS_TABLE = process.env.CHARACTERS_TABLE;

exports.handler = async (event) => {
    console.log('Received event for getCharacter:', JSON.stringify(event, null, 2));

    const { characterId } = event;

    if (!characterId) {
        throw new Error('characterId is required');
    }

    try {
        // Get character from DynamoDB
        const getCommand = new GetCommand({
            TableName: CHARACTERS_TABLE,
            Key: { characterId }
        });
        
        const response = await ddbDocClient.send(getCommand);
        const character = response.Item;

        if (!character) {
            throw new Error(`Character with ID ${characterId} not found`);
        }

        // Ensure all attributes have default values if they don't exist
        const defaultAttribute = {
            attribute: {
                attributeValue: 0,
                isGrouped: true
            }
        };

        // List of all expected attributes
        const allAttributes = [
            'speed', 'weight', 'size', 'armour', 'endurance', 'lethality',
            'strength', 'dexterity', 'agility', 'perception', 'resolve', 
            'morale', 'intelligence', 'charisma', 'seeing', 'hearing', 
            'smelling', 'light', 'noise', 'scent'
        ];

        // Add default values for any missing attributes
        allAttributes.forEach(attr => {
            if (!character[attr]) {
                character[attr] = defaultAttribute;
            }
        });

        console.log(`Successfully retrieved character: ${character.name} (${characterId})`);
        return character;

    } catch (error) {
        console.error('Error getting character from DynamoDB:', error);
        throw new Error(`Error fetching character: ${error.message}`);
    }
};