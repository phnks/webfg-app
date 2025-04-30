import React, { useState, useEffect } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import {
  CREATE_OBJECT,
  UPDATE_OBJECT,
  LIST_OBJECTS,
  // defaultObjectForm is exported, but we'll build initial state based on schema
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

const prepareObjectInput = (data, isEditing) => {
  const input = {
    name: data.name,
    type: data.type || "MISCELLANEOUS", // Assuming default type
    fit: data.fit || "ONE_HAND", // Assuming default fit
    weight: data.weight === '' ? 0.0 : parseFloat(data.weight) || 0.0,
    noise: data.noise === '' ? 0 : parseInt(data.noise, 10) || 0, // Assuming noise is Int
    hitPoints: data.hitPoints ? {
        max: data.hitPoints.max === '' ? 0 : parseInt(data.hitPoints.max, 10) || 0,
        current: data.hitPoints.current === '' ? 0 : parseInt(data.hitPoints.current, 10) || 0,
    } : { max: 0, current: 0 }, // Initialize hitPoints if null
  };

   if (!isEditing) {
      delete input.objectId; // Ensure objectId is not sent for creation
  }
  return input;
};

// Define Enums used in the form (assuming these exist based on schema)
const ObjectType = ["MISCELLANEOUS", "WEAPON", "ARMOR", "CONSUMABLE"]; // Example types
const FitType = ["ONE_HAND", "TWO_HAND", "HEAD", "TORSO", "LEGS", "ARMS", "FINGERS", "FEET", "BACK"]; // Example fits


const ObjectForm = ({ object, isEditing = false, onClose, onSuccess }) => {
  // Initialize state based on schema fields
  const initialFormData = isEditing && object
    ? {
        name: object.name || "",
        type: object.type || "MISCELLANEOUS",
        fit: object.fit || "ONE_HAND",
        weight: object.weight ?? '', // Use ?? '' for input value
        noise: object.noise ?? '', // Use ?? ''
        hitPoints: object.hitPoints ? {
            max: object.hitPoints.max ?? '', // Use ?? ''
            current: object.hitPoints.current ?? '', // Use ?? ''
        } : { max: '', current: '' }, // Initialize with empty strings for inputs
      }
    : {
        name: "",
        type: "MISCELLANEOUS",
        fit: "ONE_HAND",
        weight: '', // Initialize with empty string for input
        noise: '', // Initialize with empty string
        hitPoints: { max: '', current: '' }, // Initialize with empty strings
      };


  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();


  const [createObject, { loading: createLoading }] = useMutation(CREATE_OBJECT, {
    update(cache, { data: { createObject } }) {
      try {
        const { listObjects } = cache.readQuery({ query: LIST_OBJECTS }) || { listObjects: [] };
        cache.writeQuery({
          query: LIST_OBJECTS,
          data: { listObjects: [...listObjects, createObject] },
        });
        console.log("Object created successfully:", createObject);
      } catch (err) {
        console.error("Error updating cache:", err);
      }
    }
  });

  const [updateObject, { loading: updateLoading }] = useMutation(UPDATE_OBJECT);

  const loading = createLoading || updateLoading;

  // Modified handleChange to handle nested fields
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const [field, nestedField] = name.split('.');

    setFormData(prev => {
        let updatedFormData = { ...prev };

        if (nestedField) {
            // Handle nested fields (like hitPoints.max)
            updatedFormData[field] = {
                ...updatedFormData[field],
                [nestedField]: type === 'number' && value === '' ? '' : value,
            };
        } else {
            // Handle top-level fields (like name, type, fit, weight, noise)
            updatedFormData[field] = type === 'number' && value === '' ? '' : value;
        }

        return updatedFormData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const cleanedData = stripTypename(formData);
      const inputData = prepareObjectInput(cleanedData, isEditing);

      console.log(isEditing ? "Updating object with input:" : "Creating object with input:", inputData);

      let result;
      if (isEditing) {
        result = await updateObject({
          variables: {
            objectId: object.objectId,
            input: inputData
          }
        });
        // Check for null data or errors


        onSuccess(result.data.updateObject.objectId);
      } else {
        result = await createObject({
          variables: {
            input: inputData
          }
        });
        // Check for null data or errors

        onSuccess(result.data.createObject.objectId);
      }
    } catch (err) {
      console.error("Error saving object:", err);
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
      <h2>{isEditing ? "Edit Object" : "Create Object"}</h2>
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

        {/* Type Dropdown */}
         <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type || ""}
            onChange={handleChange}
          >
            {ObjectType.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        {/* Fit Dropdown */}
         <div className="form-group">
          <label htmlFor="fit">Fit</label>
          <select
            id="fit"
            name="fit"
            value={formData.fit || ""}
            onChange={handleChange}
          >
            {FitType.map(fit => <option key={fit} value={fit}>{fit}</option>)}
          </select>
        </div>

        {/* Numeric Fields based on schema */}
        <div className="form-group">
          <label htmlFor="weight">Weight</label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={formData.weight ?? ''}
            onChange={handleChange}
            step="0.1"
          />
        </div>
         <div className="form-group">
          <label htmlFor="noise">Noise</label>
          <input
            type="number"
            id="noise"
            name="noise"
            value={formData.noise ?? ''}
            onChange={handleChange}
            step="1"
          />
        </div>

        {/* Hit Points (Nested Object) */}
        <h3>Hit Points</h3>
         <div className="form-group">
             <label htmlFor="hitPoints.max">Max Hit Points</label>
             <input type="number" id="hitPoints.max" name="hitPoints.max" value={formData.hitPoints?.max ?? ''} onChange={handleChange} step="1" />
         </div>
         <div className="form-group">
             <label htmlFor="hitPoints.current">Current Hit Points</label>
             <input type="number" id="hitPoints.current" name="hitPoints.current" value={formData.hitPoints?.current ?? ''} onChange={handleChange} step="1" />
         </div>


        {/* Removed Quantity and Value based on schema */}

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

export default ObjectForm;
