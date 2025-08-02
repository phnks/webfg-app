import React, { useState, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { LIST_CHARACTERS, LIST_OBJECTS, LIST_ACTIONS, GET_ACTION } from '../../../graphql/operations';
import { CALCULATE_ACTION_TEST } from '../../../graphql/computedOperations';
import { getDiceForAttribute, attributeUsesDice, calculateAttributeModifier, formatDiceRoll, getAttributeRange, getDiceRange } from '../../../utils/diceMapping';
import './ActionTest.css';
const ActionTestBackend = ({
  action,
  character,
  onClose
}) => {
  const [targetType, setTargetType] = useState(action.targetType);
  const [selectedTargetIds, setSelectedTargetIds] = useState([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState(character ? [character.characterId] : []);
  const [override, setOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState('');
  const [sourceOverride, setSourceOverride] = useState(false);
  const [sourceOverrideValue, setSourceOverrideValue] = useState('');

  // Per-action override settings
  const [actionOverrides, setActionOverrides] = useState({});

  // Object usage selection for ready inventory
  const [selectedObjectId, setSelectedObjectId] = useState(null);

  // State for showing final grouped attributes
  const [showFinalGrouped, setShowFinalGrouped] = useState(false);
  const [finalGroupedAttributes, setFinalGroupedAttributes] = useState(null);

  // Fetch potential targets based on targetType
  const {
    data: charactersData
  } = useQuery(LIST_CHARACTERS, {
    skip: targetType !== 'CHARACTER'
  });
  const {
    data: objectsData
  } = useQuery(LIST_OBJECTS, {
    skip: targetType !== 'OBJECT'
  });
  const {
    data: actionsData
  } = useQuery(LIST_ACTIONS, {
    skip: targetType !== 'ACTION'
  });

  // Fetch all characters for source selection (always needed)
  const {
    data: allCharactersData
  } = useQuery(LIST_CHARACTERS);

  // State for action chain results
  const [actionChainResults, setActionChainResults] = useState([]);
  const [isCalculatingChain, setIsCalculatingChain] = useState(false);

  // Lazy query for action test calculation
  const [calculateTest, {
    data: testResult,
    loading: calculating,
    error: calculateError
  }] = useLazyQuery(CALCULATE_ACTION_TEST, {
    fetchPolicy: 'no-cache',
    // Always get fresh calculation
    onError: error => {
      console.error('GraphQL query error:', error);
      console.error('Error details:', error.message);
      console.error('Network error:', error.networkError);
      console.error('GraphQL errors:', error.graphQLErrors);
    },
    onCompleted: data => {
      console.log('GraphQL query completed with data:', data);
    }
  });

  // Lazy query for fetching action details
  const [getAction] = useLazyQuery(GET_ACTION, {
    fetchPolicy: 'no-cache'
  });

  // Initial setup
  useEffect(() => {
    setTargetType(action.targetType);
  }, [action]);

  // Auto-trigger calculation when source and target are selected
  useEffect(() => {
    if (selectedSourceIds.length > 0 && selectedTargetIds.length > 0 && !sourceOverride && !override) {
      console.log('Auto-triggering calculation with sources and targets selected');
      handleSubmit();
    }
  }, [selectedSourceIds, selectedTargetIds]);

  // Recursive function to calculate action chain
  const calculateActionChain = async (currentAction, sourceIds, targetIds, chainResults = [], visitedActions = new Set()) => {
    // Prevent infinite recursion
    if (visitedActions.has(currentAction.actionId)) {
      console.warn(`Circular reference detected for action ${currentAction.actionId}. Stopping recursion.`);
      return chainResults;
    }
    visitedActions.add(currentAction.actionId);

    // Prevent excessive chain length
    if (chainResults.length > 10) {
      console.warn('Action chain exceeded 10 actions. Stopping to prevent infinite loop.');
      return chainResults;
    }
    const isFirstAction = chainResults.length === 0;
    const actionIndex = chainResults.length;
    const actionKey = `${currentAction.actionId}_${actionIndex}`;

    // Get override settings for this specific action
    const actionOverride = actionOverrides[actionKey] || {};
    const hasTargetOverride = isFirstAction ? override : actionOverride.targetOverride;
    const targetOverrideVal = isFirstAction ? overrideValue : actionOverride.targetOverrideValue;
    const hasSourceOverride = isFirstAction ? sourceOverride : actionOverride.sourceOverride;
    const sourceOverrideVal = isFirstAction ? sourceOverrideValue : actionOverride.sourceOverrideValue;

    // Prepare input for backend calculation
    const input = {
      actionId: currentAction.actionId,
      sourceCharacterIds: hasSourceOverride ? [] : sourceIds,
      targetIds: hasTargetOverride ? [] : targetIds,
      targetType: currentAction.targetType || targetType,
      override: hasTargetOverride,
      overrideValue: hasTargetOverride ? parseFloat(targetOverrideVal) || 0 : 0,
      sourceOverride: hasSourceOverride,
      sourceOverrideValue: hasSourceOverride ? parseFloat(sourceOverrideVal) || 0 : 0
    };

    // Only include selectedReadyObjectId if it's not null/undefined to avoid Apollo Client stripping it
    if (selectedObjectId !== null && selectedObjectId !== undefined) {
      input.selectedReadyObjectId = selectedObjectId;
    }
    console.log(`Calculating action ${actionIndex + 1}: ${currentAction.name}`, {
      sourceIds,
      targetIds,
      isFirstAction,
      actionKey,
      actionOverride,
      input,
      selectedObjectId,
      selectedObjectIdType: typeof selectedObjectId,
      selectedObjectIdIsNull: selectedObjectId === null,
      selectedObjectIdIsUndefined: selectedObjectId === undefined
    });

    // Calculate test for current action
    console.log('About to call calculateTest with variables:', {
      input
    });
    console.log('calculateTest function:', calculateTest);
    console.log('CALCULATE_ACTION_TEST query:', CALCULATE_ACTION_TEST);
    try {
      console.log('Executing calculateTest query...');
      const result = await calculateTest({
        variables: {
          input
        }
      });
      console.log('Query execution completed');
      console.log('calculateTest result:', result.data?.calculateActionTest);
      console.log('calculateTest full result:', result);
      console.log('calculateTest error:', result.error);
      console.log('calculateTest errors:', result.errors);
      if (!result.data && result.errors) {
        console.error('GraphQL errors:', result.errors);
        return chainResults;
      }
      if (result.data && result.data.calculateActionTest) {
        const actionResult = {
          action: currentAction,
          result: result.data.calculateActionTest,
          sourceIds,
          targetIds
        };
        chainResults.push(actionResult);

        // Check if there's a triggered action
        console.log('Checking for triggered action:', {
          triggeredActionId: currentAction.triggeredActionId,
          effectType: currentAction.effectType,
          triggeredAction: currentAction.triggeredAction
        });
        if (currentAction.triggeredActionId && currentAction.effectType === 'TRIGGER_ACTION') {
          console.log('Found triggered action, processing...');

          // Fetch the triggered action details if not already loaded
          let triggeredAction = currentAction.triggeredAction;
          if (!triggeredAction && currentAction.triggeredActionId) {
            console.log('Fetching triggered action details for ID:', currentAction.triggeredActionId);
            const actionResult = await getAction({
              variables: {
                actionId: currentAction.triggeredActionId
              }
            });
            triggeredAction = actionResult.data?.getAction;
            console.log('Fetched triggered action:', triggeredAction);
          }
          if (triggeredAction) {
            console.log('Processing triggered action:', triggeredAction.name);

            // For triggered actions, keep the same source and target characters as the first action
            // This ensures fatigue is calculated properly for all actions in the chain
            const newSourceIds = sourceIds; // Same sources for all actions in chain
            const newTargetIds = targetIds; // Same targets for all actions in chain

            console.log('Recursive call with:', {
              action: triggeredAction.name,
              newSourceIds,
              newTargetIds
            });
            await calculateActionChain(triggeredAction, newSourceIds, newTargetIds, chainResults, visitedActions);
          } else {
            console.log('No triggered action found despite having triggeredActionId');
          }
        } else {
          console.log('No triggered action or not TRIGGER_ACTION type');
        }
      }
    } catch (error) {
      console.error('Error calling calculateTest:', error);
      console.error('Error stack:', error.stack);
      return chainResults;
    }
    return chainResults;
  };
  const handleSubmit = async () => {
    setIsCalculatingChain(true);
    setActionChainResults([]);
    console.log('Starting action chain calculation for:', {
      action: action.name,
      actionId: action.actionId,
      effectType: action.effectType,
      triggeredActionId: action.triggeredActionId,
      triggeredAction: action.triggeredAction,
      selectedSourceIds,
      selectedTargetIds
    });

    // Let's fetch the action fresh to get the triggered action data
    console.log('Fetching fresh action data to ensure we have triggered action fields...');
    let actionToUse = action;
    try {
      const freshActionResult = await getAction({
        variables: {
          actionId: action.actionId
        }
      });
      console.log('Fresh action data:', freshActionResult.data?.getAction);
      if (freshActionResult.data?.getAction) {
        actionToUse = freshActionResult.data.getAction;
        console.log('Using fresh action data for chain calculation');
      }
    } catch (err) {
      console.error('Error fetching fresh action data:', err);
      console.log('Falling back to original action data');
    }
    try {
      const results = await calculateActionChain(actionToUse, selectedSourceIds, selectedTargetIds);
      console.log('Final chain results:', results);
      setActionChainResults(results);
    } catch (error) {
      console.error('Error calculating action chain:', error);
    } finally {
      setIsCalculatingChain(false);
    }
  };

  // Handler for checkbox target selection
  const handleTargetSelection = (targetId, isChecked) => {
    if (isChecked) {
      setSelectedTargetIds(prev => [...prev, targetId]);
    } else {
      setSelectedTargetIds(prev => prev.filter(id => id !== targetId));
    }
  };

  // Handler for checkbox source selection
  const handleSourceSelection = (sourceId, isChecked) => {
    if (isChecked) {
      setSelectedSourceIds(prev => [...prev, sourceId]);
    } else {
      setSelectedSourceIds(prev => prev.filter(id => id !== sourceId));
    }
  };

  // Handler for object selection from ready inventory
  const handleObjectSelection = objectId => {
    setSelectedObjectId(objectId === selectedObjectId ? null : objectId);
  };

  // Get available objects from character's ready inventory based on objectUsage
  const getAvailableReadyObjects = () => {
    if (!character || !character.ready || !action.objectUsage || action.objectUsage === 'NONE') {
      return [];
    }
    const readyObjects = character.ready || [];
    if (action.objectUsage === 'ANY') {
      return readyObjects;
    }

    // Filter by object category matching objectUsage
    return readyObjects.filter(obj => obj.objectCategory === action.objectUsage);
  };

  // Calculate final grouped attributes when object is selected
  const calculateFinalGroupedAttributes = () => {
    if (!selectedObjectId || !character) {
      return null;
    }
    const selectedObject = character.ready?.find(obj => obj.objectId === selectedObjectId);
    if (!selectedObject) {
      return null;
    }

    // We need to recalculate grouping properly with base + equipment + selected ready object
    const finalAttributes = {};
    const attributeNames = ['weight', 'size', 'armour', 'endurance', 'lethality', 'speed', 'strength', 'dexterity', 'agility', 'resolve', 'morale', 'intelligence', 'charisma', 'obscurity', 'seeing', 'hearing', 'light', 'noise'];
    attributeNames.forEach(attrName => {
      const valuesToGroup = [];

      // Add character base value if it's groupable
      const charAttr = character[attrName];
      if (charAttr && charAttr.attribute && charAttr.attribute.isGrouped) {
        valuesToGroup.push(charAttr.attribute.attributeValue || 0);
      }

      // Add equipment values if they're groupable
      if (character.equipment) {
        character.equipment.forEach(item => {
          const itemAttr = item[attrName];
          if (itemAttr && itemAttr.isGrouped) {
            valuesToGroup.push(itemAttr.attributeValue || 0);
          }
        });
      }

      // Add selected ready object value if it's groupable
      const objectAttr = selectedObject[attrName];
      if (objectAttr && objectAttr.isGrouped) {
        valuesToGroup.push(objectAttr.attributeValue || 0);
      }

      // Calculate grouped value using the same formula as backend
      if (valuesToGroup.length === 0) {
        // If no groupable values, use character base value
        const charAttr = character[attrName];
        finalAttributes[attrName] = charAttr && charAttr.attribute ? charAttr.attribute.attributeValue || 0 : 0;
      } else if (valuesToGroup.length === 1) {
        finalAttributes[attrName] = valuesToGroup[0];
      } else {
        // Sort values in descending order (highest first)
        valuesToGroup.sort((a, b) => b - a);
        const A1 = valuesToGroup[0]; // Highest value
        let sum = A1; // Start with the highest value

        // Add weighted values for all other attributes using 0.25 constant
        for (let i = 1; i < valuesToGroup.length; i++) {
          const Ai = valuesToGroup[i];
          const scalingFactor = 0.25; // Constant scaling factor

          if (A1 > 0) {
            sum += Ai * (scalingFactor + Ai / A1);
          } else {
            // Handle edge case where A1 is 0
            sum += Ai * scalingFactor;
          }
        }
        finalAttributes[attrName] = Math.round(sum / valuesToGroup.length * 100) / 100;
      }
    });
    return finalAttributes;
  };

  // Effect to calculate final grouped attributes when object selection changes
  useEffect(() => {
    if (selectedObjectId) {
      const finalAttrs = calculateFinalGroupedAttributes();
      setFinalGroupedAttributes(finalAttrs);
      setShowFinalGrouped(true);
    } else {
      setShowFinalGrouped(false);
      setFinalGroupedAttributes(null);
    }
  }, [selectedObjectId, character]);

  // Render object selection section
  const renderObjectSelection = () => {
    if (!action.objectUsage || action.objectUsage === 'NONE') {
      return /*#__PURE__*/React.createElement("div", {
        className: "object-selection"
      }, /*#__PURE__*/React.createElement("h3", null, "Object Usage"), /*#__PURE__*/React.createElement("p", {
        className: "object-usage-note"
      }, "This action has object usage set to NONE - no object selection required."));
    }
    const availableObjects = getAvailableReadyObjects();
    if (availableObjects.length === 0) {
      return /*#__PURE__*/React.createElement("div", {
        className: "object-selection"
      }, /*#__PURE__*/React.createElement("h3", null, "Object Usage: ", action.objectUsage), /*#__PURE__*/React.createElement("p", {
        className: "object-usage-note"
      }, "No objects in ready inventory match the required object usage (", action.objectUsage, ")."));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "object-selection"
    }, /*#__PURE__*/React.createElement("h3", null, "Object Usage: ", action.objectUsage), /*#__PURE__*/React.createElement("p", {
      className: "object-usage-note"
    }, "Select an object from ready inventory (optional):"), /*#__PURE__*/React.createElement("div", {
      className: "object-selection-list"
    }, /*#__PURE__*/React.createElement("label", {
      className: "object-option"
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: "objectSelection",
      checked: selectedObjectId === null,
      onChange: () => setSelectedObjectId(null)
    }), /*#__PURE__*/React.createElement("span", {
      className: "object-name"
    }, "No object selected")), availableObjects.map(obj => /*#__PURE__*/React.createElement("label", {
      key: obj.objectId,
      className: "object-option"
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: "objectSelection",
      checked: selectedObjectId === obj.objectId,
      onChange: () => handleObjectSelection(obj.objectId)
    }), /*#__PURE__*/React.createElement("span", {
      className: "object-name"
    }, obj.name, " (", obj.objectCategory, ")")))));
  };
  const getTargetOptions = () => {
    if (override) {
      return /*#__PURE__*/React.createElement("div", {
        className: "override-input"
      }, /*#__PURE__*/React.createElement("input", {
        type: "number",
        value: overrideValue,
        onChange: e => setOverrideValue(e.target.value),
        placeholder: "Enter difficulty value"
      }));
    }
    switch (targetType) {
      case 'CHARACTER':
        return /*#__PURE__*/React.createElement("div", {
          className: "target-selection-list"
        }, /*#__PURE__*/React.createElement("div", {
          className: "selection-header"
        }, /*#__PURE__*/React.createElement("span", null, "Select Characters (multiple allowed):"), selectedTargetIds.length > 0 && /*#__PURE__*/React.createElement("span", {
          className: "selection-count"
        }, selectedTargetIds.length, " selected")), charactersData?.listCharacters.map(char => /*#__PURE__*/React.createElement("label", {
          key: char.characterId,
          className: "target-option"
        }, /*#__PURE__*/React.createElement("input", {
          type: "checkbox",
          checked: selectedTargetIds.includes(char.characterId),
          onChange: e => handleTargetSelection(char.characterId, e.target.checked)
        }), /*#__PURE__*/React.createElement("span", {
          className: "target-name"
        }, char.name))));
      case 'OBJECT':
        return /*#__PURE__*/React.createElement("div", {
          className: "target-selection-list"
        }, /*#__PURE__*/React.createElement("div", {
          className: "selection-header"
        }, /*#__PURE__*/React.createElement("span", null, "Select Objects (multiple allowed):"), selectedTargetIds.length > 0 && /*#__PURE__*/React.createElement("span", {
          className: "selection-count"
        }, selectedTargetIds.length, " selected")), objectsData?.listObjects.map(obj => /*#__PURE__*/React.createElement("label", {
          key: obj.objectId,
          className: "target-option"
        }, /*#__PURE__*/React.createElement("input", {
          type: "checkbox",
          checked: selectedTargetIds.includes(obj.objectId),
          onChange: e => handleTargetSelection(obj.objectId, e.target.checked)
        }), /*#__PURE__*/React.createElement("span", {
          className: "target-name"
        }, obj.name))));
      case 'ACTION':
        return /*#__PURE__*/React.createElement("div", {
          className: "target-selection-list"
        }, /*#__PURE__*/React.createElement("div", {
          className: "selection-header"
        }, /*#__PURE__*/React.createElement("span", null, "Select Actions (multiple allowed):"), selectedTargetIds.length > 0 && /*#__PURE__*/React.createElement("span", {
          className: "selection-count"
        }, selectedTargetIds.length, " selected")), actionsData?.listActions.map(action => /*#__PURE__*/React.createElement("label", {
          key: action.actionId,
          className: "target-option"
        }, /*#__PURE__*/React.createElement("input", {
          type: "checkbox",
          checked: selectedTargetIds.includes(action.actionId),
          onChange: e => handleTargetSelection(action.actionId, e.target.checked)
        }), /*#__PURE__*/React.createElement("span", {
          className: "target-name"
        }, action.name))));
      default:
        return /*#__PURE__*/React.createElement("div", null, "Invalid target type");
    }
  };
  const getSourceOptions = () => {
    // Filter characters that have the same action
    const charactersWithAction = allCharactersData?.listCharacters.filter(char => char.actions && char.actions.some(charAction => charAction.actionId === action.actionId)) || [];
    if (charactersWithAction.length === 0) {
      return /*#__PURE__*/React.createElement("div", {
        className: "no-sources"
      }, /*#__PURE__*/React.createElement("p", null, "No characters have this action."));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "source-selection-list"
    }, /*#__PURE__*/React.createElement("div", {
      className: "selection-header"
    }, /*#__PURE__*/React.createElement("span", null, "Select Source Characters (multiple allowed):"), selectedSourceIds.length > 0 && /*#__PURE__*/React.createElement("span", {
      className: "selection-count"
    }, selectedSourceIds.length, " selected")), /*#__PURE__*/React.createElement("div", {
      className: "source-note"
    }, /*#__PURE__*/React.createElement("small", null, "Only characters who have the \"", action.name, "\" action can be selected as sources.")), charactersWithAction.map(char => /*#__PURE__*/React.createElement("label", {
      key: char.characterId,
      className: "source-option"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: selectedSourceIds.includes(char.characterId),
      onChange: e => handleSourceSelection(char.characterId, e.target.checked)
    }), /*#__PURE__*/React.createElement("span", {
      className: "source-name"
    }, char.name, char.characterId === character?.characterId && ' (current)'))));
  };

  // Get display values from backend result
  // These functions were defined but not used - commented out for potential future use
  // const getDisplaySourceValue = () => {
  //   if (sourceOverride) {
  //     return parseFloat(sourceOverrideValue) || 0;
  //   } else if (testResult?.calculateActionTest) {
  //     const { sourceValue, sourceCount } = testResult.calculateActionTest;
  //     if (sourceCount === 1) {
  //       return `${sourceValue} (1 source)`;
  //     } else if (sourceCount > 1) {
  //       return `${sourceValue} (${sourceCount} sources grouped)`;
  //     }
  //   } else if (selectedSourceIds.length > 0) {
  //     return `Source (${selectedSourceIds.length} selected)`;
  //   }
  //   return 'N/A';
  // };

  // const getDisplayTargetValue = () => {
  //   if (override) {
  //     return parseFloat(overrideValue) || 0;
  //   } else if (testResult?.calculateActionTest) {
  //     const { targetValue, targetCount } = testResult.calculateActionTest;
  //     if (targetCount === 1) {
  //       return `${targetValue} (1 target)`;
  //     } else if (targetCount > 1) {
  //       return `${targetValue} (${targetCount} targets grouped)`;
  //     }
  //   } else if (selectedTargetIds.length > 0) {
  //     return `Target (${selectedTargetIds.length} selected)`;
  //   }
  //   return 'N/A';
  // };

  return /*#__PURE__*/React.createElement("div", {
    className: "action-test-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "action-test-header"
  }, /*#__PURE__*/React.createElement("h2", null, "Test Action: ", action.name), /*#__PURE__*/React.createElement("button", {
    className: "close-button",
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "action-test-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "action-details"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Source Attribute:"), " ", action.sourceAttribute), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Target Attribute:"), " ", action.targetAttribute)), /*#__PURE__*/React.createElement("div", {
    className: "source-selection"
  }, /*#__PURE__*/React.createElement("h3", null, "Select Sources"), /*#__PURE__*/React.createElement("div", {
    className: "override-toggle"
  }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: sourceOverride,
    onChange: () => {
      setSourceOverride(!sourceOverride);
      setSelectedSourceIds([]);
    }
  }), "Override with manual value")), sourceOverride ? /*#__PURE__*/React.createElement("div", {
    className: "override-input"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: sourceOverrideValue,
    onChange: e => setSourceOverrideValue(e.target.value),
    placeholder: "Enter source value"
  })) : getSourceOptions()), /*#__PURE__*/React.createElement("div", {
    className: "target-selection"
  }, /*#__PURE__*/React.createElement("h3", null, "Select Target"), /*#__PURE__*/React.createElement("div", {
    className: "override-toggle"
  }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: override,
    onChange: () => {
      setOverride(!override);
      setSelectedTargetIds([]);
    }
  }), "Override with manual value")), !override && /*#__PURE__*/React.createElement("p", null, "Target Type: ", targetType), getTargetOptions()), renderObjectSelection(), /*#__PURE__*/React.createElement("div", {
    className: "action-buttons"
  }, /*#__PURE__*/React.createElement("button", {
    className: "submit-button",
    onClick: handleSubmit,
    disabled: selectedTargetIds.length === 0 && !override || override && !overrideValue || selectedSourceIds.length === 0 && !sourceOverride || sourceOverride && !sourceOverrideValue || calculating || isCalculatingChain
  }, calculating || isCalculatingChain ? 'Calculating...' : 'Submit'), /*#__PURE__*/React.createElement("button", {
    className: "cancel-button",
    onClick: onClose
  }, "Cancel")), /*#__PURE__*/React.createElement("div", {
    className: "action-test-values-preview"
  }, /*#__PURE__*/React.createElement("h3", null, "Action Test Values Preview"), /*#__PURE__*/React.createElement("p", {
    className: "preview-note"
  }, "These are the values that will be used for the ", action.sourceAttribute, " calculation:"), !selectedObjectId ? /*#__PURE__*/React.createElement("div", {
    className: "no-object-selected"
  }, /*#__PURE__*/React.createElement("div", {
    className: "attribute-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "attribute-label"
  }, action.sourceAttribute, " (Base + Equipment):"), /*#__PURE__*/React.createElement("span", {
    className: "attribute-value"
  }, Math.round(character.groupedAttributes?.[action.sourceAttribute?.toLowerCase()] || 0))), /*#__PURE__*/React.createElement("p", {
    className: "calculation-note"
  }, /*#__PURE__*/React.createElement("small", null, "Using equipment-grouped values since no ready object is selected."))) : showFinalGrouped && finalGroupedAttributes && /*#__PURE__*/React.createElement("div", {
    className: "object-selected"
  }, /*#__PURE__*/React.createElement("div", {
    className: "attribute-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "attribute-label"
  }, action.sourceAttribute, " (Base + Equipment + Selected Object):"), /*#__PURE__*/React.createElement("span", {
    className: "attribute-value"
  }, Math.round(finalGroupedAttributes[action.sourceAttribute?.toLowerCase()] || 0))), /*#__PURE__*/React.createElement("p", {
    className: "calculation-note"
  }, /*#__PURE__*/React.createElement("small", null, "Using recalculated grouped values including the selected ready object.")))), actionChainResults.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "result-display"
  }, /*#__PURE__*/React.createElement("h3", null, "Action Chain Results"), actionChainResults.map((actionResult, index) => {
    const actionKey = `${actionResult.action.actionId}_${index}`;
    const actionOverride = actionOverrides[actionKey] || {};
    const isFirstAction = index === 0;
    return /*#__PURE__*/React.createElement("div", {
      key: index,
      className: "action-chain-item"
    }, /*#__PURE__*/React.createElement("h4", null, index + 1, ". ", actionResult.action.name), /*#__PURE__*/React.createElement("div", {
      className: "difficulty-value"
    }, actionResult.result.successPercentage.toFixed(2), "%"), !isFirstAction && /*#__PURE__*/React.createElement("div", {
      className: "per-action-overrides"
    }, /*#__PURE__*/React.createElement("h5", null, "Override Values for This Action"), /*#__PURE__*/React.createElement("div", {
      className: "override-control"
    }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: actionOverride.sourceOverride || false,
      onChange: e => {
        setActionOverrides(prev => ({
          ...prev,
          [actionKey]: {
            ...prev[actionKey],
            sourceOverride: e.target.checked,
            sourceOverrideValue: e.target.checked ? prev[actionKey]?.sourceOverrideValue || '' : ''
          }
        }));
      }
    }), "Override source value"), actionOverride.sourceOverride && /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: actionOverride.sourceOverrideValue || '',
      onChange: e => {
        setActionOverrides(prev => ({
          ...prev,
          [actionKey]: {
            ...prev[actionKey],
            sourceOverrideValue: e.target.value
          }
        }));
      },
      placeholder: "Enter source value",
      className: "override-input-small"
    })), /*#__PURE__*/React.createElement("div", {
      className: "override-control"
    }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: actionOverride.targetOverride || false,
      onChange: e => {
        setActionOverrides(prev => ({
          ...prev,
          [actionKey]: {
            ...prev[actionKey],
            targetOverride: e.target.checked,
            targetOverrideValue: e.target.checked ? prev[actionKey]?.targetOverrideValue || '' : ''
          }
        }));
      }
    }), "Override target value"), actionOverride.targetOverride && /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: actionOverride.targetOverrideValue || '',
      onChange: e => {
        setActionOverrides(prev => ({
          ...prev,
          [actionKey]: {
            ...prev[actionKey],
            targetOverrideValue: e.target.value
          }
        }));
      },
      placeholder: "Enter target value",
      className: "override-input-small"
    }))), /*#__PURE__*/React.createElement("p", null, "Source Value: ", actionResult.result.sourceCount === 1 ? `${actionResult.result.sourceValue} (1 source)` : actionResult.result.sourceCount > 1 ? `${actionResult.result.sourceValue} (${actionResult.result.sourceCount} sources grouped)` : actionResult.result.sourceValue, /*#__PURE__*/React.createElement("br", null), "Target Value: ", actionResult.result.targetCount === 1 ? `${actionResult.result.targetValue} (1 target)` : actionResult.result.targetCount > 1 ? `${actionResult.result.targetValue} (${actionResult.result.targetCount} targets grouped)` : actionResult.result.targetValue), (() => {
      const sourceAttribute = actionResult.action.sourceAttribute;
      const targetAttribute = actionResult.action.targetAttribute;

      // Use backend-calculated values
      const sourceDiceDisplay = actionResult.result.sourceDiceDisplay || 'N/A';
      const targetDiceDisplay = actionResult.result.targetDiceDisplay || 'N/A';
      const sourceModifier = actionResult.result.sourceModifier || 0;
      const targetModifier = actionResult.result.targetModifier || 0;
      return /*#__PURE__*/React.createElement("div", {
        className: "dice-roll-info"
      }, /*#__PURE__*/React.createElement("h5", null, "Dice Rolls Required"), /*#__PURE__*/React.createElement("div", {
        className: "dice-roll-values"
      }, /*#__PURE__*/React.createElement("div", {
        className: "dice-roll-item"
      }, /*#__PURE__*/React.createElement("span", {
        className: "dice-label"
      }, "Source (", sourceAttribute, "):"), /*#__PURE__*/React.createElement("span", {
        className: "dice-value"
      }, sourceDiceDisplay), !attributeUsesDice(sourceAttribute) && /*#__PURE__*/React.createElement("span", {
        className: "static-note"
      }, " (No roll needed)")), /*#__PURE__*/React.createElement("div", {
        className: "dice-roll-item"
      }, /*#__PURE__*/React.createElement("span", {
        className: "dice-label"
      }, "Target (", targetAttribute, "):"), /*#__PURE__*/React.createElement("span", {
        className: "dice-value"
      }, targetDiceDisplay), !attributeUsesDice(targetAttribute) && /*#__PURE__*/React.createElement("span", {
        className: "static-note"
      }, " (No roll needed)"))), /*#__PURE__*/React.createElement("div", {
        className: "modifier-breakdown"
      }, /*#__PURE__*/React.createElement("h6", null, "Dice Roll Calculation"), actionResult.action.formula === 'DELTA' && /*#__PURE__*/React.createElement("div", {
        className: "modifier-item",
        style: {
          marginBottom: '10px',
          fontStyle: 'italic'
        }
      }, /*#__PURE__*/React.createElement("span", {
        className: "modifier-label"
      }, "Delta Calculation:"), /*#__PURE__*/React.createElement("span", {
        className: "modifier-calculation"
      }, "Target's ", targetAttribute, " (", actionResult.result.targetValue, ") - Source's ", targetAttribute, " (from backend) = delta modifier")), /*#__PURE__*/React.createElement("div", {
        className: "modifier-item"
      }, /*#__PURE__*/React.createElement("span", {
        className: "modifier-label"
      }, "Source ", sourceAttribute, ":"), /*#__PURE__*/React.createElement("span", {
        className: "modifier-calculation"
      }, actionResult.result.sourceValue, actionResult.action.formula === 'DELTA' ?
      /*#__PURE__*/
      // For DELTA, show the additional calculation step
      React.createElement(React.Fragment, null, ' = ', Math.round(actionResult.result.sourceValue), ' + delta modifier = ', sourceModifier, " \u2192 ", sourceDiceDisplay) :
      /*#__PURE__*/
      // For other formulas, show the simple calculation
      React.createElement(React.Fragment, null, ' = ', Math.round(actionResult.result.sourceValue), " \u2192 ", sourceDiceDisplay))), /*#__PURE__*/React.createElement("div", {
        className: "modifier-item"
      }, /*#__PURE__*/React.createElement("span", {
        className: "modifier-label"
      }, "Target ", targetAttribute, ":"), /*#__PURE__*/React.createElement("span", {
        className: "modifier-calculation"
      }, actionResult.result.targetValue, ' = ', targetModifier, " \u2192 ", targetDiceDisplay))), /*#__PURE__*/React.createElement("div", {
        className: "success-ranges"
      }, /*#__PURE__*/React.createElement("h6", null, "Success Probability"), (() => {
        // Use backend-calculated range analysis
        const sourceRange = actionResult.result.sourceRange || {
          min: 0,
          max: 0
        };
        const targetRange = actionResult.result.targetRange || {
          min: 0,
          max: 0
        };
        const guaranteedSuccess = actionResult.result.guaranteedSuccess || false;
        const guaranteedFailure = actionResult.result.guaranteedFailure || false;
        const partialSuccess = actionResult.result.partialSuccess || false;
        return /*#__PURE__*/React.createElement("div", {
          className: "range-analysis"
        }, /*#__PURE__*/React.createElement("div", {
          className: "range-item"
        }, /*#__PURE__*/React.createElement("span", {
          className: "range-label"
        }, "Source Range (", sourceAttribute, "):"), /*#__PURE__*/React.createElement("span", {
          className: `range-value ${guaranteedSuccess ? 'guaranteed-success' : guaranteedFailure ? 'guaranteed-failure' : 'potential-success'}`
        }, sourceRange.min, "-", sourceRange.max)), /*#__PURE__*/React.createElement("div", {
          className: "range-item"
        }, /*#__PURE__*/React.createElement("span", {
          className: "range-label"
        }, "Target Range (", targetAttribute, "):"), /*#__PURE__*/React.createElement("span", {
          className: "range-value target-range"
        }, targetRange.min, "-", targetRange.max)), /*#__PURE__*/React.createElement("div", {
          className: "success-assessment"
        }, guaranteedSuccess && /*#__PURE__*/React.createElement("span", {
          className: "success-guaranteed"
        }, "\u2713 Guaranteed Success - All source rolls beat all target rolls"), guaranteedFailure && /*#__PURE__*/React.createElement("span", {
          className: "success-impossible"
        }, "\u2717 Guaranteed Failure - No source roll can beat any target roll"), partialSuccess && /*#__PURE__*/React.createElement("span", {
          className: "success-partial"
        }, "~ Partial Success - Some combinations succeed")));
      })()), /*#__PURE__*/React.createElement("div", {
        className: "dice-guidance"
      }, /*#__PURE__*/React.createElement("h6", null, "Dice Roll Guidance"), (() => {
        // Calculate dice guidance for players
        const sourceRange = actionResult.result.sourceRange || {
          min: 0,
          max: 0
        };
        const targetRange = actionResult.result.targetRange || {
          min: 0,
          max: 0
        };
        const sourceModifier = actionResult.result.sourceModifier || 0;
        const targetModifier = actionResult.result.targetModifier || 0;
        const sourceUsesDice = attributeUsesDice(sourceAttribute);
        const targetUsesDice = attributeUsesDice(targetAttribute);

        // Get dice types
        const sourceDiceType = sourceUsesDice ? getDiceForAttribute(sourceAttribute) : null;
        const targetDiceType = targetUsesDice ? getDiceForAttribute(targetAttribute) : null;
        if (!sourceUsesDice && !targetUsesDice) {
          return /*#__PURE__*/React.createElement("div", {
            className: "guidance-item"
          }, /*#__PURE__*/React.createElement("p", null, "Both attributes are static - no dice rolling required."));
        }
        if (!sourceUsesDice) {
          // Source static vs target dice
          const sourceValue = sourceRange.min;
          const targetSuccess = [];
          const targetFail = [];
          const targetMaxRoll = targetDiceType ? getDiceRange(targetDiceType).max : 0;
          if (!targetDiceType || targetMaxRoll <= 0) {
            return /*#__PURE__*/React.createElement("div", {
              className: "guidance-item"
            }, /*#__PURE__*/React.createElement("p", null, "Error: Invalid target dice type."));
          }
          for (let targetRoll = 1; targetRoll <= targetMaxRoll; targetRoll++) {
            const targetTotal = targetRoll + targetModifier;
            if (targetTotal >= sourceValue) {
              // Target wins on tie
              targetSuccess.push(targetRoll);
            } else {
              targetFail.push(targetRoll);
            }
          }
          return /*#__PURE__*/React.createElement("div", {
            className: "guidance-item"
          }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Source (", sourceAttribute, "):"), " Static value ", sourceValue, " (no roll needed)"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Target (", targetAttribute, ") - Roll 1", targetDiceType, ":")), targetSuccess.length > 0 && /*#__PURE__*/React.createElement("p", null, "\u2022 ", /*#__PURE__*/React.createElement("span", {
            style: {
              color: '#28a745'
            }
          }, "Success (defense)"), " on: ", targetSuccess.join(', '), " (\u2265 static ", sourceValue, ")"), targetFail.length > 0 && /*#__PURE__*/React.createElement("p", null, "\u2022 ", /*#__PURE__*/React.createElement("span", {
            style: {
              color: '#dc3545'
            }
          }, "Failure (defense)"), " on: ", targetFail.join(', '), " (< static ", sourceValue, ")"));
        }
        if (!targetUsesDice) {
          // Source dice vs target static
          const targetValue = targetRange.min;
          const sourceSuccess = [];
          const sourceFail = [];
          const sourceMaxRoll = sourceDiceType ? getDiceRange(sourceDiceType).max : 0;
          if (!sourceDiceType || sourceMaxRoll <= 0) {
            return /*#__PURE__*/React.createElement("div", {
              className: "guidance-item"
            }, /*#__PURE__*/React.createElement("p", null, "Error: Invalid source dice type."));
          }
          for (let sourceRoll = 1; sourceRoll <= sourceMaxRoll; sourceRoll++) {
            const sourceTotal = sourceRoll + sourceModifier;
            if (sourceTotal > targetValue) {
              sourceSuccess.push(sourceRoll);
            } else {
              sourceFail.push(sourceRoll);
            }
          }
          return /*#__PURE__*/React.createElement("div", {
            className: "guidance-item"
          }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Source (", sourceAttribute, ") - Roll 1", sourceDiceType, ":")), sourceSuccess.length > 0 && /*#__PURE__*/React.createElement("p", null, "\u2022 ", /*#__PURE__*/React.createElement("span", {
            style: {
              color: '#28a745'
            }
          }, "Success"), " on: ", sourceSuccess.join(', '), " (beats static ", targetValue, ")"), sourceFail.length > 0 && /*#__PURE__*/React.createElement("p", null, "\u2022 ", /*#__PURE__*/React.createElement("span", {
            style: {
              color: '#dc3545'
            }
          }, "Failure"), " on: ", sourceFail.join(', '), " (\u2264 static ", targetValue, ")"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Target (", targetAttribute, "):"), " Static value ", targetValue, " (no roll needed)"));
        }

        // Both use dice - analyze specific roll outcomes
        const sourceGuaranteedWin = [];
        const sourceGuaranteedLoss = [];
        const sourceMixed = [];
        const targetGuaranteedWin = [];
        const targetGuaranteedLoss = [];
        const targetMixed = [];
        console.log('Dice guidance debug:', {
          sourceAttribute,
          targetAttribute,
          sourceDiceType,
          targetDiceType,
          sourceModifier,
          targetModifier,
          sourceRange,
          targetRange
        });

        // Safety check to prevent infinite loops
        const sourceMaxRoll = sourceDiceType ? getDiceRange(sourceDiceType).max : 0;
        const targetMaxRoll = targetDiceType ? getDiceRange(targetDiceType).max : 0;
        if (!sourceDiceType || !targetDiceType || sourceMaxRoll <= 0 || targetMaxRoll <= 0) {
          return /*#__PURE__*/React.createElement("div", {
            className: "guidance-item"
          }, /*#__PURE__*/React.createElement("p", null, "Error: Invalid dice types detected. Cannot generate guidance."));
        }

        // Analyze source die outcomes
        for (let sourceRoll = 1; sourceRoll <= sourceMaxRoll; sourceRoll++) {
          const sourceTotal = sourceRoll + sourceModifier;
          let winsAgainst = 0;
          let totalPossible = 0;
          for (let targetRoll = 1; targetRoll <= targetMaxRoll; targetRoll++) {
            const targetTotal = targetRoll + targetModifier;
            totalPossible++;
            if (sourceTotal > targetTotal) {
              winsAgainst++;
            }
          }
          if (winsAgainst === totalPossible) {
            sourceGuaranteedWin.push(sourceRoll);
          } else if (winsAgainst === 0) {
            sourceGuaranteedLoss.push(sourceRoll);
          } else {
            sourceMixed.push(sourceRoll);
          }
        }

        // Analyze target die outcomes  
        for (let targetRoll = 1; targetRoll <= targetMaxRoll; targetRoll++) {
          const targetTotal = targetRoll + targetModifier;
          let winsAgainst = 0;
          let totalPossible = 0;
          for (let sourceRoll = 1; sourceRoll <= sourceMaxRoll; sourceRoll++) {
            const sourceTotal = sourceRoll + sourceModifier;
            totalPossible++;
            if (targetTotal >= sourceTotal) {
              // Target wins on tie
              winsAgainst++;
            }
          }
          if (winsAgainst === totalPossible) {
            targetGuaranteedWin.push(targetRoll);
          } else if (winsAgainst === 0) {
            targetGuaranteedLoss.push(targetRoll);
          } else {
            targetMixed.push(targetRoll);
          }
        }
        return /*#__PURE__*/React.createElement("div", {
          className: "guidance-item"
        }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Source (", sourceAttribute, ") - Roll 1", sourceDiceType, ":")), sourceGuaranteedWin.length > 0 && /*#__PURE__*/React.createElement("p", null, "\u2022 ", /*#__PURE__*/React.createElement("span", {
          style: {
            color: '#28a745'
          }
        }, "Guaranteed success"), " on: ", sourceGuaranteedWin.join(', ')), sourceMixed.length > 0 && /*#__PURE__*/React.createElement("p", null, "\u2022 ", /*#__PURE__*/React.createElement("span", {
          style: {
            color: '#ffc107'
          }
        }, "Possible success/failure"), " on: ", sourceMixed.join(', ')), sourceGuaranteedLoss.length > 0 && /*#__PURE__*/React.createElement("p", null, "\u2022 ", /*#__PURE__*/React.createElement("span", {
          style: {
            color: '#dc3545'
          }
        }, "Guaranteed failure"), " on: ", sourceGuaranteedLoss.join(', ')), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Target (", targetAttribute, ") - Roll 1", targetDiceType, ":")), targetGuaranteedWin.length > 0 && /*#__PURE__*/React.createElement("p", null, "\u2022 ", /*#__PURE__*/React.createElement("span", {
          style: {
            color: '#28a745'
          }
        }, "Guaranteed success (defense)"), " on: ", targetGuaranteedWin.join(', ')), targetMixed.length > 0 && /*#__PURE__*/React.createElement("p", null, "\u2022 ", /*#__PURE__*/React.createElement("span", {
          style: {
            color: '#ffc107'
          }
        }, "Possible success/failure"), " on: ", targetMixed.join(', ')), targetGuaranteedLoss.length > 0 && /*#__PURE__*/React.createElement("p", null, "\u2022 ", /*#__PURE__*/React.createElement("span", {
          style: {
            color: '#dc3545'
          }
        }, "Guaranteed failure (defense)"), " on: ", targetGuaranteedLoss.join(', ')));
      })()));
    })());
  }), actionChainResults.length > 1 && Object.keys(actionOverrides).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "recalculate-section"
  }, /*#__PURE__*/React.createElement("button", {
    className: "recalculate-button",
    onClick: handleSubmit,
    disabled: calculating || isCalculatingChain
  }, calculating || isCalculatingChain ? 'Recalculating...' : 'Recalculate with Overrides')), actionChainResults.length > 1 && /*#__PURE__*/React.createElement("div", {
    className: "chain-total"
  }, /*#__PURE__*/React.createElement("h4", null, "Total Chain Success"), /*#__PURE__*/React.createElement("div", {
    className: "chain-calculation"
  }, actionChainResults.map((result, index) => /*#__PURE__*/React.createElement("span", {
    key: index
  }, result.result.successPercentage.toFixed(2), "%", index < actionChainResults.length - 1 && ' × ')), ' = ', /*#__PURE__*/React.createElement("strong", null, (actionChainResults.reduce((acc, result) => acc * (result.result.successPercentage / 100), 1) * 100).toFixed(2), "%"))))));
};
export default ActionTestBackend;