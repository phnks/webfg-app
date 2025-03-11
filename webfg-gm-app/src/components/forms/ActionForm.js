import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_ACTION, UPDATE_ACTION, LIST_ACTIONS, defaultActionForm } from "../../graphql/operations";
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

// More precise preparation of action data for GraphQL input
const prepareActionInput = (data) => {
  // Create a new input object with only the fields that are in the schema
  // Based on the ActionInput type definition
  const input = {
    name: data.name,
    type: data.type
  };

  // Handle timing - required field
  if (data.timing) {
    input.timing = {
      duration: data.timing.duration,
      timeUnit: data.timing.timeUnit
    };
    
    // Only add initiative if it has values
    if (data.timing.initiative && data.timing.initiative.duration) {
      input.timing.initiative = {
        duration: data.timing.initiative.duration,
        timeUnit: data.timing.initiative.timeUnit || "SECONDS"
      };
      
      // Only add type if it has a non-empty value
      if (data.timing.initiative.type) {
        input.timing.initiative.type = data.timing.initiative.type;
      }
    }
  }

  // Handle effects - carefully construct each phase
  if (data.effects) {
    input.effects = {};
    
    // Process each phase (start, during, end)
    ['start', 'during', 'end'].forEach(phase => {
      if (data.effects[phase]) {
        const effect = data.effects[phase];
        
        // Only include effect in input if it has required fields
        if (effect.type && effect.resource) {
          input.effects[phase] = {
            type: effect.type,
            resource: effect.resource,
            amount: effect.amount,
            range: effect.range,
            targetType: effect.targetType,
            cancelable: effect.cancelable
          };
          
          // Only include speed if it's a number
          const speedNum = parseFloat(effect.speed);
          if (!isNaN(speedNum)) {
            input.effects[phase].speed = speedNum;
          }
        }
      }
    });
    
    // Remove effects completely if empty
    if (Object.keys(input.effects).length === 0) {
      delete input.effects;
    }
  }

  return input;
};

const ActionForm = ({ action, isEditing = false, onClose, onSuccess }) => {
  const initialFormData = isEditing && action 
    ? { ...action }
    : { ...defaultActionForm };

  const [formData, setFormData] = useState(initialFormData);
  
  const [createAction, { loading: createLoading }] = useMutation(CREATE_ACTION, {
    update(cache, { data: { createAction } }) {
      try {
        // Read the current list of actions from the cache
        const { listActions } = cache.readQuery({ query: LIST_ACTIONS }) || { listActions: [] };
        
        // Update the cache with the new action
        cache.writeQuery({
          query: LIST_ACTIONS,
          data: { listActions: [...listActions, createAction] },
        });
        
        console.log("Action created successfully:", createAction);
      } catch (err) {
        console.error("Error updating cache:", err);
      }
    }
  });
  
  const [updateAction, { loading: updateLoading }] = useMutation(UPDATE_ACTION);
  
  const loading = createLoading || updateLoading;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleTypeChange = (e) => {
    setFormData({
      ...formData,
      type: e.target.value
    });
  };
  
  const handleDurationChange = (e) => {
    const timing = formData.timing || {};
    setFormData({
      ...formData,
      timing: {
        ...timing,
        duration: parseInt(e.target.value)
      }
    });
  };
  
  const handleTimeUnitChange = (e) => {
    const timing = formData.timing || {};
    setFormData({
      ...formData,
      timing: {
        ...timing,
        timeUnit: e.target.value
      }
    });
  };
  
  const handleInitiativeDurationChange = (e) => {
    const timing = formData.timing || {};
    const initiative = timing.initiative || {};
    
    setFormData({
      ...formData,
      timing: {
        ...timing,
        initiative: {
          ...initiative,
          duration: parseInt(e.target.value)
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Clean the form data by removing __typename fields
      const cleanedData = stripTypename(formData);
      
      if (isEditing) {
        // Prepare only the fields that belong in ActionInput
        const inputData = prepareActionInput(cleanedData);
        console.log("Updating action with input:", inputData);
        
        const result = await updateAction({
          variables: {
            actionId: action.actionId,
            input: inputData
          }
        });
        
        onSuccess(result.data.updateAction.actionId);
      } else {
        // Prepare only the fields that belong in ActionInput
        const inputData = prepareActionInput(cleanedData);
        console.log("Creating action with input:", inputData);
        
        const result = await createAction({
          variables: {
            input: inputData
          }
        });
        
        onSuccess(result.data.createAction.actionId);
      }
    } catch (err) {
      console.error("Error saving action:", err);
      if (err.graphQLErrors) {
        console.error("GraphQL Errors:", err.graphQLErrors);
      }
      if (err.networkError) {
        console.error("Network Error:", err.networkError);
      }
    }
  };
  
  const setEffect = (phase, effect) => {
    const newEffects = {...formData.effects || {}};
    newEffects[phase] = effect;
    setFormData({
      ...formData,
      effects: newEffects
    });
  };
  
  const handleAddEffect = (phase) => {
    const newEffect = {
      type: "MODIFY_RESOURCE",
      amount: 0,
      cancelable: false,
      range: "SELF",
      resource: "FATIGUE",
      speed: "",
      targetType: "CHARACTER"
    };
    
    setEffect(phase, newEffect);
  };
  
  const handleRemoveEffect = (phase) => {
    const newEffects = {...formData.effects};
    newEffects[phase] = null;
    setFormData({
      ...formData,
      effects: newEffects
    });
  };
  
  const handleEffectFieldChange = (phase, field, value) => {
    if (field === "amount") {
      value = parseFloat(value);
    }
    
    if (field === "cancelable") {
      value = value === "true";
    }
    
    const newEffects = {...formData.effects};
    if (newEffects[phase]) {
      newEffects[phase] = {
        ...newEffects[phase],
        [field]: value
      };
      
      setFormData({
        ...formData,
        effects: newEffects
      });
    }
  };
  
  const renderEffectForm = (phase) => {
    const effect = formData.effects?.[phase];
    
    if (!effect) {
      return (
        <div className="effect-container">
          <h4>{phase.charAt(0).toUpperCase() + phase.slice(1)} Phase</h4>
          <button 
            type="button"
            onClick={() => handleAddEffect(phase)}
            className="add-effect-button"
          >
            Add Effect
          </button>
        </div>
      );
    }
    
    return (
      <div className="effect-container">
        <h4>{phase.charAt(0).toUpperCase() + phase.slice(1)} Phase</h4>
        
        <div className="effect-field">
          <label>Type</label>
          <select 
            value={effect.type}
            onChange={(e) => handleEffectFieldChange(phase, "type", e.target.value)}
          >
            <option value="MODIFY_RESOURCE">Modify Resource</option>
            <option value="DAMAGE">Damage</option>
            <option value="HEAL">Heal</option>
            <option value="BUFF">Buff</option>
            <option value="DEBUFF">Debuff</option>
            <option value="CONTROL">Control</option>
            <option value="UTILITY">Utility</option>
          </select>
        </div>
        
        <div className="effect-field">
          <label>Resource</label>
          <select 
            value={effect.resource}
            onChange={(e) => handleEffectFieldChange(phase, "resource", e.target.value)}
          >
            <option value="HEALTH">Health</option>
            <option value="MANA">Mana</option>
            <option value="STAMINA">Stamina</option>
            <option value="FATIGUE">Fatigue</option>
            <option value="FOCUS">Focus</option>
          </select>
        </div>
        
        <div className="effect-field">
          <label>Amount</label>
          <input 
            type="number"
            value={effect.amount}
            onChange={(e) => handleEffectFieldChange(phase, "amount", e.target.value)}
          />
        </div>
        
        <div className="effect-field">
          <label>Range</label>
          <select 
            value={effect.range}
            onChange={(e) => handleEffectFieldChange(phase, "range", e.target.value)}
          >
            <option value="SELF">Self</option>
            <option value="TOUCH">Touch</option>
            <option value="MELEE">Melee</option>
            <option value="RANGED">Ranged</option>
            <option value="AREA">Area</option>
          </select>
        </div>
        
        <div className="effect-field">
          <label>Target Type</label>
          <select 
            value={effect.targetType}
            onChange={(e) => handleEffectFieldChange(phase, "targetType", e.target.value)}
          >
            <option value="CHARACTER">Character</option>
            <option value="OBJECT">Object</option>
            <option value="AREA">Area</option>
          </select>
        </div>
        
        <div className="effect-field">
          <label>Cancelable</label>
          <select 
            value={effect.cancelable.toString()}
            onChange={(e) => handleEffectFieldChange(phase, "cancelable", e.target.value)}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        
        <div className="effect-field">
          <label>Speed</label>
          <input 
            type="text"
            value={effect.speed}
            onChange={(e) => handleEffectFieldChange(phase, "speed", e.target.value)}
          />
        </div>
        
        <button 
          type="button" 
          className="remove-effect-button"
          onClick={() => handleRemoveEffect(phase)}
        >
          Remove Effect
        </button>
      </div>
    );
  };

  return (
    <div className="form-container">
      <h2>{isEditing ? "Edit Action" : "Create Action"}</h2>
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
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type || ""}
            onChange={handleTypeChange}
            required
          >
            <option value="">Select Type</option>
            <option value="GENERAL">General</option>
            <option value="STRENGTH">Strength</option>
            <option value="AGILITY">Agility</option>
            <option value="DEXTERITY">Dexterity</option>
            <option value="ENDURANCE">Endurance</option>
            <option value="INTELLIGENCE">Intelligence</option>
            <option value="CHARISMA">Charisma</option>
            <option value="PERCEPTION">Perception</option>
            <option value="RESOLVE">Resolve</option>
            <option value="COMBAT">Combat</option>
            <option value="MAGIC">Magic</option>
          </select>
        </div>
        
        <h3>Timing</h3>
        <div className="form-group">
          <label htmlFor="duration">Duration</label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.timing?.duration || 0}
            onChange={handleDurationChange}
            min="0"
            step="0.1"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="timeUnit">Time Unit</label>
          <select
            id="timeUnit"
            name="timeUnit"
            value={formData.timing?.timeUnit || "SECONDS"}
            onChange={handleTimeUnitChange}
          >
            <option value="SECONDS">Seconds</option>
            <option value="MINUTES">Minutes</option>
            <option value="HOURS">Hours</option>
            <option value="DAYS">Days</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="initiativeDuration">Initiative Duration</label>
          <input
            type="number"
            id="initiativeDuration"
            name="initiativeDuration"
            value={formData.timing?.initiative?.duration || 0}
            onChange={handleInitiativeDurationChange}
            min="0"
          />
        </div>
        
        <h3>Effects</h3>
        <div className="effects-container">
          {renderEffectForm('start')}
          {renderEffectForm('during')}
          {renderEffectForm('end')}
        </div>
        
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

export default ActionForm; 