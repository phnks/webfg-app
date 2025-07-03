const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
// Configure DocumentClient to remove undefined values
const marshallOptions = { removeUndefinedValues: true };
const translateConfig = { marshallOptions };
const docClient = DynamoDBDocumentClient.from(client, translateConfig);

const attributesTable = process.env.ATTRIBUTES_TABLE;

exports.handler = async (event) => {
  // console.log("Received event for resolveCharacterAttributes:", JSON.stringify(event, null, 2));

  // Source contains the parent Character object
  const characterData = event.source;

  if (!characterData || !characterData.attributeData || characterData.attributeData.length === 0) {
    // console.log("No attributeData found on character, returning empty array.");
    return []; // No attributes to resolve
  }

  // Extract attribute IDs to fetch
  const attributeIdsToFetch = characterData.attributeData.map(data => data.attributeId);
  if (attributeIdsToFetch.length === 0) {
    return [];
  }

  // Create keys for BatchGetCommand
  const keys = attributeIdsToFetch.map(attributeId => ({ attributeId }));

  // Fetch base attribute details using BatchGetCommand
  try {
    const batchGetCommand = new BatchGetCommand({
      RequestItems: {
        [attributesTable]: {
          Keys: keys,
          // ProjectionExpression: "attributeId, attributeName, description", // Specify if needed
        }
      }
    });

    const { Responses } = await docClient.send(batchGetCommand);
    const baseAttributes = Responses && Responses[attributesTable] ? Responses[attributesTable] : [];

    // Create a map for quick lookup
    const baseAttributeMap = new Map();
    baseAttributes.forEach(attr => {
      if (attr.attributeId) {
        baseAttributeMap.set(attr.attributeId, attr);
      }
    });

    // Merge character-specific value with base attribute details
    const resolvedAttributes = characterData.attributeData.map(charAttrData => {
      const baseAttribute = baseAttributeMap.get(charAttrData.attributeId);
      if (!baseAttribute) {
        console.warn(`Base attribute details not found for attributeId: ${charAttrData.attributeId}`);
        return {
          attributeId: charAttrData.attributeId,
          attributeValue: charAttrData.attributeValue,
          attributeName: 'UNKNOWN', // Placeholder
        };
      }
      return {
        attributeId: charAttrData.attributeId,
        attributeValue: charAttrData.attributeValue,
        attributeName: baseAttribute.attributeName, // Assuming field name in AttributesTable
        // description: baseAttribute.description, // Optional
        __typename: "CharacterAttribute" // Important for AppSync
      };
    });

    // console.log("Resolved attributes:", JSON.stringify(resolvedAttributes, null, 2));
    return resolvedAttributes;

  } catch (error) {
    console.error("Error resolving character attributes:", error);
    throw new Error(`Failed to resolve character attributes: ${error.message}`);
  }
};
