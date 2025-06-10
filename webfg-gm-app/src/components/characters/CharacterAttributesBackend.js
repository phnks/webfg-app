import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_CHARACTER_ATTRIBUTE_BREAKDOWN } from "../../graphql/computedOperations";
import AttributeBreakdownPopup from "../common/AttributeBreakdownPopup";
import AttributeGroups, { ATTRIBUTE_GROUPS } from "../common/AttributeGroups";
import "./CharacterAttributes.css";

// Version that uses backend computed fields
const CharacterAttributesBackend = ({ 
  character, // Full character object with all attributes
  groupedAttributes // New prop from backend
}) => {

  // State for breakdown popup
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [breakdownAttributeName, setBreakdownAttributeName] = useState('');
  
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
  
  
  // Handler for showing breakdown
  const handleShowBreakdown = (attributeKey, attributeName) => {
    if (character) {
      setSelectedAttribute(attributeKey);
      setBreakdownAttributeName(attributeName);
      setShowBreakdown(true);
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
    const groupedValue = effectiveGroupedAttributes?.[attributeName];
    const hasEquipment = character && character.equipment && character.equipment.length > 0;
    const hasConditions = character && character.conditions && character.conditions.length > 0;
    
    // Check if there are conditions that affect this attribute
    const hasConditionForThisAttribute = hasConditions && character.conditions.some(c => 
      c.conditionTarget && c.conditionTarget.toLowerCase() === attributeName.toLowerCase()
    );
    
    // Convert values to numbers for accurate comparison
    const numOriginal = typeof originalValue === 'string' ? parseFloat(originalValue) : Number(originalValue);
    const numGrouped = typeof groupedValue === 'string' ? parseFloat(groupedValue) : Number(groupedValue);
    
    // Check if we have valid numbers before computing difference
    const canComputeDifference = !isNaN(numOriginal) && !isNaN(numGrouped);
    const difference = canComputeDifference ? Math.abs(numGrouped - numOriginal) : 0;
    const isDifferent = canComputeDifference && difference >= 0.01;
    
    // Determine if we should show grouped value
    const shouldShowGroupedValue = 
      ((groupedValue !== undefined && groupedValue !== null) && 
       (hasEquipment || hasConditionForThisAttribute || isDifferent)) ||
      (hasConditionForThisAttribute && effectiveGroupedAttributes && 
       effectiveGroupedAttributes[attributeName] !== undefined);
    
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
              style={getGroupedValueStyle(originalValue, effectiveGroupedAttributes[attributeName])}
              title="Final grouped value with equipment and conditions"
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
    </>
  );
};

export default CharacterAttributesBackend;