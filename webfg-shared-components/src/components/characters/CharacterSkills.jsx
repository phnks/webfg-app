import React, { useState, useMemo } from "react";
import "./CharacterSkills.css";

// Accepts the resolved 'skills' array: [{ skillId, skillValue, skillName, skillCategory }, ...]
const CharacterSkills = ({ skills }) => {
  
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
     return (
      <div className="section character-skills">
        <h3>Skills</h3>
        <p>No skills defined.</p>
      </div>
    );
  }

  return (
    <div className="section character-skills">
      <h3>Skills</h3>
      
      <div className="skill-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`skill-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {/* Format category name (e.g., COMBAT -> Combat) */}
            {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      
      {activeCategory && skillsByCategory[activeCategory] && (
        <div className="skill-content">
          {/* Title could be derived or maybe added to Skill definition */}
          <h4>{activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1).toLowerCase()} Skills</h4> 
          <div className="skill-list">
            {skillsByCategory[activeCategory].map((skill) => (
              <div key={skill.skillId} className="skill-item">
                {/* Display the resolved skillName */}
                <div className="skill-name">
                  {/* Format skill name (e.g., STRIKING -> Striking) */}
                  {skill.skillName.charAt(0).toUpperCase() + skill.skillName.slice(1).toLowerCase().replace('_', ' ')}
                </div>
                {/* Display the character-specific skillValue */}
                <div className="skill-value">{skill.skillValue}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSkills;
