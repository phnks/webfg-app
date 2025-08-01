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

        {/* Removed Weight display as it's not in schema's Physical type */}

        <div className="physical-stat">
          <div className="stat-label">Body Fat</div>
          <div className="stat-value">{physical.bodyFatPercentage}%</div>
        </div>

        {/* Added flattened size fields */}
         <div className="physical-stat">
          <div className="stat-label">Width</div>
          <div className="stat-value">{physical.width}</div>
        </div>

         <div className="physical-stat">
          <div className="stat-label">Length</div>
          <div className="stat-value">{physical.length}</div>
        </div>

         <div className="physical-stat">
          <div className="stat-label">Depth/Height (Physical)</div> {/* Renamed to avoid confusion with character height */}
          <div className="stat-value">{physical.height}</div> {/* This is the physical height, not character height */}
        </div>


        <div className="physical-stat">
          <div className="stat-label">Adjacency</div>
          <div className="stat-value">{physical.adjacency}</div>
        </div>
      </div>

      {/* Removed Size sub-section and visualization */}

    </div>
  );
};

export default CharacterPhysical;
