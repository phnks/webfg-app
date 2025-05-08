import React, { useState, useEffect, useCallback } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import {
  CREATE_OBJECT,
  UPDATE_OBJECT,
  defaultObjectForm 
} from "../../graphql/operations";
import "./Form.css";

// Enums from schema
const ObjectCategoryEnum = ["ITEM", "TOOL", "WEAPON", "ARMOR", "CONTAINER", "STRUCTURE", "FURNITURE", "BARRIER", "DEVICE", "MATERIAL", "RESOURCE", "CLOTHING", "LIGHT_SOURCE", "DISPLAY", "DOCUMENT", "COMPONENT", "DEBRIS", "ARTIFACT"];
const DamageTypeEnum = ["KINETIC", "HYPERTHERMAL", "HYPOTHERMAL", "ELECTRIC", "SONIC", "CHEMICAL", "BIOCHEMICAL", "RADIATION"];

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

const prepareObjectInput = (data) => {
  const input = {
    name: data.name,
    objectCategory: data.objectCategory || ObjectCategoryEnum[0],
    width: parseFloat(data.width) || 0.0,
    length: parseFloat(data.length) || 0.0,
    height: parseFloat(data.height) || 0.0,
    weight: parseFloat(data.weight) || 0.0,
    penetration: parseFloat(data.penetration) || 0.0,
    deflection: parseFloat(data.deflection) || 0.0,
    impact: parseFloat(data.impact) || 0.0,
    absorption: parseFloat(data.absorption) || 0.0,
    hitPoints: {
        max: parseInt(data.hitPoints.max, 10) || 0,
        current: parseInt(data.hitPoints.current, 10) || 0,
    },
    damageMin: parseFloat(data.damageMin) || 0.0,
    damageMax: parseFloat(data.damageMax) || 0.0,
    damageType: data.damageType || DamageTypeEnum[0],
    isLimb: Boolean(data.isLimb),
    noise: parseFloat(data.noise) || 0.0,
    duration: parseFloat(data.duration) || 0.0,
    handling: parseFloat(data.handling) || 0.0,
    capacity: parseFloat(data.capacity) || 0.0,
    falloff: parseFloat(data.falloff) || 0.0,
    partsIds: typeof data.partsIds === 'string' ? data.partsIds.split(',').map(id => id.trim()).filter(id => id) : (Array.isArray(data.partsIds) ? data.partsIds : []),
    usage: Array.isArray(data.usage) ? data.usage : [] 
  };
  return input;
};


const ObjectForm = ({ object, isEditing = false, onClose, onSuccess }) => {
  const getInitialFormData = useCallback(() => {
    const base = isEditing && object ? { ...defaultObjectForm, ...stripTypename(object) } : { ...defaultObjectForm };

    // Ensure all fields are strings for form inputs, or boolean for checkbox
    return {
        name: base.name || "",
        objectCategory: base.objectCategory || ObjectCategoryEnum[0],
        width: base.width?.toString() ?? '',
        length: base.length?.toString() ?? '',
        height: base.height?.toString() ?? '',
        weight: base.weight?.toString() ?? '',
        penetration: base.penetration?.toString() ?? '',
        deflection: base.deflection?.toString() ?? '',
        impact: base.impact?.toString() ?? '',
        absorption: base.absorption?.toString() ?? '',
        hitPoints: {
            max: base.hitPoints?.max?.toString() ?? '',
            current: base.hitPoints?.current?.toString() ?? '',
        },
        damageMin: base.damageMin?.toString() ?? '',
        damageMax: base.damageMax?.toString() ?? '',
        damageType: base.damageType || DamageTypeEnum[0],
        isLimb: base.isLimb || false, // Boolean for checkbox
        noise: base.noise?.toString() ?? '',
        duration: base.duration?.toString() ?? '',
        handling: base.handling?.toString() ?? '',
        capacity: base.capacity?.toString() ?? '',
        falloff: base.falloff?.toString() ?? '',
        partsIds: Array.isArray(base.partsIds) ? base.partsIds.join(', ') : (base.partsIds || ''),
        usage: base.usage || [] // Not directly editable in UI for now
    };
  }, [isEditing, object]);

  const [formData, setFormData] = useState(getInitialFormData());
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [getInitialFormData]);


  const [createObjectMutation, { loading: createLoading }] = useMutation(CREATE_OBJECT);
  const [updateObjectMutation, { loading: updateLoading }] = useMutation(UPDATE_OBJECT);
  const loading = createLoading || updateLoading;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const [field, nestedField] = name.split('.');

    setFormData(prev => {
        let updatedValue = type === 'checkbox' ? checked : value;

        if (type === 'number' && value === '') {
            updatedValue = ''; 
        }

        if (nestedField) {
            return {
                ...prev,
                [field]: {
                    ...prev[field],
                    [nestedField]: updatedValue,
                },
            };
        } else {
            return {
                ...prev,
                [name]: updatedValue,
            };
        }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    try {
      const inputData = prepareObjectInput(formData);

      let result;
      if (isEditing) {
        result = await updateObjectMutation({
          variables: { objectId: object.objectId, input: inputData }
        });
        if (!result.data?.updateObject) throw new Error("Failed to update object or no data returned.");
        if (onSuccess) onSuccess(result.data.updateObject.objectId);
      } else {
        result = await createObjectMutation({
          variables: { input: inputData }
        });
        if (!result.data?.createObject) throw new Error("Failed to create object or no data returned.");
        if (onSuccess) onSuccess(result.data.createObject.objectId);
      }
    } catch (err) {
      console.error("Error saving object:", err);
      setError({ message: err.message || "An unexpected error occurred.", stack: err.stack });
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(isEditing && object ? `/objects/${object.objectId}` : "/objects");
    }
  };

  return (
    <div className="form-container">
      <h2>{isEditing ? "Edit Object" : "Create New Object"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="objectCategory">Category</label>
          <select id="objectCategory" name="objectCategory" value={formData.objectCategory} onChange={handleChange}>
            {ObjectCategoryEnum.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <h3>Dimensions & Weight</h3>
        <div className="form-group">
          <label htmlFor="width">Width (m)</label>
          <input type="number" id="width" name="width" value={formData.width} onChange={handleChange} step="0.01" placeholder="e.g. 0.5"/>
        </div>
        <div className="form-group">
          <label htmlFor="length">Length (m)</label>
          <input type="number" id="length" name="length" value={formData.length} onChange={handleChange} step="0.01" placeholder="e.g. 0.5"/>
        </div>
        <div className="form-group">
          <label htmlFor="height">Height (m)</label>
          <input type="number" id="height" name="height" value={formData.height} onChange={handleChange} step="0.01" placeholder="e.g. 0.5"/>
        </div>
        <div className="form-group">
          <label htmlFor="weight">Weight (kg)</label>
          <input type="number" id="weight" name="weight" value={formData.weight} onChange={handleChange} step="0.01" placeholder="e.g. 1.2"/>
        </div>

        <h3>Combat Properties</h3>
        <div className="form-group">
            <label htmlFor="hitPoints.max">Max Hit Points</label>
            <input type="number" id="hitPoints.max" name="hitPoints.max" value={formData.hitPoints.max} onChange={handleChange} step="1" placeholder="e.g. 10"/>
        </div>
        <div className="form-group">
            <label htmlFor="hitPoints.current">Current Hit Points</label>
            <input type="number" id="hitPoints.current" name="hitPoints.current" value={formData.hitPoints.current} onChange={handleChange} step="1" placeholder="e.g. 10"/>
        </div>
        <div className="form-group">
          <label htmlFor="damageMin">Min Damage</label>
          <input type="number" id="damageMin" name="damageMin" value={formData.damageMin} onChange={handleChange} step="0.1" placeholder="e.g. 1"/>
        </div>
        <div className="form-group">
          <label htmlFor="damageMax">Max Damage</label>
          <input type="number" id="damageMax" name="damageMax" value={formData.damageMax} onChange={handleChange} step="0.1" placeholder="e.g. 5"/>
        </div>
        <div className="form-group">
          <label htmlFor="damageType">Damage Type</label>
          <select id="damageType" name="damageType" value={formData.damageType} onChange={handleChange}>
            {DamageTypeEnum.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="penetration">Penetration</label>
          <input type="number" id="penetration" name="penetration" value={formData.penetration} onChange={handleChange} step="0.1" placeholder="e.g. 0"/>
        </div>
        <div className="form-group">
          <label htmlFor="deflection">Deflection</label>
          <input type="number" id="deflection" name="deflection" value={formData.deflection} onChange={handleChange} step="0.1" placeholder="e.g. 0"/>
        </div>
        <div className="form-group">
          <label htmlFor="impact">Impact</label>
          <input type="number" id="impact" name="impact" value={formData.impact} onChange={handleChange} step="0.1" placeholder="e.g. 0"/>
        </div>
        <div className="form-group">
          <label htmlFor="absorption">Absorption</label>
          <input type="number" id="absorption" name="absorption" value={formData.absorption} onChange={handleChange} step="0.1" placeholder="e.g. 0"/>
        </div>

        <h3>Other Properties</h3>
        <div className="form-group form-group-checkbox">
          <label htmlFor="isLimb">Is Limb?</label>
          <input type="checkbox" id="isLimb" name="isLimb" checked={!!formData.isLimb} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="noise">Noise</label>
          <input type="number" id="noise" name="noise" value={formData.noise} onChange={handleChange} step="0.1" placeholder="e.g. 0"/>
        </div>
        <div className="form-group">
          <label htmlFor="duration">Duration (s)</label>
          <input type="number" id="duration" name="duration" value={formData.duration} onChange={handleChange} step="0.1" placeholder="e.g. 0"/>
        </div>
        <div className="form-group">
          <label htmlFor="handling">Handling</label>
          <input type="number" id="handling" name="handling" value={formData.handling} onChange={handleChange} step="0.01" placeholder="e.g. 0"/>
        </div>
        <div className="form-group">
          <label htmlFor="capacity">Capacity</label>
          <input type="number" id="capacity" name="capacity" value={formData.capacity} onChange={handleChange} step="0.01" placeholder="e.g. 0"/>
        </div>
        <div className="form-group">
          <label htmlFor="falloff">Falloff</label>
          <input type="number" id="falloff" name="falloff" value={formData.falloff} onChange={handleChange} step="0.01" placeholder="e.g. 0"/>
        </div>
        <div className="form-group">
          <label htmlFor="partsIds">Part IDs (comma-separated)</label>
          <input type="text" id="partsIds" name="partsIds" value={formData.partsIds} onChange={handleChange} placeholder="e.g. id1,id2"/>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="button-cancel">Cancel</button>
          <button type="submit" disabled={loading} className="button-submit">
            {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Object" : "Create Object")}
          </button>
        </div>
      </form>
      <ErrorPopup error={error} onClose={() => setError(null)} />
    </div>
  );
};

export default ObjectForm;
