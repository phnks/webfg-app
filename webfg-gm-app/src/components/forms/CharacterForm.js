import React, { useState, useEffect } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
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

const ATTRIBUTE_TYPES = ['HELP', 'HINDER'];

const CharacterForm = ({ character, isEditing = false, onClose, onSuccess }) => {
  const navigate = useNavigate();

  // State for form data matching the new schema
  const [error, setError] = useState(null);
  const [showAddValueModal, setShowAddValueModal] = useState(false);
  const [selectedValueName, setSelectedValueName] = useState("");
  const [selectedValueType, setSelectedValueType] = useState("GOOD");
  
  const [formData, setFormData] = useState({
    name: "",
    characterCategory: "HUMAN",
    will: 10,
    values: [],
    lethality: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    armour: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    endurance: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    strength: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    dexterity: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    agility: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    perception: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    charisma: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    intelligence: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    resolve: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    morale: { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
    special: [],
    actionIds: [],
    inventoryIds: [],
    equipmentIds: []
  });

  // Effect to populate form data when character prop changes (for editing)
  useEffect(() => {
    if (isEditing && character) {
      setFormData({
        name: character.name || "",
        characterCategory: character.characterCategory || "HUMAN",
        will: character.will || 10,
        values: (character.values || []).map(v => ({ ...v })),
        lethality: character.lethality || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        armour: character.armour || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        endurance: character.endurance || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        strength: character.strength || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        dexterity: character.dexterity || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        agility: character.agility || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        perception: character.perception || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        charisma: character.charisma || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        intelligence: character.intelligence || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        resolve: character.resolve || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        morale: character.morale || { attribute: { attributeValue: 0, attributeType: 'HELP' }, fatigue: 0 },
        special: character.special || [],
        actionIds: character.actionIds || [],
        inventoryIds: character.inventoryIds || [],
        equipmentIds: character.equipmentIds || []
      });
    }
  }, [isEditing, character]);

  const [createCharacter] = useMutation(CREATE_CHARACTER, {
    refetchQueries: [{ query: LIST_CHARACTERS }],
    onCompleted: (data) => {
      console.log('Create character response:', data);
      if (onSuccess) {
        onSuccess(data.createCharacter.characterId);
      } else {
        navigate(`/characters/${data.createCharacter.characterId}`);
      }
    }
  });

  const [updateCharacter] = useMutation(UPDATE_CHARACTER, {
    onCompleted: (data) => {
      if (onSuccess) {
        onSuccess(data.updateCharacter.characterId);
      }
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAttributeChange = (attributeName, field, value) => {
    setFormData(prev => ({
      ...prev,
      [attributeName]: {
        ...prev[attributeName],
        [field]: field === 'fatigue' ? parseInt(value) || 0 : {
          ...prev[attributeName][field],
          [field === 'attribute' ? (value.includes('Value') ? 'attributeValue' : 'attributeType') : field]: 
            field === 'attribute' && value.includes('Value') ? parseFloat(value.replace('Value', '')) || 0 : value
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
        will: parseInt(formData.will) || 10,
        values: formData.values.map(v => ({ valueName: v.valueName, valueType: v.valueType })),
        lethality: {
          attribute: { 
            attributeValue: parseFloat(formData.lethality.attribute.attributeValue) || 0,
            attributeType: formData.lethality.attribute.attributeType
          },
          fatigue: parseInt(formData.lethality.fatigue) || 0
        },
        armour: {
          attribute: { 
            attributeValue: parseFloat(formData.armour.attribute.attributeValue) || 0,
            attributeType: formData.armour.attribute.attributeType
          },
          fatigue: parseInt(formData.armour.fatigue) || 0
        },
        endurance: {
          attribute: { 
            attributeValue: parseFloat(formData.endurance.attribute.attributeValue) || 0,
            attributeType: formData.endurance.attribute.attributeType
          },
          fatigue: parseInt(formData.endurance.fatigue) || 0
        },
        strength: {
          attribute: { 
            attributeValue: parseFloat(formData.strength.attribute.attributeValue) || 0,
            attributeType: formData.strength.attribute.attributeType
          },
          fatigue: parseInt(formData.strength.fatigue) || 0
        },
        dexterity: {
          attribute: { 
            attributeValue: parseFloat(formData.dexterity.attribute.attributeValue) || 0,
            attributeType: formData.dexterity.attribute.attributeType
          },
          fatigue: parseInt(formData.dexterity.fatigue) || 0
        },
        agility: {
          attribute: { 
            attributeValue: parseFloat(formData.agility.attribute.attributeValue) || 0,
            attributeType: formData.agility.attribute.attributeType
          },
          fatigue: parseInt(formData.agility.fatigue) || 0
        },
        perception: {
          attribute: { 
            attributeValue: parseFloat(formData.perception.attribute.attributeValue) || 0,
            attributeType: formData.perception.attribute.attributeType
          },
          fatigue: parseInt(formData.perception.fatigue) || 0
        },
        charisma: {
          attribute: { 
            attributeValue: parseFloat(formData.charisma.attribute.attributeValue) || 0,
            attributeType: formData.charisma.attribute.attributeType
          },
          fatigue: parseInt(formData.charisma.fatigue) || 0
        },
        intelligence: {
          attribute: { 
            attributeValue: parseFloat(formData.intelligence.attribute.attributeValue) || 0,
            attributeType: formData.intelligence.attribute.attributeType
          },
          fatigue: parseInt(formData.intelligence.fatigue) || 0
        },
        resolve: {
          attribute: { 
            attributeValue: parseFloat(formData.resolve.attribute.attributeValue) || 0,
            attributeType: formData.resolve.attribute.attributeType
          },
          fatigue: parseInt(formData.resolve.fatigue) || 0
        },
        morale: {
          attribute: { 
            attributeValue: parseFloat(formData.morale.attribute.attributeValue) || 0,
            attributeType: formData.morale.attribute.attributeType
          },
          fatigue: parseInt(formData.morale.fatigue) || 0
        },
        special: formData.special,
        actionIds: formData.actionIds,
        inventoryIds: formData.inventoryIds,
        equipmentIds: formData.equipmentIds
      };

      if (isEditing) {
        await updateCharacter({
          variables: {
            characterId: character.characterId,
            input: stripTypename(input)
          }
        });
      } else {
        await createCharacter({
          variables: {
            input: stripTypename(input)
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

  const attributes = [
    'lethality', 'armour', 'endurance', 'strength', 'dexterity',
    'agility', 'perception', 'charisma', 'intelligence', 'resolve', 'morale'
  ];

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
              <input
                type="number"
                value={formData.will}
                onChange={(e) => handleInputChange('will', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Attributes</h3>
          <div className="attributes-grid">
            {attributes.map(attr => (
              <div key={attr} className="attribute-group">
                <h4>{attr.charAt(0).toUpperCase() + attr.slice(1)}</h4>
                <div className="attribute-fields">
                  <div className="form-field">
                    <label>Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData[attr]?.attribute?.attributeValue || 0}
                      onChange={(e) => handleNestedAttributeChange(attr, 'attributeValue', e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Type</label>
                    <select
                      value={formData[attr]?.attribute?.attributeType || 'HELP'}
                      onChange={(e) => handleNestedAttributeChange(attr, 'attributeType', e.target.value)}
                    >
                      {ATTRIBUTE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Fatigue</label>
                    <input
                      type="number"
                      value={formData[attr]?.fatigue || 0}
                      onChange={(e) => handleAttributeChange(attr, 'fatigue', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
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