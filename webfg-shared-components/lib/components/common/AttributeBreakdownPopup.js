import React, { useEffect } from 'react';
import './AttributeBreakdownPopup.css';
const AttributeBreakdownPopup = ({
  breakdown,
  attributeName,
  onClose,
  isLoading
}) => {
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
    return /*#__PURE__*/React.createElement("div", {
      className: "breakdown-overlay",
      onClick: onClose
    }, /*#__PURE__*/React.createElement("div", {
      className: "breakdown-popup",
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      className: "breakdown-header"
    }, /*#__PURE__*/React.createElement("h3", null, attributeName, " Breakdown"), /*#__PURE__*/React.createElement("button", {
      className: "breakdown-close",
      onClick: onClose
    }, "\xD7")), /*#__PURE__*/React.createElement("div", {
      className: "breakdown-content loading"
    }, /*#__PURE__*/React.createElement("p", null, "Loading attribute breakdown data..."))));
  }
  if (!breakdown || breakdown.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "breakdown-overlay",
      onClick: onClose
    }, /*#__PURE__*/React.createElement("div", {
      className: "breakdown-popup",
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      className: "breakdown-header"
    }, /*#__PURE__*/React.createElement("h3", null, attributeName, " Breakdown"), /*#__PURE__*/React.createElement("button", {
      className: "breakdown-close",
      onClick: onClose
    }, "\xD7")), /*#__PURE__*/React.createElement("div", {
      className: "breakdown-content error"
    }, /*#__PURE__*/React.createElement("p", null, "No breakdown data available for this attribute."), /*#__PURE__*/React.createElement("p", null, "This may happen if there are no equipment or conditions affecting this attribute."))));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "breakdown-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "breakdown-popup",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "breakdown-header"
  }, /*#__PURE__*/React.createElement("h3", null, attributeName, " Grouping Breakdown"), /*#__PURE__*/React.createElement("button", {
    className: "breakdown-close",
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "breakdown-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "breakdown-steps"
  }, breakdown.map((step, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: `breakdown-step ${step.entityType === 'condition' ? 'condition-step' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-info"
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number"
  }, step.step), /*#__PURE__*/React.createElement("span", {
    className: "entity-name"
  }, step.entityName, /*#__PURE__*/React.createElement("span", {
    className: "entity-type"
  }, "(", step.entityType, ")")), /*#__PURE__*/React.createElement("span", {
    className: "attribute-details"
  }, step.entityType === 'condition' ? (() => {
    console.log(`[DEBUG] Rendering condition step: ${JSON.stringify(step)}`);
    return `${step.formula?.includes('HINDER') ? 'Hinders' : 'Helps'} by ${step.attributeValue}`;
  })() : `${step.attributeValue} ${step.isGrouped ? '☑️' : '❌'}`)), step.formula && /*#__PURE__*/React.createElement("div", {
    className: "step-formula"
  }, /*#__PURE__*/React.createElement("strong", null, "Formula:"), " ", step.formula), /*#__PURE__*/React.createElement("div", {
    className: "step-result"
  }, /*#__PURE__*/React.createElement("strong", null, "Result:"), " ", Math.round(step.runningTotal * 100) / 100), index < breakdown.length - 1 && /*#__PURE__*/React.createElement("div", {
    className: "step-arrow"
  }, "\u2193")))), /*#__PURE__*/React.createElement("div", {
    className: "breakdown-summary"
  }, /*#__PURE__*/React.createElement("strong", null, "Final Grouped Value: ", Math.round(breakdown[breakdown.length - 1]?.runningTotal || 0))))));
};
export default AttributeBreakdownPopup;