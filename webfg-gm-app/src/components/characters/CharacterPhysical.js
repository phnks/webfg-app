import React from "react";
import "./CharacterPhysical.css";

const CharacterPhysical = ({ physical }) => {
  if (!physical) return null;
  
  return (
    <div className="section character-physical">
      <h3>Physical Attributes</h3>
      <div className="physical-stats">
        <div className="physical-stat">
          <div className="stat-label">Height</div>
          <div className="stat-value">{physical.height} cm</div>
        </div>
        
        <div className="physical-stat">
          <div className="stat-label">Weight</div>
          <div className="stat-value">{physical.weight} kg</div>
        </div>
        
        <div className="physical-stat">
          <div className="stat-label">Body Fat</div>
          <div className="stat-value">{physical.bodyFatPercentage}%</div>
        </div>
        
        <div className="physical-stat">
          <div className="stat-label">Adjacency</div>
          <div className="stat-value">{physical.adjacency}</div>
        </div>
      </div>
      
      <h4>Size</h4>
      <div className="size-stats">
        <div className="size-stat">
          <div className="stat-label">Width</div>
          <div className="stat-value">{physical.size.width}</div>
        </div>
        
        <div className="size-stat">
          <div className="stat-label">Length</div>
          <div className="stat-value">{physical.size.length}</div>
        </div>
        
        <div className="size-stat">
          <div className="stat-label">Height</div>
          <div className="stat-value">{physical.size.height}</div>
        </div>
      </div>
      
      <div className="size-visualization">
        <div 
          className="size-box" 
          style={{
            width: `${physical.size.width * 20}px`,
            height: `${physical.size.height * 20}px`
          }}
        />
      </div>
    </div>
  );
};

export default CharacterPhysical; 