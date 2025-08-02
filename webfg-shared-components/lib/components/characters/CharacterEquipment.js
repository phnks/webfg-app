import React from "react";
import "./CharacterEquipment.css";
const CharacterEquipment = ({
  equipped
}) => {
  if (!equipped || !Array.isArray(equipped)) return null;

  // Define all possible equipment slots
  const equipmentSlots = [{
    key: "HEAD",
    label: "Head"
  }, {
    key: "TORSO",
    label: "Torso"
  }, {
    key: "ARMS",
    label: "Arms"
  }, {
    key: "LEGS",
    label: "Legs"
  }, {
    key: "LEFT_HAND",
    label: "Left Hand"
  }, {
    key: "RIGHT_HAND",
    label: "Right Hand"
  }];

  // Create a map of slot to item for easy lookup
  const equippedBySlot = {};
  equipped.forEach(item => {
    if (item && item.slot) {
      equippedBySlot[item.slot] = item;
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "section character-equipment"
  }, /*#__PURE__*/React.createElement("h3", null, "Equipment"), /*#__PURE__*/React.createElement("div", {
    className: "equipment-slots"
  }, equipmentSlots.map(slot => /*#__PURE__*/React.createElement("div", {
    key: slot.key,
    className: "equipment-slot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slot-label"
  }, slot.label), /*#__PURE__*/React.createElement("div", {
    className: "slot-item"
  }, equippedBySlot[slot.key] ? equippedBySlot[slot.key].name : "Empty")))));
};
export default CharacterEquipment;