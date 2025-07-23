const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const THOUGHTS_TABLE_NAME = process.env.THOUGHTS_TABLE_NAME;

exports.handler = async (event) => {
    const { filter } = event;

    const params = {
        TableName: THOUGHTS_TABLE_NAME,
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
        const command = new ScanCommand(params);
        const result = await ddbDocClient.send(command);

        return result.Items || []; // Return empty array if Items is null/undefined

    } catch (error) {
        console.error('Error listing thoughts from DynamoDB:', error);
        throw new Error(`Error fetching thoughts: ${error.message}`);
    }
};