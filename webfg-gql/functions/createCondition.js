const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.CONDITION_TABLE_NAME;

exports.handler = async (event) => {
  // console.log('CreateCondition input:', JSON.stringify(event, null, 2));
  
  const conditionId = uuidv4();
  const input = event.input;
  
  const condition = {
    conditionId,
    name: input.name,
    nameLowerCase: input.name.toLowerCase(),
    description: input.description,
    descriptionLowerCase: input.description ? input.description.toLowerCase() : undefined,
    conditionCategory: input.conditionCategory,
    conditionType: input.conditionType,
    conditionTarget: input.conditionTarget
  };
  
  const params = {
    TableName: tableName,
    Item: condition
  };
  
  try {
    await ddbDocClient.send(new PutCommand(params));
    // console.log('Created condition:', conditionId);
    return condition;
  } catch (error) {
    console.error('Error creating condition:', error);
    throw new Error(`Failed to create condition: ${error.message}`);
  }
};