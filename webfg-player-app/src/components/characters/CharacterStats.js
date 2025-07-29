import React from "react";
import "./CharacterStats.css";

const CharacterStats = ({ stats }) => {
  if (!stats) return null;
  
  return (
    <div className="section character-stats">
      <h3>Stats</h3>
      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-name">Hit Points</div>
          <div className="stat-bar">
            <div 
              className="stat-fill" 
              style={{ width: `${(stats.hitPoints.current / stats.hitPoints.max) * 100}%` }}
            />
          </div>
          <div className="stat-value">
            {stats.hitPoints.current} / {stats.hitPoints.max}
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-name">Exhaustion</div>
          <div className="stat-bar">
            <div 
              className="stat-fill exhaustion" 
              style={{ width: `${(stats.exhaustion.current / stats.exhaustion.max) * 100}%` }}
            />
          </div>
          <div className="stat-value">
            {stats.exhaustion.current} / {stats.exhaustion.max}
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-name">Surges</div>
          <div className="stat-bar">
            <div 
              className="stat-fill surges" 
              style={{ width: `${(stats.surges.current / stats.surges.max) * 100}%` }}
            />
          </div>
          <div className="stat-value">
            {stats.surges.current} / {stats.surges.max}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterStats; 