import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_CHARACTER_ATTRIBUTE_BREAKDOWN } from "../../graphql/computedOperations";
import AttributeBreakdownPopup from "../common/AttributeBreakdownPopup";
import "./CharacterAttributes.css";

// Version that uses backend computed fields
const CharacterAttributesBackend = ({ 
  lethality, armour, endurance, strength, dexterity, agility,
  perception, charisma, intelligence, resolve, morale,
  character, // Added character prop for breakdown queries
  groupedAttributes // New prop from backend
}) => {
  
  const attributes = [
    { name: "Lethality", key: "lethality", data: lethality },
    { name: "Armour", key: "armour", data: armour },
    { name: "Endurance", key: "endurance", data: endurance },
    { name: "Strength", key: "strength", data: strength },
    { name: "Dexterity", key: "dexterity", data: dexterity },
    { name: "Agility", key: "agility", data: agility },
    { name: "Perception", key: "perception", data: perception },
    { name: "Charisma", key: "charisma", data: charisma },
    { name: "Intelligence", key: "intelligence", data: intelligence },
    { name: "Resolve", key: "resolve", data: resolve },
    { name: "Morale", key: "morale", data: morale }
  ].filter(attr => attr.data); // Only show attributes that have data

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
      onCompleted: (data) => {
        console.log(`[DEBUG] Breakdown query completed with data:`, data);
      },
      onError: (error) => {
        console.error(`[DEBUG] Breakdown query failed:`, error);
      }
    }
  );
  
  // Debug tracking for breakdown state
  useMemo(() => {
    if (selectedAttribute) {
      console.log(`[DEBUG] selectedAttribute: ${selectedAttribute}, showBreakdown: ${showBreakdown}`);
      if (breakdownData) {
        console.log(`[DEBUG] breakdownData:`, breakdownData);
      }
      if (breakdownError) {
        console.error(`[DEBUG] breakdownError:`, breakdownError);
      }
    }
  }, [selectedAttribute, showBreakdown, breakdownData, breakdownError]);
  
  // Handler for showing breakdown
  const handleShowBreakdown = (attributeKey, attributeName) => {
    console.log(`[DEBUG] handleShowBreakdown called with attributeKey=${attributeKey}, attributeName=${attributeName}`);
    if (character) {
      console.log(`[DEBUG] Character ID: ${character.characterId}`);
      setSelectedAttribute(attributeKey);
      setBreakdownAttributeName(attributeName);
      setShowBreakdown(true);
      console.log(`[DEBUG] Set showBreakdown to true, selectedAttribute to ${attributeKey}`);
    } else {
      console.log(`[DEBUG] Character is null or undefined - can't show breakdown`);
    }
  };
  
  // Debug outputs using console.log directly
  const hasConditions = character && character.conditions && character.conditions.length > 0;
  if (hasConditions) {
    console.log('[DEBUG] Character has conditions:', character.conditions);
  }
  
  if (groupedAttributes) {
    console.log('[DEBUG] Grouped attributes:', groupedAttributes);
  } else {
    console.log('[DEBUG] WARNING: groupedAttributes is undefined or null');
  }
  
  // Function to generate a fallback breakdown when backend data is unavailable
  const generateFallbackBreakdown = (attributeKey) => {
    console.log(`[DEBUG] Generating fallback breakdown for ${attributeKey}`);
    const steps = [];
    let stepCount = 1;
    
    // Find the attribute in our attributes array
    const attribute = attributes.find(attr => attr.key === attributeKey);
    if (!attribute) {
      console.error(`[DEBUG] Could not find attribute with key ${attributeKey}`);
      return steps;
    }
    
    // Get original value
    const originalValue = Number(attribute.data.attribute.attributeValue);
    
    // Add base value as first step
    steps.push({
      step: stepCount++,
      entityName: character?.name || 'Character',
      entityType: 'character',
      attributeValue: originalValue,
      isGrouped: attribute.data.attribute.isGrouped,
      runningTotal: originalValue,
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
    
    console.log(`[DEBUG] Found ${relevantConditions.length} conditions affecting ${attributeKey}`);
    
    // Add steps for each condition
    let runningTotal = originalValue;
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
    
    console.log(`[DEBUG] Generated fallback breakdown:`, steps);
    return steps;
  };
  
  // Create a fallback groupedAttributes object if it's undefined
  // This will calculate the values based on conditions directly in the frontend
  const effectiveGroupedAttributes = useMemo(() => {
    if (groupedAttributes) return groupedAttributes;
    
    // If the backend didn't provide groupedAttributes, create our own version
    console.log('[DEBUG] Creating fallback groupedAttributes');
    const fallbackAttributes = {};
    
    // Initialize with base attribute values
    attributes.forEach(attr => {
      if (attr.data?.attribute?.attributeValue) {
        fallbackAttributes[attr.key] = Number(attr.data.attribute.attributeValue);
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
    
    console.log('[DEBUG] Fallback grouped attributes:', fallbackAttributes);
    return fallbackAttributes;
  }, [attributes, character?.conditions, groupedAttributes]);

  // Helper function to get color style for grouped value
  const getGroupedValueStyle = (originalValue, groupedValue) => {
    // If groupedValue is undefined, return default style
    if (groupedValue === undefined || groupedValue === null) {
      console.log(`[DEBUG] getGroupedValueStyle - Grouped value is undefined or null`);
      return { fontWeight: 'bold' };
    }
    
    // More robust numeric conversion - ensure we're comparing proper numbers
    // First convert string values to numbers if needed
    const numOriginal = typeof originalValue === 'string' ? parseFloat(originalValue) : Number(originalValue);
    const numGrouped = typeof groupedValue === 'string' ? parseFloat(groupedValue) : Number(groupedValue);
    
    // Handle NaN case
    if (isNaN(numGrouped) || isNaN(numOriginal)) {
      console.log(`[DEBUG] getGroupedValueStyle - NaN detected: Original: ${numOriginal}, Grouped: ${numGrouped}`);
      return { fontWeight: 'bold' };
    }
    
    console.log(`[DEBUG] getGroupedValueStyle - Original: ${originalValue} (${typeof originalValue}) => ${numOriginal}, Grouped: ${groupedValue} (${typeof groupedValue}) => ${numGrouped}`);
    
    // Use small epsilon for floating point comparison to avoid precision issues
    const epsilon = 0.001;
    
    if (numGrouped - numOriginal > epsilon) {
      console.log(`[DEBUG] Grouped value HIGHER than original: ${numGrouped} > ${numOriginal}`);
      return { color: '#28a745', fontWeight: 'bold' }; // Green for higher
    } else if (numOriginal - numGrouped > epsilon) {
      console.log(`[DEBUG] Grouped value LOWER than original: ${numGrouped} < ${numOriginal}`);
      return { color: '#dc3545', fontWeight: 'bold' }; // Red for lower
    }
    console.log(`[DEBUG] Grouped value SAME as original: ${numGrouped} = ${numOriginal}`);
    return { fontWeight: 'bold' }; // Normal color for same
  };

  if (attributes.length === 0) {
    return (
      <div className="section character-attributes">
        <h3>Attributes</h3>
        <p>No attributes defined.</p>
      </div>
    );
  }

  return (
    <>
      <div className="section character-attributes">
        <h3>Attributes</h3>
        <div className="attributes-grid">
          {attributes.map(attr => {
            const originalValue = attr.data.attribute.attributeValue;
            const groupedValue = effectiveGroupedAttributes?.[attr.key];
            const hasEquipment = character && character.equipment && character.equipment.length > 0;
            const hasConditions = character && character.conditions && character.conditions.length > 0;
            
            // Debug for each attribute
            console.log(`[DEBUG] Attribute ${attr.name} (${attr.key}):`); 
            console.log(`  - Original value: ${originalValue} (${typeof originalValue})`);
            console.log(`  - Grouped value: ${groupedValue} (${typeof groupedValue})`);
            console.log(`  - Has equipment: ${hasEquipment}`);
            console.log(`  - Has conditions: ${hasConditions}`);
            
            // Show grouped value if:
            // 1. There's equipment that could affect it, OR
            // 2. There are conditions that could affect it, OR
            // 3. The grouped value is different from original
            
            // Make sure we handle conditions properly - we want to show the difference even if very small
            // Fixed issue: Always show the grouped value if there are conditions that might affect this attribute
            const hasConditionForThisAttribute = hasConditions && character.conditions.some(c => 
              c.conditionTarget && c.conditionTarget.toLowerCase() === attr.key.toLowerCase()
            );
            
            console.log(`  - Has condition for this attribute (${attr.key}): ${hasConditionForThisAttribute}`);
            
            // Handle potential undefined/null groupedValue
            if (groupedValue === undefined || groupedValue === null) {
              console.log(`  - Grouped value is undefined/null for ${attr.key}`);
              // If we have a condition for this attribute but no grouped value,
              // we need to calculate what it should be
              if (hasConditionForThisAttribute) {
                console.log(`  - Computing expected grouped value from conditions directly`);
                const affectingConditions = character.conditions.filter(c => 
                  c.conditionTarget && c.conditionTarget.toLowerCase() === attr.key.toLowerCase()
                );
                
                if (affectingConditions.length > 0) {
                  console.log(`  - Found ${affectingConditions.length} conditions affecting ${attr.key}`);
                }
              }
            }
            
            // Convert values to numbers for accurate comparison and ensure we're comparing numeric values
            const numOriginal = typeof originalValue === 'string' ? parseFloat(originalValue) : Number(originalValue);
            const numGrouped = typeof groupedValue === 'string' ? parseFloat(groupedValue) : Number(groupedValue);
            
            console.log(`  - numOriginal: ${numOriginal} (${typeof numOriginal})`);
            console.log(`  - numGrouped: ${numGrouped} (${typeof numGrouped})`);
            
            // Check if we have valid numbers before computing difference
            const canComputeDifference = !isNaN(numOriginal) && !isNaN(numGrouped);
            const difference = canComputeDifference ? Math.abs(numGrouped - numOriginal) : 0;
            console.log(`  - Can compute difference: ${canComputeDifference}, Difference: ${difference}`);
            
            const isDifferent = canComputeDifference && difference >= 0.01;
            console.log(`  - Values are different: ${isDifferent} (diff: ${difference})`);
            
            // Improved condition to show grouped value
            // Now includes a fallback for undefined groupedValue but with conditions
            const shouldShowGroupedValue = 
              // Regular case - we have a grouped value and some reason to show it
              ((groupedValue !== undefined && groupedValue !== null) && 
               (hasEquipment || hasConditionForThisAttribute || isDifferent)) ||
              // Special case - no grouped value but we have conditions that should affect this attribute
              (hasConditionForThisAttribute && effectiveGroupedAttributes && 
               effectiveGroupedAttributes[attr.key] !== undefined);
            
            console.log(`  - Should show grouped value: ${shouldShowGroupedValue}`);
            
            return (
              <div key={attr.name} className="attribute-item">
                <div className="attribute-name">{attr.name}</div>
                <div className="attribute-info">
                  <div className="attribute-value">
                    {originalValue} 
                    <span 
                      className="grouping-indicator" 
                      title={attr.data.attribute.isGrouped ? 'This attribute participates in grouping' : 'This attribute does not participate in grouping'}
                      style={{ marginLeft: '6px', fontSize: '0.8em', opacity: 0.7 }}
                    >
                      {attr.data.attribute.isGrouped ? '☑️' : '❌'}
                    </span>
                    {shouldShowGroupedValue && (
                      <span 
                        className="grouped-value" 
                        style={getGroupedValueStyle(originalValue, effectiveGroupedAttributes[attr.key])}
                        title="Final grouped value with equipment and conditions"
                      >
                        {console.log(`[DEBUG] Rendering grouped value for ${attr.name}: ${effectiveGroupedAttributes[attr.key]}`)}
                        {' → '}{
                          // Use either the actual groupedValue or our computed fallback value
                          effectiveGroupedAttributes[attr.key] !== undefined && 
                          !isNaN(Number(effectiveGroupedAttributes[attr.key])) ? 
                            Math.round(Number(effectiveGroupedAttributes[attr.key])) : 
                            originalValue
                        }
                        {(hasEquipment || hasConditions) && (
                          <button
                            className="info-icon"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent event bubbling
                              console.log(`[DEBUG] Info button clicked for ${attr.name} (${attr.key})`);
                              handleShowBreakdown(attr.key, attr.name);
                            }}
                            title="Show detailed breakdown"
                          >
                            ℹ️
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {console.log(`[DEBUG] showBreakdown: ${showBreakdown}, hasBreakdownData: ${Boolean(breakdownData?.getCharacter?.attributeBreakdown)}`)}  
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