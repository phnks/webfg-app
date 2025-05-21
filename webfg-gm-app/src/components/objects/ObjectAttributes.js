import React from "react";
import { calculateObjectGroupedAttributes } from "../../utils/attributeGrouping";
import "./ObjectAttributes.css";

const ObjectAttributes = ({ object }) => {
  if (!object) return null;
  
  const attributes = [
    { name: "Lethality", key: "lethality", data: object.lethality },
    { name: "Armour", key: "armour", data: object.armour },
    { name: "Endurance", key: "endurance", data: object.endurance },
    { name: "Strength", key: "strength", data: object.strength },
    { name: "Dexterity", key: "dexterity", data: object.dexterity },
    { name: "Agility", key: "agility", data: object.agility },
    { name: "Perception", key: "perception", data: object.perception },
    { name: "Charisma", key: "charisma", data: object.charisma },
    { name: "Intelligence", key: "intelligence", data: object.intelligence },
    { name: "Resolve", key: "resolve", data: object.resolve },
    { name: "Morale", key: "morale", data: object.morale }
  ].filter(attr => attr.data); // Only show attributes that have data

  // Calculate grouped attributes if object and equipment data is available
  const groupedAttributes = calculateObjectGroupedAttributes(object);

  if (attributes.length === 0) {
    return null; // Don't render anything if no attributes
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
    <div className="object-attributes">
      <h4>Attributes</h4>
      <div className="attributes-list">
        {attributes.map(attr => {
          const originalValue = attr.data.attributeValue;
          const groupedValue = groupedAttributes[attr.key];
          const hasGroupedValue = groupedValue !== undefined && groupedValue !== originalValue;
          
          return (
            <div key={attr.name} className="detail-row">
              <span>{attr.name}:</span>
              <span>
                {originalValue} ({attr.data.attributeType})
                {hasGroupedValue && (
                  <span 
                    className="grouped-value" 
                    style={getGroupedValueStyle(originalValue, groupedValue)}
                    title="Grouped value with equipment"
                  >
                    {' → '}{groupedValue}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ObjectAttributes;