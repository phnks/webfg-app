const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
// Configure DocumentClient to remove undefined values (good practice, though less critical for reads)
const marshallOptions = { removeUndefinedValues: true };
const translateConfig = { marshallOptions };
const docClient = DynamoDBDocumentClient.from(client, translateConfig);

const skillsTable = process.env.SKILLS_TABLE;

exports.handler = async (event) => {
  // console.log("Received event for resolveCharacterSkills:", JSON.stringify(event, null, 2));

  // Source contains the parent Character object
  const characterData = event.source;

  if (!characterData || !characterData.skillData || characterData.skillData.length === 0) {
    // console.log("No skillData found on character, returning empty array.");
    return []; // No skills to resolve
  }

  // Extract skill IDs to fetch
  const skillIdsToFetch = characterData.skillData.map(data => data.skillId);
  if (skillIdsToFetch.length === 0) {
    return [];
  }

  // Create keys for BatchGetCommand
  const keys = skillIdsToFetch.map(skillId => ({ skillId }));

  // Fetch base skill details using BatchGetCommand for efficiency
  try {
    const batchGetCommand = new BatchGetCommand({
      RequestItems: {
        [skillsTable]: {
          Keys: keys,
          // Specify attributes to retrieve if needed, otherwise fetches all
          // ProjectionExpression: "skillId, skillName, skillCategory, description",
        }
      }
    });

    const { Responses } = await docClient.send(batchGetCommand);
    const baseSkills = Responses && Responses[skillsTable] ? Responses[skillsTable] : [];

    // Create a map for quick lookup of base skill details
    const baseSkillMap = new Map();
    baseSkills.forEach(skill => {
      if (skill.skillId) {
        baseSkillMap.set(skill.skillId, skill);
      }
    });

    // Merge character-specific value with base skill details
    const resolvedSkills = characterData.skillData.map(charSkillData => {
      const baseSkill = baseSkillMap.get(charSkillData.skillId);
      if (!baseSkill) {
        console.warn(`Base skill details not found for skillId: ${charSkillData.skillId}`);
        // Decide how to handle missing base skills: return partial data or null?
        // Returning partial data for now:
        return {
          skillId: charSkillData.skillId,
          skillValue: charSkillData.skillValue,
          skillName: 'UNKNOWN', // Placeholder
          skillCategory: 'UNKNOWN', // Placeholder
        };
      }
      return {
        skillId: charSkillData.skillId,
        skillValue: charSkillData.skillValue,
        skillName: baseSkill.skillName, // Assuming field name in SkillsTable
        skillCategory: baseSkill.skillCategory, // Assuming field name in SkillsTable
        // description: baseSkill.description, // Optional
        __typename: "CharacterSkill" // Important for AppSync
      };
    });

    // console.log("Resolved skills:", JSON.stringify(resolvedSkills, null, 2));
    return resolvedSkills;

  } catch (error) {
    console.error("Error resolving character skills:", error);
    // Depending on requirements, you might return partial data or throw
    // Throwing error for now to make issues visible
    throw new Error(`Failed to resolve character skills: ${error.message}`);
  }
};
