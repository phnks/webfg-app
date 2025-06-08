import React, { useState } from "react";
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
  const { data: breakdownData, loading: breakdownLoading } = useQuery(
    GET_CHARACTER_ATTRIBUTE_BREAKDOWN,
    {
      variables: {
        characterId: character?.characterId,
        attributeName: selectedAttribute
      },
      skip: !selectedAttribute || !character?.characterId
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
  

  if (attributes.length === 0) {
    return (
      <div className="section character-attributes">
        <h3>Attributes</h3>
        <p>No attributes defined.</p>
      </div>
    );
  }

  // Helper function to get color style for grouped value
  const getGroupedValueStyle = (originalValue, groupedValue) => {
    // More robust numeric conversion - ensure we're comparing proper numbers
    // First convert string values to numbers if needed
    const numOriginal = typeof originalValue === 'string' ? parseFloat(originalValue) : Number(originalValue);
    const numGrouped = typeof groupedValue === 'string' ? parseFloat(groupedValue) : Number(groupedValue);
    
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

  // Debug outputs using console.log directly instead of useEffect
  if (character?.conditions?.length > 0) {
    console.log('[DEBUG] Character has conditions:', character.conditions);
  }
  
  if (groupedAttributes) {
    console.log('[DEBUG] Grouped attributes:', groupedAttributes);
  }
  
  return (
    <>
      <div className="section character-attributes">
        <h3>Attributes</h3>
        <div className="attributes-grid">
          {attributes.map(attr => {
            const originalValue = attr.data.attribute.attributeValue;
            const groupedValue = groupedAttributes?.[attr.key];
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
            // Convert values to numbers for accurate comparison and ensure we're comparing numeric values
            const numOriginal = typeof originalValue === 'string' ? parseFloat(originalValue) : Number(originalValue);
            const numGrouped = typeof groupedValue === 'string' ? parseFloat(groupedValue) : Number(groupedValue);
            
            console.log(`  - numOriginal: ${numOriginal} (${typeof numOriginal})`);
            console.log(`  - numGrouped: ${numGrouped} (${typeof numGrouped})`);
            console.log(`  - Difference: ${Math.abs(numGrouped - numOriginal)}`);
            
            // Make sure we handle conditions properly - we want to show the difference even if very small
            // Fixed issue: Always show the grouped value if there are conditions that might affect this attribute
            const hasConditionForThisAttribute = hasConditions && character.conditions.some(c => 
              c.conditionTarget && c.conditionTarget.toLowerCase() === attr.key.toLowerCase()
            );
            
            console.log(`  - Has condition for this attribute (${attr.key}): ${hasConditionForThisAttribute}`);
            
            const isDifferent = Math.abs(numGrouped - numOriginal) >= 0.01;
            console.log(`  - Values are different: ${isDifferent} (diff: ${Math.abs(numGrouped - numOriginal)})`);
            
            const shouldShowGroupedValue = (groupedValue !== undefined && groupedValue !== null) && 
              (hasEquipment || hasConditionForThisAttribute || isDifferent);
            
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
                        style={getGroupedValueStyle(originalValue, Math.round(numGrouped))}
                        title="Final grouped value with equipment and conditions"
                      >
                        {console.log(`[DEBUG] Rendering grouped value for ${attr.name}: ${Math.round(numGrouped)}`)}
                        {' → '}{typeof numGrouped === 'number' && !isNaN(numGrouped) ? Math.round(numGrouped) : numGrouped}
                        {(hasEquipment || hasConditions) && (
                          <button
                            className="info-icon"
                            onClick={() => handleShowBreakdown(attr.key, attr.name)}
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
      
      {showBreakdown && breakdownData?.getCharacter?.attributeBreakdown && (
        <AttributeBreakdownPopup
          breakdown={breakdownData.getCharacter.attributeBreakdown}
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