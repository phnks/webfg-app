const AWS = require('aws-sdk');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const { filter } = event.arguments;

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
            params.ExpressionAttributeNames = expressionAttributeNames;
            params.ExpressionAttributeValues = expressionAttributeValues;
        }
    }

    try {
        const command = new ScanCommand(params);
        const result = await ddbDocClient.send(command);
        console.log('DynamoDB Scan result:', JSON.stringify(result, null, 2));

        return result.Items;
    } catch (error) {
        console.error('Error listing objects from DynamoDB:', error);
        throw new Error('Error fetching objects.');
    }
};
