import React, { useState, useEffect } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import {
  CREATE_CHARACTER,
  UPDATE_CHARACTER,
  LIST_CHARACTERS,
  LIST_ATTRIBUTES,
  LIST_SKILLS,
  // Need to fetch list of possible Value objects and Body objects (Objects with type BODY)
  LIST_OBJECTS // Assuming LIST_OBJECTS can filter by type, or fetch all and filter locally
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

// Refactored prepareCharacterInput to match schema and handle conditions for mutation
const prepareCharacterInput = (data, isEditing) => {
  const input = {
    name: data.name || "",
    attributeData: (data.attributeData || []).filter(attr => attr != null).map(attr => ({
        attributeId: attr.attributeId,
        attributeValue: attr.attributeValue === '' ? 0 : parseInt(attr.attributeValue, 10) || 0,
    })),
    skillData: (data.skillData || []).filter(skill => skill != null).map(skill => ({
        skillId: skill.skillId,
        skillValue: skill.skillValue === '' ? 0 : parseInt(skill.skillValue, 10) || 0,
    })),
    stats: data.stats ? {
        hitPoints: {
            current: data.stats.hitPoints.current === '' ? 0 : parseInt(data.stats.hitPoints.current, 10) || 0,
            max: data.stats.hitPoints?.max === '' ? null : parseInt(data.stats.hitPoints?.max, 10) || 0,
        },
        fatigue: {
             current: data.stats.fatigue.current === '' ? 0 : parseInt(data.stats.fatigue.current, 10) || 0,
            max: data.stats.fatigue?.max === '' ? 0 : parseInt(data.stats.fatigue?.max, 10) || 0,
        },
         exhaustion: {
             current: data.stats.exhaustion.current === '' ? 0 : parseInt(data.stats.exhaustion.current, 10) || 0,
            max: data.stats.exhaustion?.max === '' ? 0 : parseInt(data.stats.exhaustion?.max, 10) || 0,
        },
         surges: {
             current: data.stats.surges.current === '' ? 0 : parseInt(data.stats.surges.current, 10) || 0,
            max: data.stats.surges?.max === '' ? 0 : parseInt(data.stats.surges?.max, 10) || 0,
        },
    } : null,
    valueData: (data.valueData || []).filter(val => val != null).map(val => ({
        valueId: val.valueId,
    })),
    bodyId: data.bodyId || null, // bodyId is a single ID
    conditions: (data.conditions || [])
      .filter(condition => condition != null)
      .map(condition => {
        if (typeof condition === 'object' && condition.name !== undefined) {
            return condition.name;
        }
        return String(condition);
    }),
    inventoryIds: data.inventoryIds || [].filter(id => id != null),
    equipmentIds: data.equipmentIds || [].filter(id => id != null),
    actionIds: data.actionIds || [].filter(id => id != null),
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
  // Fetch all objects to find body objects (assuming type 'BODY')
  const { data: objectsData, loading: objectsLoading, error: objectsError } = useQuery(LIST_OBJECTS);
  const bodyObjects = objectsData?.listObjects?.filter(obj => obj.objectCategory === 'BODY') || [];


  // State for form data, including dynamic attributes and skills
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    characterId: isEditing ? character?.characterId : undefined, // Include characterId only if editing
    name: "",
    attributeData: [],
    skillData: [],
    stats: { hitPoints: { current: '', max: '' }, fatigue: { current: '', max: '' }, exhaustion: { current: '', max: '' }, surges: { current: '', max: '' } },
    valueData: [], // Initialize as empty array
    bodyId: '', // Initialize as empty string for dropdown selection
    conditions: [],
    inventoryIds: [],
    equipmentIds: [],
    actionIds: [],
  });

  // Effect to populate form data when character prop changes (for editing)
  useEffect(() => {
    if (isEditing && character) {
        setFormData({
            characterId: character.characterId,
            name: character.name || "",
            attributeData: (character.attributeData || []).map(attr => ({
                attributeId: attr.attributeId,
                attributeValue: attr.attributeValue ?? '',
            })),
            skillData: (character.skillData || []).map(skill => ({
                skillId: skill.skillId,
                skillValue: skill.skillValue ?? '',
            })),
             stats: character.stats ? {
                hitPoints: { current: character.stats.hitPoints.current ?? '', max: character.stats.hitPoints.max ?? '' },
                fatigue: { current: character.stats.fatigue.current ?? '', max: character.stats.fatigue.max ?? '' },
                exhaustion: { current: character.stats.exhaustion.current ?? '', max: character.stats.exhaustion.max ?? '' },
                surges: { current: character.stats.surges.current ?? '', max: character.stats.surges.max ?? '' },
            } : { hitPoints: { current: '', max: '' }, fatigue: { current: '', max: '', }, exhaustion: { current: '', max: '' }, surges: { current: '', max: '' } },
            valueData: (character.valueData || []).map(val => ({ // Map valueData
                valueId: val.valueId,
            })),
            bodyId: character.bodyId || '', // Map bodyId
            conditions: character.conditions || [],
            inventoryIds: character.inventoryIds || [],
            equipmentIds: character.equipmentIds || [],
            actionIds: character.actionIds || [],
        });
    } else {
        // For new character, initialize attributeData and skillData based on fetched lists
        if (attributesData?.listAttributes && skillsData?.listSkills) {
             setFormData(prev => ({
                 ...prev,
                 attributeData: attributesData.listAttributes.map(attr => ({
                     attributeId: attr.attributeId,
                     attributeValue: '',
                 })),
                 skillData: skillsData.listSkills.map(skill => ({
                     skillId: skill.skillId,
                     skillValue: '',
                 })),
             }));
         }
    }
  }, [isEditing, character, attributesData, skillsData]);


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

  const loading = createLoading || updateLoading || attributesLoading || skillsLoading || objectsLoading;

  // Modified handleChange to handle valueData (adding/removing by ID) and bodyId
  const handleChange = (e) => {
      const { name, value, type } = e.target;
      const [field, nestedField, deeplyNestedField] = name.split('.');

      setFormData(prev => {
          let updatedFormData = { ...prev };

          if (field === 'attributeData' || field === 'skillData') {
              const id = e.target.dataset.id;
              updatedFormData[field] = (updatedFormData[field] || []).map(item =>
                  item[`${field.slice(0, -4)}Id`] === id
                      ? { ...item, [`${field.slice(0, -4)}Value`]: type === 'number' && value === '' ? '' : value }
                      : item
              );
          } else if (field === 'valueData') {
              // Assuming a way to add/remove valueIds, e.g., a multi-select or add button
              // For simplicity here, let's assume the 'value' input is for adding a single valueId at a time
              // This part needs proper form implementation for adding/removing multiple valueData entries.
              // For now, let's add a simple text input for adding Value IDs and handle parsing on submit.
              // A better approach is needed for a user-friendly interface.
              // This simple implementation will add a new { valueId: value } object to the array.
              // If the form has a way to remove, that logic would be needed too.

              // For a form input that adds a valueId with name="newValueIdInput":
              if (name === 'newValueIdInput') {
                  if (value && !updatedFormData.valueData.some(v => v.valueId === value)) {
                       updatedFormData.valueData = [...(updatedFormData.valueData || []), { valueId: value }];
                  }
              } else {
                   // Handle changes to existing valueData items if form allows editing individual valueIds
                   // This requires a form structure that provides name like valueData[index].valueId
                   // For now, we'll assume direct editing of valueData isn't implemented this way.
              }

          } else if (field === 'bodyId') {
              updatedFormData.bodyId = value; // bodyId is a single string/ID
          } else if (field === 'conditions') {
              // Keep conditions as objects in state, prepareCharacterInput maps them to strings
              // This handleChange logic for conditions is likely not used directly by input fields
              // unless there's a specific input for adding new conditions by name.
              // If there was a text input for adding a condition by name:
              // if (name === 'newConditionNameInput') {
              //     if (value && !updatedFormData.conditions.some(c => c.name === value)) {
              //         updatedFormData.conditions = [...(updatedFormData.conditions || []), { traitId: uuidv4(), name: value }]; // Assuming Trait needs an ID
              //     }
              // } else { ... existing logic ... }
          } else if (nestedField && deeplyNestedField) {
                updatedFormData[field] = {
                    ...updatedFormData[field],
                    [nestedField]: {
                        ...updatedFormData[field]?.[nestedField],
                        [deeplyNestedField]: type === 'number' && value === '' ? '' : value,
                    }
                };
            } else if (nestedField) {
                updatedFormData[field] = { // Removed physical handling here
                    ...updatedFormData[field],
                    [nestedField]: type === 'number' && value === '' ? '' : value,
                };
            }
            else {
               updatedFormData[field] = value;
           }

           return updatedFormData;
       });
   };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
          ...formData,
          name: formData.name || ""
      };

      const cleanedData = stripTypename(dataToSend);
      // prepareCharacterInput handles transformation for valueData and conditions
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
            valueData: inputData.valueData, // Pass valueData
            bodyId: inputData.bodyId, // Pass bodyId
            conditions: inputData.conditions, // Sending the transformed conditions (array of strings)
            inventoryIds: inputData.inventoryIds,
            equipmentIds: inputData.equipmentIds,
            actionIds: inputData.actionIds,
          }
        });
        // Check for null data or errors
        if (!result.data || !result.data.updateCharacter || (result.errors && result.errors.length > 0)) {
            const errorMessages = result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null for updateCharacter or no data.";
            console.error("Error from updateCharacter mutation:", errorMessages, "Full result:", result); // Added more logging
            throw new Error(errorMessages);
        }
        onSuccess(result.data.updateCharacter.characterId);
      } else {
        result = await createCharacter({
          variables: {
            name: inputData.name,
            attributeData: inputData.attributeData,
            skillData: inputData.skillData,
            stats: inputData.stats,
            valueData: inputData.valueData, // Pass valueData
            bodyId: inputData.bodyId, // Pass bodyId
            conditions: inputData.conditions,
            inventoryIds: inputData.inventoryIds,
            equipmentIds: inputData.equipmentIds,
            actionIds: inputData.actionIds,
          }
        });
        // Check for null data or errors
         if (!result.data || !result.data.createCharacter || (result.errors && result.errors.length > 0)) {
            const errorMessages = result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null for createCharacter or no data.";
            console.error("Error from createCharacter mutation:", errorMessages, "Full result:", result); // Added more logging
            throw new Error(errorMessages);
        }
        onSuccess(result.data.createCharacter.characterId);
      }
    } catch (err) {
      console.error("Error saving character:", err);
      let errorMessage = "An unexpected error occurred.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        // GraphQL errors might have a stack trace on individual errors or the main error object
        // For simplicity, we'll use the main error object's stack for now, or indicate if none
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setError({ message: errorMessage, stack: errorStack });
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

  if (loading) return <p>Loading attributes, skills, and objects...</p>; // Updated loading message
  if (attributesError || skillsError || objectsError) return <p>Error loading data: {attributesError?.message || skillsError?.message || objectsError?.message}</p>; // Updated error message


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

        {/* Dynamic Attributes */}
        <h3>Attributes</h3>
        {(attributesData?.listAttributes || []).map(attr => {
             const characterAttribute = formData.attributeData.find(ca => ca.attributeId === attr.attributeId);
             const attributeValue = characterAttribute ? (characterAttribute.attributeValue ?? '') : '';
             return (
                 <div className="form-group" key={attr.attributeId}>
                     <label htmlFor={`attribute-${attr.attributeId}`}>{attr.attributeName}</label>
                     <input
                         type="number"
                         id={`attribute-${attr.attributeId}`}
                         name="attributeData"
                         data-id={attr.attributeId}
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
             const skillValue = characterSkill ? (characterSkill.skillValue ?? '') : '';
             return (
                 <div className="form-group" key={skill.skillId}>
                     <label htmlFor={`skill-${skill.skillId}`}>{skill.skillName} ({skill.skillCategory})</label>
                     <input
                         type="number"
                         id={`skill-${skill.skillId}`}
                         name="skillData"
                         data-id={skill.skillId}
                         value={skillValue}
                         onChange={handleChange}
                         step="1"
                     />
                 </div>
             );
         })}

        {/* Stats */}
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

        {/* Value Data - Assuming a simple text input for Value ID for now */}
        {/* In a real app, this would likely be a multi-select or add/remove interface */}
        <h3>Value Data (Enter Value IDs, comma-separated)</h3>
        <div className="form-group">
             <label htmlFor="valueData">Value IDs</label>
             {/* This input needs logic to parse comma-separated IDs and update valueData state */}
             {/* For simplicity, let's add a temporary input and handle parsing on submit */}
             {/* A better approach is needed for a user-friendly interface */}
             {/* For now, we'll just display the existing valueData IDs */}
             <div>
                 {(formData.valueData || []).map(val => val.valueId).join(', ')}
             </div>
             {/* Add an input field later for adding new values */}
        </div>

        {/* Body ID - Assuming a dropdown to select from available Body objects */}
        <h3>Body</h3>
        <div className="form-group">
            <label htmlFor="bodyId">Body Object</label>
            <select
                id="bodyId"
                name="bodyId"
                value={formData.bodyId || ''}
                onChange={handleChange}
            >
                <option value="">Select a Body Object</option>
                {(bodyObjects || []).map(body => (
                    <option key={body.objectId} value={body.objectId}>
                        {body.name} ({body.objectId})
                    </option>
                ))}
            </select>
        </div>


        {/* Other fields like Conditions, Inventory, Equipment, Actions would need form components */}

        <div className="form-actions">
          <button type="button" onClick={handleCancel}>Cancel</button>
          <button type="submit" disabled={loading}>
            {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create")}
          </button>
        </div>
      </form>
      <ErrorPopup error={error} onClose={() => setError(null)} />
    </div>
  );
};

export default CharacterForm;
