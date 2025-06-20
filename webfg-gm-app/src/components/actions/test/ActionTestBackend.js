import React, { useState, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { LIST_CHARACTERS, LIST_OBJECTS, LIST_ACTIONS, GET_ACTION } from '../../../graphql/operations';
import { CALCULATE_ACTION_TEST } from '../../../graphql/computedOperations';
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
    
    console.log(`Calculating action ${actionIndex + 1}: ${currentAction.name}`, {
      sourceIds,
      targetIds,
      isFirstAction,
      actionKey,
      actionOverride,
      input
    });
    
    // Calculate test for current action
    const result = await calculateTest({
      variables: { input }
    });
    
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
                
                {/* Dice Pool Information */}
                {actionResult.result.dicePoolExceeded && (
                  <div className="dice-pool-info">
                    <h5>Dice Pools</h5>
                    <p className="dice-pool-note">
                      Total dice exceeded 20, pools were halved:
                    </p>
                    <div className="dice-pool-values">
                      <div className="dice-pool-item">
                        <span className="dice-label">Source Dice:</span>
                        <span className="dice-original">{actionResult.result.sourceDice}</span>
                        <span className="dice-arrow">→</span>
                        <span className="dice-adjusted">{actionResult.result.adjustedSourceDice}</span>
                      </div>
                      <div className="dice-pool-item">
                        <span className="dice-label">Target Dice:</span>
                        <span className="dice-original">{actionResult.result.targetDice}</span>
                        <span className="dice-arrow">→</span>
                        <span className="dice-adjusted">{actionResult.result.adjustedTargetDice}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {!actionResult.result.dicePoolExceeded && (
                  <div className="dice-pool-info">
                    <h5>Dice to Roll</h5>
                    <div className="dice-pool-values">
                      <div className="dice-pool-item">
                        <span className="dice-label">Source Dice:</span>
                        <span className="dice-value">{actionResult.result.sourceDice}</span>
                      </div>
                      <div className="dice-pool-item">
                        <span className="dice-label">Target Dice:</span>
                        <span className="dice-value">{actionResult.result.targetDice}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Fatigue Application */}
                {(actionResult.result.sourceFatigue > 0 || actionResult.result.targetFatigue > 0) && (
                  <div className="fatigue-info">
                    <h5>Fatigue Applied</h5>
                    <p className="fatigue-note">
                      Fatigue is applied after dice pool adjustment:
                    </p>
                    <div className="fatigue-values">
                      {actionResult.result.sourceFatigue > 0 && (
                        <div className="fatigue-item">
                          <span className="fatigue-label">Source Fatigue:</span>
                          <div className="fatigue-breakdown">
                            {actionResult.result.sourceFatigueDetails && actionResult.result.sourceFatigueDetails.length > 0 ? (
                              <>
                                {actionResult.result.sourceFatigueDetails.map((detail, idx) => (
                                  <span key={detail.characterId} className="fatigue-character">
                                    {detail.characterName}: {detail.fatigue}
                                    {idx < actionResult.result.sourceFatigueDetails.length - 1 && " + "}
                                  </span>
                                ))}
                                <span className="fatigue-total"> = {actionResult.result.sourceFatigue}</span>
                              </>
                            ) : (
                              <span className="fatigue-value">-{actionResult.result.sourceFatigue}</span>
                            )}
                          </div>
                          <span className="fatigue-arrow">→</span>
                          <span className="fatigue-final">{actionResult.result.finalSourceDice} dice</span>
                        </div>
                      )}
                      {actionResult.result.targetFatigue > 0 && (
                        <div className="fatigue-item">
                          <span className="fatigue-label">Target Fatigue:</span>
                          <div className="fatigue-breakdown">
                            {actionResult.result.targetFatigueDetails && actionResult.result.targetFatigueDetails.length > 0 ? (
                              <>
                                {actionResult.result.targetFatigueDetails.map((detail, idx) => (
                                  <span key={detail.characterId} className="fatigue-character">
                                    {detail.characterName}: {detail.fatigue}
                                    {idx < actionResult.result.targetFatigueDetails.length - 1 && " + "}
                                  </span>
                                ))}
                                <span className="fatigue-total"> = {actionResult.result.targetFatigue}</span>
                              </>
                            ) : (
                              <span className="fatigue-value">-{actionResult.result.targetFatigue}</span>
                            )}
                          </div>
                          <span className="fatigue-arrow">→</span>
                          <span className="fatigue-final">{actionResult.result.finalTargetDice} dice</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Final Dice Pools */}
                <div className="final-dice-info">
                  <h5>Final Dice Pools</h5>
                  <div className="final-dice-values">
                    <div className="final-dice-item">
                      <span className="dice-label">Source:</span>
                      <span className="dice-final-value">{actionResult.result.finalSourceDice} dice</span>
                    </div>
                    <div className="final-dice-item">
                      <span className="dice-label">Target:</span>
                      <span className="dice-final-value">{actionResult.result.finalTargetDice} dice</span>
                    </div>
                  </div>
                </div>
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