import React from 'react';
import './AttributeBreakdownPopup.css';

const AttributeBreakdownPopup = ({ breakdown, attributeName, onClose }) => {
  if (!breakdown || breakdown.length === 0) return null;

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
              <div key={index} className={`breakdown-step ${step.entityType === 'fatigue' ? 'fatigue-step' : ''} ${step.entityType === 'condition' ? 'condition-step' : ''}`}>
                <div className="step-info">
                  <span className="step-number">{step.step}</span>
                  <span className="entity-name">
                    {step.entityName} 
                    <span className="entity-type">({step.entityType})</span>
                  </span>
                  <span className="attribute-details">
                    {step.entityType === 'fatigue' ? 
                      `Reduces by ${Math.abs(step.attributeValue)}` : 
                      step.entityType === 'condition' ?
                      `${step.formula?.includes('HINDER') ? 'Hinders' : 'Helps'} by ${step.attributeValue}` :
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