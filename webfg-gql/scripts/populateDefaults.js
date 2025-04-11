const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const { v5: uuidv5 } = require('uuid'); // Import v5

// --- Configuration ---
const REGION = process.env.AWS_REGION || "us-east-1"; // Or your default region
const WEBFG_NAMESPACE_UUID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'; // Namespace for deterministic UUIDs

// Determine environment and deployment ID from command line arguments
const environment = process.argv[2] === 'qa' ? 'qa' : 'prod'; // Arg 2: 'qa' or 'prod'
const deploymentId = process.argv[3] && process.argv[3] !== 'none' ? process.argv[3] : null; // Arg 3: Deployment ID or 'none'

console.log(`Targeting environment: ${environment}${deploymentId ? ` (Deployment ID: ${deploymentId})` : ''}`);

// Construct service name based on environment and deployment ID
let serviceNameSuffix = '';
if (environment === 'qa') {
  serviceNameSuffix = deploymentId ? `-qa${deploymentId}` : '-qa';
}
const baseServiceName = 'webfg-gql'; // Assuming this is the base name from config
const serviceName = `${baseServiceName}${serviceNameSuffix}`;

const skillsTableName = `${serviceName}-Skills`;
const attributesTableName = `${serviceName}-Attributes`;

// --- Enum Values & Categories (from GraphQL Schema & Rulebook) ---
const skillCategories = {
    // Weapon Skills
    DAGGERS: "WEAPONS",
    SWORDS: "WEAPONS",
    GREATSWORDS: "WEAPONS",
    AXES: "WEAPONS",
    HAMMERS: "WEAPONS",
    POLEARMS: "WEAPONS",
    THROWBLADES: "WEAPONS",
    JAVELINS: "WEAPONS",
    BOWS: "WEAPONS",
    CROSSBOWS: "WEAPONS",
    SIEGE: "WEAPONS",
    GRENADES: "WEAPONS",
    PISTOLS: "WEAPONS",
    SHOTGUNS: "WEAPONS",
    RIFLES: "WEAPONS",
    SNIPERS: "WEAPONS",
    MGS: "WEAPONS",
    ROCKETS: "WEAPONS",
    MISSILES: "WEAPONS",
    ARTILLERY: "WEAPONS",
    GUNNERY: "WEAPONS",
    TORPEDOES: "WEAPONS",
    BOMBS: "WEAPONS",
    // Combat Skills
    STRIKING: "COMBAT",
    GRAPPLING: "COMBAT",
    DODGING: "COMBAT",
    PARRYING: "COMBAT",
    BLOCKING: "COMBAT",
    FEINTING: "COMBAT",
    DISARMING: "COMBAT",
    COUNTERING: "COMBAT",
    // Technical Skills
    AMBITS: "TECHNICAL",
    SPINDLING: "TECHNICAL",
    SPINDLE_HANDLING: "TECHNICAL",
    // Physical Skills
    THROWING: "PHYSICAL",
    SNEAKING: "PHYSICAL",
    WEIGHTLIFTING: "PHYSICAL",
    SWIMMING: "PHYSICAL",
    CLIMBING: "PHYSICAL",
    JUMPING: "PHYSICAL",
    TRACKING: "PHYSICAL",
    SPRINTING: "PHYSICAL",
    // Intrapersonal Skills
    EMOTION_REGULATION: "INTRAPERSONAL"
};

const skillNames = Object.keys(skillCategories);

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
    console.log("Starting default data population (upserting)...");

    // Prepare Skill Items (using deterministic UUIDs)
    const skillItems = skillNames.map(name => ({
        skillId: uuidv5(name, WEBFG_NAMESPACE_UUID), // Use v5 with namespace
        skillName: name,
        skillCategory: skillCategories[name] // Use mapped category
    }));

    // Prepare Attribute Items (using deterministic UUIDs)
    const attributeItems = attributeNames.map(name => ({
        attributeId: uuidv5(name, WEBFG_NAMESPACE_UUID), // Use v5 with namespace
        attributeName: name
    }));

    // Write to DynamoDB (BatchWriteCommand handles upserts automatically)
    try {
        console.log(`Upserting ${skillItems.length} skills into ${skillsTableName}...`);
        await batchWriteItems(skillsTableName, skillItems);
        console.log(`Successfully upserted skills into ${skillsTableName}.`);

        console.log(`Upserting ${attributeItems.length} attributes into ${attributesTableName}...`);
        await batchWriteItems(attributesTableName, attributeItems);
        console.log(`Successfully upserted attributes into ${attributesTableName}.`);

        console.log("Default data population/update completed successfully.");
    } catch (error) {
        console.error("Error during default data population/update:", error);
        process.exit(1); // Exit with error code
    }
}

// --- Execute ---
populateDefaults();
