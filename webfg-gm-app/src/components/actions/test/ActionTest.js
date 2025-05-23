import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { LIST_CHARACTERS, LIST_OBJECTS, LIST_ACTIONS, GET_CHARACTER, GET_OBJECT } from '../../../graphql/operations';
import { calculateGroupedAttributes, calculateObjectGroupedAttributes, calculateGroupingFormula } from '../../../utils/attributeGrouping';
import './ActionTest.css';

const ActionTest = ({ action, character, onClose }) => {
  const [targetType, setTargetType] = useState(action.targetType);
  const [selectedTargets, setSelectedTargets] = useState([]); // Changed to array for multi-selection
  const [selectedTargetIds, setSelectedTargetIds] = useState([]); // Changed to array
  const [selectedSourceIds, setSelectedSourceIds] = useState(character ? [character.characterId] : []); // Source grouping
  const [override, setOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState('');
  const [actionDifficulty, setActionDifficulty] = useState(null);
  const [lastCalculatedSourceValue, setLastCalculatedSourceValue] = useState(null);
  
  // Fetch potential targets based on targetType
  const { data: charactersData } = useQuery(LIST_CHARACTERS, { skip: targetType !== 'CHARACTER' });
  const { data: objectsData } = useQuery(LIST_OBJECTS, { skip: targetType !== 'OBJECT' });
  const { data: actionsData } = useQuery(LIST_ACTIONS, { skip: targetType !== 'ACTION' });
  
  // Fetch all characters for source selection (always needed)
  const { data: allCharactersData } = useQuery(LIST_CHARACTERS);
  
  // We'll fetch detailed data dynamically when needed instead of using static queries

  // Initial setup
  useEffect(() => {
    setTargetType(action.targetType);
  }, [action]);
  
  // Calculate action difficulty (async version for multi-source and multi-target support)
  const calculateActionDifficultyAsync = async () => {
    let sourceActionDifficulty = 0;
    let targetActionDifficulty = 0;
    
    // Get source attribute value from grouped sources
    if (selectedSourceIds.length > 0) {
      const sourceAttribute = action.sourceAttribute.toLowerCase();
      sourceActionDifficulty = await groupSourceAttributes(selectedSourceIds, sourceAttribute);
      setLastCalculatedSourceValue(sourceActionDifficulty);
    }
    
    // Get target attribute value based on selection or override
    if (override) {
      targetActionDifficulty = parseFloat(overrideValue) || 0;
      setLastCalculatedTargetValue(targetActionDifficulty);
    } else if (selectedTargetIds.length > 0) {
      if (targetType === 'CHARACTER' || targetType === 'OBJECT') {
        const targetAttribute = action.targetAttribute.toLowerCase();
        // Use new grouping function for multiple targets
        targetActionDifficulty = await groupTargetAttributes(selectedTargetIds, targetAttribute);
        setLastCalculatedTargetValue(targetActionDifficulty);
      } else if (targetType === 'ACTION') {
        // Action logic will be implemented in future feature
        targetActionDifficulty = 0;
        setLastCalculatedTargetValue(targetActionDifficulty);
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
    if (selectedSourceIds.length > 0 && lastCalculatedSourceValue !== null) {
      // Show the actual calculated value with context
      if (selectedSourceIds.length === 1) {
        return `${lastCalculatedSourceValue} (1 source)`;
      } else {
        return `${lastCalculatedSourceValue} (${selectedSourceIds.length} sources grouped)`;
      }
    } else if (selectedSourceIds.length > 0) {
      // Before calculation, show placeholder
      if (selectedSourceIds.length === 1) {
        return `Source (${selectedSourceIds.length} selected)`;
      } else {
        return `Grouped Sources (${selectedSourceIds.length} selected)`;
      }
    }
    return 'N/A';
  };

  // State to store the last calculated target value for display
  const [lastCalculatedTargetValue, setLastCalculatedTargetValue] = useState(null);

  // Helper function to get the actual target value used in calculation (now supports multiple targets)
  const getDisplayTargetValue = () => {
    if (override) {
      return parseFloat(overrideValue) || 0;
    } else if (selectedTargetIds.length > 0 && lastCalculatedTargetValue !== null) {
      // Show the actual calculated value with context
      if (selectedTargetIds.length === 1) {
        return `${lastCalculatedTargetValue} (1 target)`;
      } else {
        return `${lastCalculatedTargetValue} (${selectedTargetIds.length} targets grouped)`;
      }
    } else if (selectedTargetIds.length > 0) {
      // Before calculation, show placeholder
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
    
    // Get the final grouped attribute value for each target entity
    const targetValues = [];
    targetEntities.forEach(entity => {
      const groupedValue = getSingleEntityAttributeValue(entity, targetAttribute);
      if (groupedValue > 0) { // Only include non-zero values
        targetValues.push({
          name: entity.name || 'Unknown',
          value: groupedValue,
          type: 'HELP' // Use HELP as default type for combining grouped values
        });
      }
    });
    
    if (targetValues.length === 0) return 0;
    if (targetValues.length === 1) return targetValues[0].value;
    
    // Apply grouping formula to combine the grouped values
    // Start with the first value and apply the formula for each subsequent value
    let currentValue = targetValues[0].value;
    
    for (let i = 1; i < targetValues.length; i++) {
      currentValue = calculateGroupingFormula(currentValue, targetValues[i].value, 'HELP');
    }
    
    return Math.round(currentValue * 100) / 100;
  };
  
  // Function to group multiple sources into a single attribute value
  const groupSourceAttributes = async (sourceIds, sourceAttribute) => {
    if (sourceIds.length === 0) return 0;
    if (sourceIds.length === 1) {
      // Single source - get grouped value
      const sourceChar = allCharactersData?.listCharacters.find(char => char.characterId === sourceIds[0]);
      if (!sourceChar) return 0;
      return getSingleCharacterAttributeValue(sourceChar, sourceAttribute);
    }
    
    // Multiple sources - need to group them
    const sourceEntities = [];
    
    for (const sourceId of sourceIds) {
      const sourceChar = allCharactersData?.listCharacters.find(char => char.characterId === sourceId);
      if (sourceChar) {
        sourceEntities.push(sourceChar);
      }
    }
    
    if (sourceEntities.length === 0) return 0;
    if (sourceEntities.length === 1) {
      return getSingleCharacterAttributeValue(sourceEntities[0], sourceAttribute);
    }
    
    // Get the final grouped attribute value for each source character
    const sourceValues = [];
    sourceEntities.forEach(entity => {
      const groupedValue = getSingleCharacterAttributeValue(entity, sourceAttribute);
      if (groupedValue > 0) { // Only include non-zero values
        sourceValues.push({
          name: entity.name || 'Unknown',
          value: groupedValue,
          type: 'HELP' // Use HELP as default type for combining grouped values
        });
      }
    });
    
    if (sourceValues.length === 0) return 0;
    if (sourceValues.length === 1) return sourceValues[0].value;
    
    // Apply grouping formula to combine the grouped values
    // Sort by value descending to start with highest value first
    sourceValues.sort((a, b) => b.value - a.value);
    
    // Start with the highest value and apply the formula for each subsequent value
    let currentValue = sourceValues[0].value;
    
    for (let i = 1; i < sourceValues.length; i++) {
      currentValue = calculateGroupingFormula(currentValue, sourceValues[i].value, 'HELP');
    }
    
    return Math.round(currentValue * 100) / 100;
  };
  
  // Helper function to get single character attribute value with grouping
  const getSingleCharacterAttributeValue = (character, attributeName) => {
    const groupedAttributes = calculateGroupedAttributes(character);
    if (groupedAttributes[attributeName] !== undefined) {
      return groupedAttributes[attributeName];
    } else if (character[attributeName] && character[attributeName].attribute) {
      return character[attributeName].attribute.attributeValue;
    }
    return 0;
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
    setLastCalculatedTargetValue(null);
  };

  // Handler for checkbox source selection
  const handleSourceSelection = (sourceId, isChecked) => {
    if (isChecked) {
      setSelectedSourceIds(prev => [...prev, sourceId]);
    } else {
      setSelectedSourceIds(prev => prev.filter(id => id !== sourceId));
    }
    // Clear previous results when selection changes
    setActionDifficulty(null);
    setLastCalculatedSourceValue(null);
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
    // Debug logging
    console.log('🔍 Source filtering debug:');
    console.log('Current action:', action);
    console.log('All characters data:', allCharactersData?.listCharacters);
    console.log('Looking for actionId:', action.actionId);
    
    // Filter characters that have the same action
    const charactersWithAction = allCharactersData?.listCharacters.filter(char => {
      console.log(`Character ${char.name}:`, {
        hasActions: !!char.actions,
        actions: char.actions,
        actionIds: char.actions?.map(a => a.actionId),
        hasTargetAction: char.actions?.some(charAction => charAction.actionId === action.actionId)
      });
      return char.actions && char.actions.some(charAction => charAction.actionId === action.actionId);
    }) || [];

    console.log('Characters with action:', charactersWithAction);

    if (charactersWithAction.length === 0) {
      return (
        <div className="no-sources">
          <p>No characters have this action.</p>
          <small>Debug: Looking for actionId {action.actionId}</small>
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
            disabled={(selectedTargetIds.length === 0 && !override) || (override && !overrideValue) || selectedSourceIds.length === 0}
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
              Source Value: {getDisplaySourceValue()} {selectedSourceIds.length > 0 ? '(grouped)' : ''}
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