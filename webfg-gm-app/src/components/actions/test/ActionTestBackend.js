import React, { useState, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { LIST_CHARACTERS, LIST_OBJECTS, LIST_ACTIONS } from '../../../graphql/operations';
import { CALCULATE_ACTION_TEST } from '../../../graphql/computedOperations';
import './ActionTest.css';

const ActionTestBackend = ({ action, character, onClose }) => {
  const [targetType, setTargetType] = useState(action.targetType);
  const [selectedTargetIds, setSelectedTargetIds] = useState([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState(character ? [character.characterId] : []);
  const [override, setOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState('');
  
  // Fetch potential targets based on targetType
  const { data: charactersData } = useQuery(LIST_CHARACTERS, { skip: targetType !== 'CHARACTER' });
  const { data: objectsData } = useQuery(LIST_OBJECTS, { skip: targetType !== 'OBJECT' });
  const { data: actionsData } = useQuery(LIST_ACTIONS, { skip: targetType !== 'ACTION' });
  
  // Fetch all characters for source selection (always needed)
  const { data: allCharactersData } = useQuery(LIST_CHARACTERS);
  
  // Lazy query for action test calculation
  const [calculateTest, { data: testResult, loading: calculating }] = useLazyQuery(
    CALCULATE_ACTION_TEST,
    {
      fetchPolicy: 'no-cache' // Always get fresh calculation
    }
  );
  
  // Initial setup
  useEffect(() => {
    setTargetType(action.targetType);
  }, [action]);

  const handleSubmit = async () => {
    // Prepare input for backend calculation
    const input = {
      actionId: action.actionId,
      sourceCharacterIds: selectedSourceIds,
      targetIds: override ? [] : selectedTargetIds,
      targetType,
      override,
      overrideValue: override ? parseFloat(overrideValue) || 0 : 0
    };
    
    // Call backend to calculate
    calculateTest({
      variables: { input }
    });
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
  const getDisplaySourceValue = () => {
    if (testResult?.calculateActionTest) {
      const { sourceValue, sourceCount } = testResult.calculateActionTest;
      if (sourceCount === 1) {
        return `${sourceValue} (1 source)`;
      } else if (sourceCount > 1) {
        return `${sourceValue} (${sourceCount} sources grouped)`;
      }
    } else if (selectedSourceIds.length > 0) {
      return `Source (${selectedSourceIds.length} selected)`;
    }
    return 'N/A';
  };

  const getDisplayTargetValue = () => {
    if (override) {
      return parseFloat(overrideValue) || 0;
    } else if (testResult?.calculateActionTest) {
      const { targetValue, targetCount } = testResult.calculateActionTest;
      if (targetCount === 1) {
        return `${targetValue} (1 target)`;
      } else if (targetCount > 1) {
        return `${targetValue} (${targetCount} targets grouped)`;
      }
    } else if (selectedTargetIds.length > 0) {
      return `Target (${selectedTargetIds.length} selected)`;
    }
    return 'N/A';
  };
  
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
          {getSourceOptions()}
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
            disabled={(selectedTargetIds.length === 0 && !override) || (override && !overrideValue) || selectedSourceIds.length === 0 || calculating}
          >
            {calculating ? 'Calculating...' : 'Submit'}
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
        
        {testResult?.calculateActionTest && (
          <div className="result-display">
            <h3>Action Difficulty</h3>
            <div className="difficulty-value">
              {testResult.calculateActionTest.successPercentage.toFixed(2)}%
            </div>
            <p>
              Source Value: {getDisplaySourceValue()}
              <br />
              Target Value: {getDisplayTargetValue()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionTestBackend;