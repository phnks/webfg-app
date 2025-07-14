const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
// Configure DocumentClient to remove undefined values
const marshallOptions = { removeUndefinedValues: true };
const translateConfig = { marshallOptions };
const docClient = DynamoDBDocumentClient.from(client, translateConfig);

// Assuming the environment variable will be set in the SAM template
const valuesTable = process.env.VALUES_TABLE;

exports.handler = async (event) => {
  // console.log("Received event for resolveCharacterValues:", JSON.stringify(event, null, 2));

  // Source contains the parent Character object
  const characterData = event.source;

  if (!characterData || !characterData.valueData || characterData.valueData.length === 0) {
    // console.log("No valueData found on character, returning empty array.");
    return []; // No values to resolve
  }

  // Extract value IDs to fetch
  const valueIdsToFetch = characterData.valueData.map(data => data.valueId);
  if (valueIdsToFetch.length === 0) {
    return [];
  }

  // Create keys for BatchGetCommand
  const keys = valueIdsToFetch.map(valueId => ({ valueId }));

  // Fetch base value details using BatchGetCommand
  try {
    const batchGetCommand = new BatchGetCommand({
      RequestItems: {
        [valuesTable]: {
          Keys: keys,
          // ProjectionExpression: "valueId, valueName", // Specify if needed
        }
      }
    });

    const { Responses } = await docClient.send(batchGetCommand);
    const baseValues = Responses && Responses[valuesTable] ? Responses[valuesTable] : [];

    // Create a map for quick lookup
    const baseValueMap = new Map();
    baseValues.forEach(val => {
      if (val.valueId) {
        baseValueMap.set(val.valueId, val);
      }
    });

    // Map base value details to the CharacterValue type
    const resolvedValues = characterData.valueData.map(charValueData => {
      const baseValue = baseValueMap.get(charValueData.valueId);
      if (!baseValue) {
        console.warn(`Base value details not found for valueId: ${charValueData.valueId}`);
        return {
          valueId: charValueData.valueId,
          valueName: 'UNKNOWN', // Placeholder
        };
      }
      return {
        valueId: baseValue.valueId,
        valueName: baseValue.valueName, // Assuming field name in ValuesTable
        __typename: "CharacterValue" // Important for AppSync
      };
    });

    // console.log("Resolved values:", JSON.stringify(resolvedValues, null, 2));
    return resolvedValues;

  } catch (error) {
    console.error("Error resolving character values:", error);
    throw new Error(`Failed to resolve character values: ${error.message}`);
  }
};
