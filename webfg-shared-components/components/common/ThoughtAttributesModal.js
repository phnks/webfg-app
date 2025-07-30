import React, { useState } from 'react';
import './ThoughtAttributesModal.css';

const ThoughtAttributesModal = ({ mindThought, onSave, onCancel }) => {
  const [affinity, setAffinity] = useState(mindThought.affinity);
  const [knowledge, setKnowledge] = useState(mindThought.knowledge);

  const handleSave = () => {
    onSave(mindThought.thoughtId, parseInt(affinity), parseInt(knowledge));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Thought Attributes</h3>
        <div className="form-group">
          <label htmlFor="affinity">Affinity:</label>
          <input
            type="number"
            id="affinity"
            value={affinity}
            onChange={(e) => setAffinity(e.target.value)}
            className="attribute-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="knowledge">Knowledge:</label>
          <input
            type="number"
            id="knowledge"
            value={knowledge}
            onChange={(e) => setKnowledge(e.target.value)}
            className="attribute-input"
          />
        </div>
        <div className="modal-actions">
          <button onClick={handleSave} className="save-btn">
            Save
          </button>
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThoughtAttributesModal;