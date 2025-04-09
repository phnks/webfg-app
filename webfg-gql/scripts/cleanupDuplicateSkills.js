const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const { v5: uuidv5 } = require('uuid');

// --- Configuration ---
const REGION = process.env.AWS_REGION || "us-east-1";
const WEBFG_NAMESPACE_UUID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'; // Must match the namespace in populateDefaults.js

// Determine environment from command line arguments (default to 'qa')
const environment = process.argv[2] === 'qa' ? 'qa' : 'prod';
console.log(`Targeting environment for cleanup: ${environment}`);

const serviceName = environment === 'qa' ? 'webfg-gql-qa' : 'webfg-gql';
const skillsTableName = `${serviceName}-Skills`;

// --- DynamoDB Client ---
const baseClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(baseClient);

// --- Helper Function for Batch Delete ---
async function batchDeleteItems(tableName, keysToDelete) {
    const batchSize = 25; // DynamoDB BatchWriteItem limit for deletes
    for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batchKeys = keysToDelete.slice(i, i + batchSize);
        const params = {
            RequestItems: {
                [tableName]: batchKeys.map(key => ({
                    DeleteRequest: {
                        Key: key // Key is { skillId: "..." }
                    }
                }))
            }
        };
        try {
            console.log(`Deleting batch ${Math.floor(i / batchSize) + 1} from ${tableName}...`);
            await docClient.send(new BatchWriteCommand(params));
            console.log(`Batch ${Math.floor(i / batchSize) + 1} deleted successfully from ${tableName}.`);
        } catch (error) {
            console.error(`Error deleting batch ${Math.floor(i / batchSize) + 1} from ${tableName}:`, error);
            // Decide if you want to stop on error or continue
            // throw error; // Uncomment to stop on first error
        }
    }
}

// --- Main Cleanup Logic ---
async function cleanupDuplicates() {
    console.log(`Starting duplicate skill cleanup for table: ${skillsTableName}...`);

    let allSkills = [];
    let lastEvaluatedKey;

    // 1. Scan the entire table
    console.log("Scanning table to fetch all skills...");
    try {
        do {
            const scanParams = {
                TableName: skillsTableName,
                ProjectionExpression: "skillId, skillName",
                ExclusiveStartKey: lastEvaluatedKey,
            };
            const command = new ScanCommand(scanParams); // Use base ScanCommand for projection
            const data = await baseClient.send(command); // Send with base client
            if (data.Items) {
                 // Manually unmarshall projected items
                const items = data.Items.map(item => ({
                    skillId: item.skillId.S,
                    skillName: item.skillName.S
                }));
                allSkills = allSkills.concat(items);
            }
            lastEvaluatedKey = data.LastEvaluatedKey;
        } while (lastEvaluatedKey);
        console.log(`Scan complete. Found ${allSkills.length} total skill entries.`);

    } catch (error) {
        console.error("Error scanning skills table:", error);
        process.exit(1);
    }

    // 2. Group by skillName and identify duplicates
    const skillsByName = {};
    allSkills.forEach(skill => {
        if (!skillsByName[skill.skillName]) {
            skillsByName[skill.skillName] = [];
        }
        skillsByName[skill.skillName].push(skill.skillId);
    });

    const keysToDelete = [];
    let duplicateCount = 0;

    console.log("Identifying duplicates...");
    for (const skillName in skillsByName) {
        const ids = skillsByName[skillName];
        if (ids.length > 1) {
            const correctId = uuidv5(skillName, WEBFG_NAMESPACE_UUID);
            ids.forEach(id => {
                if (id !== correctId) {
                    console.log(`  - Found duplicate for '${skillName}': Incorrect ID ${id} (Correct: ${correctId})`);
                    keysToDelete.push({ skillId: id }); // Key for DeleteRequest
                    duplicateCount++;
                }
            });
        }
    }

    // 3. Delete duplicates
    if (keysToDelete.length > 0) {
        console.log(`Found ${duplicateCount} duplicate entries to delete.`);
        try {
            await batchDeleteItems(skillsTableName, keysToDelete);
            console.log("Duplicate deletion process completed.");
        } catch (error) {
            console.error("Error during duplicate deletion:", error);
            process.exit(1);
        }
    } else {
        console.log("No duplicate skills found.");
    }

    console.log("Duplicate skill cleanup finished.");
}

// --- Execute ---
cleanupDuplicates();
