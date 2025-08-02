import React, { useState } from 'react';
import './AttributeGroups.css';

// Attribute groupings matching backend structure
export const ATTRIBUTE_GROUPS = {
  BODY: ['weight', 'size', 'armour', 'endurance', 'lethality', 'complexity'],
  MARTIAL: ['speed', 'strength', 'dexterity', 'agility'],
  MENTAL: ['resolve', 'morale', 'intelligence', 'charisma'],
  SENSES: ['obscurity', 'seeing', 'hearing', 'light', 'noise']
};

// Convert attribute names to display format
const formatAttributeName = attributeName => {
  return attributeName.charAt(0).toUpperCase() + attributeName.slice(1).toLowerCase();
};
const AttributeGroups = ({
  attributes,
  renderAttribute,
  title = "Attributes",
  defaultExpandedGroups = [],
  onGenerateAttributes = null
}) => {
  const [expandedGroups, setExpandedGroups] = useState(new Set(defaultExpandedGroups));
  const toggleGroup = groupName => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };
  const isGroupExpanded = groupName => expandedGroups.has(groupName);
  return /*#__PURE__*/React.createElement("div", {
    className: "attribute-groups"
  }, /*#__PURE__*/React.createElement("div", {
    className: "attributes-header"
  }, /*#__PURE__*/React.createElement("h3", null, title), onGenerateAttributes && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onGenerateAttributes,
    className: "generate-attributes-button"
  }, "Generate Attributes")), Object.entries(ATTRIBUTE_GROUPS).map(([groupName, attributeNames]) => /*#__PURE__*/React.createElement("div", {
    key: groupName,
    className: "attribute-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: `group-header ${isGroupExpanded(groupName) ? 'expanded' : ''}`,
    onClick: () => toggleGroup(groupName)
  }, /*#__PURE__*/React.createElement("span", {
    className: "group-icon"
  }, isGroupExpanded(groupName) ? '▼' : '▶'), /*#__PURE__*/React.createElement("span", {
    className: "group-name"
  }, groupName), /*#__PURE__*/React.createElement("span", {
    className: "group-count"
  }, "(", attributeNames.length, ")")), isGroupExpanded(groupName) && /*#__PURE__*/React.createElement("div", {
    className: "group-content"
  }, attributeNames.map(attributeName => {
    const attribute = attributes?.[attributeName];
    return renderAttribute ? renderAttribute(attributeName, attribute, formatAttributeName(attributeName)) : /*#__PURE__*/React.createElement("div", {
      key: attributeName,
      className: "attribute-item"
    }, /*#__PURE__*/React.createElement("label", null, formatAttributeName(attributeName)), /*#__PURE__*/React.createElement("span", null, attribute?.attributeValue || 0));
  })))));
};
export default AttributeGroups;