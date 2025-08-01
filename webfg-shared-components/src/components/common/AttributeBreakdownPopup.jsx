import React, { useEffect } from 'react';
import './AttributeBreakdownPopup.css';

const AttributeBreakdownPopup = ({ breakdown, attributeName, onClose, isLoading }) => {
  // Debug log the breakdown steps using useEffect hook
  // Note: This must be defined before any early returns to avoid React Hook rules violation
  useEffect(() => {
    console.log(`[DEBUG] AttributeBreakdownPopup rendered - attributeName: ${attributeName}, isLoading: ${isLoading}`);
    console.log(`[DEBUG] Breakdown data:`, breakdown);
    
    if (breakdown && breakdown.length > 0) {
      console.log(`[DEBUG] AttributeBreakdownPopup for ${attributeName}:`, breakdown);
      
      // Check for condition steps specifically
      const conditionSteps = breakdown.filter(step => step.entityType === 'condition');
      console.log(`[DEBUG] Found ${conditionSteps.length} condition steps in breakdown:`, conditionSteps);
    } else {
      console.log(`[DEBUG] Breakdown is empty or undefined`); 
    }
  }, [breakdown, attributeName, isLoading]);
  
  if (isLoading) {
    return (
      <div className="breakdown-overlay" onClick={onClose}>
        <div className="breakdown-popup" onClick={(e) => e.stopPropagation()}>
          <div className="breakdown-header">
            <h3>{attributeName} Breakdown</h3>
            <button className="breakdown-close" onClick={onClose}>×</button>
          </div>
          <div className="breakdown-content loading">
            <p>Loading attribute breakdown data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="breakdown-overlay" onClick={onClose}>
        <div className="breakdown-popup" onClick={(e) => e.stopPropagation()}>
          <div className="breakdown-header">
            <h3>{attributeName} Breakdown</h3>
            <button className="breakdown-close" onClick={onClose}>×</button>
          </div>
          <div className="breakdown-content error">
            <p>No breakdown data available for this attribute.</p>
            <p>This may happen if there are no equipment or conditions affecting this attribute.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="breakdown-overlay" onClick={onClose}>
      <div className="breakdown-popup" onClick={(e) => e.stopPropagation()}>
        <div className="breakdown-header">
          <h3>{attributeName} Grouping Breakdown</h3>
          <button className="breakdown-close" onClick={onClose}>×</button>
        </div>
        
        <div className="breakdown-content">
          <div className="breakdown-steps">
            {breakdown.map((step, index) => (
              <div key={index} className={`breakdown-step ${step.entityType === 'condition' ? 'condition-step' : ''}`}>
                <div className="step-info">
                  <span className="step-number">{step.step}</span>
                  <span className="entity-name">
                    {step.entityName} 
                    <span className="entity-type">({step.entityType})</span>
                  </span>
                  <span className="attribute-details">
                    {step.entityType === 'condition' ?
                      (() => {
                        console.log(`[DEBUG] Rendering condition step: ${JSON.stringify(step)}`);
                        return `${step.formula?.includes('HINDER') ? 'Hinders' : 'Helps'} by ${step.attributeValue}`;
                      })() :
                      `${step.attributeValue} ${step.isGrouped ? '☑️' : '❌'}`
                    }
                  </span>
                </div>
                
                {step.formula && (
                  <div className="step-formula">
                    <strong>Formula:</strong> {step.formula}
                  </div>
                )}
                
                <div className="step-result">
                  <strong>Result:</strong> {Math.round(step.runningTotal * 100) / 100}
                </div>
                
                {index < breakdown.length - 1 && (
                  <div className="step-arrow">↓</div>
                )}
              </div>
            ))}
          </div>
          
          <div className="breakdown-summary">
            <strong>Final Grouped Value: {Math.round(breakdown[breakdown.length - 1]?.runningTotal || 0)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributeBreakdownPopup;