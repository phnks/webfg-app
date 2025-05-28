import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CHARACTER_ATTRIBUTE_BREAKDOWN } from "../../graphql/computedOperations";
import { UPDATE_CHARACTER } from "../../graphql/operations";
import AttributeBreakdownPopup from "../common/AttributeBreakdownPopup";
import QuickAdjustWidget from "../common/QuickAdjustWidget";
import "./CharacterAttributes.css";

// Version that uses backend computed fields
const CharacterAttributesBackend = ({ 
  lethality, armour, endurance, strength, dexterity, agility,
  perception, charisma, intelligence, resolve, morale,
  character, // Added character prop for breakdown queries
  groupedAttributes, // New prop from backend
  onUpdate // Callback to refresh data after updates
}) => {
  const [updateCharacter] = useMutation(UPDATE_CHARACTER);
  
  const attributes = [
    { name: "Lethality", key: "lethality", data: lethality },
    { name: "Armour", key: "armour", data: armour },
    { name: "Endurance", key: "endurance", data: endurance },
    { name: "Strength", key: "strength", data: strength },
    { name: "Dexterity", key: "dexterity", data: dexterity },
    { name: "Agility", key: "agility", data: agility },
    { name: "Perception", key: "perception", data: perception },
    { name: "Charisma", key: "charisma", data: charisma },
    { name: "Intelligence", key: "intelligence", data: intelligence },
    { name: "Resolve", key: "resolve", data: resolve },
    { name: "Morale", key: "morale", data: morale }
  ].filter(attr => attr.data); // Only show attributes that have data

  // State for breakdown popup
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [breakdownAttributeName, setBreakdownAttributeName] = useState('');
  
  // Query for breakdown data when needed
  const { data: breakdownData, loading: breakdownLoading } = useQuery(
    GET_CHARACTER_ATTRIBUTE_BREAKDOWN,
    {
      variables: {
        characterId: character?.characterId,
        attributeName: selectedAttribute
      },
      skip: !selectedAttribute || !character?.characterId
    }
  );
  
  // Handler for showing breakdown
  const handleShowBreakdown = (attributeKey, attributeName) => {
    if (character) {
      setSelectedAttribute(attributeKey);
      setBreakdownAttributeName(attributeName);
      setShowBreakdown(true);
    }
  };
  
  // Handler for adjusting fatigue
  const handleFatigueAdjust = async (attributeKey, newFatigue) => {
    try {
      // Build the complete character input with all required fields
      const characterInput = {
        name: character.name,
        characterCategory: character.characterCategory,
        will: character.will || 0,
        values: character.values || [],
        special: character.special || "",
        actionIds: character.actionIds || [],
        inventoryIds: character.inventoryIds || [],
        equipmentIds: character.equipmentIds || []
      };

      // Add attributes with their current values and fatigue
      const attributesList = [
        'lethality', 'armour', 'endurance', 'strength', 'dexterity',
        'agility', 'perception', 'charisma', 'intelligence', 'resolve', 'morale'
      ];

      attributesList.forEach(attr => {
        if (character[attr]) {
          characterInput[attr] = {
            attribute: {
              attributeValue: character[attr].attribute.attributeValue,
              attributeType: character[attr].attribute.attributeType
            },
            fatigue: attr === attributeKey ? newFatigue : (character[attr].fatigue || 0)
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
      console.error(`Failed to update ${attributeKey} fatigue:`, error);
      throw error;
    }
  };

  if (attributes.length === 0) {
    return (
      <div className="section character-attributes">
        <h3>Attributes</h3>
        <p>No attributes defined.</p>
      </div>
    );
  }

  // Helper function to get color style for grouped value
  const getGroupedValueStyle = (originalValue, groupedValue) => {
    if (groupedValue > originalValue) {
      return { color: '#28a745', fontWeight: 'bold' }; // Green for higher
    } else if (groupedValue < originalValue) {
      return { color: '#dc3545', fontWeight: 'bold' }; // Red for lower
    }
    return { fontWeight: 'bold' }; // Normal color for same
  };

  return (
    <>
      <div className="section character-attributes">
        <h3>Attributes</h3>
        <div className="attributes-grid">
          {attributes.map(attr => {
            const originalValue = attr.data.attribute.attributeValue;
            const groupedValue = groupedAttributes?.[attr.key];
            const fatigue = attr.data.fatigue || 0;
            const hasEquipment = character && character.equipment && character.equipment.length > 0;
            
            // Show grouped value if:
            // 1. There's equipment that could affect it
            // 2. There's fatigue > 0
            // 3. The grouped value is different from original (even after considering fatigue)
            const shouldShowGroupedValue = (groupedValue !== undefined && groupedValue !== null) && 
              (hasEquipment || fatigue > 0 || groupedValue !== originalValue);
            
            return (
              <div key={attr.name} className="attribute-item">
                <div className="attribute-name">{attr.name}</div>
                <div className="attribute-info">
                  <div className="attribute-value">
                    {originalValue} ({attr.data.attribute.attributeType})
                    {shouldShowGroupedValue && (
                      <span 
                        className="grouped-value" 
                        style={getGroupedValueStyle(originalValue, groupedValue)}
                        title="Grouped value with equipment and/or fatigue"
                      >
                        {' → '}{groupedValue}
                        {(hasEquipment || fatigue > 0) && (
                          <button
                            className="info-icon"
                            onClick={() => handleShowBreakdown(attr.key, attr.name)}
                            title="Show detailed breakdown"
                          >
                            ℹ️
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                  <div className={`attribute-fatigue ${fatigue > 0 ? 'has-fatigue' : ''}`}>
                    <span>{fatigue > 0 ? `⚠️ Fatigue: ${fatigue}` : `Fatigue: ${fatigue}`}</span>
                    <QuickAdjustWidget
                      currentValue={fatigue}
                      onAdjust={(newValue) => handleFatigueAdjust(attr.key, newValue)}
                      min={0}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {showBreakdown && breakdownData?.getCharacter?.attributeBreakdown && (
        <AttributeBreakdownPopup
          breakdown={breakdownData.getCharacter.attributeBreakdown}
          attributeName={breakdownAttributeName}
          isLoading={breakdownLoading}
          onClose={() => {
            setShowBreakdown(false);
            setSelectedAttribute(null);
          }}
        />
      )}
    </>
  );
};

export default CharacterAttributesBackend;