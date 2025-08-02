import React, { useState } from 'react';
import './InventoryQuantityModal.css';
const InventoryQuantityModal = ({
  item,
  onSave,
  onCancel,
  title = "Edit Quantity"
}) => {
  const [quantity, setQuantity] = useState(item.quantity || 1);
  const handleSave = () => {
    onSave(item.objectId, parseInt(quantity));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("h3", null, title), /*#__PURE__*/React.createElement("div", {
    className: "item-info"
  }, /*#__PURE__*/React.createElement("strong", null, item.name), item.objectCategory && /*#__PURE__*/React.createElement("span", {
    className: "item-category"
  }, " (", item.objectCategory, ")")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "quantity"
  }, "Quantity:"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    id: "quantity",
    value: quantity,
    onChange: e => setQuantity(e.target.value),
    className: "quantity-input",
    min: "1"
  })), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleSave,
    className: "save-btn"
  }, "Save"), /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    className: "cancel-btn"
  }, "Cancel"))));
};
export default InventoryQuantityModal;