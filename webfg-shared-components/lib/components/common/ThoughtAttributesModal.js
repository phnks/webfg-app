import React, { useState } from 'react';
import './ThoughtAttributesModal.css';
const ThoughtAttributesModal = ({
  mindThought,
  onSave,
  onCancel
}) => {
  const [affinity, setAffinity] = useState(mindThought.affinity);
  const [knowledge, setKnowledge] = useState(mindThought.knowledge);
  const handleSave = () => {
    onSave(mindThought.thoughtId, parseInt(affinity), parseInt(knowledge));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("h3", null, "Edit Thought Attributes"), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "affinity"
  }, "Affinity:"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    id: "affinity",
    value: affinity,
    onChange: e => setAffinity(e.target.value),
    className: "attribute-input"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "knowledge"
  }, "Knowledge:"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    id: "knowledge",
    value: knowledge,
    onChange: e => setKnowledge(e.target.value),
    className: "attribute-input"
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
export default ThoughtAttributesModal;