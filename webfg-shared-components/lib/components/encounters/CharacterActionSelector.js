import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CHARACTER_WITH_GROUPED } from '../../graphql/computedOperations';
import { FaSearch } from 'react-icons/fa';
import './CharacterActionSelector.css';
const CharacterActionSelector = ({
  characterId,
  onSelectAction,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    loading,
    error,
    data
  } = useQuery(GET_CHARACTER_WITH_GROUPED, {
    variables: {
      characterId
    },
    fetchPolicy: 'network-only'
  });
  if (loading) return /*#__PURE__*/React.createElement("p", null, "Loading character actions...");
  if (error) return /*#__PURE__*/React.createElement("p", null, "Error loading character: ", error.message);
  const character = data?.getCharacter;
  if (!character) return /*#__PURE__*/React.createElement("p", null, "Character not found");
  const filteredActions = character.actions?.filter(action => action?.name?.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  return /*#__PURE__*/React.createElement("div", {
    className: "character-action-selector"
  }, /*#__PURE__*/React.createElement("div", {
    className: "action-selector-header"
  }, /*#__PURE__*/React.createElement("h3", null, "Select Action for ", character.name), /*#__PURE__*/React.createElement("button", {
    className: "close-btn",
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "search-container"
  }, /*#__PURE__*/React.createElement(FaSearch, {
    className: "search-icon"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "action-search",
    placeholder: "Search actions...",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "actions-list"
  }, filteredActions.length > 0 ? filteredActions.map(action => /*#__PURE__*/React.createElement("div", {
    key: action.actionId,
    className: "action-item",
    onClick: () => onSelectAction(action)
  }, /*#__PURE__*/React.createElement("div", {
    className: "action-item-header"
  }, /*#__PURE__*/React.createElement("h4", null, action.name), /*#__PURE__*/React.createElement("span", {
    className: `action-type ${action.type?.toLowerCase()}`
  }, action.type)), /*#__PURE__*/React.createElement("p", {
    className: "action-description"
  }, action.description || 'No description'), /*#__PURE__*/React.createElement("div", {
    className: "action-timing"
  }, /*#__PURE__*/React.createElement("span", null, "Initiative: ", action.timing?.initiative || 'N/A'), /*#__PURE__*/React.createElement("span", null, "Duration: ", action.timing?.duration || 'N/A')))) : /*#__PURE__*/React.createElement("p", {
    className: "no-actions"
  }, "No actions found")));
};
export default CharacterActionSelector;