import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { 
  CREATE_CHARACTER, 
  UPDATE_CHARACTER,
  LIST_CHARACTERS,
  defaultAttributes,
  defaultSkills,
  defaultStats,
  defaultPhysical 
} from "../../graphql/operations";
import "./Form.css";

// Recursive component to handle nested form fields
const NestedFormFields = ({ data, path = [], onChange, labelPrefix = "" }) => {
  if (typeof data !== 'object' || data === null) {
    // Render input for primitive values
    const fieldName = path[path.length - 1];
    const isNumeric = typeof data === 'number';
    const formattedLabel = labelPrefix 
      ? `${labelPrefix} ${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`
      : fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    
    return (
      <div className="form-group">
        <label htmlFor={path.join('-')}>{formattedLabel}</label>
        <input
          type={isNumeric ? "number" : "text"}
          id={path.join('-')}
          value={data}
          onChange={(e) => {
            const newValue = isNumeric ? parseInt(e.target.value, 10) : e.target.value;
            onChange(path, newValue);
          }}
        />
      </div>
    );
  }
  
  // Check if it's an array
  if (Array.isArray(data)) {
    // For arrays, render each item with its index in the path
    return (
      <div className="nested-array">
        {data.map((item, index) => (
          <NestedFormFields 
            key={index}
            data={item}
            path={[...path, index]}
            onChange={onChange}
            labelPrefix={`${labelPrefix} ${index + 1}`}
          />
        ))}
      </div>
    );
  }
  
  // Handle objects
  return (
    <div className="nested-object">
      {/* If not root level and has a name, show section header */}
      {path.length > 0 && (
        <h4 className="section-title">
          {path[path.length - 1].charAt(0).toUpperCase() + path[path.length - 1].slice(1)}
        </h4>
      )}
      
      <div className="form-grid">
        {Object.entries(data).map(([key, value]) => {
          const newPath = [...path, key];
          const newPrefix = labelPrefix 
            ? `${labelPrefix} ${key.charAt(0).toUpperCase() + key.slice(1)}`
            : "";
            
          // Special case for attribute objects with consistent structure
          if (value && typeof value === 'object' && 'base' in value && 'current' in value && 'max' in value) {
            return (
              <div key={key} className="attribute-group">
                <h5>{key.charAt(0).toUpperCase() + key.slice(1)}</h5>
                <div className="attribute-fields">
                  <div className="form-group">
                    <label htmlFor={`${newPath.join('-')}-base`}>Base</label>
                    <input
                      type="number"
                      id={`${newPath.join('-')}-base`}
                      value={value.base}
                      onChange={(e) => onChange([...newPath, 'base'], parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`${newPath.join('-')}-current`}>Current</label>
                    <input
                      type="number"
                      id={`${newPath.join('-')}-current`}
                      value={value.current}
                      onChange={(e) => onChange([...newPath, 'current'], parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`${newPath.join('-')}-max`}>Max</label>
                    <input
                      type="number"
                      id={`${newPath.join('-')}-max`}
                      value={value.max}
                      onChange={(e) => onChange([...newPath, 'max'], parseInt(e.target.value, 10))}
                    />
                  </div>
                </div>
              </div>
            );
          }
          
          // Handle size object specially for better layout
          if (key === 'size' && typeof value === 'object') {
            return (
              <div key={key} className="size-group">
                <h5>Size</h5>
                <div className="size-fields">
                  {Object.entries(value).map(([sizeKey, sizeVal]) => (
                    <div key={sizeKey} className="form-group">
                      <label htmlFor={`${newPath.join('-')}-${sizeKey}`}>
                        {sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)}
                      </label>
                      <input
                        type="number"
                        id={`${newPath.join('-')}-${sizeKey}`}
                        value={sizeVal}
                        onChange={(e) => onChange([...newPath, sizeKey], parseInt(e.target.value, 10))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          
          // Recursive case for other nested objects
          return (
            <NestedFormFields
              key={key}
              data={value}
              path={newPath}
              onChange={onChange}
              labelPrefix={newPrefix}
            />
          );
        })}
      </div>
    </div>
  );
};

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

const CharacterForm = ({ character, isEditing = false, onClose, onSuccess }) => {
  // Initialize with defaults or existing character data
  const getInitialFormData = () => {
    if (isEditing && character) {
      return {
        name: character.name || "",
        race: character.race || "HUMAN",
        attributes: character.attributes ? JSON.parse(JSON.stringify(character.attributes)) : { ...defaultAttributes },
        skills: character.skills ? JSON.parse(JSON.stringify(character.skills)) : { ...defaultSkills },
        stats: character.stats ? JSON.parse(JSON.stringify(character.stats)) : { ...defaultStats },
        physical: character.physical ? JSON.parse(JSON.stringify(character.physical)) : { ...defaultPhysical }
      };
    }
    
    return {
      name: "",
      race: "HUMAN",
      attributes: { ...defaultAttributes },
      skills: { ...defaultSkills },
      stats: { ...defaultStats },
      physical: { ...defaultPhysical }
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  
  // Re-initialize if character changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [isEditing, character]);

  const [createCharacter, { loading: createLoading }] = useMutation(CREATE_CHARACTER, {
    update(cache, { data: { createCharacter } }) {
      const { listCharacters } = cache.readQuery({ query: LIST_CHARACTERS }) || { listCharacters: [] };
      cache.writeQuery({
        query: LIST_CHARACTERS,
        data: { listCharacters: [...listCharacters, createCharacter] },
      });
    }
  });
  
  const [updateCharacter, { loading: updateLoading }] = useMutation(UPDATE_CHARACTER);

  const loading = createLoading || updateLoading;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const updateNestedFormData = (path, value) => {
    const newFormData = { ...formData };
    let current = newFormData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    setFormData(newFormData);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create clean copies of form data with __typename stripped out
      const cleanedData = {
        name: formData.name,
        race: formData.race,
        attributes: stripTypename(formData.attributes),
        skills: stripTypename(formData.skills),
        stats: stripTypename(formData.stats),
        physical: stripTypename(formData.physical),
      };
      
      if (isEditing) {
        // Add character ID for updates
        cleanedData.characterId = character.characterId;
        
        // Debug: Log the cleaned mutation variables
        console.log("Updating character with cleaned data:", cleanedData);
        
        // Update existing character
        const result = await updateCharacter({
          variables: cleanedData
        });
        
        onSuccess(result.data.updateCharacter.characterId);
      } else {
        // Debug: Log the cleaned mutation variables
        console.log("Creating character with cleaned data:", cleanedData);
        
        // Create new character
        const result = await createCharacter({
          variables: cleanedData
        });
        
        onSuccess(result.data.createCharacter.characterId);
      }
    } catch (err) {
      console.error("Error saving character:", err);
      // Log the error details
      if (err.graphQLErrors) {
        console.error("GraphQL Errors:", err.graphQLErrors);
      }
      if (err.networkError) {
        console.error("Network Error:", err.networkError);
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
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="race">Race</label>
          <select
            id="race"
            name="race"
            value={formData.race}
            onChange={handleChange}
          >
            <option value="HUMAN">Human</option>
            <option value="ELF">Elf</option>
            <option value="DWARF">Dwarf</option>
            <option value="HALFLING">Halfling</option>
            <option value="GNOME">Gnome</option>
            <option value="HALF_ORC">Half-Orc</option>
            <option value="HALF_ELF">Half-Elf</option>
          </select>
        </div>
        
        <h3>Attributes</h3>
        <NestedFormFields 
          data={formData.attributes} 
          path={['attributes']} 
          onChange={updateNestedFormData} 
        />
        
        <h3>Skills</h3>
        <NestedFormFields 
          data={formData.skills} 
          path={['skills']} 
          onChange={updateNestedFormData} 
        />
        
        <h3>Stats</h3>
        <NestedFormFields 
          data={formData.stats} 
          path={['stats']} 
          onChange={updateNestedFormData} 
        />
        
        <h3>Physical</h3>
        <NestedFormFields 
          data={formData.physical} 
          path={['physical']} 
          onChange={updateNestedFormData} 
        />
        
        <div className="form-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={loading}>
            {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CharacterForm; 