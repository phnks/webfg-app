import React from "react";
import "./CharacterAttributes.css";

const CharacterAttributes = ({ attributes }) => {
  if (!attributes) return null;
  
  const attributeList = [
    { name: "Strength", key: "strength" },
    { name: "Agility", key: "agility" },
    { name: "Dexterity", key: "dexterity" },
    { name: "Endurance", key: "endurance" },
    { name: "Intelligence", key: "intelligence" },
    { name: "Charisma", key: "charisma" },
    { name: "Perception", key: "perception" },
    { name: "Resolve", key: "resolve" }
  ];
  
  return (
    <div className="section character-attributes">
      <h3>Attributes</h3>
      <div className="attributes-grid">
        {attributeList.map(attr => (
          <div key={attr.key} className="attribute-item">
            <div className="attribute-name">{attr.name}</div>
            <div className="attribute-values">
              <div className="attribute-value">
                <span>Base:</span> {attributes[attr.key].base}
              </div>
              <div className="attribute-value">
                <span>Current:</span> {attributes[attr.key].current}
              </div>
              <div className="attribute-value">
                <span>Max:</span> {attributes[attr.key].max}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterAttributes; 