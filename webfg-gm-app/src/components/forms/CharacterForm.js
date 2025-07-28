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

const CHARACTER_RACES = [
  'HUMAN', 'ANTHRO', 'CARVED', 'TREPIDITE', 'DHYARMA'
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
      race: "HUMAN",
      raceOverride: false,
      will: 0,  // Default to 0 as requested
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
  
  // Helper function to determine if race restrictions should apply
  const shouldApplyRaceRestrictions = () => {
    return formData.race === 'HUMAN' && !formData.raceOverride;
  };

  // Helper function to check if an attribute is restricted for humans
  const isRestrictedAttribute = (attributeName) => {
    const restrictedAttributes = ['armour', 'endurance', 'lethality', 'complexity', 'obscurity', 'light'];
    return restrictedAttributes.includes(attributeName);
  };

  // Helper function to get validation error for a specific attribute
  const getAttributeValidationError = (attributeName) => {
    if (!shouldApplyRaceRestrictions()) return null;
    
    const value = formData[attributeName]?.attribute?.attributeValue || 0;
    
    if (isRestrictedAttribute(attributeName) && value !== 10) {
      return `Must be 10 for humans (currently ${value})`;
    } else if (!isRestrictedAttribute(attributeName) && (value < 5 || value > 20)) {
      return `Must be between 5-20 for humans (currently ${value})`;
    }
    
    return null;
  };
  
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
      console.log('DEBUG: Loading character for edit - character.raceOverride:', character.raceOverride, 'type:', typeof character.raceOverride);
      const updatedFormData = {
        name: character.name || "",
        description: character.description || "",
        characterCategory: character.characterCategory || "HUMAN",
        race: character.race || "HUMAN",
        raceOverride: character.raceOverride !== undefined ? character.raceOverride : false,
        will: character.will !== null && character.will !== undefined ? character.will : 0,
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
      
      console.log('DEBUG: Setting form data - updatedFormData.raceOverride:', updatedFormData.raceOverride, 'type:', typeof updatedFormData.raceOverride);
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
    const updatedData = {
      ...formData,
      [field]: field === 'will' || field === 'targetAttributeTotal' ? parseInt(value) || 0 : value
    };
    
    // No automatic value clamping - let user see validation errors instead
    
    setFormData(updatedData);
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
    
    // Validate race restrictions
    if (shouldApplyRaceRestrictions()) {
      const violations = [];
      
      getAllAttributeNames().forEach(attr => {
        const value = formData[attr]?.attribute?.attributeValue || 0;
        
        if (isRestrictedAttribute(attr) && value !== 10) {
          violations.push(`${attr} must be 10 for humans (currently ${value})`);
        } else if (!isRestrictedAttribute(attr) && (value < 5 || value > 20)) {
          violations.push(`${attr} must be between 5-20 for humans (currently ${value})`);
        }
      });
      
      if (violations.length > 0) {
        setValidationError(`Race restrictions violated: ${violations.join(', ')}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    
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
      console.log('DEBUG: formData.raceOverride before submission:', formData.raceOverride, typeof formData.raceOverride);
      const input = {
        name: formData.name,
        description: formData.description || "",
        characterCategory: formData.characterCategory,
        race: formData.race || "HUMAN",
        raceOverride: formData.raceOverride === true,
        will: formData.will !== null && formData.will !== undefined && formData.will !== '' ? parseInt(formData.will) : 0,
        mind: formData.mind,
        special: formData.special,
        actionIds: formData.actionIds,
        stashIds: formData.stashIds,
        equipmentIds: formData.equipmentIds,
        readyIds: formData.readyIds,
        targetAttributeTotal: formData.targetAttributeTotal || calculateDefaultTargetTotal()
      };
      
      console.log('DEBUG: input.raceOverride after preparation:', input.raceOverride, typeof input.raceOverride);
      
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
    const validationError = getAttributeValidationError(attributeName);
    
    return (
      <div key={attributeName} className="attribute-item">
        <label>{displayName}</label>
        <div className="attribute-controls">
          <MobileNumberInput
            step="0.1"
            value={formData[attributeName]?.attribute?.attributeValue || 0}
            onChange={(e) => handleNestedAttributeChange(attributeName, 'attributeValue', e.target.value)}
            style={validationError ? {borderColor: '#dc3545'} : {}}
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
        {validationError && (
          <div style={{fontSize: '0.8em', color: '#dc3545', marginTop: '2px'}}>
            {validationError}
          </div>
        )}
      </div>
    );
  };

  // Check if submit should be disabled based on attribute total validation
  const currentTotal = calculateCurrentTotal();
  const targetTotal = formData.targetAttributeTotal || calculateDefaultTargetTotal();
  
  // Check for race restriction violations
  let hasRaceViolations = false;
  if (shouldApplyRaceRestrictions()) {
    hasRaceViolations = getAllAttributeNames().some(attr => {
      const value = formData[attr]?.attribute?.attributeValue || 0;
      if (isRestrictedAttribute(attr)) {
        return value !== 10;
      } else {
        return value < 5 || value > 20;
      }
    });
  }
  
  const isSubmitDisabled = currentTotal !== targetTotal || hasRaceViolations;

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
              <label>Race</label>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <select
                  value={formData.race}
                  onChange={(e) => handleInputChange('race', e.target.value)}
                  style={{flex: 1}}
                >
                  {CHARACTER_RACES.map(race => (
                    <option key={race} value={race}>{race}</option>
                  ))}
                </select>
                <label className="checkbox-label" style={{margin: 0, fontSize: '0.9em'}}>
                  <input
                    type="checkbox"
                    checked={formData.raceOverride}
                    onChange={(e) => handleInputChange('raceOverride', e.target.checked)}
                  />
                  Override race restrictions
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Will</label>
              <MobileNumberInput
                value={formData.will}
                onChange={(e) => handleInputChange('will', e.target.value)}
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
            title={isSubmitDisabled ? 
              (currentTotal !== targetTotal ? `Attribute total must equal ${targetTotal}` : '') +
              (hasRaceViolations ? (currentTotal !== targetTotal ? ' and ' : '') + 'Race restrictions must be satisfied' : '')
              : ''}
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