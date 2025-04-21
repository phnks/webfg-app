import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import {
  CREATE_CHARACTER,
  UPDATE_CHARACTER,
  LIST_CHARACTERS,
  // defaultCharacterForm // REMOVED: Not exported from operations.js
  // Import other necessary defaults like defaultStats, defaultPhysical if needed
} from "../../graphql/operations";
import "./Form.css";

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

// Assuming prepareCharacterInput function exists and needs numeric handling
const prepareCharacterInput = (data, isEditing) => {
  const input = {
    name: data.name,
    race: data.race || "",
    // Convert empty strings to 0 for numeric fields
    health: data.health === '' ? 0 : parseInt(data.health, 10) || 0,
    mana: data.mana === '' ? 0 : parseInt(data.mana, 10) || 0,
    strength: data.strength === '' ? 0 : parseInt(data.strength, 10) || 0,
    dexterity: data.dexterity === '' ? 0 : parseInt(data.dexterity, 10) || 0,
    constitution: data.constitution === '' ? 0 : parseInt(data.constitution, 10) || 0,
    intelligence: data.intelligence === '' ? 0 : parseInt(data.intelligence, 10) || 0,
    wisdom: data.wisdom === '' ? 0 : parseInt(data.wisdom, 10) || 0,
    charisma: data.charisma === '' ? 0 : parseInt(data.charisma, 10) || 0,
    fatigue: data.fatigue === '' ? 0 : parseInt(data.fatigue, 10) || 0,
    // Add other numeric fields as needed based on the form structure
    // If character has nested objects like stats or physical, handle them:
    // stats: data.stats ? { ...data.stats, current: data.stats.current === '' ? 0 : parseInt(data.stats.current, 10) || 0, ... } : null,
    // physical: data.physical ? { ...data.physical, weight: data.physical.weight === '' ? 0 : parseFloat(data.physical.weight) || 0.0, ... } : null,
    // ... etc.
  };

  if (!isEditing) {
      delete input.characterId;
  }

  return input;
};


const CharacterForm = ({ character, isEditing = false, onClose, onSuccess }) => {
  // Revert initial state logic to use internal defaults if not editing
  const initialFormData = isEditing && character
    ? { ...character } // Use existing character data when editing
    : { // Define default values when creating
        name: "",
        race: "",
        health: 0, // Default numeric values to 0
        mana: 0,
        strength: 0,
        dexterity: 0,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0,
        fatigue: 0,
        // Add other default fields matching the form structure
        // Example for nested objects (adjust based on actual schema):
        // stats: { hitPoints: { current: 0, max: 0 }, fatigue: { current: 0, max: 0 }, exhaustion: { current: 0, max: 0 }, surges: { current: 0, max: 0 } },
        // physical: { height: 0.0, bodyFatPercentage: 0.0, weight: 0.0, size: { width: 0.0, length: 0.0, height: 0.0 }, adjacency: 0.0 },
        // attributeData: [], // Assuming these are arrays
        // skillData: [],
      };

  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();

  const [createCharacter, { loading: createLoading }] = useMutation(CREATE_CHARACTER, {
    update(cache, { data: { createCharacter } }) {
      try {
        const { listCharacters } = cache.readQuery({ query: LIST_CHARACTERS }) || { listCharacters: [] };
        cache.writeQuery({
          query: LIST_CHARACTERS,
          data: { listCharacters: [...listCharacters, createCharacter] },
        });
        console.log("Character created successfully:", createCharacter);
      } catch (err) {
        console.error("Error updating cache:", err);
      }
    }
  });

  const [updateCharacter, { loading: updateLoading }] = useMutation(UPDATE_CHARACTER);

  const loading = createLoading || updateLoading;

  // Keep modified handleChange: Allow empty strings for numeric inputs
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' && value === '' ? '' : value; // Allow empty string
    setFormData({ ...formData, [name]: finalValue });
  };

  // Assuming no array handlers needed in CharacterForm

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const cleanedData = stripTypename(formData);

      if (isEditing) {
         // Pass isEditing to prepareCharacterInput
        const inputData = prepareCharacterInput(cleanedData, true);
        console.log("Updating character with input:", inputData);
        const result = await updateCharacter({
          variables: {
            characterId: character.characterId,
            input: inputData
          }
        });
        onSuccess(result.data.updateCharacter.characterId);
      } else {
         // Pass isEditing to prepareCharacterInput
        const inputData = prepareCharacterInput(cleanedData, false);
        console.log("Creating character with input:", inputData);
        const result = await createCharacter({
          variables: {
            input: inputData
          }
        });
        onSuccess(result.data.createCharacter.characterId);
      }
    } catch (err) {
      console.error("Error saving character:", err);
      if (err.graphQLErrors) {
        console.error("GraphQL Errors:", err.graphQLErrors);
      }
      if (err.networkError) {
        console.error("Network Error:", err.networkError);
      }
    }
  };

  // Keep handleCancel logic
  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      const currentPath = window.location.pathname;
      if (currentPath.endsWith('/new')) {
          const listPath = currentPath.replace('/new', '');
          navigate(listPath);
      } else {
          navigate(-1);
      }
    }
  };


  return (
    <div className="form-container">
      <h2>{isEditing ? "Edit Character" : "Create Character"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            required
          />
        </div>
         <div className="form-group">
          <label htmlFor="race">Race</label>
          <input
            type="text"
            id="race"
            name="race"
            value={formData.race || ""}
            onChange={handleChange}
          />
        </div>

        {/* Example numeric fields - Keep value={... ?? ''} */}
        <div className="form-group">
          <label htmlFor="health">Health</label>
          <input
            type="number"
            id="health"
            name="health"
            value={formData.health ?? ''}
            onChange={handleChange}
            step="1"
          />
        </div>
        <div className="form-group">
          <label htmlFor="mana">Mana</label>
          <input
            type="number"
            id="mana"
            name="mana"
            value={formData.mana ?? ''}
            onChange={handleChange}
            step="1"
          />
        </div>
         <div className="form-group">
          <label htmlFor="strength">Strength</label>
          <input
            type="number"
            id="strength"
            name="strength"
            value={formData.strength ?? ''}
            onChange={handleChange}
            step="1"
          />
        </div>
         <div className="form-group">
          <label htmlFor="dexterity">Dexterity</label>
          <input
            type="number"
            id="dexterity"
            name="dexterity"
            value={formData.dexterity ?? ''}
            onChange={handleChange}
            step="1"
          />
        </div>
         <div className="form-group">
          <label htmlFor="constitution">Constitution</label>
          <input
            type="number"
            id="constitution"
            name="constitution"
            value={formData.constitution ?? ''}
            onChange={handleChange}
            step="1"
          />
        </div>
         <div className="form-group">
          <label htmlFor="intelligence">Intelligence</label>
          <input
            type="number"
            id="intelligence"
            name="intelligence"
            value={formData.intelligence ?? ''}
            onChange={handleChange}
            step="1"
          />
        </div>
         <div className="form-group">
          <label htmlFor="wisdom">Wisdom</label>
          <input
            type="number"
            id="wisdom"
            name="wisdom"
            value={formData.wisdom ?? ''}
            onChange={handleChange}
            step="1"
          />
        </div>
         <div className="form-group">
          <label htmlFor="charisma">Charisma</label>
          <input
            type="number"
            id="charisma"
            name="charisma"
            value={formData.charisma ?? ''}
            onChange={handleChange}
            step="1"
          />
        </div>
        {/* Add other form fields here */}

        <div className="form-actions">
          <button type="button" onClick={handleCancel}>Cancel</button>
          <button type="submit" disabled={loading}>
            {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CharacterForm;
