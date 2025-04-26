import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import {
  CREATE_CHARACTER,
  UPDATE_CHARACTER,
  LIST_CHARACTERS,
  LIST_ATTRIBUTES,
  LIST_SKILLS,
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

// Refactored prepareCharacterInput to match schema's PhysicalInput
const prepareCharacterInput = (data, isEditing) => {
  const input = {
    name: data.name || "",
    race: data.race || "",
    attributeData: (data.attributeData || []).map(attr => ({
        attributeId: attr.attributeId,
        attributeValue: attr.attributeValue === '' ? 0 : parseInt(attr.attributeValue, 10) || 0,
    })),
    skillData: (data.skillData || []).map(skill => ({
        skillId: skill.skillId,
        skillValue: skill.skillValue === '' ? 0 : parseInt(skill.skillValue, 10) || 0,
    })),
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
    } : null,
    // Corrected physical structure based on schema
    physical: data.physical ? {
        height: data.physical.height === '' ? 0.0 : parseFloat(data.physical.height) || 0.0,
        bodyFatPercentage: data.physical.bodyFatPercentage === '' ? 0.0 : parseFloat(data.physical.bodyFatPercentage) || 0.0,
        // Flattened size fields
        width: data.physical.width === '' ? 0.0 : parseFloat(data.physical.width) || 0.0,
        length: data.physical.length === '' ? 0.0 : parseFloat(data.physical.length) || 0.0,
        height: data.physical.height === '' ? 0.0 : parseFloat(data.physical.height) || 0.0, // Note: height is already included
        adjacency: data.physical.adjacency === '' ? 0.0 : parseFloat(data.physical.adjacency) || 0.0,
    } : null,
    conditions: data.conditions || [],
    inventoryIds: data.inventoryIds || [],
    equipmentIds: data.equipmentIds || [],
    actionIds: data.actionIds || [],
  };

  // Remove the duplicate height field from physical input
  if (input.physical) {
      const { height, ...restPhysical } = input.physical;
      input.physical = { ...restPhysical, height };
  }


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
    attributeData: [],
    skillData: [],
    stats: { hitPoints: { current: 0, max: 0 }, fatigue: { current: 0, max: 0 }, exhaustion: { current: 0, max: 0 }, surges: { current: 0, max: 0 } },
    // Corrected physical state initialization
    physical: { height: 0.0, bodyFatPercentage: 0.0, width: 0.0, length: 0.0, adjacency: 0.0 },
    conditions: [],
    inventoryIds: [],
    equipmentIds: [],
    actionIds: [],
  });

  // Effect to populate form data when character prop changes (for editing)
  useEffect(() => {
    if (isEditing && character) {
        setFormData({
            name: character.name || "",
            race: character.race || "",
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
            } : { hitPoints: { current: '', max: '' }, fatigue: { current: '', max: '' }, exhaustion: { current: '', max: '' }, surges: { current: '', max: '' } },
             // Corrected physical data mapping for editing
             physical: character.physical ? {
                height: character.physical.height ?? '',
                bodyFatPercentage: character.physical.bodyFatPercentage ?? '',
                width: character.physical.width ?? '',
                length: character.physical.length ?? '',
                adjacency: character.physical.adjacency ?? '',
            } : { height: '', bodyFatPercentage: '', width: '', length: '', adjacency: '' },
            conditions: character.conditions || [],
            inventoryIds: character.inventoryIds || [],
            equipmentIds: character.equipmentIds || [],
            actionIds: character.actionIds || [],
        });
    } else {
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

  const loading = createLoading || updateLoading || attributesLoading || skillsLoading;

  // Modified handleChange to handle flattened physical fields
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
          } else if (nestedField && deeplyNestedField) {
               updatedFormData[field] = {
                   ...updatedFormData[field],
                   [nestedField]: {
                       ...updatedFormData[field]?.[nestedField],
                       [deeplyNestedField]: type === 'number' && value === '' ? '' : value,
                   }
               };
           } else if (nestedField) {
               // Handle flattened physical fields directly under physical
               if (field === 'physical') {
                   updatedFormData.physical = {
                       ...updatedFormData.physical,
                       [nestedField]: type === 'number' && value === '' ? '' : value,
                   };
               } else {
                   // Handle other nested fields like stats
                    updatedFormData[field] = {
                       ...updatedFormData[field],
                       [nestedField]: type === 'number' && value === '' ? '' : value,
                   };
               }
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

        {/* Physical (Corrected structure based on schema) */}
        <h3>Physical</h3>
        <div className="form-group">
             <label htmlFor="physical.height">Height</label>
             <input type="number" id="physical.height" name="physical.height" value={formData.physical?.height ?? ''} onChange={handleChange} step="0.1" />
         </div>
         <div className="form-group">
             <label htmlFor="physical.bodyFatPercentage">Body Fat Percentage</label>
             <input type="number" id="physical.bodyFatPercentage" name="physical.bodyFatPercentage" value={formData.physical?.bodyFatPercentage ?? ''} onChange={handleChange} step="0.1" />
         </div>
         {/* Removed weight input */}
         {/* Flattened size inputs */}
          <div className="form-group">
             <label htmlFor="physical.width">Width</label>
             <input type="number" id="physical.width" name="physical.width" value={formData.physical?.width ?? ''} onChange={handleChange} step="0.1" />
         </div>
          <div className="form-group">
             <label htmlFor="physical.length">Length</label>
             <input type="number" id="physical.length" name="physical.length" value={formData.physical?.length ?? ''} onChange={handleChange} step="0.1" />
         </div>
          {/* Height is already included */}
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
