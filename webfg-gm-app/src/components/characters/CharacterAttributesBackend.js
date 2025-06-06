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
    if (groupedValue > originalValue) {
      return { color: '#28a745', fontWeight: 'bold' }; // Green for higher
    } else if (groupedValue < originalValue) {
      return { color: '#dc3545', fontWeight: 'bold' }; // Red for lower
    }
    return { fontWeight: 'bold' }; // Normal color for same
  };

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
            
            // Show grouped value if:
            // 1. There's equipment that could affect it, OR
            // 2. There are conditions that could affect it, OR
            // 3. The grouped value is different from original
            const shouldShowGroupedValue = (groupedValue !== undefined && groupedValue !== null) && 
              (hasEquipment || hasConditions || groupedValue !== originalValue);
            
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
                        style={getGroupedValueStyle(originalValue, Math.round(groupedValue))}
                        title="Final grouped value with equipment and conditions"
                      >
                        {' → '}{Math.round(groupedValue)}
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