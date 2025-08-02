import React from 'react';
import { Link } from 'react-router-dom';
import { useSelectedCharacter } from '../../context/SelectedCharacterContext';
import './SelectedCharacterBanner.css';
const SelectedCharacterBanner = () => {
  const {
    selectedCharacter,
    clearSelectedCharacter
  } = useSelectedCharacter();
  if (!selectedCharacter) {
    return null;
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "selected-character-banner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "banner-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "banner-text"
  }, "Selected Character: ", /*#__PURE__*/React.createElement(Link, {
    to: `/characters/${selectedCharacter.characterId}`
  }, selectedCharacter.name)), /*#__PURE__*/React.createElement("button", {
    className: "clear-selection-btn",
    onClick: clearSelectedCharacter,
    "aria-label": "Clear selected character"
  }, "\xD7")));
};
export default SelectedCharacterBanner;