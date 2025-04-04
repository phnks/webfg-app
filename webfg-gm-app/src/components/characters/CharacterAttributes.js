import React from "react";
import "./CharacterAttributes.css";

// Accepts the resolved 'attributes' array: [{ attributeId, attributeValue, attributeName }, ...]
const CharacterAttributes = ({ attributes }) => {
  // Check if attributes is an array and has items
  if (!Array.isArray(attributes) || attributes.length === 0) {
    return (
      <div className="section character-attributes">
        <h3>Attributes</h3>
        <p>No attributes defined.</p>
      </div>
    );
  }
  
  // Sort attributes alphabetically by name for consistent display
  const sortedAttributes = [...attributes].sort((a, b) => 
    a.attributeName.localeCompare(b.attributeName)
  );

  return (
    <div className="section character-attributes">
      <h3>Attributes</h3>
      <div className="attributes-grid">
        {sortedAttributes.map(attr => (
          <div key={attr.attributeId} className="attribute-item">
            {/* Display the resolved attributeName */}
            <div className="attribute-name">{attr.attributeName}</div>
            {/* Display the character-specific attributeValue */}
            <div className="attribute-value">{attr.attributeValue}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterAttributes;
