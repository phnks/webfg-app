const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

// --- Configuration ---
const REGION = process.env.AWS_REGION || "us-east-1"; // Or your default region

// Determine environment from command line arguments (default to 'prod')
const environment = process.argv[2] === 'qa' ? 'qa' : 'prod';
console.log(`Targeting environment: ${environment}`);

const serviceName = environment === 'qa' ? 'webfg-gql-qa' : 'webfg-gql';
const skillsTableName = `${serviceName}-Skills`;
const attributesTableName = `${serviceName}-Attributes`;

// --- Enum Values (from GraphQL Schema) ---
const skillNames = [
    "STRIKING", "GRAPPLING", "DODGING", "PARRYING", "BLOCKING", "FEINTING", "DISARMING", "COUNTERING",
    "DAGGERS", "SWORDS", "GREATSWORDS", "AXES", "HAMMERS", "POLEARMS", "THROWBLADES", "JAVELINS",
    "BOWS", "CROSSBOWS", "SIEGE", "GRENADES", "PISTOLS", "SHOTGUNS", "RIFLES", "SNIPERS", "MGS",
    "ROCKETS", "MISSILES", "ARTILLERY", "GUNNERY", "TORPEDOES", "BOMBS", "AMBITS", "SPINDLING",
    "SPINDLE_HANDLING", "THROWING", "SNEAKING", "WEIGHTLIFTING", "SWIMMING", "CLIMBING", "JUMPING",
    "TRACKING", "SPRINTING", "EMOTION_REGULATION"
];

// TODO: Assign appropriate categories based on game design. Using 'PHYSICAL' as a placeholder.
const defaultSkillCategory = "PHYSICAL";

const attributeNames = [
    "STRENGTH", "AGILITY", "DEXTERITY", "ENDURANCE", "INTELLIGENCE", "CHARISMA", "PERCEPTION", "RESOLVE"
];

// --- DynamoDB Client ---
const baseClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(baseClient);

// --- Helper Function for Batch Write ---
async function batchWriteItems(tableName, items) {
    const batchSize = 25; // DynamoDB BatchWriteItem limit
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const params = {
            RequestItems: {
                [tableName]: batch.map(item => ({
                    PutRequest: {
                        Item: item // Use plain JS objects with DocumentClient
                    }
                }))
            }
        };
        try {
            console.log(`Writing batch ${Math.floor(i / batchSize) + 1} to ${tableName}...`);
            // Use BatchWriteCommand from lib-dynamodb with the docClient
            await docClient.send(new BatchWriteCommand(params));
            console.log(`Batch ${Math.floor(i / batchSize) + 1} written successfully to ${tableName}.`);
        } catch (error) {
            console.error(`Error writing batch ${Math.floor(i / batchSize) + 1} to ${tableName}:`, error);
            // Decide if you want to stop on error or continue
            // throw error; // Uncomment to stop on first error
        }
    }
}

// --- Main Population Logic ---
async function populateDefaults() {
    console.log("Starting default data population...");

    // Prepare Skill Items (using plain JS objects)
    const skillItems = skillNames.map(name => ({
        skillId: uuidv4(),
        skillName: name,
        skillCategory: defaultSkillCategory // Using placeholder category
    }));

    // Prepare Attribute Items (using plain JS objects)
    const attributeItems = attributeNames.map(name => ({
        attributeId: uuidv4(),
        attributeName: name
    }));

    // Write to DynamoDB
    try {
        console.log(`Populating ${skillsTableName} with ${skillItems.length} skills...`);
        await batchWriteItems(skillsTableName, skillItems);
        console.log(`Successfully populated ${skillsTableName}.`);

        console.log(`Populating ${attributesTableName} with ${attributeItems.length} attributes...`);
        await batchWriteItems(attributesTableName, attributeItems);
        console.log(`Successfully populated ${attributesTableName}.`);

        console.log("Default data population completed successfully.");
    } catch (error) {
        console.error("Error during default data population:", error);
        process.exit(1); // Exit with error code
    }
}

// --- Execute ---
populateDefaults();
