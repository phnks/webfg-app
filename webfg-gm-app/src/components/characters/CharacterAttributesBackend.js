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

  // State for equipment/ready toggle
  const [showReadyAttributes, setShowReadyAttributes] = useState(false);

  // State for breakdown popup
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [breakdownAttributeName, setBreakdownAttributeName] = useState('');
  
  // Note: Ready breakdown state removed as ready grouping is no longer automatic
  // const [showReadyBreakdown, setShowReadyBreakdown] = useState(false);
  // const [selectedReadyAttribute, setSelectedReadyAttribute] = useState(null);
  // const [readyBreakdownAttributeName, setReadyBreakdownAttributeName] = useState('');
  
  // Query for breakdown data when needed
  const { data: breakdownData, loading: breakdownLoading } = useQuery(
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
  
  // Note: Ready breakdown uses frontend fallback function only
  // Backend doesn't support ready grouped breakdowns yet
  
  
  // Handler for showing breakdown
  const handleShowBreakdown = (attributeKey, attributeName) => {
    if (character) {
      setSelectedAttribute(attributeKey);
      setBreakdownAttributeName(attributeName);
      setShowBreakdown(true);
    }
  };
  
  // Note: Ready breakdown handler removed as ready grouping is no longer automatic
  // const handleShowReadyBreakdown = (attributeKey, attributeName) => {
  //   if (character) {
  //     setSelectedReadyAttribute(attributeKey);
  //     setReadyBreakdownAttributeName(attributeName);
  //     setShowReadyBreakdown(true);
  //   }
  // };
  
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
  // Mimics the backend format: one row per entity, showing weighted average formula as items are added
  const generateReadyFallbackBreakdown = (attributeKey) => {
    const steps = [];
    let stepCount = 1;
    
    // Find the attribute in character
    const originalValue = character?.[attributeKey]?.attribute?.attributeValue || 0;
    if (!originalValue && originalValue !== 0) {
      return steps;
    }
    
    // Get original value and collect all values to group
    const numOriginalValue = Number(originalValue);
    const charIsGrouped = character?.[attributeKey]?.attribute?.isGrouped !== false;
    
    // Collect all values that will be grouped (sorted by highest first)
    const allValues = [];
    
    // Character base value (always first if grouped)
    if (charIsGrouped) {
      allValues.push({ value: numOriginalValue, name: character?.name || 'Character', type: 'character' });
    }
    
    // Equipment objects
    if (character?.equipment?.length > 0) {
      character.equipment.forEach(item => {
        const itemAttr = item[attributeKey];
        if (itemAttr && itemAttr.attributeValue !== undefined) {
          const itemValue = Number(itemAttr.attributeValue);
          const itemIsGrouped = itemAttr.isGrouped !== false;
          if (itemIsGrouped && itemValue > 0) {
            allValues.push({ value: itemValue, name: item.name || 'Equipment', type: 'equipment' });
          }
        }
      });
    }
    
    // Ready objects
    if (character?.ready?.length > 0) {
      character.ready.forEach(item => {
        const itemAttr = item[attributeKey];
        if (itemAttr && itemAttr.attributeValue !== undefined) {
          const itemValue = Number(itemAttr.attributeValue);
          const itemIsGrouped = itemAttr.isGrouped !== false;
          if (itemIsGrouped && itemValue > 0) {
            allValues.push({ value: itemValue, name: item.name || 'Ready Object', type: 'ready' });
          }
        }
      });
    }
    
    // Sort by value descending (highest first) to match backend logic
    allValues.sort((a, b) => b.value - a.value);
    
    // Calculate running totals as each entity is added (like backend format)
    let runningTotal = 0;
    
    allValues.forEach((entity, index) => {
      if (index === 0) {
        // First entity (highest value)
        runningTotal = entity.value;
        steps.push({
          step: stepCount++,
          entityName: entity.name,
          entityType: entity.type === 'character' ? 'character' : 'object',
          attributeValue: entity.value,
          isGrouped: true,
          runningTotal: Math.round(runningTotal * 100) / 100,
          formula: null
        });
      } else {
        // Subsequent entities: calculate weighted average formula
        // Calculate new running total using weighted average formula: (A1 + A2*(2+A2/A1) + A3*(3+A3/A1) + ...) / N
        const A1 = allValues[0].value; // Highest value
        let sum = A1; // Start with A1
        
        for (let i = 1; i <= index; i++) {
          const Ai = allValues[i].value;
          const scalingFactor = i + 1;
          if (A1 > 0) {
            sum += Ai * (scalingFactor + Ai / A1);
          } else {
            sum += Ai * scalingFactor;
          }
        }
        runningTotal = sum / (index + 1);
        
        // Create formula string showing the correct weighted average calculation
        if (index === 1) {
          // Second item: show A1 + A2*(2+A2/A1) / 2
          const A2 = entity.value;
          const formulaString = `Weighted Average: (${A1} + ${A2}*(2+${A2}/${A1})) / 2`;
          steps.push({
            step: stepCount++,
            entityName: entity.name,
            entityType: entity.type === 'character' ? 'character' : 'object',
            attributeValue: entity.value,
            isGrouped: true,
            runningTotal: Math.round(runningTotal * 100) / 100,
            formula: formulaString
          });
        } else {
          // Third+ item: show full formula
          let formulaParts = [A1.toString()];
          for (let i = 1; i <= index; i++) {
            const Ai = allValues[i].value;
            const scalingFactor = i + 1;
            formulaParts.push(`${Ai}*(${scalingFactor}+${Ai}/${A1})`);
          }
          const formulaString = `Weighted Average: (${formulaParts.join(' + ')}) / ${index + 1}`;
          steps.push({
            step: stepCount++,
            entityName: entity.name,
            entityType: entity.type === 'character' ? 'character' : 'object',
            attributeValue: entity.value,
            isGrouped: true,
            runningTotal: Math.round(runningTotal * 100) / 100,
            formula: formulaString
          });
        }
      }
    });
    
    // Apply conditions (HELP/HINDER) at the end
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
          formula: `${condition.conditionType}: ${previousValue} ${condition.conditionType === 'HELP' ? '+' : '-'} ${conditionAmount}`
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
    
    // Determine which grouped value to show based on toggle state
    const displayGroupedValue = showReadyAttributes ? readyGroupedValue : equipmentGroupedValue;
    const displayGroupedSource = showReadyAttributes ? 'ready' : 'equipment';
    
    // Check if there are conditions that affect this attribute
    const hasConditionForThisAttribute = hasConditions && character.conditions.some(c => 
      c.conditionTarget && c.conditionTarget.toLowerCase() === attributeName.toLowerCase()
    );
    
    // Convert values to numbers for accurate comparison
    const numOriginal = typeof originalValue === 'string' ? parseFloat(originalValue) : Number(originalValue);
    const numEquipmentGrouped = typeof equipmentGroupedValue === 'string' ? parseFloat(equipmentGroupedValue) : Number(equipmentGroupedValue);
    const numReadyGrouped = typeof readyGroupedValue === 'string' ? parseFloat(readyGroupedValue) : Number(readyGroupedValue);
    const numDisplayGrouped = typeof displayGroupedValue === 'string' ? parseFloat(displayGroupedValue) : Number(displayGroupedValue);
    
    // Check if we have valid numbers before computing difference
    const canComputeDisplayDifference = !isNaN(numOriginal) && !isNaN(numDisplayGrouped);
    const displayDifference = canComputeDisplayDifference ? Math.abs(numDisplayGrouped - numOriginal) : 0;
    const isDisplayDifferent = canComputeDisplayDifference && displayDifference >= 0.01;
    
    // Determine if we should show grouped value based on toggle state
    const shouldShowGroupedValue = showReadyAttributes ? 
      // For ready mode: show if we have ready grouped data OR if equipment mode would show it
      ((readyGroupedValue !== undefined && readyGroupedValue !== null) && 
       (hasReady || hasConditionForThisAttribute || isDisplayDifferent)) ||
      (hasConditionForThisAttribute && readyGroupedAttributes && 
       readyGroupedAttributes[attributeName] !== undefined) ||
      // Also show if equipment mode would show it (to maintain consistency)
      ((equipmentGroupedValue !== undefined && equipmentGroupedValue !== null) && 
       (hasEquipment || hasConditionForThisAttribute)) ||
      (hasConditionForThisAttribute && effectiveGroupedAttributes && 
       effectiveGroupedAttributes[attributeName] !== undefined)
      :
      // For equipment mode: use existing logic
      ((equipmentGroupedValue !== undefined && equipmentGroupedValue !== null) && 
       (hasEquipment || hasConditionForThisAttribute || isDisplayDifferent)) ||
      (hasConditionForThisAttribute && effectiveGroupedAttributes && 
       effectiveGroupedAttributes[attributeName] !== undefined);
       
    // Note: Ready grouped values are no longer automatically displayed
    // They will only be calculated and shown during action tests when an object is selected
    
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
          {shouldShowGroupedValue && (
            <span 
              className="grouped-value" 
              style={getGroupedValueStyle(originalValue, displayGroupedValue)}
              title={`Grouped value with ${displayGroupedSource} and conditions`}
            >
              {' → '}{
                displayGroupedValue !== undefined && 
                !isNaN(Number(displayGroupedValue)) ? 
                  Math.round(Number(displayGroupedValue)) : 
                  originalValue
              }
              {((showReadyAttributes ? hasReady : hasEquipment) || hasConditions) && (
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
        <div className="attributes-header">
          <h3>Attributes</h3>
          {(character?.ready?.length > 0 || readyGroupedAttributes) && (
            <div className="equipment-ready-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showReadyAttributes}
                  onChange={(e) => setShowReadyAttributes(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {showReadyAttributes ? 'ready' : 'equipment'}
                </span>
              </label>
            </div>
          )}
        </div>
        <AttributeGroups
          attributes={character}
          renderAttribute={renderAttributeForView}
          title={null}
          defaultExpandedGroups={['BODY', 'MARTIAL', 'MENTAL']}
        />
      </div>
      
      {showBreakdown && (
        <AttributeBreakdownPopup
          breakdown={
            showReadyAttributes 
              ? generateReadyFallbackBreakdown(selectedAttribute)
              : (breakdownData?.getCharacter?.attributeBreakdown || generateFallbackBreakdown(selectedAttribute))
          }
          attributeName={`${breakdownAttributeName}${showReadyAttributes ? ' (Ready Grouped)' : ''}`}
          isLoading={!showReadyAttributes && breakdownLoading}
          onClose={() => {
            setShowBreakdown(false);
            setSelectedAttribute(null);
          }}
        />
      )}
      
      {/* Ready breakdown popup removed as ready grouping is no longer automatic */}
      {/*
      {showReadyBreakdown && (
        <AttributeBreakdownPopup
          breakdown={generateReadyFallbackBreakdown(selectedReadyAttribute)}
          attributeName={`${readyBreakdownAttributeName} (Ready Grouped)`}
          isLoading={false}
          onClose={() => {
            setShowReadyBreakdown(false);
            setSelectedReadyAttribute(null);
          }}
        />
      )}
      */}
    </>
  );
};

export default CharacterAttributesBackend;