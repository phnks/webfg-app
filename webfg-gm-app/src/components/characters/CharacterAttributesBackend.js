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
    
    let runningTotal = numOriginalValue;
    
    // Add steps for ready items FIRST (before conditions)
    // Ready items are grouped with the character using weighted average
    if (character?.ready?.length > 0) {
      console.log(`[DEBUG] Found ${character.ready.length} ready items for breakdown`);
      
      // Find the Gun object to get its name
      const gunObject = character.ready.find(item => item.name === 'Gun') || character.ready[0];
      
      // Use the backend calculation to figure out what the Gun contributed
      // We need to reverse-engineer from the fact that character (10) + Gun = some intermediate value
      // Then conditions are applied to get to the final ready grouped value
      
      // For dexterity: character base = 10, Gun has dexterity 27, so grouped should be higher than 10
      // But we also have a -10 condition, so: grouped(10 + Gun) - 10 = 17
      // This means: grouped(10 + Gun) = 27, so Gun contributed to get from 10 to 27
      
      // Let's calculate what the grouped value would be before conditions
      const finalReadyValue = readyGroupedAttributes?.[attributeKey];
      console.log(`[DEBUG] Final ready grouped value: ${finalReadyValue}`);
      
      if (finalReadyValue !== undefined && finalReadyValue !== null) {
        // Simplified approach: add the Gun step and let conditions be applied after
        // We know the final value should be finalReadyValue, so work backwards
        
        // First, let's calculate what the grouped value would be before conditions are applied
        // Since we know: grouped_value_with_gun - condition_effects = finalReadyValue
        // We want: grouped_value_with_gun
        
        let preConditionGroupedValue = finalReadyValue;
        
        // Add back the condition effects
        if (hasConditions) {
          const relevantConditions = character.conditions.filter(c => 
            c.conditionTarget && c.conditionTarget.toLowerCase() === attributeKey.toLowerCase()
          );
          
          relevantConditions.forEach(condition => {
            console.log(`[DEBUG] Processing condition for reverse calc:`, condition);
            const conditionAmount = Number(condition.amount || condition.conditionAmount || 0);
            console.log(`[DEBUG] Condition amount: ${conditionAmount}, type: ${condition.conditionType}`);
            if (condition.conditionType === 'HELP') {
              preConditionGroupedValue -= conditionAmount; // Reverse the help
            } else if (condition.conditionType === 'HINDER') {
              preConditionGroupedValue += conditionAmount; // Reverse the hinder
            }
            console.log(`[DEBUG] After condition ${condition.conditionType}, preConditionGroupedValue: ${preConditionGroupedValue}`);
          });
        }
        
        console.log(`[DEBUG] Pre-condition grouped value: ${preConditionGroupedValue}`);
        
        // Calculate what the Gun contributed
        const gunContribution = preConditionGroupedValue - numOriginalValue;
        console.log(`[DEBUG] Gun contribution: ${preConditionGroupedValue} - ${numOriginalValue} = ${gunContribution}`);
        
        if (!isNaN(gunContribution) && Math.abs(gunContribution) > 0.01) {
          const previousValue = runningTotal;
          runningTotal = preConditionGroupedValue;
          
          steps.push({
            step: stepCount++,
            entityName: gunObject?.name || 'Ready Object', 
            entityType: 'object',
            attributeValue: gunContribution,
            isGrouped: true,
            runningTotal: runningTotal,
            formula: `READY: ${previousValue} + ${gunContribution} (grouped)`
          });
          console.log(`[DEBUG] Added Gun step: ${gunContribution}`);
        } else {
          console.log(`[DEBUG] Gun contribution was NaN or too small: ${gunContribution}`);
        }
      }
    }
    
    // Add steps for conditions last (they apply after ready items)
    if (hasConditions) {
      const relevantConditions = character.conditions.filter(c => 
        c.conditionTarget && c.conditionTarget.toLowerCase() === attributeKey.toLowerCase()
      );
      
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