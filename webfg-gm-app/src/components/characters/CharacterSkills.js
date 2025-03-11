import React, { useState } from "react";
import "./CharacterSkills.css";

const CharacterSkills = ({ skills }) => {
  const [activeCategory, setActiveCategory] = useState("combat");
  
  if (!skills) return null;
  
  const categories = {
    combat: { title: "Combat Skills", skills: skills.combat },
    weapons: { title: "Weapon Skills", skills: skills.weapons },
    physical: { title: "Physical Skills", skills: skills.physical },
    technical: { title: "Technical Skills", skills: skills.technical },
    intrapersonal: { title: "Intrapersonal Skills", skills: skills.intrapersonal }
  };
  
  return (
    <div className="section character-skills">
      <h3>Skills</h3>
      
      <div className="skill-tabs">
        {Object.keys(categories).map(category => (
          <button
            key={category}
            className={`skill-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="skill-content">
        <h4>{categories[activeCategory].title}</h4>
        <div className="skill-list">
          {Object.entries(categories[activeCategory].skills).map(([key, value]) => (
            <div key={key} className="skill-item">
              <div className="skill-name">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </div>
              <div className="skill-value">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CharacterSkills; 