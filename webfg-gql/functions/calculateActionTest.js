const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchGetCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { calculateActionTest } = require('../utils/actionCalculations');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, { 
  marshallOptions: { removeUndefinedValues: true } 
});

const charactersTable = process.env.CHARACTERS_TABLE;
const objectsTable = process.env.OBJECTS_TABLE;
const actionsTable = process.env.ACTIONS_TABLE;
const conditionsTable = process.env.CONDITIONS_TABLE;

exports.handler = async (event) => {
  console.log("Received event for calculateActionTest:", JSON.stringify(event, null, 2));

  const input = event.input || event.arguments?.input;
  const {
    actionId,
    sourceCharacterIds,
    targetIds = [],
    targetType,
    override = false,
    overrideValue = 0,
    sourceOverride = false,
    sourceOverrideValue = 0
  } = input;

  try {
    // Fetch the action
    const getActionCommand = new GetCommand({
      TableName: actionsTable,
      Key: { actionId }
    });
    const actionResult = await docClient.send(getActionCommand);
    const action = actionResult.Item;
    
    if (!action) {
      throw new Error(`Action with ID ${actionId} not found`);
    }

    // Fetch source characters
    const sourceCharacters = [];
    if (sourceCharacterIds && sourceCharacterIds.length > 0) {
      const sourceKeys = sourceCharacterIds.map(id => ({ characterId: id }));
      const batchGetSourcesCommand = new BatchGetCommand({
        RequestItems: {
          [charactersTable]: {
            Keys: sourceKeys
          }
        }
      });
      const sourcesResult = await docClient.send(batchGetSourcesCommand);
      const sources = sourcesResult.Responses?.[charactersTable] || [];
      
      // Fetch equipment for each source character
      for (const source of sources) {
        // Debug: Log the source character's attributes with fatigue
        console.log(`Source character ${source.name} attributes:`, {
          dexterity: source.dexterity,
          strength: source.strength,
          // Add other attributes as needed for debugging
        });
        
        if (source.equipmentIds && source.equipmentIds.length > 0) {
          const equipmentKeys = source.equipmentIds.map(id => ({ objectId: id }));
          const batchGetEquipmentCommand = new BatchGetCommand({
            RequestItems: {
              [objectsTable]: {
                Keys: equipmentKeys
              }
            }
          });
          const equipmentResult = await docClient.send(batchGetEquipmentCommand);
          source.equipment = equipmentResult.Responses?.[objectsTable] || [];
        } else {
          source.equipment = [];
        }

        // Fetch conditions for each source character
        console.log(`Fetching conditions for source character ${source.name} (${source.characterId}):`, {
          hasCharacterConditions: !!source.characterConditions,
          characterConditionsLength: source.characterConditions?.length,
          characterConditions: source.characterConditions
        });
        source.conditions = [];
        if (source.characterConditions && source.characterConditions.length > 0) {
          for (const characterCondition of source.characterConditions) {
            try {
              const conditionId = characterCondition.conditionId;
              const result = await docClient.send(new GetCommand({
                TableName: conditionsTable,
                Key: { conditionId }
              }));
              
              if (result.Item) {
                console.log(`Successfully fetched condition ${conditionId}:`, {
                  conditionName: result.Item.name,
                  conditionType: result.Item.conditionType,
                  conditionTarget: result.Item.conditionTarget,
                  amountFromCharacterCondition: characterCondition.amount
                });
                // Add the amount from characterCondition to the condition object
                source.conditions.push({
                  ...result.Item,
                  amount: characterCondition.amount
                });
              } else {
                console.warn(`Condition ${conditionId} not found in database`);
              }
            } catch (error) {
              console.error(`Error fetching condition ${characterCondition.conditionId}:`, error);
            }
          }
        }

        sourceCharacters.push(source);
      }
    }

    // Fetch target entities (if not using override)
    const targetEntities = [];
    if (!override && targetIds && targetIds.length > 0) {
      if (targetType === 'CHARACTER') {
        const targetKeys = targetIds.map(id => ({ characterId: id }));
        const batchGetTargetsCommand = new BatchGetCommand({
          RequestItems: {
            [charactersTable]: {
              Keys: targetKeys
            }
          }
        });
        const targetsResult = await docClient.send(batchGetTargetsCommand);
        const targets = targetsResult.Responses?.[charactersTable] || [];
        
        // Fetch equipment for each target character
        for (const target of targets) {
          if (target.equipmentIds && target.equipmentIds.length > 0) {
            const equipmentKeys = target.equipmentIds.map(id => ({ objectId: id }));
            const batchGetEquipmentCommand = new BatchGetCommand({
              RequestItems: {
                [objectsTable]: {
                  Keys: equipmentKeys
                }
              }
            });
            const equipmentResult = await docClient.send(batchGetEquipmentCommand);
            target.equipment = equipmentResult.Responses?.[objectsTable] || [];
          } else {
            target.equipment = [];
          }

          // Fetch conditions for each target character
          console.log(`Fetching conditions for target character ${target.name} (${target.characterId}):`, {
            hasCharacterConditions: !!target.characterConditions,
            characterConditionsLength: target.characterConditions?.length,
            characterConditions: target.characterConditions
          });
          target.conditions = [];
          if (target.characterConditions && target.characterConditions.length > 0) {
            for (const characterCondition of target.characterConditions) {
              try {
                const conditionId = characterCondition.conditionId;
                const result = await docClient.send(new GetCommand({
                  TableName: conditionsTable,
                  Key: { conditionId }
                }));
                
                if (result.Item) {
                  console.log(`Successfully fetched TARGET condition ${conditionId}:`, {
                    conditionName: result.Item.name,
                    conditionType: result.Item.conditionType,
                    conditionTarget: result.Item.conditionTarget,
                    amountFromCharacterCondition: characterCondition.amount
                  });
                  // Add the amount from characterCondition to the condition object
                  target.conditions.push({
                    ...result.Item,
                    amount: characterCondition.amount
                  });
                } else {
                  console.warn(`TARGET condition ${conditionId} not found in database`);
                }
              } catch (error) {
                console.error(`Error fetching condition ${characterCondition.conditionId}:`, error);
              }
            }
          }

          targetEntities.push(target);
        }
      } else if (targetType === 'OBJECT') {
        const targetKeys = targetIds.map(id => ({ objectId: id }));
        const batchGetTargetsCommand = new BatchGetCommand({
          RequestItems: {
            [objectsTable]: {
              Keys: targetKeys
            }
          }
        });
        const targetsResult = await docClient.send(batchGetTargetsCommand);
        const targets = targetsResult.Responses?.[objectsTable] || [];
        
        // Fetch equipment for each target object
        for (const target of targets) {
          if (target.equipmentIds && target.equipmentIds.length > 0) {
            const equipmentKeys = target.equipmentIds.map(id => ({ objectId: id }));
            const batchGetEquipmentCommand = new BatchGetCommand({
              RequestItems: {
                [objectsTable]: {
                  Keys: equipmentKeys
                }
              }
            });
            const equipmentResult = await docClient.send(batchGetEquipmentCommand);
            target.equipment = equipmentResult.Responses?.[objectsTable] || [];
          } else {
            target.equipment = [];
          }
          targetEntities.push(target);
        }
      }
      // ACTION type targets not implemented yet
    }

    // Debug: Log target entities before calculation
    console.log("=== PRE-CALCULATION DEBUG ===");
    console.log("Target entities summary:", targetEntities.map(target => ({
      name: target.name,
      characterId: target.characterId,
      hasConditions: !!target.conditions,
      conditionsCount: target.conditions?.length || 0,
      conditions: target.conditions?.map(c => ({
        name: c.name,
        type: c.conditionType,
        target: c.conditionTarget,
        amount: c.amount
      })) || []
    })));
    console.log("Action details:", {
      sourceAttribute: action.sourceAttribute,
      targetAttribute: action.targetAttribute,
      targetType: targetType
    });

    // Calculate the action test
    const result = calculateActionTest({
      sourceCharacters,
      targetEntities,
      sourceAttribute: action.sourceAttribute,
      targetAttribute: action.targetAttribute,
      targetType,
      override,
      overrideValue,
      sourceOverride,
      sourceOverrideValue
    });

    console.log("Calculated action test result:", JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error("Error calculating action test:", error);
    throw new Error(`Failed to calculate action test: ${error.message}`);
  }
};