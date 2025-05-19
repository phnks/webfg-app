import React, { useState, useEffect } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import {
  CREATE_ACTION,
  UPDATE_ACTION,
  LIST_ACTIONS,
  LIST_FORMULAS,
  CREATE_FORMULA
} from "../../graphql/operations";
import "./Form.css";

const ActionCategory = ["MOVE", "ATTACK", "DEFEND", "RECOVER", "INTERACT", "MANIPULATE", "ASSIST"];
const Units = ["POUNDS", "FEET", "SECONDS"];
const TargetType = ["ACTION", "SELF", "OBJECT", "CHARACTER", "LOCATION"];
const SourceType = ["ACTION", "SELF", "OBJECT", "CHARACTER", "LOCATION"];
const EffectType = ["MODIFY_STAT", "MODIFY_SKILL", "MODIFY_ATTRIBUTE", "CANCEL_MOVE", "MOVE", "HIT", "CANCEL_HIT"];

const defaultActionForm = {
  name: '',
  actionCategory: ActionCategory[0],
  initDurationId: '',
  defaultInitDuration: '',
  durationId: '',
  defaultDuration: '',
  fatigueCost: '',
  difficultyClassId: '',
  guaranteedFormulaId: '',
  units: Units[0],
  description: '',
  actionTargets: [],
  actionSources: [],
  actionEffects: []
};

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

const prepareActionInput = (data, isEditing) => {
  const input = {
    name: data.name,
    actionCategory: data.actionCategory,
    initDurationId: data.initDurationId,
    defaultInitDuration: data.defaultInitDuration === '' ? 0.0 : parseFloat(data.defaultInitDuration || 0.0),
    durationId: data.durationId,
    defaultDuration: data.defaultDuration === '' ? 0.0 : parseFloat(data.defaultDuration || 0.0),
    fatigueCost: data.fatigueCost === '' ? 0 : parseInt(data.fatigueCost, 10) || 0,
    difficultyClassId: data.difficultyClassId,
    guaranteedFormulaId: data.guaranteedFormulaId,
    units: data.units || null,
    description: data.description || "",
    actionTargets: (data.actionTargets || []).map(item => stripTypename(item)),
    actionSources: (data.actionSources || []).map(item => stripTypename(item)),
    actionEffects: (data.actionEffects || []).map(item => stripTypename(item)),
  };
  if (!isEditing) {
      delete input.actionId;
  }
  return input;
};

const ActionForm = ({ action, isEditing = false, onClose, onSuccess }) => {
  const initialFormData = isEditing && action
    ? { ...defaultActionForm, ...action }
    : { ...defaultActionForm };

  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [newFormulaTexts, setNewFormulaTexts] = useState({
    initDuration: '',
    duration: '',
    difficultyClass: '',
    guaranteedFormula: ''
  });
  const navigate = useNavigate();

  const { data: formulasData, loading: formulasLoading, error: formulasError, refetch: refetchFormulas } = useQuery(LIST_FORMULAS);

  const [createFormula] = useMutation(CREATE_FORMULA);

  const [createAction, { loading: createLoading }] = useMutation(CREATE_ACTION, {
    update(cache, { data: { createAction } }) {
      try {
        const { listActions } = cache.readQuery({ query: LIST_ACTIONS }) || { listActions: [] };
        cache.writeQuery({
          query: LIST_ACTIONS,
          data: { listActions: [...listActions, createAction] },
        });
        console.log("Action created successfully:", createAction);
        refetchFormulas();
      } catch (err) {
        console.error("Error updating cache:", err);
      }
    }
  });

  const [updateAction, { loading: updateLoading }] = useMutation(UPDATE_ACTION, {
     update(cache, { data: { updateAction } }) {
         refetchFormulas();
     }
  });

  const loading = createLoading || updateLoading;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' && value === '' ? '' : value;
    setFormData({ ...formData, [name]: finalValue });
  };

  const handleNewFormulaTextChange = (e) => {
    const { name, value } = e.target;
    setNewFormulaTexts(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
      const textInputName = name.replace('Id', '');
      setNewFormulaTexts(prev => ({ ...prev, [textInputName]: '' }));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => {
      const newArray = [...(prev[arrayName] || [])];
      if (!newArray[index]) {
          console.warn(`Attempted to change item at index ${index} in ${arrayName}, but it doesn't exist.`);
          return prev;
      }

      let finalValue = value;
      const numericFields = ['quantity', 'sequenceId'];
      if (numericFields.includes(field)) {
        const parsedValue = parseInt(value, 10);
        finalValue = value === '' ? '' : (isNaN(parsedValue) ? 0 : parsedValue);
      }

      newArray[index] = { ...newArray[index], [field]: finalValue };
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const cleanedData = stripTypename(formData);
      const inputData = prepareActionInput(cleanedData, isEditing);

      const formulaIdsToLink = {};
      const formulaFields = ['initDuration', 'duration', 'difficultyClass', 'guaranteedFormula'];

      for (const field of formulaFields) {
          const text = newFormulaTexts[field];
          const dropdownId = formData[`${field}Id`];

          if (text) {
              console.log(`Creating new formula for ${field}: ${text}`);
              const formulaResult = await createFormula({
                  variables: { input: { formulaValue: text } }
              });
              // Check for null data or errors (including null values for all keys in data)
              if (!formulaResult.data || (formulaResult.errors && formulaResult.errors.length > 0) || (formulaResult.data && Object.values(formulaResult.data).every(value => value === null))) {
                  throw new Error(formulaResult.errors ? formulaResult.errors.map(e => e.message).join("\n") : "Formula creation returned null data.");
              }
              formulaIdsToLink[`${field}Id`] = formulaResult.data.createFormula.formulaId;
          } else if (dropdownId) {
              formulaIdsToLink[`${field}Id`] = dropdownId;
          } else {
               // With required IDs in backend, this should result in a GraphQL error if not handled client-side
               // We rely on the user providing either text or selecting from the dropdown.
               // If neither, the backend validation will catch it.
               formulaIdsToLink[`${field}Id`] = ""; // Pass empty string if neither, backend will validate ID!
          }
      }

      const finalInputData = { ...inputData, ...formulaIdsToLink };

      console.log(isEditing ? "Updating action with input:" : "Creating action with input:", finalInputData);

      let result;
      if (isEditing) {
        result = await updateAction({
          variables: {
            actionId: action.actionId,
            input: finalInputData
          }
        });
        if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
            throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
        }
        onSuccess(result.data.updateAction.actionId);
      } else {
        result = await createAction({
          variables: {
            input: finalInputData
          }
        });
        if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
            throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
        }
        onSuccess(result.data.createAction.actionId);
      }
    } catch (err) {
      console.error("Error saving action:", err);
      let errorMessage = "An unexpected error occurred.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
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
          <input type="number" value={target.quantity ?? ''} onChange={(e) => handleArrayChange('actionTargets', index, 'quantity', e.target.value)} />
        </div>
         <div className="form-group">
          <label>Sequence ID</label>
          <input type="number" value={target.sequenceId ?? ''} onChange={(e) => handleArrayChange('actionTargets', index, 'sequenceId', e.target.value)} />
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
          <input type="number" value={source.quantity ?? ''} onChange={(e) => handleArrayChange('actionSources', index, 'quantity', e.target.value)} />
        </div>
         <div className="form-group">
          <label>Sequence ID</label>
          <input type="number" value={source.sequenceId ?? ''} onChange={(e) => handleArrayChange('actionSources', index, 'sequenceId', e.target.value)} />
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
          <input type="number" value={effect.quantity ?? ''} onChange={(e) => handleArrayChange('actionEffects', index, 'quantity', e.target.value)} />
        </div>
         <div className="form-group">
          <label htmlFor="sequenceId">Sequence ID</label>
          <input type="number" id="sequenceId" value={effect.sequenceId ?? ''} onChange={(e) => handleArrayChange('actionEffects', index, 'sequenceId', e.target.value)} />
        </div>
      </div>
      <button type="button" onClick={() => removeArrayItem('actionEffects', index)} className="remove-item-button">Remove Effect</button>
    </div>
  );


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

        {/* --- Formula Selection / Creation --- */}
        <h3>Formulas</h3>
        {formulasLoading && <p>Loading formulas...</p>}
        {formulasError && <p>Error loading formulas: {formulasError.message}</p>}

        {/* Initial Duration Formula */}
        <div className="form-group form-group-formula">
          <label htmlFor="initDurationId">Initial Duration Formula</label>
          <select
            id="initDurationId"
            name="initDurationId"
            value={formData.initDurationId || ""}
            onChange={handleDropdownChange}
            disabled={!!newFormulaTexts.initDuration}
          >
             <option value="">-- Select Existing --</option>
             {formulasData?.listFormulas.map(f => <option key={f.formulaId} value={f.formulaId}>{f.formulaValue}</option>)}
          </select>
          <div className="formula-text-input">
             <span>OR Enter New:</span>
             <input
               type="text"
               name="initDuration"
               value={newFormulaTexts.initDuration}
               onChange={handleNewFormulaTextChange}
               disabled={!!formData.initDurationId}
             />
          </div>
        </div>

        {/* Duration Formula */}
         <div className="form-group form-group-formula">
          <label htmlFor="durationId">Duration Formula</label>
           <select
             id="durationId"
             name="durationId"
             value={formData.durationId || ""}
             onChange={handleDropdownChange}
             disabled={!!newFormulaTexts.duration}
           >
             <option value="">-- Select Existing --</option>
             {formulasData?.listFormulas.map(f => <option key={f.formulaId} value={f.formulaId}>{f.formulaValue}</option>)}
          </select>
          <div className="formula-text-input">
             <span>OR Enter New:</span>
             <input
               type="text"
               name="duration"
               value={newFormulaTexts.duration}
               onChange={handleNewFormulaTextChange}
               disabled={!!formData.durationId}
             />
          </div>
        </div>

        {/* Difficulty Class Formula */}
         <div className="form-group form-group-formula">
          <label htmlFor="difficultyClassId">Difficulty Class Formula</label>
           <select
             id="difficultyClassId"
             name="difficultyClassId"
             value={formData.difficultyClassId || ""}
             onChange={handleDropdownChange}
             disabled={!!newFormulaTexts.difficultyClass}
           >
             <option value="">-- Select Existing --</option>
             {formulasData?.listFormulas.map(f => <option key={f.formulaId} value={f.formulaId}>{f.formulaValue}</option>)}
          </select>
           <div className="formula-text-input">
             <span>OR Enter New:</span>
             <input
               type="text"
               name="difficultyClass"
               value={newFormulaTexts.difficultyClass}
               onChange={handleNewFormulaTextChange}
               disabled={!!formData.difficultyClassId}
             />
          </div>
        </div>

        {/* Guaranteed Formula */}
         <div className="form-group form-group-formula">
          <label htmlFor="guaranteedFormulaId">Guaranteed Formula</label>
           <select
             id="guaranteedFormulaId"
             name="guaranteedFormulaId"
             value={formData.guaranteedFormulaId || ""}
             onChange={handleDropdownChange}
             disabled={!!newFormulaTexts.guaranteedFormula}
           >
             <option value="">-- Select Existing --</option>
             {formulasData?.listFormulas.map(f => <option key={f.formulaId} value={f.formulaId}>{f.formulaValue}</option>)}
          </select>
           <div className="formula-text-input">
             <span>OR Enter New:</span>
             <input
               type="text"
               name="guaranteedFormula"
               value={newFormulaTexts.guaranteedFormula}
               onChange={handleNewFormulaTextChange}
               disabled={!!formData.guaranteedFormulaId}
             />
          </div>
        </div>
        {/* --- End Formula Selection / Creation --- */}

        <h3>Defaults & Costs</h3>
         <div className="form-group">
          <label htmlFor="defaultInitDuration">Default Initial Duration</label>
          <input
            type="number"
            id="defaultInitDuration"
            name="defaultInitDuration"
            value={formData.defaultInitDuration ?? ''}
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
            value={formData.defaultDuration ?? ''}
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
            value={formData.fatigueCost ?? ''}
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

export default ActionForm;
