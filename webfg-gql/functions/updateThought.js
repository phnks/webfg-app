const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const THOUGHTS_TABLE_NAME = process.env.THOUGHTS_TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const { thoughtId, input } = event;
    const updatedAt = new Date().toISOString();

    const updateExpressionParts = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Helper function to add update expression parts
    const addUpdateField = (fieldName, fieldValue, attributeName = fieldName) => {
        if (fieldValue !== undefined) {
            updateExpressionParts.push(`#${attributeName} = :${attributeName}`);
            expressionAttributeNames[`#${attributeName}`] = fieldName;
            expressionAttributeValues[`:${attributeName}`] = fieldValue;
        }
    };

    // Add updatedAt
    addUpdateField("updatedAt", updatedAt);

    // Update fields from input
    addUpdateField("name", input.name);
    addUpdateField("description", input.description);

    // Update nameLowerCase whenever name is updated
    if (input.name !== undefined) {
        const lowerCaseAttributeName = '#nameLowerCase';
        const lowerCaseAttributeValue = ':nameLowerCase';
        
        expressionAttributeNames[lowerCaseAttributeName] = 'nameLowerCase';
        expressionAttributeValues[lowerCaseAttributeValue] = input.name.toLowerCase();
        updateExpressionParts.push(`${lowerCaseAttributeName} = ${lowerCaseAttributeValue}`);
    }

    // Update descriptionLowerCase whenever description is updated
    if (input.description !== undefined) {
        const lowerCaseAttributeName = '#descriptionLowerCase';
        const lowerCaseAttributeValue = ':descriptionLowerCase';
        
        expressionAttributeNames[lowerCaseAttributeName] = 'descriptionLowerCase';
        expressionAttributeValues[lowerCaseAttributeValue] = input.description.toLowerCase();
        updateExpressionParts.push(`${lowerCaseAttributeName} = ${lowerCaseAttributeValue}`);
    }

    const params = {
        TableName: THOUGHTS_TABLE_NAME,
        Key: {
            thoughtId: thoughtId,
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
        console.error('Error updating thought in DynamoDB:', error);
        throw new Error('Error updating thought.');
    }
};