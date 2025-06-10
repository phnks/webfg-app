import React, { useState } from 'react';
import './QuickAdjustPopup.css';

const QuickAdjustPopup = ({ currentValue, onAdjust, onClose, min = 1, max = 100, title = "Adjust Value" }) => {
  const [value, setValue] = useState(currentValue);

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (newValue >= min && newValue <= max) {
      setValue(newValue);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      setValue(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      setValue(value - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdjust(value);
    onClose();
  };

  return (
    <div className="quick-adjust-popup-overlay">
      <div className="quick-adjust-popup">
        <h3>{title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="adjust-controls">
            <button 
              type="button" 
              className="adjust-btn decrement" 
              onClick={handleDecrement}
              disabled={value <= min}
            >
              -
            </button>
            <input
              type="number"
              value={value}
              onChange={handleChange}
              min={min}
              max={max}
            />
            <button 
              type="button" 
              className="adjust-btn increment" 
              onClick={handleIncrement}
              disabled={value >= max}
            >
              +
            </button>
          </div>
          <div className="popup-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="apply-btn">
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAdjustPopup;