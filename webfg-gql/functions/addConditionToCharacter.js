const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.CHARACTER_TABLE_NAME;

exports.handler = async (event) => {
  console.log('AddConditionToCharacter input:', JSON.stringify(event, null, 2));
  
  const { characterId, conditionId, amount = 1 } = event;
  
  if (!characterId || !conditionId) {
    throw new Error('Both characterId and conditionId are required');
  }
  
  // Parse amount to ensure it's a number
  const parsedAmount = parseInt(amount, 10);
  console.log(`[DEBUG-ADD] amount=${amount}, parsed=${parsedAmount}, type=${typeof parsedAmount}, isNaN=${isNaN(parsedAmount)}`);
  
  if (isNaN(parsedAmount)) {
    throw new Error('Invalid amount: must be a number');
  }

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
    const currentConditions = character.characterConditions || [];
    
    // Check if condition is already added
    const existingConditionIndex = currentConditions.findIndex(c => c.conditionId === conditionId);
    
    if (existingConditionIndex >= 0) {
      // If already exists, update the amount
      currentConditions[existingConditionIndex].amount = parsedAmount;
      console.log(`[DEBUG-ADD] Updated existing condition: ${JSON.stringify(currentConditions[existingConditionIndex], null, 2)}`);
    } else {
      // Add the new condition with amount
      const newCondition = {
        conditionId,
        amount: parsedAmount
      };
      currentConditions.push(newCondition);
      console.log(`[DEBUG-ADD] Added new condition: ${JSON.stringify(newCondition, null, 2)}`);
    }
    
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
    console.log('Added/updated condition for character:', characterId);
    return result.Attributes;
  } catch (error) {
    console.error('Error adding condition to character:', error);
    throw new Error(`Failed to add condition to character: ${error.message}`);
  }
};