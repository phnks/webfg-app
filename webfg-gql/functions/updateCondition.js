const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.CONDITION_TABLE_NAME;

exports.handler = async (event) => {
  console.log('UpdateCondition input:', JSON.stringify(event, null, 2));
  
  const { conditionId, input } = event;
  
  const updateExpressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  
  const fields = ['name', 'description', 'conditionCategory', 'conditionType', 'conditionTarget', 'conditionAmount'];
  
  fields.forEach(field => {
    if (input[field] !== undefined) {
      updateExpressionParts.push(`#${field} = :${field}`);
      expressionAttributeNames[`#${field}`] = field;
      expressionAttributeValues[`:${field}`] = input[field];
    }
  });
  
  if (updateExpressionParts.length === 0) {
    throw new Error('No fields to update');
  }
  
  const params = {
    TableName: tableName,
    Key: { conditionId },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };
  
  try {
    const result = await ddbDocClient.send(new UpdateCommand(params));
    console.log('Updated condition:', conditionId);
    return result.Attributes;
  } catch (error) {
    console.error('Error updating condition:', error);
    throw new Error(`Failed to update condition: ${error.message}`);
  }
};