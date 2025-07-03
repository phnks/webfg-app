
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
    // console.log('Received event:', JSON.stringify(event, null, 2));

    const { objectId } = event; // Corrected: Access arguments directly from event

    try {
        const params = {
            TableName: OBJECTS_TABLE_NAME,
            Key: {
                objectId: objectId,
            },
            ReturnValues: 'ALL_OLD', // Return the deleted item
        };

        const command = new DeleteCommand(params);
        const result = await ddbDocClient.send(command);
        // console.log('DynamoDB Delete result:', JSON.stringify(result, null, 2));

        return result.Attributes; // Return the deleted item
    } catch (error) {
        console.error('Error deleting object from DynamoDB:', error);
        throw new Error('Error deleting object.');
    }
};
