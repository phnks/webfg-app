import React, { useState, useEffect } from "react"; // Added useEffect
import { useQuery, useMutation } from "@apollo/client"; // Added useQuery
import {
  CREATE_ACTION,
  UPDATE_ACTION,
  LIST_ACTIONS,
  LIST_FORMULAS, // Import LIST_FORMULAS
  defaultActionForm
} from "../../graphql/operations";
import "./Form.css";
// Define Enums used in the form
const ActionCategory = ["MOVE", "ATTACK", "DEFEND", "RECOVER", "INTERACT", "MANIPULATE", "ASSIST"];
const Units = ["POUNDS", "FEET", "SECONDS"];
const TargetType = ["ACTION", "SELF", "OBJECT", "CHARACTER", "LOCATION"];
const SourceType = ["ACTION", "SELF", "OBJECT", "CHARACTER", "LOCATION"];
const EffectType = ["MODIFY_STAT", "MODIFY_SKILL", "MODIFY_ATTRIBUTE", "CANCEL_MOVE", "MOVE", "HIT", "CANCEL_HIT"];

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

// Updated preparation function for the new ActionInput structure
const prepareActionInput = (data) => {
  const input = {
    name: data.name,
    actionCategory: data.actionCategory,
    initDurationId: data.initDurationId,
    defaultInitDuration: parseFloat(data.defaultInitDuration) || 0.0,
    durationId: data.durationId,
    defaultDuration: parseFloat(data.defaultDuration) || 0.0,
    fatigueCost: parseInt(data.fatigueCost) || 0,
    difficultyClassId: data.difficultyClassId,
    guaranteedFormulaId: data.guaranteedFormulaId,
    units: data.units || null, // Handle optional enum
    description: data.description || "",
    // Ensure arrays are always present, even if empty
    actionTargets: data.actionTargets ? data.actionTargets.map(stripTypename) : [],
    actionSources: data.actionSources ? data.actionSources.map(stripTypename) : [],
    actionEffects: data.actionEffects ? data.actionEffects.map(stripTypename) : [],
  };

  // Remove null/empty IDs before sending
  if (!input.initDurationId) delete input.initDurationId;
  if (!input.durationId) delete input.durationId;
  if (!input.difficultyClassId) delete input.difficultyClassId;
  if (!input.guaranteedFormulaId) delete input.guaranteedFormulaId;
  if (!input.units) delete input.units; // Remove if null/empty

  return input;
};

const ActionForm = ({ action, isEditing = false, onClose, onSuccess }) => {
  const initialFormData = isEditing && action
    ? { ...defaultActionForm, ...action } // Merge defaults with existing action data
    : { ...defaultActionForm };

  const [formData, setFormData] = useState(initialFormData);

  // Fetch existing formulas
  const { data: formulasData, loading: formulasLoading, error: formulasError } = useQuery(LIST_FORMULAS);

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
     const { name, value, type } = e.target;
     // Handle numeric inputs specifically
     const numericFields = ['defaultInitDuration', 'defaultDuration', 'fatigueCost'];
    const parsedValue = type === 'number' ? parseFloat(value) : value;
    const finalValue = numericFields.includes(name) && isNaN(parsedValue) ? 0 : parsedValue;

    setFormData({ ...formData, [name]: finalValue });
  };

  // Removed old handlers for type, duration, timeUnit, initiativeDuration

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

   // --- Handlers for Targets, Sources, Effects Arrays ---

   const handleArrayChange = (arrayName, index, field, value) => {
     setFormData(prev => {
       const newArray = [...(prev[arrayName] || [])]; // Ensure array exists
       // Ensure the item exists at the index
       if (newArray[index]) {
          // Handle numeric fields
          const numericFields = ['quantity', 'sequenceId'];
          const parsedValue = numericFields.includes(field) ? parseInt(value, 10) : value;
          newArray[index] = { ...newArray[index], [field]: isNaN(parsedValue) ? 0 : parsedValue };
       }
       return { ...prev, [arrayName]: newArray };
     });
   };

   const addArrayItem = (arrayName, defaultItem) => {
     setFormData(prev => ({
       ...prev,
       [arrayName]: [...(prev[arrayName] || []), { ...defaultItem, sequenceId: (prev[arrayName]?.length || 0) + 1 }]
     }));
   };

   const removeArrayItem = (arrayName, index) => {
     setFormData(prev => ({
       ...prev,
       [arrayName]: (prev[arrayName] || []).filter((_, i) => i !== index)
     }));
   };

   // --- Render Functions for Array Items ---

   const renderTargetForm = (target, index) => (
     <div key={`target-${index}`} className="array-item-form">
       <h5>Target {index + 1}</h5>
       <div className="form-grid-small">
         <div className="form-group">
           <label>Type</label>
           <select value={target.targetType || ""} onChange={(e) => handleArrayChange('actionTargets', index, 'targetType', e.target.value)}>
             {TargetType.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
         </div>
         <div className="form-group">
           <label>Quantity</label>
           <input type="number" value={target.quantity || 1} onChange={(e) => handleArrayChange('actionTargets', index, 'quantity', e.target.value)} />
         </div>
          <div className="form-group">
           <label>Sequence ID</label>
           <input type="number" value={target.sequenceId || index + 1} onChange={(e) => handleArrayChange('actionTargets', index, 'sequenceId', e.target.value)} />
         </div>
       </div>
       <button type="button" onClick={() => removeArrayItem('actionTargets', index)} className="remove-item-button">Remove Target</button>
     </div>
   );

   const renderSourceForm = (source, index) => (
      <div key={`source-${index}`} className="array-item-form">
       <h5>Source {index + 1}</h5>
        <div className="form-grid-small">
         <div className="form-group">
           <label>Type</label>
           <select value={source.sourceType || ""} onChange={(e) => handleArrayChange('actionSources', index, 'sourceType', e.target.value)}>
             {SourceType.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
         </div>
         <div className="form-group">
           <label>Quantity</label>
           <input type="number" value={source.quantity || 1} onChange={(e) => handleArrayChange('actionSources', index, 'quantity', e.target.value)} />
         </div>
          <div className="form-group">
           <label>Sequence ID</label>
           <input type="number" value={source.sequenceId || index + 1} onChange={(e) => handleArrayChange('actionSources', index, 'sequenceId', e.target.value)} />
         </div>
       </div>
       <button type="button" onClick={() => removeArrayItem('actionSources', index)} className="remove-item-button">Remove Source</button>
     </div>
   );

   const renderEffectForm = (effect, index) => (
      <div key={`effect-${index}`} className="array-item-form">
        <h5>Effect {index + 1}</h5>
        <div className="form-grid-small">
         <div className="form-group">
           <label>Type</label>
           <select value={effect.effectType || ""} onChange={(e) => handleArrayChange('actionEffects', index, 'effectType', e.target.value)}>
             {EffectType.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
         </div>
         <div className="form-group">
           <label>Quantity</label>
           <input type="number" value={effect.quantity || 1} onChange={(e) => handleArrayChange('actionEffects', index, 'quantity', e.target.value)} />
         </div>
          <div className="form-group">
           <label>Sequence ID</label>
           <input type="number" value={effect.sequenceId || index + 1} onChange={(e) => handleArrayChange('actionEffects', index, 'sequenceId', e.target.value)} />
         </div>
       </div>
       <button type="button" onClick={() => removeArrayItem('actionEffects', index)} className="remove-item-button">Remove Effect</button>
     </div>
   );

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

        {/* Removed old 'Type' dropdown */}

         <div className="form-group">
          <label htmlFor="actionCategory">Category</label>
          <select
            id="actionCategory"
            name="actionCategory"
            value={formData.actionCategory || ""}
            onChange={handleChange}
            required
          >
            {ActionCategory.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* --- Formula Selection --- */}
        <h3>Formulas</h3>
        {formulasLoading && <p>Loading formulas...</p>}
        {formulasError && <p>Error loading formulas: {formulasError.message}</p>}
        <div className="form-group">
          <label htmlFor="initDurationId">Initial Duration Formula</label>
          <select id="initDurationId" name="initDurationId" value={formData.initDurationId || ""} onChange={handleChange}>
             <option value="">-- Select Formula --</option>
             {formulasData?.listFormulas.map(f => <option key={f.formulaId} value={f.formulaId}>{f.formulaValue}</option>)}
          </select>
        </div>
         <div className="form-group">
          <label htmlFor="durationId">Duration Formula</label>
           <select id="durationId" name="durationId" value={formData.durationId || ""} onChange={handleChange}>
             <option value="">-- Select Formula --</option>
             {formulasData?.listFormulas.map(f => <option key={f.formulaId} value={f.formulaId}>{f.formulaValue}</option>)}
          </select>
        </div>
         <div className="form-group">
          <label htmlFor="difficultyClassId">Difficulty Class Formula</label>
           <select id="difficultyClassId" name="difficultyClassId" value={formData.difficultyClassId || ""} onChange={handleChange}>
             <option value="">-- Select Formula --</option>
             {formulasData?.listFormulas.map(f => <option key={f.formulaId} value={f.formulaId}>{f.formulaValue}</option>)}
          </select>
        </div>
         <div className="form-group">
          <label htmlFor="guaranteedFormulaId">Guaranteed Formula</label>
           <select id="guaranteedFormulaId" name="guaranteedFormulaId" value={formData.guaranteedFormulaId || ""} onChange={handleChange}>
             <option value="">-- Select Formula --</option>
             {formulasData?.listFormulas.map(f => <option key={f.formulaId} value={f.formulaId}>{f.formulaValue}</option>)}
          </select>
        </div>
        {/* --- End Formula Selection --- */}

        <h3>Defaults & Costs</h3>
         <div className="form-group">
          <label htmlFor="defaultInitDuration">Default Initial Duration</label>
          <input
            type="number"
            id="defaultInitDuration"
            name="defaultInitDuration"
            value={formData.defaultInitDuration || 0}
            onChange={handleChange}
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label htmlFor="defaultDuration">Default Duration</label>
          <input
            type="number"
            id="defaultDuration"
            name="defaultDuration"
            value={formData.defaultDuration || 0}
            onChange={handleChange}
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label htmlFor="fatigueCost">Fatigue Cost</label>
          <input
            type="number"
            id="fatigueCost"
            name="fatigueCost"
            value={formData.fatigueCost || 0}
            onChange={handleChange}
            step="1"
          />
        </div>
        <div className="form-group">
          <label htmlFor="units">Units</label>
          <select
            id="units"
            name="units"
            value={formData.units || ""}
            onChange={handleChange}
          >
            <option value="">-- None --</option>
            {Units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
          />
        </div>

        {/* --- Targets --- */}
        <div className="array-section">
          <h3>Targets</h3>
          {(formData.actionTargets || []).map((target, index) => renderTargetForm(target, index))}
          <button
            type="button"
            onClick={() => addArrayItem('actionTargets', { targetType: TargetType[0], quantity: 1 })}
            className="add-item-button"
          >
            Add Target
          </button>
        </div>

        {/* --- Sources --- */}
         <div className="array-section">
          <h3>Sources</h3>
          {(formData.actionSources || []).map((source, index) => renderSourceForm(source, index))}
          <button
            type="button"
            onClick={() => addArrayItem('actionSources', { sourceType: SourceType[0], quantity: 1 })}
            className="add-item-button"
          >
            Add Source
          </button>
        </div>

        {/* --- Effects --- */}
         <div className="array-section">
          <h3>Effects</h3>
          {(formData.actionEffects || []).map((effect, index) => renderEffectForm(effect, index))}
          <button
            type="button"
            onClick={() => addArrayItem('actionEffects', { effectType: EffectType[0], quantity: 1 })}
            className="add-item-button"
          >
            Add Effect
          </button>
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
