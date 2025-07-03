const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.CONDITION_TABLE_NAME;

exports.handler = async (event) => {
  // console.log('DeleteCondition input:', JSON.stringify(event, null, 2));
  
  const { conditionId } = event;
  
  // First get the condition to return it
  const getParams = {
    TableName: tableName,
    Key: { conditionId }
  };
  
  try {
    const getResult = await ddbDocClient.send(new GetCommand(getParams));
    
    if (!getResult.Item) {
      throw new Error(`Condition not found: ${conditionId}`);
    }
    
    const condition = getResult.Item;
    
    // Now delete it
    const deleteParams = {
      TableName: tableName,
      Key: { conditionId }
    };
    
    await ddbDocClient.send(new DeleteCommand(deleteParams));
    // console.log('Deleted condition:', conditionId);
    
    return condition;
  } catch (error) {
    console.error('Error deleting condition:', error);
    throw new Error(`Failed to delete condition: ${error.message}`);
  }
};