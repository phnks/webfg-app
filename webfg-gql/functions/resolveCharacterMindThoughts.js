const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const character = event.source;
    const mind = character.mind || [];
    
    if (mind.length === 0) {
      return [];
    }

    // Extract thoughtIds from mind array
    const thoughtIds = mind.map(mindThought => mindThought.thoughtId);
    
    // Remove duplicates
    const uniqueThoughtIds = [...new Set(thoughtIds)];
    
    if (uniqueThoughtIds.length === 0) {
      return [];
    }

    // Batch get thoughts from DynamoDB (max 100 at a time)
    const batchSize = 100;
    const allThoughts = [];
    
    for (let i = 0; i < uniqueThoughtIds.length; i += batchSize) {
      const batch = uniqueThoughtIds.slice(i, i + batchSize);
      
      const params = {
        RequestItems: {
          [process.env.THOUGHTS_TABLE]: {
            Keys: batch.map(thoughtId => ({ thoughtId }))
          }
        }
      };

      const result = await docClient.send(new BatchGetCommand(params));
      const thoughts = result.Responses[process.env.THOUGHTS_TABLE] || [];
      allThoughts.push(...thoughts);
    }

    // Create a map for quick lookup
    const thoughtMap = {};
    allThoughts.forEach(thought => {
      thoughtMap[thought.thoughtId] = thought;
    });

    // Return thoughts in the same order as the mind array (preserving order)
    const orderedThoughts = thoughtIds
      .map(thoughtId => thoughtMap[thoughtId])
      .filter(thought => thought !== undefined);

    return orderedThoughts;
  } catch (error) {
    console.error('Error resolving character mind thoughts:', error);
    throw error;
  }
};