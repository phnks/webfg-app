import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { LIST_CHARACTERS, LIST_OBJECTS, LIST_ACTIONS, GET_CHARACTER, GET_OBJECT } from '../../../graphql/operations';
import { calculateGroupedAttributes, calculateObjectGroupedAttributes, extractAttributeInfo, calculateGroupingFormula } from '../../../utils/attributeGrouping';
import './ActionTest.css';

const ActionTest = ({ action, character, onClose }) => {
  const [targetType, setTargetType] = useState(action.targetType);
  const [selectedTargets, setSelectedTargets] = useState([]); // Changed to array for multi-selection
  const [selectedTargetIds, setSelectedTargetIds] = useState([]); // Changed to array
  const [override, setOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState('');
  const [actionDifficulty, setActionDifficulty] = useState(null);
  
  // Fetch potential targets based on targetType
  const { data: charactersData } = useQuery(LIST_CHARACTERS, { skip: targetType !== 'CHARACTER' });
  const { data: objectsData } = useQuery(LIST_OBJECTS, { skip: targetType !== 'OBJECT' });
  const { data: actionsData } = useQuery(LIST_ACTIONS, { skip: targetType !== 'ACTION' });
  
  // We'll fetch detailed data dynamically when needed instead of using static queries

  // Initial setup
  useEffect(() => {
    setTargetType(action.targetType);
  }, [action]);
  
  // Calculate action difficulty (async version for multi-target support)
  const calculateActionDifficultyAsync = async () => {
    let sourceActionDifficulty = 0;
    let targetActionDifficulty = 0;
    
    // Get source attribute value from character using grouped attributes
    if (character) {
      const sourceAttribute = action.sourceAttribute.toLowerCase();
      const groupedAttributes = calculateGroupedAttributes(character);
      
      // Use grouped value if available, otherwise fall back to default value
      if (groupedAttributes[sourceAttribute] !== undefined) {
        sourceActionDifficulty = groupedAttributes[sourceAttribute];
      } else if (character[sourceAttribute] && character[sourceAttribute].attribute) {
        sourceActionDifficulty = character[sourceAttribute].attribute.attributeValue;
      }
    }
    
    // Get target attribute value based on selection or override
    if (override) {
      targetActionDifficulty = parseFloat(overrideValue) || 0;
    } else if (selectedTargetIds.length > 0) {
      if (targetType === 'CHARACTER' || targetType === 'OBJECT') {
        const targetAttribute = action.targetAttribute.toLowerCase();
        // Use new grouping function for multiple targets
        targetActionDifficulty = await groupTargetAttributes(selectedTargetIds, targetAttribute);
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
  
  // Helper function to get the actual source value used in calculation
  const getDisplaySourceValue = () => {
    if (character) {
      const sourceAttribute = action.sourceAttribute.toLowerCase();
      const groupedAttributes = calculateGroupedAttributes(character);
      
      if (groupedAttributes[sourceAttribute] !== undefined) {
        return groupedAttributes[sourceAttribute];
      } else if (character[sourceAttribute] && character[sourceAttribute].attribute) {
        return character[sourceAttribute].attribute.attributeValue;
      }
    }
    return 0;
  };

  // Helper function to get the actual target value used in calculation (now supports multiple targets)
  const getDisplayTargetValue = () => {
    if (override) {
      return parseFloat(overrideValue) || 0;
    } else if (selectedTargetIds.length > 0) {
      // For display purposes, we'll show a placeholder since the actual calculation is async
      // The real value will be calculated during submission
      if (selectedTargetIds.length === 1) {
        return `Target (${selectedTargetIds.length} selected)`;
      } else {
        return `Grouped Targets (${selectedTargetIds.length} selected)`;
      }
    }
    return 'N/A';
  };

  // Function to group multiple targets into a single attribute value
  const groupTargetAttributes = async (targetIds, targetAttribute) => {
    if (targetIds.length === 0) return 0;
    if (targetIds.length === 1) {
      // Single target - get grouped value as before
      return await getSingleTargetAttributeValue(targetIds[0], targetAttribute);
    }
    
    // Multiple targets - need to group them
    const targetEntities = [];
    
    for (const targetId of targetIds) {
      try {
        const entity = await fetchTargetEntity(targetId);
        if (entity) {
          targetEntities.push(entity);
        }
      } catch (error) {
        console.error(`Error fetching target ${targetId}:`, error);
      }
    }
    
    if (targetEntities.length === 0) return 0;
    if (targetEntities.length === 1) {
      return getSingleEntityAttributeValue(targetEntities[0], targetAttribute);
    }
    
    // Apply grouping logic to multiple targets
    const attributeInfos = [];
    targetEntities.forEach(entity => {
      const attrInfo = extractAttributeInfo(entity[targetAttribute]);
      if (attrInfo && attrInfo.type !== 'NONE') {
        attributeInfos.push({
          name: entity.name || 'Unknown',
          ...attrInfo
        });
      }
    });
    
    if (attributeInfos.length === 0) return 0;
    if (attributeInfos.length === 1) return attributeInfos[0].value;
    
    // Find highest value and apply grouping formula
    const highestValue = Math.max(...attributeInfos.map(attr => attr.value));
    let currentValue = highestValue;
    
    attributeInfos.forEach(attr => {
      if (attr.value !== highestValue) {
        currentValue = calculateGroupingFormula(currentValue, attr.value, attr.type);
      }
    });
    
    return Math.round(currentValue * 100) / 100;
  };
  
  // Helper function to fetch a single target entity
  const fetchTargetEntity = async (targetId) => {
    // For now, we'll use the list data which should have the basic attribute information
    // The LIST_CHARACTERS and LIST_OBJECTS queries include the attributes we need
    if (targetType === 'CHARACTER') {
      return charactersData?.listCharacters.find(char => char.characterId === targetId);
    } else if (targetType === 'OBJECT') {
      return objectsData?.listObjects.find(obj => obj.objectId === targetId);
    }
    return null;
  };
  
  // Helper function to get single entity attribute value with grouping
  const getSingleEntityAttributeValue = (entity, targetAttribute) => {
    if (targetType === 'CHARACTER') {
      const groupedAttributes = calculateGroupedAttributes(entity);
      if (groupedAttributes[targetAttribute] !== undefined) {
        return groupedAttributes[targetAttribute];
      } else if (entity[targetAttribute] && entity[targetAttribute].attribute) {
        return entity[targetAttribute].attribute.attributeValue;
      }
    } else if (targetType === 'OBJECT') {
      const groupedAttributes = calculateObjectGroupedAttributes(entity);
      if (groupedAttributes[targetAttribute] !== undefined) {
        return groupedAttributes[targetAttribute];
      } else if (entity[targetAttribute]) {
        return entity[targetAttribute].attributeValue;
      }
    }
    return 0;
  };
  
  // Updated helper to get single target value (for backward compatibility)
  const getSingleTargetAttributeValue = async (targetId, targetAttribute) => {
    const entity = await fetchTargetEntity(targetId);
    if (!entity) return 0;
    return getSingleEntityAttributeValue(entity, targetAttribute);
  };

  const handleSubmit = async () => {
    const difficulty = await calculateActionDifficultyAsync();
    setActionDifficulty(difficulty);
  };
  
  // Handler for checkbox target selection
  const handleTargetSelection = (targetId, isChecked) => {
    if (isChecked) {
      setSelectedTargetIds(prev => [...prev, targetId]);
    } else {
      setSelectedTargetIds(prev => prev.filter(id => id !== targetId));
    }
    // Clear previous results when selection changes
    setActionDifficulty(null);
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
                  setSelectedTargets([]);
                  setSelectedTargetIds([]);
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
            disabled={(selectedTargetIds.length === 0 && !override) || (override && !overrideValue)}
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
              Source Value: {getDisplaySourceValue()} (grouped)
              <br />
              Target Value: {getDisplayTargetValue()} {!override && selectedTargetIds.length > 0 ? '(grouped)' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionTest;