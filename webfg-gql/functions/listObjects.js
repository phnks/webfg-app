
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const { filter } = event; // Corrected: Access arguments directly from event

    const params = {
        TableName: OBJECTS_TABLE_NAME,
    };

    // Build filter expression if filters are provided
    if (filter) {
        const filterExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        if (filter.name) {
            if (filter.name.eq) {
                filterExpressions.push('#name = :name_eq');
                expressionAttributeNames['#name'] = 'name';
                expressionAttributeValues[':name_eq'] = filter.name.eq;
            }
            if (filter.name.contains) {
                filterExpressions.push('contains(#name, :name_contains)');
                expressionAttributeNames['#name'] = 'name';
                expressionAttributeValues[':name_contains'] = filter.name.contains;
            }
            if (filter.name.beginsWith) {
                filterExpressions.push('begins_with(#name, :name_beginsWith)');
                expressionAttributeNames['#name'] = 'name';
                expressionAttributeValues[':name_beginsWith'] = filter.name.beginsWith;
            }
        }

        if (filter.objectCategory) {
            filterExpressions.push('#objectCategory = :objectCategory_eq');
            expressionAttributeNames['#objectCategory'] = 'objectCategory';
            expressionAttributeValues[':objectCategory_eq'] = filter.objectCategory;
        }

        if (filter.maxWeight) {
            filterExpressions.push('#weight <= :weight_lte');
            expressionAttributeNames['#weight'] = 'weight';
            expressionAttributeValues[':weight_lte'] = filter.maxWeight;
        }

        if (filterExpressions.length > 0) {
            params.FilterExpression = filterExpressions.join(' AND ');
            if (Object.keys(expressionAttributeNames).length > 0) {
               params.ExpressionAttributeNames = expressionAttributeNames;
            }
            if (Object.keys(expressionAttributeValues).length > 0) {
               params.ExpressionAttributeValues = expressionAttributeValues;
            }
        }
    }

    try {
        console.log("Executing Scan with params:", JSON.stringify(params, null, 2));
        const command = new ScanCommand(params);
        const result = await ddbDocClient.send(command);

        // Detailed logging of items before returning
        if (result.Items) {
            console.log(`Found ${result.Items.length} items. Logging structure of first few items:`);
            result.Items.slice(0, 3).forEach((item, index) => { // Log first 3 items
                console.log(`Item ${index} (${item.objectId || 'NO ID'}):`, JSON.stringify(item, null, 2));
            });
            // Check specifically if any item HAS a version field
             const itemsWithVersion = result.Items.filter(item => item.hasOwnProperty('version') || item.hasOwnProperty('_version'));
             if (itemsWithVersion.length > 0) {
                 console.warn(`WARNING: Found ${itemsWithVersion.length} items with a 'version' or '_version' field!`);
             } else {
                 console.log("Confirmed: No items returned by scan have 'version' or '_version' field.");
             }
        } else {
            console.log('DynamoDB Scan returned no items.');
        }

        return result.Items || []; // Return empty array if Items is null/undefined

    } catch (error) {
        console.error('Error listing objects from DynamoDB:', error);
        // Rethrow a formatted error potentially? For now, just rethrow.
        throw new Error(`Error fetching objects: ${error.message}`);
    }
};
