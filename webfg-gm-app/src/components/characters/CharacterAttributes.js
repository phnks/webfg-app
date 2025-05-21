import React from "react";
import { calculateGroupedAttributes } from "../../utils/attributeGrouping";
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
    <div className="section character-attributes">
      <h3>Attributes</h3>
      <div className="attributes-grid">
        {attributes.map(attr => {
          const originalValue = attr.data.attribute.attributeValue;
          const groupedValue = groupedAttributes[attr.key];
          const hasGroupedValue = groupedValue !== undefined && groupedValue !== originalValue;
          
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
  );
};

export default CharacterAttributes;