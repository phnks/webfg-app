const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const { objectId, input } = event;
    const updatedAt = new Date().toISOString();

    const updateExpressionParts = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = updatedAt;
    updateExpressionParts.push('#updatedAt = :updatedAt');

    for (const key in input) {
        if (input.hasOwnProperty(key) && key !== 'objectId') {
            const value = input[key];
            const attributeName = `#${key}`;
            const attributeValue = `:${key}`;

            expressionAttributeNames[attributeName] = key;
            expressionAttributeValues[attributeValue] = value;
            updateExpressionParts.push(`${attributeName} = ${attributeValue}`);
        }
    }

    // Update nameLowerCase whenever name is updated
    if (input.name !== undefined) {
        const lowerCaseAttributeName = '#nameLowerCase';
        const lowerCaseAttributeValue = ':nameLowerCase';
        
        expressionAttributeNames[lowerCaseAttributeName] = 'nameLowerCase';
        expressionAttributeValues[lowerCaseAttributeValue] = input.name.toLowerCase();
        updateExpressionParts.push(`${lowerCaseAttributeName} = ${lowerCaseAttributeValue}`);
    }

    const params = {
        TableName: OBJECTS_TABLE_NAME,
        Key: {
            objectId: objectId,
        },
        UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
    };

    try {
        const command = new UpdateCommand(params);
        const result = await ddbDocClient.send(command);
        console.log('DynamoDB Update result:', JSON.stringify(result, null, 2));

        return result.Attributes;
    } catch (error) {
        console.error('Error updating object in DynamoDB:', error);
        throw new Error('Error updating object.');
    }
};