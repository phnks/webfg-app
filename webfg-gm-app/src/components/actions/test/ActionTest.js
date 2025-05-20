import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { LIST_CHARACTERS, LIST_OBJECTS, LIST_ACTIONS, GET_CHARACTER, GET_OBJECT } from '../../../graphql/operations';
import './ActionTest.css';

const ActionTest = ({ action, character, onClose }) => {
  const [targetType, setTargetType] = useState(action.targetType);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [override, setOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState('');
  const [actionDifficulty, setActionDifficulty] = useState(null);
  
  // Fetch potential targets based on targetType
  const { data: charactersData } = useQuery(LIST_CHARACTERS, { skip: targetType !== 'CHARACTER' });
  const { data: objectsData } = useQuery(LIST_OBJECTS, { skip: targetType !== 'OBJECT' });
  const { data: actionsData } = useQuery(LIST_ACTIONS, { skip: targetType !== 'ACTION' });
  
  // Fetch detailed data for the selected target
  const { data: characterDetailData } = useQuery(GET_CHARACTER, {
    variables: { characterId: selectedTargetId },
    skip: targetType !== 'CHARACTER' || !selectedTargetId,
    onCompleted: (data) => {
      if (data && data.getCharacter) {
        setSelectedTarget(data.getCharacter);
      }
    }
  });
  
  const { data: objectDetailData } = useQuery(GET_OBJECT, {
    variables: { objectId: selectedTargetId },
    skip: targetType !== 'OBJECT' || !selectedTargetId,
    onCompleted: (data) => {
      if (data && data.getObject) {
        setSelectedTarget(data.getObject);
      }
    }
  });

  // Initial setup
  useEffect(() => {
    setTargetType(action.targetType);
  }, [action]);
  
  // Calculate action difficulty
  const calculateActionDifficulty = () => {
    let sourceActionDifficulty = 0;
    let targetActionDifficulty = 0;
    
    // Get source attribute value from character
    if (character) {
      const sourceAttribute = action.sourceAttribute.toLowerCase();
      if (character[sourceAttribute] && character[sourceAttribute].attribute) {
        sourceActionDifficulty = character[sourceAttribute].attribute.attributeValue;
      }
    }
    
    // Get target attribute value based on selection or override
    if (override) {
      targetActionDifficulty = parseFloat(overrideValue) || 0;
    } else if (selectedTarget) {
      if (targetType === 'CHARACTER' || targetType === 'OBJECT') {
        const targetAttribute = action.targetAttribute.toLowerCase();
        if (selectedTarget[targetAttribute]) {
          if (targetType === 'CHARACTER' && selectedTarget[targetAttribute].attribute) {
            targetActionDifficulty = selectedTarget[targetAttribute].attribute.attributeValue;
          } else if (targetType === 'OBJECT') {
            targetActionDifficulty = selectedTarget[targetAttribute].attributeValue;
          }
        }
      } else if (targetType === 'ACTION') {
        // Action logic will be implemented in future feature
        targetActionDifficulty = 0;
      }
    }
    
    // Calculate difficulty using formula: A1/(A1+A2)
    if (sourceActionDifficulty === 0 && targetActionDifficulty === 0) {
      return 0.5; // Default to 50% if both values are 0
    }
    
    return sourceActionDifficulty / (sourceActionDifficulty + targetActionDifficulty);
  };
  
  const handleSubmit = () => {
    const difficulty = calculateActionDifficulty();
    setActionDifficulty(difficulty);
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
          <select
            value={selectedTargetId || ''}
            onChange={(e) => {
              setSelectedTargetId(e.target.value);
            }}
          >
            <option value="">Select a character</option>
            {charactersData?.listCharacters.map((char) => (
              <option key={char.characterId} value={char.characterId}>
                {char.name}
              </option>
            ))}
          </select>
        );
      case 'OBJECT':
        return (
          <select
            value={selectedTargetId || ''}
            onChange={(e) => {
              setSelectedTargetId(e.target.value);
            }}
          >
            <option value="">Select an object</option>
            {objectsData?.listObjects.map((obj) => (
              <option key={obj.objectId} value={obj.objectId}>
                {obj.name}
              </option>
            ))}
          </select>
        );
      case 'ACTION':
        return (
          <select
            value={selectedTargetId || ''}
            onChange={(e) => {
              const target = actionsData.listActions.find(
                (act) => act.actionId === e.target.value
              );
              setSelectedTarget(target);
              setSelectedTargetId(e.target.value);
            }}
          >
            <option value="">Select an action</option>
            {actionsData?.listActions.map((act) => (
              <option key={act.actionId} value={act.actionId}>
                {act.name}
              </option>
            ))}
          </select>
        );
      default:
        return <div>Invalid target type</div>;
    }
  };
  
  return (
    <div className="action-test-container">
      <div className="action-test-header">
        <h2>Test Action: {action.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="action-test-content">
        <div className="action-details">
          <p><strong>Source:</strong> {character ? character.name : 'No character selected'}</p>
          <p><strong>Source Attribute:</strong> {action.sourceAttribute}</p>
          <p><strong>Target Attribute:</strong> {action.targetAttribute}</p>
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
                  setSelectedTarget(null);
                  setActionDifficulty(null);
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
            disabled={(!selectedTargetId && !override) || (override && !overrideValue)}
          >
            Submit
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
        
        {actionDifficulty !== null && (
          <div className="result-display">
            <h3>Action Difficulty</h3>
            <div className="difficulty-value">
              {(actionDifficulty * 100).toFixed(2)}%
            </div>
            <p>
              Source Value: {character && character[action.sourceAttribute.toLowerCase()]?.attribute.attributeValue || 0}
              <br />
              Target Value: {override ? overrideValue : (selectedTarget ? 
                (targetType === 'CHARACTER' && selectedTarget[action.targetAttribute.toLowerCase()]?.attribute ? 
                  selectedTarget[action.targetAttribute.toLowerCase()]?.attribute.attributeValue : 
                  (targetType === 'OBJECT' && selectedTarget[action.targetAttribute.toLowerCase()] ? 
                    selectedTarget[action.targetAttribute.toLowerCase()]?.attributeValue : 
                    'N/A'
                  )
                ) : 'None'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionTest;