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
  
  // Get all attribute names from the new grouping
  const getAllAttributeNames = () => {
    return Object.values(ATTRIBUTE_GROUPS).flat();
  };

  // Create initial form data with all attributes
  const createInitialFormData = () => {
    const initialData = {
      name: "",
      description: "",
      characterCategory: "HUMAN",
      will: 0,  // Default to 0 as requested
      fatigue: 0,
      mind: [],
      special: [],
      actionIds: [],
      stashIds: [],
      equipmentIds: [],
      readyIds: [],
      targetAttributeTotal: null  // Will be calculated based on attributes * 10
    };
    
    // Add all attributes with default values of 10
    getAllAttributeNames().forEach(attr => {
      initialData[attr] = { attribute: { attributeValue: 10, isGrouped: true } };
    });
    
    return initialData;
  };

  const [formData, setFormData] = useState(createInitialFormData());
  const [validationError, setValidationError] = useState(null);
  
  // Calculate the default target total (number of attributes * 10)
  const calculateDefaultTargetTotal = () => {
    return getAllAttributeNames().length * 10;
  };
  
  // Calculate current total of all attribute values
  const calculateCurrentTotal = () => {
    return getAllAttributeNames().reduce((sum, attr) => {
      const value = parseFloat(formData[attr]?.attribute?.attributeValue) || 0;
      return sum + value;
    }, 0);
  };

  // Initialize targetAttributeTotal
  useEffect(() => {
    if (!formData.targetAttributeTotal) {
      setFormData(prev => ({
        ...prev,
        targetAttributeTotal: calculateDefaultTargetTotal()
      }));
    }
  }, [isEditing]);

  // Effect to populate form data when character prop changes (for editing)
  useEffect(() => {
    if (isEditing && character) {
      const updatedFormData = {
        name: character.name || "",
        description: character.description || "",
        characterCategory: character.characterCategory || "HUMAN",
        will: character.will !== null && character.will !== undefined ? character.will : 0,
        fatigue: character.fatigue || 0,
        mind: (character.mind || []).map(m => ({ ...m })),
        special: character.special || [],
        actionIds: character.actionIds || [],
        stashIds: character.stashIds || [],
        equipmentIds: character.equipmentIds || [],
        readyIds: character.readyIds || []
      };
      
      // Add all attributes from character or default values
      getAllAttributeNames().forEach(attr => {
        updatedFormData[attr] = character[attr] || { attribute: { attributeValue: 10, isGrouped: true } };
      });
      
      // Set targetAttributeTotal from character or calculate default
      updatedFormData.targetAttributeTotal = character.targetAttributeTotal || calculateDefaultTargetTotal();
      
      setFormData(updatedFormData);
    }
  }, [isEditing, character]);


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
      [field]: field === 'will' || field === 'fatigue' || field === 'targetAttributeTotal' ? parseInt(value) || 0 : value
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
    console.log(`DEBUG: handleNestedAttributeChange called - ${attributeName}.${nestedField} = ${value}`);
    setFormData(prev => {
      const updated = {
        ...prev,
        [attributeName]: {
          ...prev[attributeName],
          attribute: {
            ...prev[attributeName].attribute,
            [nestedField]: nestedField === 'attributeValue' ? parseFloat(value) || 0 : value
          }
        }
      };
      console.log(`DEBUG: Updated formData for ${attributeName}:`, updated[attributeName]);
      return updated;
    });
    
    // Clear validation error when user makes changes
    if (validationError) {
      setValidationError(null);
    }
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
    setValidationError(null);
    
    // Validate attribute total
    const currentTotal = calculateCurrentTotal();
    const targetTotal = formData.targetAttributeTotal || calculateDefaultTargetTotal();
    
    if (currentTotal < targetTotal) {
      setValidationError(`Insufficient attribute values. Current total: ${currentTotal}, Required: ${targetTotal}`);
      // Scroll to top where the validation message is shown
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (currentTotal > targetTotal) {
      setValidationError(`Too high attribute values. Current total: ${currentTotal}, Maximum: ${targetTotal}`);
      // Scroll to top where the validation message is shown
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      
      // Prepare the input data for mutation
      const input = {
        name: formData.name,
        description: formData.description || "",
        characterCategory: formData.characterCategory,
        will: formData.will !== null && formData.will !== undefined && formData.will !== '' ? parseInt(formData.will) : 0,
        fatigue: formData.fatigue !== null && formData.fatigue !== undefined && formData.fatigue !== '' ? parseInt(formData.fatigue) : 0,
        mind: formData.mind,
        special: formData.special,
        actionIds: formData.actionIds,
        stashIds: formData.stashIds,
        equipmentIds: formData.equipmentIds,
        readyIds: formData.readyIds,
        targetAttributeTotal: formData.targetAttributeTotal || calculateDefaultTargetTotal()
      };
      
      
      // Add all attributes dynamically
      console.log('DEBUG: formData before submission:', formData);
      console.log('DEBUG: getAllAttributeNames():', getAllAttributeNames());
      
      getAllAttributeNames().forEach(attr => {
        console.log(`DEBUG: Processing attribute ${attr}:`, formData[attr]);
        input[attr] = {
          attribute: { 
            attributeValue: parseFloat(formData[attr]?.attribute?.attributeValue) || 0,
            isGrouped: formData[attr]?.attribute?.isGrouped !== false
          }
        };
        console.log(`DEBUG: Set ${attr} to:`, input[attr]);
      });
      
      console.log('DEBUG: Final input object:', input);

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

  // Check if submit should be disabled based on attribute total validation
  const currentTotal = calculateCurrentTotal();
  const targetTotal = formData.targetAttributeTotal || calculateDefaultTargetTotal();
  const isSubmitDisabled = currentTotal !== targetTotal;

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h2>{isEditing ? "Edit Character" : "Create New Character"}</h2>
          <div className="attribute-total-display">
            <span className={`current-total ${currentTotal < targetTotal ? 'insufficient' : currentTotal > targetTotal ? 'excessive' : 'valid'}`}>
              Total: {currentTotal}
            </span>
            <span className="total-separator">/</span>
            <div className="target-total-input">
              <label>Target:</label>
              <MobileNumberInput
                value={formData.targetAttributeTotal || calculateDefaultTargetTotal()}
                onChange={(e) => handleInputChange('targetAttributeTotal', e.target.value)}
                min="1"
                className="target-input"
              />
              <div className="target-help-text">
                Default: 10 × {getAllAttributeNames().length} = {calculateDefaultTargetTotal()}
              </div>
            </div>
          </div>
        </div>
        
        {validationError && (
          <div className="validation-error">
            {validationError}
          </div>
        )}
        
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
              <label>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows="3"
                placeholder="Enter character description (optional)"
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
              defaultExpandedGroups={['BODY', 'SENSES']}
            />
          </div>
        </div>



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
          <button 
            type="submit" 
            className="button-submit"
            disabled={isSubmitDisabled}
            title={isSubmitDisabled ? `Attribute total must equal ${targetTotal}` : ''}
          >
            {isEditing ? "Update Character" : "Create Character"}
          </button>
        </div>
      </form>
      
      <ErrorPopup error={error} onClose={() => setError(null)} />
    </div>
  );
};

export default CharacterForm;