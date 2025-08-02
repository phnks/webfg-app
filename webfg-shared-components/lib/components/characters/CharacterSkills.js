import React, { useState, useMemo } from "react";
import "./CharacterSkills.css";

// Accepts the resolved 'skills' array: [{ skillId, skillValue, skillName, skillCategory }, ...]
const CharacterSkills = ({
  skills
}) => {
  // Group skills by category dynamically
  const skillsByCategory = useMemo(() => {
    if (!Array.isArray(skills) || skills.length === 0) {
      return {};
    }
    return skills.reduce((acc, skill) => {
      const category = skill.skillCategory || 'UNCATEGORIZED'; // Fallback category
      if (!acc[category]) {
        acc[category] = [];
      }
      // Sort skills alphabetically within category
      acc[category].push(skill);
      acc[category].sort((a, b) => a.skillName.localeCompare(b.skillName));
      return acc;
    }, {});
  }, [skills]);
  const categories = Object.keys(skillsByCategory);
  const [activeCategory, setActiveCategory] = useState(categories[0] || null);

  // Set initial active category when categories are loaded
  React.useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);
  if (categories.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "section character-skills"
    }, /*#__PURE__*/React.createElement("h3", null, "Skills"), /*#__PURE__*/React.createElement("p", null, "No skills defined."));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "section character-skills"
  }, /*#__PURE__*/React.createElement("h3", null, "Skills"), /*#__PURE__*/React.createElement("div", {
    className: "skill-tabs"
  }, categories.map(category => /*#__PURE__*/React.createElement("button", {
    key: category,
    className: `skill-tab ${activeCategory === category ? 'active' : ''}`,
    onClick: () => setActiveCategory(category)
  }, category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()))), activeCategory && skillsByCategory[activeCategory] && /*#__PURE__*/React.createElement("div", {
    className: "skill-content"
  }, /*#__PURE__*/React.createElement("h4", null, activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1).toLowerCase(), " Skills"), /*#__PURE__*/React.createElement("div", {
    className: "skill-list"
  }, skillsByCategory[activeCategory].map(skill => /*#__PURE__*/React.createElement("div", {
    key: skill.skillId,
    className: "skill-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "skill-name"
  }, skill.skillName.charAt(0).toUpperCase() + skill.skillName.slice(1).toLowerCase().replace('_', ' ')), /*#__PURE__*/React.createElement("div", {
    className: "skill-value"
  }, skill.skillValue))))));
};
export default CharacterSkills;