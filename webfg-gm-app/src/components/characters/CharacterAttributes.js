import React, { useState } from "react";
import { calculateGroupedAttributes } from "../../utils/attributeGrouping";
import { calculateAttributeBreakdown } from "../../utils/attributeBreakdown";
import AttributeBreakdownPopup from "../common/AttributeBreakdownPopup";
import "./CharacterAttributes.css";

// New schema: each attribute has { attribute: { attributeValue, attributeType }, fatigue }
const CharacterAttributes = ({ 
  lethality, armour, endurance, strength, dexterity, agility,
  perception, charisma, intelligence, resolve, morale,
  character // Added character prop to calculate grouped values
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

  // Calculate grouped attributes if character and equipment data is available
  const groupedAttributes = character ? calculateGroupedAttributes(character) : {};
  
  // State for breakdown popup
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownData, setBreakdownData] = useState([]);
  const [breakdownAttributeName, setBreakdownAttributeName] = useState('');
  
  // Handler for showing breakdown
  const handleShowBreakdown = (attributeKey, attributeName) => {
    if (character && character.equipment && character.equipment.length > 0) {
      const breakdown = calculateAttributeBreakdown(character, attributeKey, groupedAttributes);
      setBreakdownData(breakdown);
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
            const groupedValue = groupedAttributes[attr.key];
            const hasGroupedValue = groupedValue !== undefined && groupedValue !== originalValue;
            const hasEquipment = character && character.equipment && character.equipment.length > 0;
            
            return (
              <div key={attr.name} className="attribute-item">
                <div className="attribute-name">{attr.name}</div>
                <div className="attribute-info">
                  <div className="attribute-value">
                    {originalValue} ({attr.data.attribute.attributeType})
                    {hasGroupedValue && (
                      <span 
                        className="grouped-value" 
                        style={getGroupedValueStyle(originalValue, groupedValue)}
                        title="Grouped value with equipment"
                      >
                        {' → '}{groupedValue}
                        {hasEquipment && (
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
                  <div className="attribute-fatigue">
                    Fatigue: {attr.data.fatigue}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {showBreakdown && (
        <AttributeBreakdownPopup
          breakdown={breakdownData}
          attributeName={breakdownAttributeName}
          onClose={() => setShowBreakdown(false)}
        />
      )}
    </>
  );
};

export default CharacterAttributes;