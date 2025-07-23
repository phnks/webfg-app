const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const THOUGHTS_TABLE_NAME = process.env.THOUGHTS_TABLE_NAME;

exports.handler = async (event) => {
    const { thoughtId } = event;

    try {
        const params = {
            TableName: THOUGHTS_TABLE_NAME,
            Key: {
                thoughtId: thoughtId,
            },
            ReturnValues: 'ALL_OLD', // Return the deleted item
        };

        const command = new DeleteCommand(params);
        const result = await ddbDocClient.send(command);

        return result.Attributes; // Return the deleted item
    } catch (error) {
        console.error('Error deleting thought from DynamoDB:', error);
        throw new Error('Error deleting thought.');
    }
};