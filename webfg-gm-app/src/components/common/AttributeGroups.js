import React, { useState } from 'react';
import './AttributeGroups.css';

// Attribute groupings matching backend structure
export const ATTRIBUTE_GROUPS = {
  BODY: ['weight', 'size', 'armour', 'endurance', 'lethality', 'penetration', 'complexity'],
  MARTIAL: ['speed', 'strength', 'dexterity', 'agility'],
  MENTAL: ['resolve', 'morale', 'intelligence', 'charisma'],
  SENSES: ['obscurity', 'seeing', 'hearing', 'light', 'noise']
};

// Convert attribute names to display format
const formatAttributeName = (attributeName) => {
  return attributeName.charAt(0).toUpperCase() + attributeName.slice(1).toLowerCase();
};

const AttributeGroups = ({ 
  attributes, 
  renderAttribute, 
  title = "Attributes",
  defaultExpandedGroups = [],
  onGenerateAttributes = null
}) => {
  const [expandedGroups, setExpandedGroups] = useState(
    new Set(defaultExpandedGroups)
  );

  const toggleGroup = (groupName) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const isGroupExpanded = (groupName) => expandedGroups.has(groupName);

  return (
    <div className="attribute-groups">
      <div className="attributes-header">
        <h3>{title}</h3>
        {onGenerateAttributes && (
          <button 
            type="button" 
            onClick={onGenerateAttributes}
            className="generate-attributes-button"
          >
            Generate Attributes
          </button>
        )}
      </div>
      
      {Object.entries(ATTRIBUTE_GROUPS).map(([groupName, attributeNames]) => (
        <div key={groupName} className="attribute-group">
          <div 
            className={`group-header ${isGroupExpanded(groupName) ? 'expanded' : ''}`}
            onClick={() => toggleGroup(groupName)}
          >
            <span className="group-icon">
              {isGroupExpanded(groupName) ? '▼' : '▶'}
            </span>
            <span className="group-name">{groupName}</span>
            <span className="group-count">({attributeNames.length})</span>
          </div>
          
          {isGroupExpanded(groupName) && (
            <div className="group-content">
              {attributeNames.map(attributeName => {
                const attribute = attributes?.[attributeName];
                return renderAttribute ? 
                  renderAttribute(attributeName, attribute, formatAttributeName(attributeName)) :
                  (
                    <div key={attributeName} className="attribute-item">
                      <label>{formatAttributeName(attributeName)}</label>
                      <span>{attribute?.attributeValue || 0}</span>
                    </div>
                  );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AttributeGroups;