const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.CHARACTER_TABLE_NAME;

exports.handler = async (event) => {
  // console.log('RemoveConditionFromCharacter input:', JSON.stringify(event, null, 2));
  
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
    const currentConditions = character.characterConditions || [];
    
    // Remove the condition
    const updatedConditions = currentConditions.filter(c => c.conditionId !== conditionId);
    
    if (updatedConditions.length === currentConditions.length) {
      // console.log('Condition not found on character');
      return character;
    }
    
    const updateParams = {
      TableName: tableName,
      Key: { characterId },
      UpdateExpression: 'SET characterConditions = :characterConditions',
      ExpressionAttributeValues: {
        ':characterConditions': updatedConditions
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await ddbDocClient.send(new UpdateCommand(updateParams));
    // console.log('Removed condition from character:', characterId);
    return result.Attributes;
  } catch (error) {
    console.error('Error removing condition from character:', error);
    throw new Error(`Failed to remove condition from character: ${error.message}`);
  }
};