import React, { useState } from 'react';
import './QuickAdjustPopup.css';
const QuickAdjustPopup = ({
  currentValue,
  onAdjust,
  onClose,
  min = 1,
  max = 100,
  title = "Adjust Value"
}) => {
  const [value, setValue] = useState(currentValue);
  const handleChange = e => {
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
  const handleSubmit = e => {
    e.preventDefault();
    onAdjust(value);
    onClose();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "quick-adjust-popup-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "quick-adjust-popup"
  }, /*#__PURE__*/React.createElement("h3", null, title), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "adjust-controls"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "adjust-btn decrement",
    onClick: handleDecrement,
    disabled: value <= min
  }, "-"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    onChange: handleChange,
    min: min,
    max: max
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "adjust-btn increment",
    onClick: handleIncrement,
    disabled: value >= max
  }, "+")), /*#__PURE__*/React.createElement("div", {
    className: "popup-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "cancel-btn",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "apply-btn"
  }, "Apply")))));
};
export default QuickAdjustPopup;