const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.CHARACTER_TABLE_NAME;

exports.handler = async (event) => {
  console.log('UpdateConditionAmount input:', JSON.stringify(event, null, 2));
  
  const { characterId, conditionId, amount } = event;
  
  if (!characterId || !conditionId || amount === undefined) {
    throw new Error('characterId, conditionId, and amount are all required');
  }

  if (amount < 1) {
    throw new Error('Amount must be at least 1');
  }
  
  // Get the character to check existing conditions
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
    const currentConditions = character.characterConditions || [];
    
    // Find the condition
    const conditionIndex = currentConditions.findIndex(c => c.conditionId === conditionId);
    
    if (conditionIndex === -1) {
      throw new Error(`Condition ${conditionId} not found for character ${characterId}`);
    }
    
    // Update the condition amount
    currentConditions[conditionIndex].amount = amount;
    
    const updateParams = {
      TableName: tableName,
      Key: { characterId },
      UpdateExpression: 'SET characterConditions = :characterConditions',
      ExpressionAttributeValues: {
        ':characterConditions': currentConditions
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await ddbDocClient.send(new UpdateCommand(updateParams));
    console.log(`Updated condition ${conditionId} amount to ${amount} for character ${characterId}`);
    return result.Attributes;
  } catch (error) {
    console.error('Error updating condition amount:', error);
    throw new Error(`Failed to update condition amount: ${error.message}`);
  }
};