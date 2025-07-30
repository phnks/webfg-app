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

        // Debug logging for raceOverride from DynamoDB
        console.log("DEBUG getCharacter - Raw character.raceOverride from DB:", character.raceOverride, "type:", typeof character.raceOverride);

        // Ensure all attributes have default values if they don't exist
        const defaultAttribute = {
            attribute: {
                attributeValue: 0.0,
                isGrouped: true
            }
        };

        // List of all expected attributes (updated to match current schema)
        const allAttributes = [
            'speed', 'weight', 'size', 'armour', 'endurance', 'lethality', 'penetration', 'complexity',
            'strength', 'dexterity', 'agility', 'obscurity', 'resolve', 
            'morale', 'intelligence', 'charisma', 'seeing', 'hearing', 
            'light', 'noise'
        ];

        // Add default values for any missing attributes and fix legacy data format
        allAttributes.forEach(attr => {
            if (!character[attr]) {
                // Missing attribute - add default
                character[attr] = defaultAttribute;
            } else if (typeof character[attr] === 'number') {
                // Legacy format - convert plain number to GraphQL structure
                character[attr] = {
                    attribute: {
                        attributeValue: parseFloat(character[attr]),
                        isGrouped: true
                    }
                };
            }
        });

        // Handle mind field for backward compatibility
        if (!character.mind) {
            character.mind = [];
        }

        // Handle race field for backward compatibility
        if (!character.race) {
            character.race = 'HUMAN';
        }
        // Explicitly handle raceOverride boolean field
        if (character.raceOverride === undefined || character.raceOverride === null) {
            character.raceOverride = false;
        } else {
            // Ensure it's a proper boolean value
            character.raceOverride = Boolean(character.raceOverride);
        }

        // Debug logging after boolean handling
        console.log("DEBUG getCharacter - Final character.raceOverride after processing:", character.raceOverride, "type:", typeof character.raceOverride);
        console.log("DEBUG getCharacter - Penetration attribute:", JSON.stringify(character.penetration, null, 2));
        console.log("DEBUG getCharacter - All Body attributes:", {
            weight: character.weight?.attribute?.attributeValue,
            size: character.size?.attribute?.attributeValue,
            armour: character.armour?.attribute?.attributeValue,
            endurance: character.endurance?.attribute?.attributeValue,
            lethality: character.lethality?.attribute?.attributeValue,
            penetration: character.penetration?.attribute?.attributeValue,
            complexity: character.complexity?.attribute?.attributeValue
        });
        console.log(`Successfully retrieved character: ${character.name} (${characterId})`);
        return character;

    } catch (error) {
        console.error('Error getting character from DynamoDB:', error);
        throw new Error(`Error fetching character: ${error.message}`);
    }
};