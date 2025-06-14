import React, { useState, useEffect } from "react";
import ErrorPopup from '../common/ErrorPopup';
import MobileNumberInput from '../common/MobileNumberInput';
import AttributeGroups, { ATTRIBUTE_GROUPS } from '../common/AttributeGroups';
import { useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import {
  CREATE_CHARACTER,
  UPDATE_CHARACTER,
  LIST_CHARACTERS
} from "../../graphql/operations";
import "./Form.css";
import "./CharacterForm.css";

// Helper function to strip __typename fields recursively
const stripTypename = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => stripTypename(item));
  }
  const newObj = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (key !== '__typename') {
      newObj[key] = stripTypename(value);
    }
  });
  return newObj;
};

// Available value names and types based on the new schema
const VALUE_NAMES = [
  'IDEALISM', 'PRAGMATISM', 'DISCIPLINE', 'DEFIANCE', 'CURIOSITY',
  'DETACHMENT', 'CONTROL', 'COMPASSION', 'AMBITION', 'DOUBT',
  'LOYALTY', 'INDEPENDENCE', 'FAITH', 'CYNICISM', 'GLORY',
  'SURVIVAL', 'UNITY', 'VIOLENCE', 'RESTRAINT', 'OBSESSION'
];

const CHARACTER_CATEGORIES = [
  'HUMAN', 'TREPIDITE', 'MONSTER', 'CARVED', 'ANTHRO',
  'ICER', 'DAXMC', 'QRTIS', 'TYVIR'
];

// Removed ATTRIBUTE_TYPES as we now use a simple boolean isGrouped field

const CharacterForm = ({ character, isEditing = false, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();

  // State for form data matching the new schema
  const [error, setError] = useState(null);
  const [showAddValueModal, setShowAddValueModal] = useState(false);
  const [selectedValueName, setSelectedValueName] = useState("");
  const [selectedValueType, setSelectedValueType] = useState("GOOD");
  
  // Get all attribute names from the new grouping
  const getAllAttributeNames = () => {
    return Object.values(ATTRIBUTE_GROUPS).flat();
  };

  // Create initial form data with all attributes
  const createInitialFormData = () => {
    const initialData = {
      name: "",
      characterCategory: "HUMAN",
      will: 10,
      fatigue: 0,
      values: [],
      special: [],
      actionIds: [],
      stashIds: [],
      equipmentIds: [],
      readyIds: []
    };
    
    // Add all attributes with default values
    getAllAttributeNames().forEach(attr => {
      initialData[attr] = { attribute: { attributeValue: 0, isGrouped: true } };
    });
    
    return initialData;
  };

  const [formData, setFormData] = useState(createInitialFormData());

  // Effect to populate form data when character prop changes (for editing)
  useEffect(() => {
    if (isEditing && character) {
      const updatedFormData = {
        name: character.name || "",
        characterCategory: character.characterCategory || "HUMAN",
        will: character.will !== null && character.will !== undefined ? character.will : 10,
        fatigue: character.fatigue || 0,
        values: (character.values || []).map(v => ({ ...v })),
        special: character.special || [],
        actionIds: character.actionIds || [],
        stashIds: character.stashIds || [],
        equipmentIds: character.equipmentIds || [],
        readyIds: character.readyIds || []
      };
      
      // Add all attributes from character or default values
      getAllAttributeNames().forEach(attr => {
        updatedFormData[attr] = character[attr] || { attribute: { attributeValue: 0, isGrouped: true } };
      });
      
      setFormData(updatedFormData);
    }
  }, [isEditing, character]);

  // Clear stored values when selected character changes
  useEffect(() => {
    setSelectedValueName("");
    setSelectedValueType("GOOD");
    setShowAddValueModal(false);
  }, [selectedCharacter]);

  const [createCharacter] = useMutation(CREATE_CHARACTER, {
    refetchQueries: [{ query: LIST_CHARACTERS }],
    onCompleted: (data) => {
      if (onSuccess) {
        onSuccess(data.createCharacter.characterId);
      } else {
        navigate(`/characters/${data.createCharacter.characterId}`);
      }
    }
  });

  const [updateCharacter] = useMutation(UPDATE_CHARACTER, {
    refetchQueries: [
      {
        query: LIST_CHARACTERS
      }
    ],
    onCompleted: (data) => {
      if (onSuccess) {
        onSuccess(data.updateCharacter.characterId);
      }
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'will' || field === 'fatigue' ? parseInt(value) || 0 : value
    }));
  };

  const handleAttributeChange = (attributeName, field, value) => {
    // Since we no longer have fatigue per attribute, this is simpler
    setFormData(prev => ({
      ...prev,
      [attributeName]: {
        ...prev[attributeName],
        attribute: {
          ...prev[attributeName].attribute,
          [field]: field === 'attributeValue' ? parseFloat(value) || 0 : value
        }
      }
    }));
  };

  const handleNestedAttributeChange = (attributeName, nestedField, value) => {
    setFormData(prev => ({
      ...prev,
      [attributeName]: {
        ...prev[attributeName],
        attribute: {
          ...prev[attributeName].attribute,
          [nestedField]: nestedField === 'attributeValue' ? parseFloat(value) || 0 : value
        }
      }
    }));
  };

  const handleAddValue = () => {
    if (selectedValueName && !formData.values.find(v => v.valueName === selectedValueName)) {
      setFormData(prev => ({
        ...prev,
        values: [...prev.values, { valueName: selectedValueName, valueType: selectedValueType }]
      }));
      setSelectedValueName("");
      setSelectedValueType("GOOD");
      setShowAddValueModal(false);
    }
  };

  const handleRemoveValue = (valueName) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter(v => v.valueName !== valueName)
    }));
  };

  const [newSpecialAbility, setNewSpecialAbility] = useState('');

  const handleSpecialAdd = () => {
    if (newSpecialAbility.trim()) {
      setFormData(prev => ({
        ...prev,
        special: [...prev.special, newSpecialAbility.trim()]
      }));
      setNewSpecialAbility('');
    }
  };

  const handleSpecialRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      special: prev.special.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      
      // Prepare the input data for mutation
      const input = {
        name: formData.name,
        characterCategory: formData.characterCategory,
        will: formData.will !== null && formData.will !== undefined && formData.will !== '' ? parseInt(formData.will) : 10,
        fatigue: formData.fatigue !== null && formData.fatigue !== undefined && formData.fatigue !== '' ? parseInt(formData.fatigue) : 0,
        values: formData.values.map(v => ({ valueName: v.valueName, valueType: v.valueType })),
        special: formData.special,
        actionIds: formData.actionIds,
        stashIds: formData.stashIds,
        equipmentIds: formData.equipmentIds,
        readyIds: formData.readyIds
      };
      
      
      // Add all attributes dynamically
      getAllAttributeNames().forEach(attr => {
        input[attr] = {
          attribute: { 
            attributeValue: parseFloat(formData[attr]?.attribute?.attributeValue) || 0,
            isGrouped: formData[attr]?.attribute?.isGrouped !== false
          }
        };
      });

      const finalInput = stripTypename(input);

      if (isEditing) {
        await updateCharacter({
          variables: {
            characterId: character.characterId,
            input: finalInput
          }
        });
      } else {
        await createCharacter({
          variables: {
            input: finalInput
          }
        });
      }
    } catch (err) {
      console.error("Error saving character:", err);
      let errorMessage = "An unexpected error occurred while saving character.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\\n");
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
      } else {
        errorMessage = err.message;
      }
      setError({ message: errorMessage, stack: err.stack || "No stack trace available." });
    }
  };

  // Render function for individual attributes in the form
  const renderAttributeForForm = (attributeName, attribute, displayName) => {
    return (
      <div key={attributeName} className="attribute-item">
        <label>{displayName}</label>
        <div className="attribute-controls">
          <MobileNumberInput
            step="0.1"
            value={formData[attributeName]?.attribute?.attributeValue || 0}
            onChange={(e) => handleNestedAttributeChange(attributeName, 'attributeValue', e.target.value)}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData[attributeName]?.attribute?.isGrouped !== false}
              onChange={(e) => handleNestedAttributeChange(attributeName, 'isGrouped', e.target.checked)}
            />
            Group
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <h2>{isEditing ? "Edit Character" : "Create New Character"}</h2>
        
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.characterCategory}
                onChange={(e) => handleInputChange('characterCategory', e.target.value)}
              >
                {CHARACTER_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Will</label>
              <MobileNumberInput
                value={formData.will}
                onChange={(e) => handleInputChange('will', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Fatigue</label>
              <MobileNumberInput
                value={formData.fatigue}
                onChange={(e) => handleInputChange('fatigue', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <AttributeGroups
              attributes={formData}
              renderAttribute={renderAttributeForForm}
              title="Attributes"
              defaultExpandedGroups={['BODY']}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Values</h3>
          <div className="form-group">
            {formData.values.length === 0 && <p className="empty-message">No values added.</p>}
            <ul className="parts-list">
              {formData.values.map((value) => (
                <li key={value.valueName}>
                  {value.valueName} ({value.valueType})
                  <button 
                    type="button" 
                    onClick={() => handleRemoveValue(value.valueName)} 
                    className="button-remove"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setShowAddValueModal(true)} className="button-add-part">
              Add Value
            </button>
          </div>
        </div>

        {showAddValueModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Add Value</h3>
              <div className="form-group">
                <label>Value Name</label>
                <select 
                  value={selectedValueName} 
                  onChange={(e) => setSelectedValueName(e.target.value)}
                >
                  <option value="">-- Select a Value --</option>
                  {VALUE_NAMES
                    .filter(name => !formData.values.find(v => v.valueName === name))
                    .map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))
                  }
                </select>
              </div>
              <div className="form-group">
                <label>Value Type</label>
                <select 
                  value={selectedValueType} 
                  onChange={(e) => setSelectedValueType(e.target.value)}
                >
                  <option value="GOOD">GOOD</option>
                  <option value="BAD">BAD</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddValueModal(false)} className="button-cancel">
                  Cancel
                </button>
                <button type="button" onClick={handleAddValue} className="button-submit">
                  Add Value
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>Special Abilities</h3>
          <div className="form-group">
            {formData.special.length === 0 && <p className="empty-message">No special abilities added.</p>}
            <ul className="parts-list">
              {formData.special.map((ability, index) => (
                <li key={index}>
                  {ability}
                  <button 
                    type="button" 
                    onClick={() => handleSpecialRemove(index)} 
                    className="button-remove"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="special-input-group">
              <input
                type="text"
                value={newSpecialAbility}
                onChange={(e) => setNewSpecialAbility(e.target.value)}
                placeholder="Enter special ability"
                className="special-input"
              />
              <button 
                type="button" 
                onClick={handleSpecialAdd} 
                className="button-add-part"
              >
                Add Ability
              </button>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="button-cancel">
            Cancel
          </button>
          <button type="submit" className="button-submit">
            {isEditing ? "Update Character" : "Create Character"}
          </button>
        </div>
      </form>
      
      <ErrorPopup error={error} onClose={() => setError(null)} />
    </div>
  );
};

export default CharacterForm;