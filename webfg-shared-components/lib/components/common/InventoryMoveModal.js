import React, { useState } from 'react';
import './InventoryQuantityModal.css'; // Reuse the same styles

const InventoryMoveModal = ({
  item,
  action,
  maxQuantity,
  destinationQuantity,
  onConfirm,
  onCancel
}) => {
  const [quantity, setQuantity] = useState(maxQuantity);
  const handleConfirm = () => {
    onConfirm(parseInt(quantity));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("h3", null, action, " Item"), /*#__PURE__*/React.createElement("div", {
    className: "item-info"
  }, /*#__PURE__*/React.createElement("strong", null, item.name), item.objectCategory && /*#__PURE__*/React.createElement("span", {
    className: "item-category"
  }, " (", item.objectCategory, ")")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "quantity"
  }, "How many to ", action.toLowerCase(), "?"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    id: "quantity",
    value: quantity,
    onChange: e => setQuantity(e.target.value),
    className: "quantity-input",
    min: "1",
    max: maxQuantity
  }), /*#__PURE__*/React.createElement("small", {
    style: {
      color: '#666',
      display: 'block',
      marginTop: '5px'
    }
  }, "Available: ", maxQuantity), destinationQuantity > 0 && /*#__PURE__*/React.createElement("small", {
    style: {
      color: '#007bff',
      display: 'block',
      marginTop: '5px'
    }
  }, "Will be combined with ", destinationQuantity, " already at destination \u2192 Total: ", destinationQuantity + parseInt(quantity || 0))), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleConfirm,
    className: "save-btn"
  }, action), /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    className: "cancel-btn"
  }, "Cancel"))));
};
export default InventoryMoveModal;