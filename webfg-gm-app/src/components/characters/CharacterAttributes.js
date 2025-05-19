import React from "react";
import "./CharacterAttributes.css";

// New schema: each attribute has { attribute: { attributeValue, attributeType }, fatigue }
const CharacterAttributes = ({ 
  lethality, armour, endurance, strength, dexterity, agility,
  perception, charisma, intelligence, resolve, morale 
}) => {
  const attributes = [
    { name: "Lethality", data: lethality },
    { name: "Armour", data: armour },
    { name: "Endurance", data: endurance },
    { name: "Strength", data: strength },
    { name: "Dexterity", data: dexterity },
    { name: "Agility", data: agility },
    { name: "Perception", data: perception },
    { name: "Charisma", data: charisma },
    { name: "Intelligence", data: intelligence },
    { name: "Resolve", data: resolve },
    { name: "Morale", data: morale }
  ].filter(attr => attr.data); // Only show attributes that have data

  if (attributes.length === 0) {
    return (
      <div className="section character-attributes">
        <h3>Attributes</h3>
        <p>No attributes defined.</p>
      </div>
    );
  }

  return (
    <div className="section character-attributes">
      <h3>Attributes</h3>
      <div className="attributes-grid">
        {attributes.map(attr => (
          <div key={attr.name} className="attribute-item">
            <div className="attribute-name">{attr.name}</div>
            <div className="attribute-info">
              <div className="attribute-value">
                {attr.data.attribute.attributeValue} ({attr.data.attribute.attributeType})
              </div>
              <div className="attribute-fatigue">
                Fatigue: {attr.data.fatigue}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterAttributes;