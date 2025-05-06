const AWS = require('aws-sdk');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const { objectId } = event.arguments;

    try {
        const params = {
            TableName: OBJECTS_TABLE_NAME,
            Key: {
                objectId: objectId,
            },
        };

        const result = await ddbDocClient.get(params);
        console.log('DynamoDB Get result:', JSON.stringify(result, null, 2));

        return result.Item;
    } catch (error) {
        console.error('Error getting object from DynamoDB:', error);
        throw new Error('Error fetching object.');
    }
};
