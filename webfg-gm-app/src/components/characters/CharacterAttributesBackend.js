import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_CHARACTER_ATTRIBUTE_BREAKDOWN } from "../../graphql/computedOperations";
import AttributeBreakdownPopup from "../common/AttributeBreakdownPopup";
import AttributeGroups, { ATTRIBUTE_GROUPS } from "../common/AttributeGroups";
import "./CharacterAttributes.css";

// Dynamic attributes and their dice types
const DYNAMIC_ATTRIBUTES = {
  speed: { diceType: 'd4', defaultCount: 1 },
  agility: { diceType: 'd6', defaultCount: 1 },
  dexterity: { diceType: 'd8', defaultCount: 1 },
  strength: { diceType: 'd10', defaultCount: 1 },
  charisma: { diceType: 'd12', defaultCount: 1 },
  seeing: { diceType: 'd20', defaultCount: 1 },
  hearing: { diceType: 'd20', defaultCount: 1 },
  intelligence: { diceType: 'd100', defaultCount: 1 }
};

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
    const rawValue = character?.[attributeKey]?.attribute?.attributeValue;
    const parsedValue = parseFloat(rawValue);
    const originalValue = !isNaN(parsedValue) ? parsedValue : 0;
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
    const rawValue = character?.[attributeKey]?.attribute?.attributeValue;
    const parsedValue = parseFloat(rawValue);
    const originalValue = !isNaN(parsedValue) ? parsedValue : 0;
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
    // Only include equipment items that are marked as equipment (isEquipment: true)
    // Skip weapons/tools that require active use (isEquipment: false)
    // Use quantity from inventoryItems to handle multiple instances
    if (character?.equipment?.length > 0) {
      const inventoryItems = character.inventoryItems || [];
      const equipmentQuantityMap = new Map();
      
      // Build quantity map for equipment items
      inventoryItems
        .filter(invItem => invItem.inventoryLocation === 'EQUIPMENT')
        .forEach(invItem => {
          equipmentQuantityMap.set(invItem.objectId, invItem.quantity);
        });
      
      character.equipment.forEach(item => {
        const itemAttr = item[attributeKey];
        // Default to true if isEquipment is undefined/null for backwards compatibility
        const isEquipment = item.isEquipment !== undefined ? item.isEquipment : true;
        if (itemAttr && itemAttr.attributeValue !== undefined && isEquipment !== false) {
          const itemValue = Number(itemAttr.attributeValue);
          const itemIsGrouped = itemAttr.isGrouped !== false;
          if (itemIsGrouped && itemValue > 0) {
            const quantity = equipmentQuantityMap.get(item.objectId) || 1;
            // Add the item multiple times based on quantity
            for (let i = 0; i < quantity; i++) {
              allValues.push({ value: itemValue, name: item.name || 'Equipment', type: 'equipment' });
            }
          }
        }
      });
    }
    
    // Ready objects
    // Use quantity from inventoryItems to handle multiple instances
    if (character?.ready?.length > 0) {
      const inventoryItems = character.inventoryItems || [];
      const readyQuantityMap = new Map();
      
      // Build quantity map for ready items
      inventoryItems
        .filter(invItem => invItem.inventoryLocation === 'READY')
        .forEach(invItem => {
          readyQuantityMap.set(invItem.objectId, invItem.quantity);
        });
      
      character.ready.forEach(item => {
        const itemAttr = item[attributeKey];
        if (itemAttr && itemAttr.attributeValue !== undefined) {
          const itemValue = Number(itemAttr.attributeValue);
          const itemIsGrouped = itemAttr.isGrouped !== false;
          if (itemIsGrouped && itemValue > 0) {
            const quantity = readyQuantityMap.get(item.objectId) || 1;
            // Add the item multiple times based on quantity
            for (let i = 0; i < quantity; i++) {
              allValues.push({ value: itemValue, name: item.name || 'Ready Object', type: 'ready' });
            }
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
        // Subsequent entities: calculate weighted average formula using constant 0.25 scaling factor
        // Calculate new running total using weighted average formula: (A1 + A2*(0.25+A2/A1) + A3*(0.25+A3/A1) + ...) / N
        const A1 = allValues[0].value; // Highest value
        let sum = A1; // Start with A1
        
        for (let i = 1; i <= index; i++) {
          const Ai = allValues[i].value;
          const scalingFactor = 0.25; // Constant scaling factor
          if (A1 > 0) {
            sum += Ai * (scalingFactor + Ai / A1);
          } else {
            sum += Ai * scalingFactor;
          }
        }
        runningTotal = sum / (index + 1);
        
        // Create formula string showing the correct weighted average calculation
        if (index === 1) {
          // Second item: show A1 + A2*(0.25+A2/A1) / 2
          const A2 = entity.value;
          const formulaString = `Weighted Average: (${A1} + ${A2}*(0.25+${A2}/${A1})) / 2`;
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
            const scalingFactor = 0.25; // Constant scaling factor
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

  // Create a fallback readyGroupedAttributes object if it's undefined or missing attributes
  // This will calculate the ready grouped values including equipment + ready objects
  const effectiveReadyGroupedAttributes = useMemo(() => {
    if (readyGroupedAttributes) {
      // Check if any attributes are missing from backend ready grouped attributes OR have incorrect 0 values
      const problematicAttributes = Object.values(ATTRIBUTE_GROUPS).flat().filter(attrName => {
        if (character?.[attrName]?.attribute?.attributeValue === undefined) return false;
        
        const backendValue = readyGroupedAttributes[attrName];
        const charBaseValue = Number(character[attrName].attribute.attributeValue);
        
        // Check if backend value is missing, 0, or suspiciously low when it should be higher
        const isMissing = backendValue === undefined;
        const isZeroWhenShouldBeHigher = backendValue === 0 && charBaseValue > 0;
        const isSuspiciouslyLow = backendValue !== undefined && backendValue < charBaseValue && 
                                 (character?.ready?.length > 0 || character?.equipment?.length > 0);
        
        return isMissing || isZeroWhenShouldBeHigher || isSuspiciouslyLow;
      });
      
      // If no problematic attributes, use backend data
      if (problematicAttributes.length === 0) {
        return readyGroupedAttributes;
      }
      
      // Mixed approach: use backend values when available and reasonable, fallback for problematic ones
      const mixedAttributes = {};
      
      // Start with backend values if they exist
      if (readyGroupedAttributes) {
        Object.keys(readyGroupedAttributes).forEach(attrName => {
          if (!problematicAttributes.includes(attrName)) {
            mixedAttributes[attrName] = readyGroupedAttributes[attrName];
          }
        });
      }
      
      // Calculate fallback values ONLY for problematic attributes
      problematicAttributes.forEach(attrName => {
        if (character?.[attrName]?.attribute?.attributeValue !== undefined) {
          const originalValue = Number(character[attrName].attribute.attributeValue);
          const charIsGrouped = character[attrName].attribute.isGrouped !== false;
          
          // Collect all values that should be grouped
          const valuesToGroup = [];
          
          // Add character base value if it's groupable
          if (charIsGrouped) {
            valuesToGroup.push(originalValue);
          }
          
          // Add equipment values if they're groupable
          // Only include equipment items that are marked as equipment (isEquipment: true)
          // Skip weapons/tools that require active use (isEquipment: false)
          if (character?.equipment?.length > 0) {
            character.equipment.forEach(item => {
              const itemAttr = item[attrName];
              // Default to true if isEquipment is undefined/null for backwards compatibility
              const isEquipment = item.isEquipment !== undefined ? item.isEquipment : true;
              if (itemAttr && itemAttr.attributeValue !== undefined && itemAttr.isGrouped !== false && isEquipment !== false) {
                const itemValue = Number(itemAttr.attributeValue);
                if (itemValue > 0) {
                  valuesToGroup.push(itemValue);
                }
              }
            });
          }
          
          // Add ready objects values if they're groupable
          if (character?.ready?.length > 0) {
            character.ready.forEach(item => {
              const itemAttr = item[attrName];
              if (itemAttr && itemAttr.attributeValue !== undefined && itemAttr.isGrouped !== false) {
                const itemValue = Number(itemAttr.attributeValue);
                if (itemValue > 0) {
                  valuesToGroup.push(itemValue);
                }
              }
            });
          }
          
          // Calculate grouped value using the same formula as backend
          if (valuesToGroup.length === 0) {
            // If no groupable values, use character base value
            mixedAttributes[attrName] = originalValue;
          } else if (valuesToGroup.length === 1) {
            mixedAttributes[attrName] = valuesToGroup[0];
          } else {
            // Sort values in descending order (highest first)
            valuesToGroup.sort((a, b) => b - a);
            
            const A1 = valuesToGroup[0]; // Highest value
            let sum = A1; // Start with the highest value
            
            // Add weighted values for all other attributes using 0.25 constant
            for (let i = 1; i < valuesToGroup.length; i++) {
              const Ai = valuesToGroup[i];
              const scalingFactor = 0.25; // Constant scaling factor
              
              if (A1 > 0) {
                sum += Ai * (scalingFactor + Ai / A1);
              } else {
                // Handle edge case where A1 is 0
                sum += Ai * scalingFactor;
              }
            }
            
            const finalValue = Math.round((sum / valuesToGroup.length) * 100) / 100;
            mixedAttributes[attrName] = finalValue;
          }
        }
      });
      
      // Apply condition effects to mixed attributes
      if (character?.conditions?.length > 0) {
        character.conditions.forEach(condition => {
          if (!condition.conditionTarget || !condition.conditionType || condition.conditionAmount === undefined) {
            return; // Skip invalid conditions
          }
          
          const targetAttr = condition.conditionTarget.toLowerCase();
          if (mixedAttributes[targetAttr] !== undefined) {
            if (condition.conditionType === 'HELP') {
              mixedAttributes[targetAttr] += Number(condition.conditionAmount);
            } else if (condition.conditionType === 'HINDER') {
              mixedAttributes[targetAttr] -= Number(condition.conditionAmount);
            }
          }
        });
      }
      
      return mixedAttributes;
    }
    
    // If the backend didn't provide readyGroupedAttributes at all, calculate all attributes
    const fallbackAttributes = {};
    
    // Initialize with base attribute values from character and calculate grouped values
    Object.values(ATTRIBUTE_GROUPS).flat().forEach(attrName => {
      if (character?.[attrName]?.attribute?.attributeValue !== undefined) {
        const originalValue = Number(character[attrName].attribute.attributeValue);
        const charIsGrouped = character[attrName].attribute.isGrouped !== false;
        
        // Collect all values that should be grouped
        const valuesToGroup = [];
        
        // Add character base value if it's groupable
        if (charIsGrouped) {
          valuesToGroup.push(originalValue);
        }
        
        // Add equipment values if they're groupable
        // Only include equipment items that are marked as equipment (isEquipment: true)
        // Skip weapons/tools that require active use (isEquipment: false)
        // Use quantity from inventoryItems to handle multiple instances
        if (character?.equipment?.length > 0) {
          const inventoryItems = character.inventoryItems || [];
          const equipmentQuantityMap = new Map();
          
          // Build quantity map for equipment items
          inventoryItems
            .filter(invItem => invItem.inventoryLocation === 'EQUIPMENT')
            .forEach(invItem => {
              equipmentQuantityMap.set(invItem.objectId, invItem.quantity);
            });
          
          character.equipment.forEach(item => {
            const itemAttr = item[attrName];
            // Default to true if isEquipment is undefined/null for backwards compatibility
            const isEquipment = item.isEquipment !== undefined ? item.isEquipment : true;
            if (itemAttr && itemAttr.attributeValue !== undefined && itemAttr.isGrouped !== false && isEquipment !== false) {
              const itemValue = Number(itemAttr.attributeValue);
              if (itemValue > 0) {
                const quantity = equipmentQuantityMap.get(item.objectId) || 1;
                // Add the item value multiple times based on quantity
                for (let i = 0; i < quantity; i++) {
                  valuesToGroup.push(itemValue);
                }
              }
            }
          });
        }
        
        // Add ready objects values if they're groupable
        // Use quantity from inventoryItems to handle multiple instances
        if (character?.ready?.length > 0) {
          const inventoryItems = character.inventoryItems || [];
          const readyQuantityMap = new Map();
          
          // Build quantity map for ready items
          inventoryItems
            .filter(invItem => invItem.inventoryLocation === 'READY')
            .forEach(invItem => {
              readyQuantityMap.set(invItem.objectId, invItem.quantity);
            });
          
          character.ready.forEach(item => {
            const itemAttr = item[attrName];
            if (itemAttr && itemAttr.attributeValue !== undefined && itemAttr.isGrouped !== false) {
              const itemValue = Number(itemAttr.attributeValue);
              if (itemValue > 0) {
                const quantity = readyQuantityMap.get(item.objectId) || 1;
                // Add the item value multiple times based on quantity
                for (let i = 0; i < quantity; i++) {
                  valuesToGroup.push(itemValue);
                }
              }
            }
          });
        }
        
        // Calculate grouped value using the same formula as backend
        if (valuesToGroup.length === 0) {
          // If no groupable values, use character base value
          fallbackAttributes[attrName] = originalValue;
        } else if (valuesToGroup.length === 1) {
          fallbackAttributes[attrName] = valuesToGroup[0];
        } else {
          // Sort values in descending order (highest first)
          valuesToGroup.sort((a, b) => b - a);
          
          const A1 = valuesToGroup[0]; // Highest value
          let sum = A1; // Start with the highest value
          
          // Add weighted values for all other attributes using 0.25 constant
          for (let i = 1; i < valuesToGroup.length; i++) {
            const Ai = valuesToGroup[i];
            const scalingFactor = 0.25; // Constant scaling factor
            
            if (A1 > 0) {
              sum += Ai * (scalingFactor + Ai / A1);
            } else {
              // Handle edge case where A1 is 0
              sum += Ai * scalingFactor;
            }
          }
          
          const finalValue = Math.round((sum / valuesToGroup.length) * 100) / 100;
          fallbackAttributes[attrName] = finalValue;
        }
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
  }, [character, readyGroupedAttributes]);

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
    const rawValue = character?.[attributeName]?.attribute?.attributeValue;
    const parsedValue = parseFloat(rawValue);
    const originalValue = !isNaN(parsedValue) ? parsedValue : 0;
    const dynamicInfo = DYNAMIC_ATTRIBUTES[attributeName];
    // Use database diceCount if available, otherwise default to 1 for dynamic attributes
    const diceCount = character?.[attributeName]?.attribute?.diceCount ?? (dynamicInfo ? dynamicInfo.defaultCount : 0);
    const equipmentGroupedValue = effectiveGroupedAttributes?.[attributeName];
    const readyGroupedValue = effectiveReadyGroupedAttributes?.[attributeName];
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
      (hasConditionForThisAttribute && effectiveReadyGroupedAttributes && 
       effectiveReadyGroupedAttributes[attributeName] !== undefined) ||
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
    
    // Calculate dynamic range for attributes with dice
    let displayText = originalValue.toString();
    let formulaText = null;
    
    if (dynamicInfo && diceCount > 0) {
      // Calculate min and max values for a single die roll
      const diceNumber = parseInt(dynamicInfo.diceType.substring(1));
      const minValue = 1 + originalValue;
      const maxValue = diceNumber + originalValue;
      displayText = `${minValue}-${maxValue}`;
      formulaText = `${diceCount}${dynamicInfo.diceType}${originalValue >= 0 ? '+' : ''}${originalValue}`;
    }
    
    return (
      <div key={attributeName} className="attribute-item">
        <label>{displayName}</label>
        <span>
          {displayText}
          {formulaText && (
            <span className="attribute-formula" style={{ marginLeft: '6px', fontSize: '0.85em', color: '#666' }}>
              ({formulaText})
            </span>
          )}
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
                (() => {
                  const groupedVal = displayGroupedValue !== undefined && 
                    !isNaN(Number(displayGroupedValue)) ? 
                    Math.round(Number(displayGroupedValue)) : 
                    originalValue;
                  
                  if (dynamicInfo && diceCount > 0) {
                    const diceNumber = parseInt(dynamicInfo.diceType.substring(1));
                    const minValue = 1 + groupedVal;
                    const maxValue = diceNumber + groupedVal;
                    const newFormula = `${diceCount}${dynamicInfo.diceType}${groupedVal >= 0 ? '+' : ''}${groupedVal}`;
                    return `${minValue}-${maxValue} (${newFormula})`;
                  }
                  return groupedVal;
                })()
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