import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_OBJECT, UPDATE_OBJECT, LIST_OBJECTS, defaultObjectForm } from "../../graphql/operations";
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

// Prepare object data for input by only including relevant fields
const prepareObjectInput = (data) => {
  // Only include fields that are part of the ObjectInput type
  // This list should match your GraphQL schema
  const allowedFields = ['name', 'type', 'description', 'fit', 'weight', 'noise', 'value'];
  
  const input = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      input[field] = data[field];
    }
  });
  
  return input;
};

const ObjectForm = ({ object, isEditing = false, onClose, onSuccess }) => {
  const initialFormData = isEditing && object 
    ? { ...object }
    : { ...defaultObjectForm };

  const [formData, setFormData] = useState(initialFormData);
  
  const [createObject, { loading: createLoading }] = useMutation(CREATE_OBJECT, {
    update(cache, { data: { createObject } }) {
      try {
        // Read the current list of objects from the cache
        const { listObjects } = cache.readQuery({ query: LIST_OBJECTS }) || { listObjects: [] };
        
        // Update the cache with the new object
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Clean the form data by removing __typename fields
      const cleanedData = stripTypename(formData);
      
      if (isEditing) {
        // Prepare only the fields that belong in ObjectInput
        const inputData = prepareObjectInput(cleanedData);
        console.log("Updating object with input:", inputData);
        
        const result = await updateObject({
          variables: {
            objectId: object.objectId,
            input: inputData
          }
        });
        
        onSuccess(result.data.updateObject.objectId);
      } else {
        // Prepare only the fields that belong in ObjectInput
        const inputData = prepareObjectInput(cleanedData);
        console.log("Creating object with input:", inputData);
        
        const result = await createObject({
          variables: {
            input: inputData
          }
        });
        
        onSuccess(result.data.createObject.objectId);
      }
    } catch (err) {
      console.error("Error saving object:", err);
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
      <h2>{isEditing ? "Edit Object" : "Create Object"}</h2>
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
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="">Select Type</option>
            <option value="WEAPON">Weapon</option>
            <option value="ARMOR">Armor</option>
            <option value="CLOTHING">Clothing</option>
            <option value="JEWELRY">Jewelry</option>
            <option value="FOOD">Food</option>
            <option value="TOOL">Tool</option>
            <option value="CONTAINER">Container</option>
            <option value="MISCELLANEOUS">Miscellaneous</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            rows={3}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="value">Value</label>
          <input
            type="number"
            id="value"
            name="value"
            value={formData.value || 0}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="weight">Weight (kg)</label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={formData.weight || 0}
            onChange={handleChange}
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fit">Fit</label>
          <select
            id="fit"
            name="fit"
            value={formData.fit || "ONE_HAND"}
            onChange={handleChange}
          >
            <option value="ONE_HAND">One Hand</option>
            <option value="TWO_HAND">Two Hands</option>
            <option value="BODY">Body</option>
            <option value="HEAD">Head</option>
            <option value="FEET">Feet</option>
            <option value="NONE">None</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="noise">Noise</label>
          <input
            type="number"
            id="noise"
            name="noise"
            value={formData.noise || 0}
            onChange={handleChange}
          />
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

export default ObjectForm; 