const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.CHARACTER_TABLE_NAME;

exports.handler = async (event) => {
  console.log('AddConditionToCharacter input:', JSON.stringify(event, null, 2));
  
  const { characterId, conditionId } = event;
  
  // First get the character to check existing conditions
  const getParams = {
    TableName: tableName,
    Key: { characterId }
  };
  
  try {
    const getResult = await ddbDocClient.send(new GetCommand(getParams));
    
    if (!getResult.Item) {
      throw new Error(`Character not found: ${characterId}`);
    }
    
    const character = getResult.Item;
    const currentConditionIds = character.conditionIds || [];
    
    // Check if condition is already added
    if (currentConditionIds.includes(conditionId)) {
      console.log('Condition already exists for character');
      return character;
    }
    
    // Add the condition
    const updatedConditionIds = [...currentConditionIds, conditionId];
    
    const updateParams = {
      TableName: tableName,
      Key: { characterId },
      UpdateExpression: 'SET conditionIds = :conditionIds',
      ExpressionAttributeValues: {
        ':conditionIds': updatedConditionIds
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await ddbDocClient.send(new UpdateCommand(updateParams));
    console.log('Added condition to character:', characterId);
    return result.Attributes;
  } catch (error) {
    console.error('Error adding condition to character:', error);
    throw new Error(`Failed to add condition to character: ${error.message}`);
  }
};