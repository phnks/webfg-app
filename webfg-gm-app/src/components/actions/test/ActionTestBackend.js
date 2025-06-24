import React, { useState, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { LIST_CHARACTERS, LIST_OBJECTS, LIST_ACTIONS, GET_ACTION } from '../../../graphql/operations';
import { CALCULATE_ACTION_TEST } from '../../../graphql/computedOperations';
import { 
  getDiceForAttribute, 
  attributeUsesDice, 
  calculateAttributeModifier, 
  formatDiceRoll, 
  getAttributeRange 
} from '../../../utils/diceMapping';
import './ActionTest.css';

const ActionTestBackend = ({ action, character, onClose }) => {
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
  const { data: charactersData } = useQuery(LIST_CHARACTERS, { skip: targetType !== 'CHARACTER' });
  const { data: objectsData } = useQuery(LIST_OBJECTS, { skip: targetType !== 'OBJECT' });
  const { data: actionsData } = useQuery(LIST_ACTIONS, { skip: targetType !== 'ACTION' });
  
  // Fetch all characters for source selection (always needed)
  const { data: allCharactersData } = useQuery(LIST_CHARACTERS);
  
  // State for action chain results
  const [actionChainResults, setActionChainResults] = useState([]);
  const [isCalculatingChain, setIsCalculatingChain] = useState(false);
  
  // Lazy query for action test calculation
  const [calculateTest, { data: testResult, loading: calculating }] = useLazyQuery(
    CALCULATE_ACTION_TEST,
    {
      fetchPolicy: 'no-cache' // Always get fresh calculation
    }
  );
  
  // Lazy query for fetching action details
  const [getAction] = useLazyQuery(GET_ACTION, {
    fetchPolicy: 'no-cache'
  });
  
  // Initial setup
  useEffect(() => {
    setTargetType(action.targetType);
  }, [action]);

  // Recursive function to calculate action chain
  const calculateActionChain = async (currentAction, sourceIds, targetIds, chainResults = []) => {
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
    console.log('About to call calculateTest with variables:', { input });
    const result = await calculateTest({
      variables: { input }
    });
    console.log('calculateTest result:', result.data?.calculateActionTest);
    
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
            variables: { actionId: currentAction.triggeredActionId }
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
          
          await calculateActionChain(triggeredAction, newSourceIds, newTargetIds, chainResults);
        } else {
          console.log('No triggered action found despite having triggeredActionId');
        }
      } else {
        console.log('No triggered action or not TRIGGER_ACTION type');
      }
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
        variables: { actionId: action.actionId }
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
  const handleObjectSelection = (objectId) => {
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
    const attributeNames = [
      'speed', 'weight', 'size', 'armour', 'endurance', 'lethality',
      'strength', 'dexterity', 'agility', 'perception', 'intensity',
      'resolve', 'morale', 'intelligence', 'charisma'
    ];
    
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
        
        finalAttributes[attrName] = Math.round((sum / valuesToGroup.length) * 100) / 100;
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
      return (
        <div className="object-selection">
          <h3>Object Usage</h3>
          <p className="object-usage-note">
            This action has object usage set to NONE - no object selection required.
          </p>
        </div>
      );
    }
    
    const availableObjects = getAvailableReadyObjects();
    
    if (availableObjects.length === 0) {
      return (
        <div className="object-selection">
          <h3>Object Usage: {action.objectUsage}</h3>
          <p className="object-usage-note">
            No objects in ready inventory match the required object usage ({action.objectUsage}).
          </p>
        </div>
      );
    }
    
    return (
      <div className="object-selection">
        <h3>Object Usage: {action.objectUsage}</h3>
        <p className="object-usage-note">
          Select an object from ready inventory (optional):
        </p>
        
        <div className="object-selection-list">
          <label className="object-option">
            <input
              type="radio"
              name="objectSelection"
              checked={selectedObjectId === null}
              onChange={() => setSelectedObjectId(null)}
            />
            <span className="object-name">No object selected</span>
          </label>
          
          {availableObjects.map((obj) => (
            <label key={obj.objectId} className="object-option">
              <input
                type="radio"
                name="objectSelection"
                checked={selectedObjectId === obj.objectId}
                onChange={() => handleObjectSelection(obj.objectId)}
              />
              <span className="object-name">
                {obj.name} ({obj.objectCategory})
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const getTargetOptions = () => {
    if (override) {
      return (
        <div className="override-input">
          <input
            type="number"
            value={overrideValue}
            onChange={(e) => setOverrideValue(e.target.value)}
            placeholder="Enter difficulty value"
          />
        </div>
      );
    }
    
    switch (targetType) {
      case 'CHARACTER':
        return (
          <div className="target-selection-list">
            <div className="selection-header">
              <span>Select Characters (multiple allowed):</span>
              {selectedTargetIds.length > 0 && (
                <span className="selection-count">{selectedTargetIds.length} selected</span>
              )}
            </div>
            {charactersData?.listCharacters.map((char) => (
              <label key={char.characterId} className="target-option">
                <input
                  type="checkbox"
                  checked={selectedTargetIds.includes(char.characterId)}
                  onChange={(e) => handleTargetSelection(char.characterId, e.target.checked)}
                />
                <span className="target-name">{char.name}</span>
              </label>
            ))}
          </div>
        );
      case 'OBJECT':
        return (
          <div className="target-selection-list">
            <div className="selection-header">
              <span>Select Objects (multiple allowed):</span>
              {selectedTargetIds.length > 0 && (
                <span className="selection-count">{selectedTargetIds.length} selected</span>
              )}
            </div>
            {objectsData?.listObjects.map((obj) => (
              <label key={obj.objectId} className="target-option">
                <input
                  type="checkbox"
                  checked={selectedTargetIds.includes(obj.objectId)}
                  onChange={(e) => handleTargetSelection(obj.objectId, e.target.checked)}
                />
                <span className="target-name">{obj.name}</span>
              </label>
            ))}
          </div>
        );
      case 'ACTION':
        return (
          <div className="target-selection-list">
            <div className="selection-header">
              <span>Select Actions (multiple allowed):</span>
              {selectedTargetIds.length > 0 && (
                <span className="selection-count">{selectedTargetIds.length} selected</span>
              )}
            </div>
            {actionsData?.listActions.map((action) => (
              <label key={action.actionId} className="target-option">
                <input
                  type="checkbox"
                  checked={selectedTargetIds.includes(action.actionId)}
                  onChange={(e) => handleTargetSelection(action.actionId, e.target.checked)}
                />
                <span className="target-name">{action.name}</span>
              </label>
            ))}
          </div>
        );
      default:
        return <div>Invalid target type</div>;
    }
  };

  const getSourceOptions = () => {
    // Filter characters that have the same action
    const charactersWithAction = allCharactersData?.listCharacters.filter(char => 
      char.actions && char.actions.some(charAction => charAction.actionId === action.actionId)
    ) || [];

    if (charactersWithAction.length === 0) {
      return (
        <div className="no-sources">
          <p>No characters have this action.</p>
        </div>
      );
    }

    return (
      <div className="source-selection-list">
        <div className="selection-header">
          <span>Select Source Characters (multiple allowed):</span>
          {selectedSourceIds.length > 0 && (
            <span className="selection-count">{selectedSourceIds.length} selected</span>
          )}
        </div>
        <div className="source-note">
          <small>Only characters who have the "{action.name}" action can be selected as sources.</small>
        </div>
        {charactersWithAction.map((char) => (
          <label key={char.characterId} className="source-option">
            <input
              type="checkbox"
              checked={selectedSourceIds.includes(char.characterId)}
              onChange={(e) => handleSourceSelection(char.characterId, e.target.checked)}
            />
            <span className="source-name">
              {char.name} 
              {char.characterId === character?.characterId && ' (current)'}
            </span>
          </label>
        ))}
      </div>
    );
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
  
  return (
    <div className="action-test-container">
      <div className="action-test-header">
        <h2>Test Action: {action.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="action-test-content">
        <div className="action-details">
          <p><strong>Source Attribute:</strong> {action.sourceAttribute}</p>
          <p><strong>Target Attribute:</strong> {action.targetAttribute}</p>
        </div>
        
        <div className="source-selection">
          <h3>Select Sources</h3>
          
          <div className="override-toggle">
            <label>
              <input
                type="checkbox"
                checked={sourceOverride}
                onChange={() => {
                  setSourceOverride(!sourceOverride);
                  setSelectedSourceIds([]);
                }}
              />
              Override with manual value
            </label>
          </div>
          
          {sourceOverride ? (
            <div className="override-input">
              <input
                type="number"
                value={sourceOverrideValue}
                onChange={(e) => setSourceOverrideValue(e.target.value)}
                placeholder="Enter source value"
              />
            </div>
          ) : (
            getSourceOptions()
          )}
        </div>
        
        <div className="target-selection">
          <h3>Select Target</h3>
          
          <div className="override-toggle">
            <label>
              <input
                type="checkbox"
                checked={override}
                onChange={() => {
                  setOverride(!override);
                  setSelectedTargetIds([]);
                }}
              />
              Override with manual value
            </label>
          </div>
          
          {!override && <p>Target Type: {targetType}</p>}
          {getTargetOptions()}
        </div>
        

        {renderObjectSelection()}
        <div className="action-buttons">
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={(selectedTargetIds.length === 0 && !override) || (override && !overrideValue) || (selectedSourceIds.length === 0 && !sourceOverride) || (sourceOverride && !sourceOverrideValue) || calculating || isCalculatingChain}
          >
            {(calculating || isCalculatingChain) ? 'Calculating...' : 'Submit'}
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
        

        {/* Display what values will be used for action test */}
        <div className="action-test-values-preview">
          <h3>Action Test Values Preview</h3>
          <p className="preview-note">
            These are the values that will be used for the {action.sourceAttribute} calculation:
          </p>
          
          {!selectedObjectId ? (
            <div className="no-object-selected">
              <div className="attribute-row">
                <span className="attribute-label">{action.sourceAttribute} (Base + Equipment):</span>
                <span className="attribute-value">
                  {Math.round(character.groupedAttributes?.[action.sourceAttribute?.toLowerCase()] || 0)}
                </span>
              </div>
              <p className="calculation-note">
                <small>Using equipment-grouped values since no ready object is selected.</small>
              </p>
            </div>
          ) : (
            showFinalGrouped && finalGroupedAttributes && (
              <div className="object-selected">
                <div className="attribute-row">
                  <span className="attribute-label">{action.sourceAttribute} (Base + Equipment + Selected Object):</span>
                  <span className="attribute-value">
                    {Math.round(finalGroupedAttributes[action.sourceAttribute?.toLowerCase()] || 0)}
                  </span>
                </div>
                <p className="calculation-note">
                  <small>Using recalculated grouped values including the selected ready object.</small>
                </p>
              </div>
            )
          )}
        </div>
        {actionChainResults.length > 0 && (
          <div className="result-display">
            <h3>Action Chain Results</h3>
            
            {/* Display each action in the chain */}
            {actionChainResults.map((actionResult, index) => {
              const actionKey = `${actionResult.action.actionId}_${index}`;
              const actionOverride = actionOverrides[actionKey] || {};
              const isFirstAction = index === 0;
              
              return (
                <div key={index} className="action-chain-item">
                  <h4>{index + 1}. {actionResult.action.name}</h4>
                  <div className="difficulty-value">
                    {actionResult.result.successPercentage.toFixed(2)}%
                  </div>
                  
                  {/* Per-action override controls (except for first action) */}
                  {!isFirstAction && (
                    <div className="per-action-overrides">
                      <h5>Override Values for This Action</h5>
                      
                      {/* Source Override */}
                      <div className="override-control">
                        <label>
                          <input
                            type="checkbox"
                            checked={actionOverride.sourceOverride || false}
                            onChange={(e) => {
                              setActionOverrides(prev => ({
                                ...prev,
                                [actionKey]: {
                                  ...prev[actionKey],
                                  sourceOverride: e.target.checked,
                                  sourceOverrideValue: e.target.checked ? prev[actionKey]?.sourceOverrideValue || '' : ''
                                }
                              }));
                            }}
                          />
                          Override source value
                        </label>
                        {actionOverride.sourceOverride && (
                          <input
                            type="number"
                            value={actionOverride.sourceOverrideValue || ''}
                            onChange={(e) => {
                              setActionOverrides(prev => ({
                                ...prev,
                                [actionKey]: {
                                  ...prev[actionKey],
                                  sourceOverrideValue: e.target.value
                                }
                              }));
                            }}
                            placeholder="Enter source value"
                            className="override-input-small"
                          />
                        )}
                      </div>
                      
                      {/* Target Override */}
                      <div className="override-control">
                        <label>
                          <input
                            type="checkbox"
                            checked={actionOverride.targetOverride || false}
                            onChange={(e) => {
                              setActionOverrides(prev => ({
                                ...prev,
                                [actionKey]: {
                                  ...prev[actionKey],
                                  targetOverride: e.target.checked,
                                  targetOverrideValue: e.target.checked ? prev[actionKey]?.targetOverrideValue || '' : ''
                                }
                              }));
                            }}
                          />
                          Override target value
                        </label>
                        {actionOverride.targetOverride && (
                          <input
                            type="number"
                            value={actionOverride.targetOverrideValue || ''}
                            onChange={(e) => {
                              setActionOverrides(prev => ({
                                ...prev,
                                [actionKey]: {
                                  ...prev[actionKey],
                                  targetOverrideValue: e.target.value
                                }
                              }));
                            }}
                            placeholder="Enter target value"
                            className="override-input-small"
                          />
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p>
                    Source Value: {actionResult.result.sourceCount === 1 ? 
                      `${actionResult.result.sourceValue} (1 source)` : 
                      actionResult.result.sourceCount > 1 ? 
                      `${actionResult.result.sourceValue} (${actionResult.result.sourceCount} sources grouped)` : 
                      actionResult.result.sourceValue}
                    <br />
                    Target Value: {actionResult.result.targetCount === 1 ? 
                      `${actionResult.result.targetValue} (1 target)` : 
                      actionResult.result.targetCount > 1 ? 
                      `${actionResult.result.targetValue} (${actionResult.result.targetCount} targets grouped)` : 
                      actionResult.result.targetValue}
                  </p>
                
                {/* New Dice Rolling Information */}
                {(() => {
                  const sourceAttribute = actionResult.action.sourceAttribute;
                  const targetAttribute = actionResult.action.targetAttribute;
                  const sourceDice = getDiceForAttribute(sourceAttribute);
                  const targetDice = getDiceForAttribute(targetAttribute);
                  
                  // Calculate modifiers based on attribute values and fatigue
                  const sourceModifier = calculateAttributeModifier(
                    actionResult.result.sourceValue, 
                    actionResult.result.sourceFatigue, 
                    sourceAttribute
                  );
                  const targetModifier = calculateAttributeModifier(
                    actionResult.result.targetValue, 
                    actionResult.result.targetFatigue, 
                    targetAttribute
                  );
                  
                  const sourceDiceDisplay = formatDiceRoll(sourceAttribute, sourceModifier);
                  const targetDiceDisplay = formatDiceRoll(targetAttribute, targetModifier);
                  
                  return (
                    <div className="dice-roll-info">
                      <h5>Dice Rolls Required</h5>
                      <div className="dice-roll-values">
                        <div className="dice-roll-item">
                          <span className="dice-label">Source ({sourceAttribute}):</span>
                          <span className="dice-value">{sourceDiceDisplay}</span>
                          {!attributeUsesDice(sourceAttribute) && (
                            <span className="static-note"> (No roll needed)</span>
                          )}
                        </div>
                        <div className="dice-roll-item">
                          <span className="dice-label">Target ({targetAttribute}):</span>
                          <span className="dice-value">{targetDiceDisplay}</span>
                          {!attributeUsesDice(targetAttribute) && (
                            <span className="static-note"> (No roll needed)</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="modifier-breakdown">
                        <h6>Modifier Breakdown</h6>
                        <div className="modifier-item">
                          <span className="modifier-label">Source {sourceAttribute}:</span>
                          <span className="modifier-calculation">
                            {actionResult.result.sourceValue}
                            {attributeUsesDice(sourceAttribute) && actionResult.result.sourceFatigue > 0 && (
                              <> - {actionResult.result.sourceFatigue} (fatigue)</>
                            )}
                            {' = '}{sourceModifier}
                          </span>
                        </div>
                        <div className="modifier-item">
                          <span className="modifier-label">Target {targetAttribute}:</span>
                          <span className="modifier-calculation">
                            {actionResult.result.targetValue}
                            {attributeUsesDice(targetAttribute) && actionResult.result.targetFatigue > 0 && (
                              <> - {actionResult.result.targetFatigue} (fatigue)</>
                            )}
                            {' = '}{targetModifier}
                          </span>
                        </div>
                      </div>
                      
                      <div className="final-dice-display">
                        <h6>Final Dice Rolls</h6>
                        <div className="final-rolls">
                          <span className="source-roll">{sourceDiceDisplay}</span>
                          <span className="vs-text"> VS </span>
                          <span className="target-roll">{targetDiceDisplay}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Fatigue Information - Simplified for new dice system */}
                {(actionResult.result.sourceFatigue > 0 || actionResult.result.targetFatigue > 0) && (
                  <div className="fatigue-info">
                    <h5>Current Fatigue</h5>
                    <p className="fatigue-note">
                      Fatigue is subtracted from dice-based attribute modifiers:
                    </p>
                    <div className="fatigue-values">
                      {actionResult.result.sourceFatigue > 0 && (
                        <div className="fatigue-item">
                          <span className="fatigue-label">Source Characters:</span>
                          <div className="fatigue-breakdown">
                            {actionResult.result.sourceFatigueDetails && actionResult.result.sourceFatigueDetails.length > 0 ? (
                              actionResult.result.sourceFatigueDetails.map((detail, idx) => (
                                <span key={detail.characterId} className="fatigue-character">
                                  {detail.characterName}: {detail.fatigue} fatigue
                                  {idx < actionResult.result.sourceFatigueDetails.length - 1 && ", "}
                                </span>
                              ))
                            ) : (
                              <span className="fatigue-value">Total: {actionResult.result.sourceFatigue}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {actionResult.result.targetFatigue > 0 && (
                        <div className="fatigue-item">
                          <span className="fatigue-label">Target Characters:</span>
                          <div className="fatigue-breakdown">
                            {actionResult.result.targetFatigueDetails && actionResult.result.targetFatigueDetails.length > 0 ? (
                              actionResult.result.targetFatigueDetails.map((detail, idx) => (
                                <span key={detail.characterId} className="fatigue-character">
                                  {detail.characterName}: {detail.fatigue} fatigue
                                  {idx < actionResult.result.targetFatigueDetails.length - 1 && ", "}
                                </span>
                              ))
                            ) : (
                              <span className="fatigue-value">Total: {actionResult.result.targetFatigue}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
            })}
            
            {/* Recalculate button when overrides are changed */}
            {actionChainResults.length > 1 && Object.keys(actionOverrides).length > 0 && (
              <div className="recalculate-section">
                <button
                  className="recalculate-button"
                  onClick={handleSubmit}
                  disabled={calculating || isCalculatingChain}
                >
                  {(calculating || isCalculatingChain) ? 'Recalculating...' : 'Recalculate with Overrides'}
                </button>
              </div>
            )}
            
            {/* Total chain success probability */}
            {actionChainResults.length > 1 && (
              <div className="chain-total">
                <h4>Total Chain Success</h4>
                <div className="chain-calculation">
                  {actionChainResults.map((result, index) => (
                    <span key={index}>
                      {result.result.successPercentage.toFixed(2)}%
                      {index < actionChainResults.length - 1 && ' × '}
                    </span>
                  ))}
                  {' = '}
                  <strong>
                    {(actionChainResults.reduce((acc, result) => 
                      acc * (result.result.successPercentage / 100), 1
                    ) * 100).toFixed(2)}%
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionTestBackend;