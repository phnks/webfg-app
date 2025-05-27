import React, { useState } from 'react';
import './QuickAdjustWidget.css';

const QuickAdjustWidget = ({ currentValue, onAdjust, min = 0, max = null }) => {
  const [adjustAmount, setAdjustAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdjust = async (direction) => {
    if (isLoading) return;
    
    const amount = parseInt(adjustAmount) || 1;
    const delta = direction === 'increment' ? amount : -amount;
    const newValue = currentValue + delta;
    
    // Check bounds
    if (min !== null && newValue < min) return;
    if (max !== null && newValue > max) return;
    
    setIsLoading(true);
    try {
      await onAdjust(newValue);
    } catch (error) {
      console.error('Failed to adjust value:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]+$/.test(value)) {
      setAdjustAmount(value === '' ? '' : parseInt(value));
    }
  };

  return (
    <div className={`quick-adjust-widget ${isLoading ? 'loading' : ''}`}>
      <button 
        className="adjust-button decrement"
        onClick={() => handleAdjust('decrement')}
        disabled={isLoading || currentValue <= min}
        title={`Decrease by ${adjustAmount || 1}`}
      >
        −
      </button>
      <input
        type="text"
        className="adjust-amount"
        value={adjustAmount}
        onChange={handleInputChange}
        disabled={isLoading}
        placeholder="1"
      />
      <button 
        className="adjust-button increment"
        onClick={() => handleAdjust('increment')}
        disabled={isLoading || (max !== null && currentValue >= max)}
        title={`Increase by ${adjustAmount || 1}`}
      >
        +
      </button>
    </div>
  );
};

export default QuickAdjustWidget;