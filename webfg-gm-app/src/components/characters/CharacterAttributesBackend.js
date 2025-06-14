import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_CHARACTER_ATTRIBUTE_BREAKDOWN } from "../../graphql/computedOperations";
import AttributeBreakdownPopup from "../common/AttributeBreakdownPopup";
import AttributeGroups, { ATTRIBUTE_GROUPS } from "../common/AttributeGroups";
import "./CharacterAttributes.css";

// Version that uses backend computed fields
const CharacterAttributesBackend = ({ 
  character, // Full character object with all attributes
  groupedAttributes, // Equipment grouped attributes from backend
  readyGroupedAttributes // Ready grouped attributes (equipment + ready) from backend - can be undefined
}) => {
  // Debug logging
  console.log('[CharacterAttributesBackend] Props received:', {
    characterName: character?.name,
    hasGroupedAttributes: !!groupedAttributes,
    hasReadyGroupedAttributes: !!readyGroupedAttributes,
    readyGroupedAttributes: readyGroupedAttributes
  });

  // State for breakdown popup
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [breakdownAttributeName, setBreakdownAttributeName] = useState('');
  
  // State for ready breakdown popup
  const [showReadyBreakdown, setShowReadyBreakdown] = useState(false);
  const [selectedReadyAttribute, setSelectedReadyAttribute] = useState(null);
  const [readyBreakdownAttributeName, setReadyBreakdownAttributeName] = useState('');
  
  // Query for breakdown data when needed
  const { data: breakdownData, loading: breakdownLoading, error: breakdownError } = useQuery(
    GET_CHARACTER_ATTRIBUTE_BREAKDOWN,
    {
      variables: {
        characterId: character?.characterId,
        attributeName: selectedAttribute
      },
      skip: !selectedAttribute || !character?.characterId,
      onCompleted: (data) => {},
      onError: (error) => {}
    }
  );
  
  // Query for ready breakdown data when needed
  const { data: readyBreakdownData, loading: readyBreakdownLoading } = useQuery(
    GET_CHARACTER_ATTRIBUTE_BREAKDOWN,
    {
      variables: {
        characterId: character?.characterId,
        attributeName: selectedReadyAttribute
      },
      skip: !selectedReadyAttribute || !character?.characterId,
      onCompleted: (data) => {},
      onError: (error) => {}
    }
  );
  
  
  // Handler for showing breakdown
  const handleShowBreakdown = (attributeKey, attributeName) => {
    if (character) {
      setSelectedAttribute(attributeKey);
      setBreakdownAttributeName(attributeName);
      setShowBreakdown(true);
    }
  };
  
  // Handler for showing ready breakdown
  const handleShowReadyBreakdown = (attributeKey, attributeName) => {
    if (character) {
      setSelectedReadyAttribute(attributeKey);
      setReadyBreakdownAttributeName(attributeName);
      setShowReadyBreakdown(true);
    }
  };
  
  const hasConditions = character && character.conditions && character.conditions.length > 0;
  
  // Function to generate a fallback breakdown when backend data is unavailable
  const generateFallbackBreakdown = (attributeKey) => {
    const steps = [];
    let stepCount = 1;
    
    // Find the attribute in character or use effectiveGroupedAttributes
    const originalValue = character?.[attributeKey]?.attribute?.attributeValue || 0;
    if (!originalValue && originalValue !== 0) {
      return steps;
    }
    
    // Get original value
    const numOriginalValue = Number(originalValue);
    
    // Add base value as first step
    steps.push({
      step: stepCount++,
      entityName: character?.name || 'Character',
      entityType: 'character',
      attributeValue: numOriginalValue,
      isGrouped: character?.[attributeKey]?.attribute?.isGrouped || true,
      runningTotal: numOriginalValue,
      formula: null
    });
    
    // If no conditions affect this attribute, return just the base value
    if (!hasConditions) {
      return steps;
    }
    
    // Check for conditions that affect this attribute
    const relevantConditions = character.conditions.filter(c => 
      c.conditionTarget && c.conditionTarget.toLowerCase() === attributeKey.toLowerCase()
    );
    
    if (relevantConditions.length === 0) {
      return steps;
    }
    
    
    // Add steps for each condition
    let runningTotal = numOriginalValue;
    relevantConditions.forEach(condition => {
      const conditionAmount = Number(condition.conditionAmount);
      const previousValue = runningTotal;
      
      if (condition.conditionType === 'HELP') {
        runningTotal += conditionAmount;
      } else if (condition.conditionType === 'HINDER') {
        runningTotal -= conditionAmount;
      }
      
      steps.push({
        step: stepCount++,
        entityName: condition.name || 'Condition',
        entityType: 'condition',
        attributeValue: conditionAmount,
        isGrouped: true,
        runningTotal: runningTotal,
        formula: `${condition.conditionType}: ${previousValue} ${condition.conditionType === 'HELP' ? '+' : '-'} ${conditionAmount}`
      });
    });
    
    return steps;
  };

  // Function to generate a fallback ready breakdown including ready items
  const generateReadyFallbackBreakdown = (attributeKey) => {
    const steps = [];
    let stepCount = 1;
    
    // Find the attribute in character
    const originalValue = character?.[attributeKey]?.attribute?.attributeValue || 0;
    if (!originalValue && originalValue !== 0) {
      return steps;
    }
    
    // Get original value
    const numOriginalValue = Number(originalValue);
    
    // Mirror the backend calculation logic exactly
    // 1. Start with character base value (if isGrouped=true)
    const charIsGrouped = character?.[attributeKey]?.attribute?.isGrouped !== false;
    const valuesToGroup = [];
    
    if (charIsGrouped) {
      valuesToGroup.push(numOriginalValue);
      steps.push({
        step: stepCount++,
        entityName: character?.name || 'Character',
        entityType: 'character',
        attributeValue: numOriginalValue,
        isGrouped: true,
        runningTotal: numOriginalValue,
        formula: null
      });
    }
    
    // 2. Add equipment objects that have isGrouped=true
    if (character?.equipment?.length > 0) {
      character.equipment.forEach(item => {
        const itemAttr = item[attributeKey];
        if (itemAttr && itemAttr.attributeValue !== undefined) {
          const itemValue = Number(itemAttr.attributeValue);
          const itemIsGrouped = itemAttr.isGrouped !== false;
          
          if (itemIsGrouped && itemValue > 0) {
            valuesToGroup.push(itemValue);
            steps.push({
              step: stepCount++,
              entityName: item.name || 'Equipment',
              entityType: 'object',
              attributeValue: itemValue,
              isGrouped: true,
              runningTotal: 0, // Will calculate after grouping
              formula: `EQUIPMENT: ${item.name} contributes ${itemValue}`
            });
          }
        }
      });
    }
    
    // 3. Add ready objects that have isGrouped=true
    if (character?.ready?.length > 0) {
      character.ready.forEach(item => {
        const itemAttr = item[attributeKey];
        if (itemAttr && itemAttr.attributeValue !== undefined) {
          const itemValue = Number(itemAttr.attributeValue);
          const itemIsGrouped = itemAttr.isGrouped !== false;
          
          if (itemIsGrouped && itemValue > 0) {
            valuesToGroup.push(itemValue);
            steps.push({
              step: stepCount++,
              entityName: item.name || 'Ready Object',
              entityType: 'object',
              attributeValue: itemValue,
              isGrouped: true,
              runningTotal: 0, // Will calculate after grouping
              formula: `READY: ${item.name} contributes ${itemValue}`
            });
          }
        }
      });
    }
    
    // 4. Calculate weighted average if we have multiple values
    let groupedValue = numOriginalValue;
    if (valuesToGroup.length > 1) {
      // Sort values in descending order (highest first)
      valuesToGroup.sort((a, b) => b - a);
      
      // Apply weighted average grouping formula: (A1 + A2*(2+A2/A1) + A3*(3+A3/A1) + ...) / N
      const A1 = valuesToGroup[0];
      let sum = A1;
      
      for (let i = 1; i < valuesToGroup.length; i++) {
        const Ai = valuesToGroup[i];
        const scalingFactor = i + 1;
        
        if (A1 > 0) {
          sum += Ai * (scalingFactor + Ai / A1);
        } else {
          sum += Ai * scalingFactor;
        }
      }
      
      groupedValue = sum / valuesToGroup.length;
      
      // Add a grouping calculation step
      steps.push({
        step: stepCount++,
        entityName: 'Weighted Average Grouping',
        entityType: 'calculation',
        attributeValue: 0,
        isGrouped: true,
        runningTotal: Math.round(groupedValue * 100) / 100,
        formula: `Grouped: (${valuesToGroup.join(' + ')}) using weighted average = ${Math.round(groupedValue * 100) / 100}`
      });
    }
    
    let runningTotal = Math.round(groupedValue * 100) / 100;
    
    // Update all previous object/character steps with the correct running total after grouping
    steps.forEach((step, index) => {
      if (step.entityType !== 'calculation' && step.entityType !== 'condition') {
        step.runningTotal = runningTotal;
      }
    });
    
    // 5. Apply conditions (HELP/HINDER) at the end
    if (hasConditions) {
      const relevantConditions = character.conditions.filter(c => 
        c.conditionTarget && c.conditionTarget.toLowerCase() === attributeKey.toLowerCase()
      );
      
      relevantConditions.forEach(condition => {
        const conditionAmount = Number(condition.conditionAmount || condition.amount || 0);
        if (conditionAmount === 0) return;
        
        const previousValue = runningTotal;
        
        if (condition.conditionType === 'HELP') {
          runningTotal += conditionAmount;
        } else if (condition.conditionType === 'HINDER') {
          runningTotal -= conditionAmount;
        }
        
        steps.push({
          step: stepCount++,
          entityName: condition.name || 'Condition',
          entityType: 'condition',
          attributeValue: conditionAmount,
          isGrouped: true,
          runningTotal: Math.round(runningTotal * 100) / 100,
          formula: `${condition.conditionType}: ${previousValue} ${condition.conditionType === 'HELP' ? '+' : '-'} ${conditionAmount} = ${Math.round(runningTotal * 100) / 100}`
        });
      });
    }
    
    return steps;
  };
  
  // Create a fallback groupedAttributes object if it's undefined
  // This will calculate the values based on conditions directly in the frontend
  const effectiveGroupedAttributes = useMemo(() => {
    if (groupedAttributes) return groupedAttributes;
    
    // If the backend didn't provide groupedAttributes, create our own version
    const fallbackAttributes = {};
    
    // Initialize with base attribute values from character
    Object.values(ATTRIBUTE_GROUPS).flat().forEach(attrName => {
      if (character?.[attrName]?.attribute?.attributeValue !== undefined) {
        fallbackAttributes[attrName] = Number(character[attrName].attribute.attributeValue);
      }
    });
    
    // Apply condition effects
    if (character?.conditions?.length > 0) {
      character.conditions.forEach(condition => {
        if (!condition.conditionTarget || !condition.conditionType || condition.conditionAmount === undefined) {
          return; // Skip invalid conditions
        }
        
        const targetAttr = condition.conditionTarget.toLowerCase();
        if (fallbackAttributes[targetAttr] !== undefined) {
          if (condition.conditionType === 'HELP') {
            fallbackAttributes[targetAttr] += Number(condition.conditionAmount);
          } else if (condition.conditionType === 'HINDER') {
            fallbackAttributes[targetAttr] -= Number(condition.conditionAmount);
          }
        }
      });
    }
    
    return fallbackAttributes;
  }, [character, groupedAttributes]);

  // Helper function to get color style for grouped value
  const getGroupedValueStyle = (originalValue, groupedValue) => {
    // If groupedValue is undefined, return default style
    if (groupedValue === undefined || groupedValue === null) {
      return { fontWeight: 'bold' };
    }
    
    // More robust numeric conversion - ensure we're comparing proper numbers
    // First convert string values to numbers if needed
    const numOriginal = typeof originalValue === 'string' ? parseFloat(originalValue) : Number(originalValue);
    const numGrouped = typeof groupedValue === 'string' ? parseFloat(groupedValue) : Number(groupedValue);
    
    // Handle NaN case
    if (isNaN(numGrouped) || isNaN(numOriginal)) {
      return { fontWeight: 'bold' };
    }
    
    // Use small epsilon for floating point comparison to avoid precision issues
    const epsilon = 0.001;
    
    if (numGrouped - numOriginal > epsilon) {
      return { color: '#28a745', fontWeight: 'bold' }; // Green for higher
    } else if (numOriginal - numGrouped > epsilon) {
      return { color: '#dc3545', fontWeight: 'bold' }; // Red for lower
    }
    return { fontWeight: 'bold' }; // Normal color for same
  };

  // Render function for individual attributes in the view
  const renderAttributeForView = (attributeName, attribute, displayName) => {
    const originalValue = character?.[attributeName]?.attribute?.attributeValue || 0;
    const equipmentGroupedValue = effectiveGroupedAttributes?.[attributeName];
    const readyGroupedValue = readyGroupedAttributes?.[attributeName];
    const hasEquipment = character && character.equipment && character.equipment.length > 0;
    const hasReady = character && character.readyIds && character.readyIds.length > 0;
    const hasConditions = character && character.conditions && character.conditions.length > 0;
    
    // Check if there are conditions that affect this attribute
    const hasConditionForThisAttribute = hasConditions && character.conditions.some(c => 
      c.conditionTarget && c.conditionTarget.toLowerCase() === attributeName.toLowerCase()
    );
    
    // Convert values to numbers for accurate comparison
    const numOriginal = typeof originalValue === 'string' ? parseFloat(originalValue) : Number(originalValue);
    const numEquipmentGrouped = typeof equipmentGroupedValue === 'string' ? parseFloat(equipmentGroupedValue) : Number(equipmentGroupedValue);
    const numReadyGrouped = typeof readyGroupedValue === 'string' ? parseFloat(readyGroupedValue) : Number(readyGroupedValue);
    
    // Check if we have valid numbers before computing difference
    const canComputeEquipmentDifference = !isNaN(numOriginal) && !isNaN(numEquipmentGrouped);
    const canComputeReadyDifference = !isNaN(numEquipmentGrouped) && !isNaN(numReadyGrouped);
    const equipmentDifference = canComputeEquipmentDifference ? Math.abs(numEquipmentGrouped - numOriginal) : 0;
    const readyDifference = canComputeReadyDifference ? Math.abs(numReadyGrouped - numEquipmentGrouped) : 0;
    const isEquipmentDifferent = canComputeEquipmentDifference && equipmentDifference >= 0.01;
    const isReadyDifferent = canComputeReadyDifference && readyDifference >= 0.01;
    
    // Determine if we should show equipment grouped value
    const shouldShowEquipmentGroupedValue = 
      ((equipmentGroupedValue !== undefined && equipmentGroupedValue !== null) && 
       (hasEquipment || hasConditionForThisAttribute || isEquipmentDifferent)) ||
      (hasConditionForThisAttribute && effectiveGroupedAttributes && 
       effectiveGroupedAttributes[attributeName] !== undefined) ||
      // Always show equipment grouped when we have ready items (to show the intermediate step)
      (hasReady && readyGroupedAttributes && readyGroupedValue !== undefined && readyGroupedValue !== null);
       
    // Determine if we should show ready grouped value
    // Show if character has ready items AND we have readyGroupedAttributes data
    const shouldShowReadyGroupedValue = 
      hasReady && 
      readyGroupedAttributes && // Check that readyGroupedAttributes exists
      readyGroupedValue !== undefined && readyGroupedValue !== null;
    
    return (
      <div key={attributeName} className="attribute-item">
        <label>{displayName}</label>
        <span>
          {originalValue} 
          <span 
            className="grouping-indicator" 
            title={character?.[attributeName]?.attribute?.isGrouped ? 'This attribute participates in grouping' : 'This attribute does not participate in grouping'}
            style={{ marginLeft: '6px', fontSize: '0.8em', opacity: 0.7 }}
          >
            {character?.[attributeName]?.attribute?.isGrouped !== false ? '☑️' : '❌'}
          </span>
          {shouldShowEquipmentGroupedValue && (
            <span 
              className="grouped-value" 
              style={getGroupedValueStyle(originalValue, effectiveGroupedAttributes[attributeName])}
              title="Grouped value with equipment and conditions (for targets)"
            >
              {' → '}{
                effectiveGroupedAttributes[attributeName] !== undefined && 
                !isNaN(Number(effectiveGroupedAttributes[attributeName])) ? 
                  Math.round(Number(effectiveGroupedAttributes[attributeName])) : 
                  originalValue
              }
              {(hasEquipment || hasConditions) && (
                <button
                  className="info-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowBreakdown(attributeName, displayName);
                  }}
                  title="Show detailed breakdown"
                >
                  ℹ️
                </button>
              )}
            </span>
          )}
          {shouldShowReadyGroupedValue && (
            <span 
              className="ready-grouped-value" 
              style={{
                ...getGroupedValueStyle(equipmentGroupedValue, readyGroupedValue),
                marginLeft: '4px'
              }}
              title="Ready grouped value with equipment + ready objects (for sources)"
            >
              {' → '}{
                readyGroupedValue !== undefined && 
                !isNaN(Number(readyGroupedValue)) ? 
                  Math.round(Number(readyGroupedValue)) : 
                  equipmentGroupedValue
              }
              <button
                className="info-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowReadyBreakdown(attributeName, displayName);
                }}
                title="Show ready grouped attribute breakdown"
              >
                ℹ️
              </button>
            </span>
          )}
        </span>
      </div>
    );
  };
  
  if (!character) {
    return (
      <div className="section character-attributes">
        <h3>Attributes</h3>
        <p>No character data available.</p>
      </div>
    );
  }

  return (
    <>
      <div className="section character-attributes">
        <AttributeGroups
          attributes={character}
          renderAttribute={renderAttributeForView}
          title="Attributes"
          defaultExpandedGroups={['BODY', 'MARTIAL', 'MENTAL']}
        />
      </div>
      
      {showBreakdown && (
        <AttributeBreakdownPopup
          breakdown={breakdownData?.getCharacter?.attributeBreakdown || generateFallbackBreakdown(selectedAttribute)}
          attributeName={breakdownAttributeName}
          isLoading={breakdownLoading}
          onClose={() => {
            setShowBreakdown(false);
            setSelectedAttribute(null);
          }}
        />
      )}
      
      {showReadyBreakdown && (
        <AttributeBreakdownPopup
          breakdown={readyBreakdownData?.getCharacter?.attributeBreakdown || generateReadyFallbackBreakdown(selectedReadyAttribute)}
          attributeName={`${readyBreakdownAttributeName} (Ready Grouped)`}
          isLoading={readyBreakdownLoading}
          onClose={() => {
            setShowReadyBreakdown(false);
            setSelectedReadyAttribute(null);
          }}
        />
      )}
    </>
  );
};

export default CharacterAttributesBackend;