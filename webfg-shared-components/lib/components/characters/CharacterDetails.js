import React from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_CHARACTER } from "../../graphql/operations";
import QuickAdjustWidget from "../common/QuickAdjustWidget";
import "./CharacterDetails.css";
const CharacterDetails = ({
  character,
  onUpdate
}) => {
  const [updateCharacter] = useMutation(UPDATE_CHARACTER);
  const handleWillAdjust = async newValue => {
    try {
      // Build the complete character input with all required fields
      const characterInput = {
        name: character.name,
        description: character.description || "",
        characterCategory: character.characterCategory,
        will: newValue,
        special: character.special || "",
        actionIds: character.actionIds || [],
        stashIds: character.stashIds || [],
        equipmentIds: character.equipmentIds || [],
        readyIds: character.readyIds || []
      };

      // Add attributes with their current values (no more fatigue per attribute)
      const attributes = ['weight', 'size', 'armour', 'endurance', 'lethality', 'speed', 'strength', 'dexterity', 'agility', 'resolve', 'morale', 'intelligence', 'charisma', 'obscurity', 'seeing', 'hearing', 'light', 'noise'];
      attributes.forEach(attr => {
        if (character[attr]) {
          characterInput[attr] = {
            attribute: {
              attributeValue: character[attr].attribute.attributeValue,
              isGrouped: character[attr].attribute.isGrouped
            }
          };
        }
      });
      await updateCharacter({
        variables: {
          characterId: character.characterId,
          input: characterInput
        }
      });

      // Call the onUpdate callback to refresh the parent component
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update will:', error);
      throw error;
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "section character-details"
  }, /*#__PURE__*/React.createElement("h3", null, "Character Details"), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "ID:"), /*#__PURE__*/React.createElement("td", null, character.characterId)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Category:"), /*#__PURE__*/React.createElement("td", null, character.characterCategory)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Race:"), /*#__PURE__*/React.createElement("td", null, character.race || 'HUMAN')), character.description && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Description:"), /*#__PURE__*/React.createElement("td", null, character.description)), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Will:"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "value-with-widget"
  }, /*#__PURE__*/React.createElement("span", null, character.will), /*#__PURE__*/React.createElement(QuickAdjustWidget, {
    currentValue: character.will || 0,
    onAdjust: handleWillAdjust,
    min: 0
  })))))));
};
export default CharacterDetails;