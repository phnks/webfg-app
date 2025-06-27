// Import commands.js using ES2015 syntax:
import './commands'

// Set up global error handling for GraphQL failures
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore GraphQL network errors during testing
  if (err.message.includes('Failed to fetch') || 
      err.message.includes('NetworkError') ||
      err.message.includes('fetch') ||
      err.message.includes('GraphQL error')) {
    console.log('Ignoring GraphQL error during testing:', err.message);
    return false;
  }
  // Let other errors fail the test
  return true;
});

// Global storage for mock data
let mockStorage = {};

// Set up GraphQL mocking for local tests
beforeEach(() => {
  // Reset mock storage for each test
  mockStorage = {};
  
  // Mock GraphQL API responses to prevent network failures
  cy.intercept('POST', '**/graphql', (req) => {
    const operation = req.body.operationName || 'Unknown';
    
    // Mock different GraphQL operations
    if (operation.includes('CreateAction') || req.body.query?.includes('mutation CreateAction')) {
      const mockId = `mock-action-${Math.random().toString(36).substr(2, 9)}`;
      const actionName = req.body.variables?.input?.name || 'Mock Action';
      
      const actionData = {
        actionId: mockId,
        name: actionName,
        description: req.body.variables?.input?.description || 'Mock Description',
        actionCategory: req.body.variables?.input?.actionCategory || 'ATTACK',
        sourceAttribute: req.body.variables?.input?.sourceAttribute || 'DEXTERITY',
        targetAttribute: req.body.variables?.input?.targetAttribute || 'AGILITY',
        targetType: req.body.variables?.input?.targetType || 'CHARACTER',
        effectType: req.body.variables?.input?.effectType || 'DESTROY',
        objectUsage: req.body.variables?.input?.objectUsage || 'NONE',
        formula: req.body.variables?.input?.formula || 'CONTEST'
      };
      
      // Store the action for subsequent queries
      mockStorage[mockId] = actionData;
      
      req.reply({
        statusCode: 200,
        body: {
          data: {
            createAction: actionData
          }
        }
      });
      
    } else if (operation.includes('ListActions') || req.body.query?.includes('listActions')) {
      // Include created actions in the list
      const createdActions = Object.values(mockStorage);
      const defaultActions = [
        {
          actionId: 'mock-action-1',
          name: 'Simple Hit',
          description: 'A basic attack action',
          actionCategory: 'ATTACK',
          sourceAttribute: 'DEXTERITY',
          targetAttribute: 'AGILITY',
          targetType: 'CHARACTER',
          effectType: 'DESTROY',
          objectUsage: 'NONE'
        },
        {
          actionId: 'mock-action-2',
          name: 'Simple Block',
          description: 'A defensive action',
          actionCategory: 'DEFENSE',
          sourceAttribute: 'STRENGTH',
          targetAttribute: 'AGILITY',
          targetType: 'CHARACTER',
          effectType: 'DESTROY',
          objectUsage: 'NONE'
        }
      ];
      
      // Handle both regular and enhanced list queries
      const isEnhanced = operation.includes('Enhanced') || req.body.query?.includes('Enhanced');
      
      if (isEnhanced) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listActionsEnhanced: {
                items: [...createdActions, ...defaultActions],
                nextCursor: null
              }
            }
          }
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listActions: {
                items: [...createdActions, ...defaultActions]
              }
            }
          }
        });
      }
    } else if (operation.includes('GetAction') || req.body.query?.includes('getAction')) {
      const actionId = req.body.variables?.actionId;
      
      // Try to get the action from stored mock data, otherwise use default
      const storedAction = mockStorage[actionId];
      const actionData = storedAction || {
        actionId: actionId || 'mock-action-1',
        name: 'Simple Hit',
        description: 'A basic attack action',
        actionCategory: 'ATTACK',
        sourceAttribute: 'DEXTERITY',
        targetAttribute: 'AGILITY',
        targetType: 'CHARACTER',
        effectType: 'DESTROY',
        objectUsage: 'NONE',
        formula: 'CONTEST'
      };
      
      req.reply({
        statusCode: 200,
        body: {
          data: {
            getAction: actionData
          }
        }
      });
    } else if (operation.includes('UpdateAction') || req.body.query?.includes('mutation UpdateAction')) {
      req.reply({
        statusCode: 200,
        body: {
          data: {
            updateAction: {
              actionId: req.body.variables?.actionId || 'mock-action-1',
              name: req.body.variables?.input?.name || 'Updated Action',
              description: req.body.variables?.input?.description || 'Updated Description',
              actionCategory: req.body.variables?.input?.actionCategory || 'ATTACK',
              sourceAttribute: req.body.variables?.input?.sourceAttribute || 'DEXTERITY',
              targetAttribute: req.body.variables?.input?.targetAttribute || 'AGILITY',
              targetType: req.body.variables?.input?.targetType || 'CHARACTER',
              effectType: req.body.variables?.input?.effectType || 'DESTROY',
              objectUsage: req.body.variables?.input?.objectUsage || 'NONE',
              formula: req.body.variables?.input?.formula || 'CONTEST'
            }
          }
        }
      });
    } else if (operation.includes('DeleteAction') || req.body.query?.includes('mutation DeleteAction')) {
      req.reply({
        statusCode: 200,
        body: {
          data: {
            deleteAction: {
              actionId: req.body.variables?.actionId || 'mock-action-1'
            }
          }
        }
      });
    } else if (operation.includes('CreateCharacter') || req.body.query?.includes('mutation CreateCharacter')) {
      const mockId = `mock-character-${Math.random().toString(36).substr(2, 9)}`;
      const characterName = req.body.variables?.input?.name || 'Mock Character';
      
      const characterData = {
        characterId: mockId,
        name: characterName,
        characterCategory: req.body.variables?.input?.characterCategory || 'PERSON'
      };
      
      // Store the character for subsequent queries
      mockStorage[mockId] = characterData;
      
      req.reply({
        statusCode: 200,
        body: {
          data: {
            createCharacter: characterData
          }
        }
      });
      
    } else if (operation.includes('ListCharacters') || req.body.query?.includes('listCharacters')) {
      const isEnhanced = operation.includes('Enhanced') || req.body.query?.includes('Enhanced');
      
      const defaultCharacters = [
        {
          characterId: 'mock-character-1',
          name: 'Test Character',
          characterCategory: 'PERSON'
        },
        {
          characterId: 'mock-character-2', 
          name: 'Mock Hero',
          characterCategory: 'PERSON'
        }
      ];
      
      if (isEnhanced) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listCharactersEnhanced: {
                items: defaultCharacters,
                nextCursor: null
              }
            }
          }
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listCharacters: defaultCharacters
            }
          }
        });
      }
      
    } else if (operation.includes('GetCharacter') || req.body.query?.includes('getCharacter')) {
      const characterId = req.body.variables?.characterId;
      
      // Try to get the character from stored mock data, otherwise use default
      const storedCharacter = mockStorage[characterId];
      const characterData = storedCharacter || {
        characterId: characterId || 'mock-character-1',
        name: 'Test Character',
        characterCategory: 'PERSON'
      };
      
      req.reply({
        statusCode: 200,
        body: {
          data: {
            getCharacter: characterData
          }
        }
      });
      
    } else if (operation.includes('CreateObject') || req.body.query?.includes('mutation CreateObject')) {
      const mockId = `mock-object-${Math.random().toString(36).substr(2, 9)}`;
      const objectName = req.body.variables?.input?.name || 'Mock Object';
      
      const objectData = {
        objectId: mockId,
        name: objectName,
        objectCategory: req.body.variables?.input?.objectCategory || 'TOOL'
      };
      
      mockStorage[mockId] = objectData;
      
      req.reply({
        statusCode: 200,
        body: {
          data: {
            createObject: objectData
          }
        }
      });
      
    } else if (operation.includes('ListObjects') || req.body.query?.includes('listObjects')) {
      const isEnhanced = operation.includes('Enhanced') || req.body.query?.includes('Enhanced');
      const createdObjects = Object.values(mockStorage).filter(item => item.objectId);
      
      const defaultObjects = [
        {
          objectId: 'mock-object-1',
          name: 'Test Sword',
          objectCategory: 'WEAPON'
        },
        {
          objectId: 'mock-object-2',
          name: 'Mock Shield',
          objectCategory: 'ARMOR'
        }
      ];
      
      if (isEnhanced) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listObjectsEnhanced: {
                items: [...createdObjects, ...defaultObjects],
                nextCursor: null
              }
            }
          }
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listObjects: [...createdObjects, ...defaultObjects]
            }
          }
        });
      }
      
    } else if (operation.includes('GetObject') || req.body.query?.includes('getObject')) {
      const objectId = req.body.variables?.objectId;
      
      const storedObject = mockStorage[objectId];
      const objectData = storedObject || {
        objectId: objectId || 'mock-object-1',
        name: 'Test Sword',
        objectCategory: 'WEAPON'
      };
      
      req.reply({
        statusCode: 200,
        body: {
          data: {
            getObject: objectData
          }
        }
      });
      
    } else if (operation.includes('CreateCondition') || req.body.query?.includes('mutation CreateCondition')) {
      const mockId = `mock-condition-${Math.random().toString(36).substr(2, 9)}`;
      const conditionName = req.body.variables?.input?.name || 'Mock Condition';
      
      const conditionData = {
        conditionId: mockId,
        name: conditionName,
        description: req.body.variables?.input?.description || 'Mock Description',
        conditionCategory: req.body.variables?.input?.conditionCategory || 'PHYSICAL',
        conditionType: req.body.variables?.input?.conditionType || 'HINDER',
        conditionTarget: req.body.variables?.input?.conditionTarget || 'SPEED'
      };
      
      // Store the condition for subsequent queries
      mockStorage[mockId] = conditionData;
      
      req.reply({
        statusCode: 200,
        body: {
          data: {
            createCondition: conditionData
          }
        }
      });
      
    } else if (operation.includes('ListConditions') || req.body.query?.includes('listConditions')) {
      // Include created conditions in the list
      const createdConditions = Object.values(mockStorage).filter(item => item.conditionId);
      const defaultConditions = [
        {
          conditionId: 'mock-condition-1',
          name: 'Poisoned',
          description: 'Character is suffering from poison',
          conditionCategory: 'PHYSICAL',
          conditionType: 'HINDER',
          conditionTarget: 'ENDURANCE'
        },
        {
          conditionId: 'mock-condition-2',
          name: 'Blessed',
          description: 'Character has divine blessing',
          conditionCategory: 'MAGICAL',
          conditionType: 'HELP',
          conditionTarget: 'RESOLVE'
        }
      ];
      
      // Handle both regular and enhanced list queries
      const isEnhanced = operation.includes('Enhanced') || req.body.query?.includes('Enhanced');
      
      if (isEnhanced) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listConditionsEnhanced: {
                items: [...createdConditions, ...defaultConditions],
                nextCursor: null
              }
            }
          }
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listConditions: [...createdConditions, ...defaultConditions]
            }
          }
        });
      }
      
    } else if (operation.includes('GetCondition') || req.body.query?.includes('getCondition')) {
      const conditionId = req.body.variables?.conditionId;
      
      // Try to get the condition from stored mock data, otherwise use default
      const storedCondition = mockStorage[conditionId];
      const conditionData = storedCondition || {
        conditionId: conditionId || 'mock-condition-1',
        name: 'Poisoned',
        description: 'Character is suffering from poison',
        conditionCategory: 'PHYSICAL',
        conditionType: 'HINDER',
        conditionTarget: 'ENDURANCE'
      };
      
      req.reply({
        statusCode: 200,
        body: {
          data: {
            getCondition: conditionData
          }
        }
      });
    } else if (operation.includes('UpdateCondition') || req.body.query?.includes('mutation UpdateCondition')) {
      req.reply({
        statusCode: 200,
        body: {
          data: {
            updateCondition: {
              conditionId: req.body.variables?.conditionId || 'mock-condition-1',
              name: req.body.variables?.input?.name || 'Updated Condition',
              description: req.body.variables?.input?.description || 'Updated Description',
              conditionCategory: req.body.variables?.input?.conditionCategory || 'PHYSICAL',
              conditionType: req.body.variables?.input?.conditionType || 'HINDER',
              conditionTarget: req.body.variables?.input?.conditionTarget || 'SPEED'
            }
          }
        }
      });
    } else if (operation.includes('DeleteCondition') || req.body.query?.includes('mutation DeleteCondition')) {
      req.reply({
        statusCode: 200,
        body: {
          data: {
            deleteCondition: {
              conditionId: req.body.variables?.conditionId || 'mock-condition-1'
            }
          }
        }
      });
    } else {
      // For any other GraphQL operations, return a generic success
      req.reply({
        statusCode: 200,
        body: {
          data: {}
        }
      });
    }
  }).as('graphqlRequest');
});