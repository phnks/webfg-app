const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
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
        };

        const command = new GetCommand(params); 
        const result = await ddbDocClient.send(command); 
        
        const thought = result.Item;
        
        if (!thought) {
            return undefined; // Return undefined when thought not found instead of throwing
        }

        console.log(`Successfully retrieved thought: ${thought.name} (${thoughtId})`);
        return thought;
    } catch (error) {
        console.error('Error getting thought from DynamoDB:', error);
        throw new Error('Error fetching thought.');
    }
};