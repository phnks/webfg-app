import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import {
  CREATE_CHARACTER,
  UPDATE_CHARACTER,
  LIST_CHARACTERS,
  LIST_ATTRIBUTES, // Import LIST_ATTRIBUTES
  LIST_SKILLS,     // Import LIST_SKILLS
  // defaultCharacterForm is not exported
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

// Refactored prepareCharacterInput
const prepareCharacterInput = (data, isEditing) => {
  const input = {
    name: data.name || "",
    race: data.race || "",
    // Use dynamically managed attribute and skill data
    attributeData: (data.attributeData || []).map(attr => ({
        attributeId: attr.attributeId,
        // Assuming attribute values are numbers/strings and need conversion/handling
        attributeValue: attr.attributeValue === '' ? 0 : parseInt(attr.attributeValue, 10) || 0, // Example conversion
        // Add other relevant fields from CharacterAttributeInput if necessary
    })),
    skillData: (data.skillData || []).map(skill => ({
        skillId: skill.skillId,
        // Assuming skill values are numbers/strings and need conversion/handling
        skillValue: skill.skillValue === '' ? 0 : parseInt(skill.skillValue, 10) || 0, // Example conversion
        // Add other relevant fields from CharacterSkillInput if necessary
    })),
    // Handle stats and physical if they are part of the form and schema
    stats: data.stats ? {
        hitPoints: {
            current: data.stats.hitPoints.current === '' ? 0 : parseInt(data.stats.hitPoints.current, 10) || 0,
            max: data.stats.hitPoints.max === '' ? 0 : parseInt(data.stats.hitPoints.max, 10) || 0,
        },
        fatigue: {
             current: data.stats.fatigue.current === '' ? 0 : parseInt(data.stats.fatigue.current, 10) || 0,
            max: data.stats.fatigue.max === '' ? 0 : parseInt(data.stats.fatigue.max, 10) || 0,
        },
         exhaustion: {
             current: data.stats.exhaustion.current === '' ? 0 : parseInt(data.stats.exhaustion.current, 10) || 0,
            max: data.stats.exhaustion.max === '' ? 0 : parseInt(data.stats.exhaustion.max, 10) || 0,
        },
         surges: {
             current: data.stats.surges.current === '' ? 0 : parseInt(data.stats.surges.current, 10) || 0,
            max: data.stats.surges.max === '' ? 0 : parseInt(data.stats.surges.max, 10) || 0,
        },
    } : null, // Ensure stats is included if part of schema
    physical: data.physical ? {
        height: data.physical.height === '' ? 0.0 : parseFloat(data.physical.height) || 0.0,
        bodyFatPercentage: data.physical.bodyFatPercentage === '' ? 0.0 : parseFloat(data.physical.bodyFatPercentage) || 0.0,
        weight: data.physical.weight === '' ? 0.0 : parseFloat(data.physical.weight) || 0.0,
        size: data.physical.size ? {
            width: data.physical.size.width === '' ? 0.0 : parseFloat(data.physical.size.width) || 0.0,
            length: data.physical.size.length === '' ? 0.0 : parseFloat(data.physical.size.length) || 0.0,
            height: data.physical.size.height === '' ? 0.0 : parseFloat(data.physical.size.height) || 0.0,
        } : null,
        adjacency: data.physical.adjacency === '' ? 0.0 : parseFloat(data.physical.adjacency) || 0.0,
    } : null, // Ensure physical is included if part of schema
    conditions: data.conditions || [], // Assuming conditions is an array of strings
    inventoryIds: data.inventoryIds || [], // Assuming inventoryIds is an array of IDs
    equipmentIds: data.equipmentIds || [], // Assuming equipmentIds is an array of IDs
    actionIds: data.actionIds || [], // Assuming actionIds is an array of IDs
  };

  if (!isEditing) {
      delete input.characterId;
  }
  return input;
};

const CharacterForm = ({ character, isEditing = false, onClose, onSuccess }) => {
  const navigate = useNavigate();

  // Fetch attributes and skills
  const { data: attributesData, loading: attributesLoading, error: attributesError } = useQuery(LIST_ATTRIBUTES);
  const { data: skillsData, loading: skillsLoading, error: skillsError } = useQuery(LIST_SKILLS);

  // State for form data, including dynamic attributes and skills
  const [formData, setFormData] = useState({
    name: "",
    race: "",
    // Initialize attributeData and skillData as empty arrays
    attributeData: [],
    skillData: [],
    // Initialize other fields based on schema defaults if needed
    stats: { hitPoints: { current: 0, max: 0 }, fatigue: { current: 0, max: 0 }, exhaustion: { current: 0, max: 0 }, surges: { current: 0, max: 0 } },
    physical: { height: 0.0, bodyFatPercentage: 0.0, weight: 0.0, size: { width: 0.0, length: 0.0, height: 0.0 }, adjacency: 0.0 },
    conditions: [],
    inventoryIds: [],
    equipmentIds: [],
    actionIds: [],
  });

  // Effect to populate form data when character prop changes (for editing)
  useEffect(() => {
    if (isEditing && character) {
        // When editing, use the existing character data
        setFormData({
            name: character.name || "",
            race: character.race || "",
            // Map existing attribute and skill data to the state format
            attributeData: (character.attributeData || []).map(attr => ({
                attributeId: attr.attributeId,
                attributeValue: attr.attributeValue ?? '', // Use ?? '' for input value
            })),
            skillData: (character.skillData || []).map(skill => ({
                skillId: skill.skillId,
                skillValue: skill.skillValue ?? '', // Use ?? '' for input value
            })),
             // Map other fields
             stats: character.stats ? {
                hitPoints: { current: character.stats.hitPoints.current ?? '', max: character.stats.hitPoints.max ?? '' },
                fatigue: { current: character.stats.fatigue.current ?? '', max: character.stats.fatigue.max ?? '' },
                exhaustion: { current: character.stats.exhaustion.current ?? '', max: character.stats.exhaustion.max ?? '' },
                surges: { current: character.stats.surges.current ?? '', max: character.stats.surges.max ?? '' },
            } : { hitPoints: { current: '', max: '' }, fatigue: { current: '', max: '' }, exhaustion: { current: '', max: '' }, surges: { current: '', max: '' } },
             physical: character.physical ? {
                height: character.physical.height ?? '',
                bodyFatPercentage: character.physical.bodyFatPercentage ?? '',
                weight: character.physical.weight ?? '',
                size: character.physical.size ? {
                    width: character.physical.size.width ?? '',
                    length: character.physical.size.length ?? '',
                    height: character.physical.size.height ?? '',
                } : { width: '', length: '', height: '' },
                adjacency: character.physical.adjacency ?? '',
            } : { height: '', bodyFatPercentage: '', weight: '', size: { width: '', length: '', height: '' }, adjacency: '' },
            conditions: character.conditions || [],
            inventoryIds: character.inventoryIds || [],
            equipmentIds: character.equipmentIds || [],
            actionIds: character.actionIds || [],
        });
    } else {
        // When creating, initialize attributeData and skillData based on fetched lists
        if (attributesData?.listAttributes && skillsData?.listSkills) {
             setFormData(prev => ({
                 ...prev,
                 attributeData: attributesData.listAttributes.map(attr => ({
                     attributeId: attr.attributeId,
                     attributeValue: '', // Initialize with empty string for input
                 })),
                 skillData: skillsData.listSkills.map(skill => ({
                     skillId: skill.skillId,
                     skillValue: '', // Initialize with empty string for input
                 })),
             }));
         }
    }
  }, [isEditing, character, attributesData, skillsData]); // Depend on character and fetched data


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

  const loading = createLoading || updateLoading || attributesLoading || skillsLoading;

  // Modified handleChange to handle nested fields and dynamic lists
  const handleChange = (e) => {
      const { name, value, type } = e.target;
      const [field, nestedField, deeplyNestedField] = name.split('.');

      setFormData(prev => {
          let updatedFormData = { ...prev };

          // Handle dynamic attribute/skill lists
          if (field === 'attributeData' || field === 'skillData') {
              const id = e.target.dataset.id; // Get the attribute/skill ID from a data attribute
              updatedFormData[field] = (updatedFormData[field] || []).map(item =>
                  item[`${field.slice(0, -4)}Id`] === id // e.g., attributeId for attributeData
                      ? { ...item, [`${field.slice(0, -4)}Value`]: type === 'number' && value === '' ? '' : value }
                      : item
              );
          } else if (nestedField && deeplyNestedField) {
               // Handle deeply nested fields (like stats.hitPoints.current)
               updatedFormData[field] = {
                   ...updatedFormData[field],
                   [nestedField]: {
                       ...updatedFormData[field]?.[nestedField],
                       [deeplyNestedField]: type === 'number' && value === '' ? '' : value,
                   }
               };
           } else if (nestedField) {
               // Handle nested fields (like physical.height)
               updatedFormData[field] = {
                   ...updatedFormData[field],
                   [nestedField]: type === 'number' && value === '' ? '' : value,
               };
           }
           else {
              // Handle top-level fields (like name, race)
              updatedFormData[field] = value;
          }

          return updatedFormData;
      });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Ensure name is a string before preparing input
      const dataToSend = {
          ...formData,
          name: formData.name || "" // Explicitly default to empty string if somehow null/undefined
      };

      const cleanedData = stripTypename(dataToSend); // Use dataToSend here
      const inputData = prepareCharacterInput(cleanedData, isEditing);

      console.log(isEditing ? "Updating character with input:" : "Creating character with input:", inputData);

      let result;
      if (isEditing) {
        result = await updateCharacter({
          variables: {
            characterId: character.characterId,
            name: inputData.name,
            attributeData: inputData.attributeData,
            skillData: inputData.skillData,
            stats: inputData.stats,
            physical: inputData.physical,
            conditions: inputData.conditions,
            inventoryIds: inputData.inventoryIds,
            equipmentIds: inputData.equipmentIds,
            actionIds: inputData.actionIds,
          }
        });
        onSuccess(result.data.updateCharacter.characterId);
      } else {
        result = await createCharacter({
          variables: {
            name: inputData.name,
            attributeData: inputData.attributeData,
            skillData: inputData.skillData,
            stats: inputData.stats,
            physical: inputData.physical,
            conditions: inputData.conditions,
            inventoryIds: inputData.inventoryIds,
            equipmentIds: inputData.equipmentIds,
            actionIds: inputData.actionIds,
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

  // Show loading/error states for fetching attributes/skills
  if (attributesLoading || skillsLoading) return <p>Loading attributes and skills...</p>;
  if (attributesError || skillsError) return <p>Error loading attributes or skills: {attributesError?.message || skillsError?.message}</p>;

  return (
    <div className="form-container">
      <h2>{isEditing ? "Edit Character" : "Create Character"}</h2>
      <form onSubmit={handleSubmit}>
        {/* Basic Fields */}
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

        {/* Dynamic Attributes */}
        <h3>Attributes</h3>
        {(attributesData?.listAttributes || []).map(attr => {
             const characterAttribute = formData.attributeData.find(ca => ca.attributeId === attr.attributeId);
             const attributeValue = characterAttribute ? (characterAttribute.attributeValue ?? '') : ''; // Use ?? ''
             return (
                 <div className="form-group" key={attr.attributeId}>
                     <label htmlFor={`attribute-${attr.attributeId}`}>{attr.attributeName}</label>
                     <input
                         type="number"
                         id={`attribute-${attr.attributeId}`}
                         name="attributeData" // Use a common name for the array
                         data-id={attr.attributeId} // Store the ID in a data attribute
                         value={attributeValue}
                         onChange={handleChange}
                         step="1"
                     />
                 </div>
             );
         })}

        {/* Dynamic Skills */}
        <h3>Skills</h3>
         {(skillsData?.listSkills || []).map(skill => {
             const characterSkill = formData.skillData.find(cs => cs.skillId === skill.skillId);
             const skillValue = characterSkill ? (characterSkill.skillValue ?? '') : ''; // Use ?? ''
             return (
                 <div className="form-group" key={skill.skillId}>
                     <label htmlFor={`skill-${skill.skillId}`}>{skill.skillName} ({skill.skillCategory})</label>
                     <input
                         type="number"
                         id={`skill-${skill.skillId}`}
                         name="skillData" // Use a common name for the array
                         data-id={skill.skillId} // Store the ID in a data attribute
                         value={skillValue}
                         onChange={handleChange}
                         step="1"
                     />
                 </div>
             );
         })}

        {/* Stats (Assuming fixed structure based on previous read) */}
        <h3>Stats</h3>
         <div className="form-group">
             <label htmlFor="stats.hitPoints.current">Hit Points (Current)</label>
             <input type="number" id="stats.hitPoints.current" name="stats.hitPoints.current" value={formData.stats?.hitPoints?.current ?? ''} onChange={handleChange} step="1" />
         </div>
         <div className="form-group">
             <label htmlFor="stats.hitPoints.max">Hit Points (Max)</label>
             <input type="number" id="stats.hitPoints.max" name="stats.hitPoints.max" value={formData.stats?.hitPoints?.max ?? ''} onChange={handleChange} step="1" />
         </div>
         <div className="form-group">
             <label htmlFor="stats.fatigue.current">Fatigue (Current)</label>
             <input type="number" id="stats.fatigue.current" name="stats.fatigue.current" value={formData.stats?.fatigue?.current ?? ''} onChange={handleChange} step="1" />
         </div>
         <div className="form-group">
             <label htmlFor="stats.fatigue.max">Fatigue (Max)</label>
             <input type="number" id="stats.fatigue.max" name="stats.fatigue.max" value={formData.stats?.fatigue?.max ?? ''} onChange={handleChange} step="1" />
         </div>
          <div className="form-group">
             <label htmlFor="stats.exhaustion.current">Exhaustion (Current)</label>
             <input type="number" id="stats.exhaustion.current" name="stats.exhaustion.current" value={formData.stats?.exhaustion?.current ?? ''} onChange={handleChange} step="1" />
         </div>
         <div className="form-group">
             <label htmlFor="stats.exhaustion.max">Exhaustion (Max)</label>
             <input type="number" id="stats.exhaustion.max" name="stats.exhaustion.max" value={formData.stats?.exhaustion?.max ?? ''} onChange={handleChange} step="1" />
         </div>
          <div className="form-group">
             <label htmlFor="stats.surges.current">Surges (Current)</label>
             <input type="number" id="stats.surges.current" name="stats.surges.current" value={formData.stats?.surges?.current ?? ''} onChange={handleChange} step="1" />
         </div>
         <div className="form-group">
             <label htmlFor="stats.surges.max">Surges (Max)</label>
             <input type="number" id="stats.surges.max" name="stats.surges.max" value={formData.stats?.surges?.max ?? ''} onChange={handleChange} step="1" />
         </div>


        {/* Physical (Assuming fixed structure based on previous read) */}
        <h3>Physical</h3>
        <div className="form-group">
             <label htmlFor="physical.height">Height</label>
             <input type="number" id="physical.height" name="physical.height" value={formData.physical?.height ?? ''} onChange={handleChange} step="0.1" />
         </div>
         <div className="form-group">
             <label htmlFor="physical.bodyFatPercentage">Body Fat Percentage</label>
             <input type="number" id="physical.bodyFatPercentage" name="physical.bodyFatPercentage" value={formData.physical?.bodyFatPercentage ?? ''} onChange={handleChange} step="0.1" />
         </div>
         <div className="form-group">
             <label htmlFor="physical.weight">Weight</label>
             <input type="number" id="physical.weight" name="physical.weight" value={formData.physical?.weight ?? ''} onChange={handleChange} step="0.1" />
         </div>
         <h4>Size</h4>
          <div className="form-group">
             <label htmlFor="physical.size.width">Size (Width)</label>
             <input type="number" id="physical.size.width" name="physical.size.width" value={formData.physical?.size?.width ?? ''} onChange={handleChange} step="0.1" />
         </div>
          <div className="form-group">
             <label htmlFor="physical.size.length">Size (Length)</label>
             <input type="number" id="physical.size.length" name="physical.size.length" value={formData.physical?.size?.length ?? ''} onChange={handleChange} step="0.1" />
         </div>
          <div className="form-group">
             <label htmlFor="physical.size.height">Size (Height)</label>
             <input type="number" id="physical.size.height" name="physical.size.height" value={formData.physical?.size?.height ?? ''} onChange={handleChange} step="0.1" />
         </div>
          <div className="form-group">
             <label htmlFor="physical.adjacency">Adjacency</label>
             <input type="number" id="physical.adjacency" name="physical.adjacency" value={formData.physical?.adjacency ?? ''} onChange={handleChange} step="0.1" />
         </div>

        {/* Other fields like Conditions, Inventory, Equipment, Actions would be added here */}

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
