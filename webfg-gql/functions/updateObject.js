const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const OBJECTS_TABLE_NAME = process.env.OBJECTS_TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const { objectId, input } = event;
    const updatedAt = new Date().toISOString();

    const updateExpressionParts = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Helper function to add update expression parts
    const addUpdateField = (fieldName, fieldValue, attributeName = fieldName) => {
        if (fieldValue !== undefined) {
            updateExpressionParts.push(`#${attributeName} = :${attributeName}`);
            expressionAttributeNames[`#${attributeName}`] = fieldName;
            expressionAttributeValues[`:${attributeName}`] = fieldValue;
        }
    };

    // Add updatedAt
    addUpdateField("updatedAt", updatedAt);

    // Update fields from input - explicitly handle all fields like we do for characters
    addUpdateField("name", input.name);
    addUpdateField("description", input.description);
    addUpdateField("objectCategory", input.objectCategory);
    addUpdateField("isEquipment", input.isEquipment);
    addUpdateField("speed", input.speed);
    addUpdateField("weight", input.weight);
    addUpdateField("size", input.size);
    addUpdateField("armour", input.armour);
    addUpdateField("endurance", input.endurance);
    addUpdateField("lethality", input.lethality);
    addUpdateField("penetration", input.penetration);
    addUpdateField("complexity", input.complexity);
    addUpdateField("strength", input.strength);
    addUpdateField("dexterity", input.dexterity);
    addUpdateField("agility", input.agility);
    addUpdateField("obscurity", input.obscurity);
    addUpdateField("resolve", input.resolve);
    addUpdateField("morale", input.morale);
    addUpdateField("intelligence", input.intelligence);
    addUpdateField("charisma", input.charisma);
    addUpdateField("seeing", input.seeing);
    addUpdateField("hearing", input.hearing);
    addUpdateField("light", input.light);
    addUpdateField("noise", input.noise);
    addUpdateField("special", input.special);
    addUpdateField("equipmentIds", input.equipmentIds);

    // Update nameLowerCase whenever name is updated
    if (input.name !== undefined) {
        const lowerCaseAttributeName = '#nameLowerCase';
        const lowerCaseAttributeValue = ':nameLowerCase';
        
        expressionAttributeNames[lowerCaseAttributeName] = 'nameLowerCase';
        expressionAttributeValues[lowerCaseAttributeValue] = input.name.toLowerCase();
        updateExpressionParts.push(`${lowerCaseAttributeName} = ${lowerCaseAttributeValue}`);
    }

    const params = {
        TableName: OBJECTS_TABLE_NAME,
        Key: {
            objectId: objectId,
        },
        UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
    };

    try {
        const command = new UpdateCommand(params);
        const result = await ddbDocClient.send(command);
        console.log('DynamoDB Update result:', JSON.stringify(result, null, 2));

        return result.Attributes;
    } catch (error) {
        console.error('Error updating object in DynamoDB:', error);
        throw new Error('Error updating object.');
    }
};