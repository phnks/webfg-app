import React from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_CHARACTER } from "../../graphql/operations";
import QuickAdjustWidget from "../common/QuickAdjustWidget";
import "./CharacterDetails.css";

const CharacterDetails = ({ character, onUpdate }) => {
  const [updateCharacter] = useMutation(UPDATE_CHARACTER);

  const handleWillAdjust = async (newValue) => {
    try {
      // Build the complete character input with all required fields
      const characterInput = {
        name: character.name,
        characterCategory: character.characterCategory,
        will: newValue,
        fatigue: character.fatigue || 0,
        values: character.values || [],
        special: character.special || "",
        actionIds: character.actionIds || [],
        inventoryIds: character.inventoryIds || [],
        equipmentIds: character.equipmentIds || []
      };

      // Add attributes with their current values (no more fatigue per attribute)
      const attributes = [
        'lethality', 'armour', 'endurance', 'strength', 'dexterity',
        'agility', 'perception', 'charisma', 'intelligence', 'resolve', 'morale'
      ];

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

  const handleFatigueAdjust = async (newValue) => {
    try {
      // Build the complete character input with all required fields
      const characterInput = {
        name: character.name,
        characterCategory: character.characterCategory,
        will: character.will || 0,
        fatigue: newValue,
        values: character.values || [],
        special: character.special || "",
        actionIds: character.actionIds || [],
        inventoryIds: character.inventoryIds || [],
        equipmentIds: character.equipmentIds || []
      };

      // Add attributes with their current values (no more fatigue per attribute)
      const attributes = [
        'lethality', 'armour', 'endurance', 'strength', 'dexterity',
        'agility', 'perception', 'charisma', 'intelligence', 'resolve', 'morale'
      ];

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
      console.error('Failed to update fatigue:', error);
      throw error;
    }
  };

  return (
    <div className="section character-details">
      <h3>Character Details</h3>
      <table>
        <tbody>
          <tr>
            <td>ID:</td>
            <td>{character.characterId}</td>
          </tr>
          <tr>
            <td>Name:</td>
            <td>{character.name}</td>
          </tr>
          <tr>
            <td>Category:</td>
            <td>{character.characterCategory}</td>
          </tr>
          <tr>
            <td>Will:</td>
            <td>
              <div className="value-with-widget">
                <span>{character.will}</span>
                <QuickAdjustWidget
                  currentValue={character.will || 0}
                  onAdjust={handleWillAdjust}
                  min={0}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td>Fatigue:</td>
            <td>
              <div className="value-with-widget">
                <span>{character.fatigue || 0}</span>
                <QuickAdjustWidget
                  currentValue={character.fatigue || 0}
                  onAdjust={handleFatigueAdjust}
                  min={0}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CharacterDetails;