import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import {
  CREATE_OBJECT,
  UPDATE_OBJECT,
  LIST_OBJECTS,
  defaultObjectForm // Ensure this is imported
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
    type: data.type || "",
    weight: data.weight === '' ? 0 : parseFloat(data.weight) || 0.0,
    value: data.value === '' ? 0 : parseFloat(data.value) || 0.0,
    quantity: data.quantity === '' ? 0 : parseInt(data.quantity, 10) || 0,
    // Add other numeric fields as needed based on defaultObjectForm structure
  };

   if (!isEditing) {
      delete input.objectId;
  }

  return input;
};

const ObjectForm = ({ object, isEditing = false, onClose, onSuccess }) => {
  const initialFormData = isEditing && object
    ? { ...defaultObjectForm, ...object }
    : { ...defaultObjectForm };

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

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' && value === '' ? '' : value;
    setFormData({ ...formData, [name]: finalValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const cleanedData = stripTypename(formData);

      if (isEditing) {
        const inputData = prepareObjectInput(cleanedData, true);
        console.log("Updating object with input:", inputData);
        const result = await updateObject({
          variables: {
            objectId: object.objectId,
            input: inputData
          }
        });
        onSuccess(result.data.updateObject.objectId);
      } else {
        const inputData = prepareObjectInput(cleanedData, false);
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
          <input
            type="text"
            id="type"
            name="type"
            value={formData.type || ""}
            onChange={handleChange}
          />
        </div>

        {/* Example numeric fields */}
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
          <label htmlFor="value">Value</label>
          <input
            type="number"
            id="value"
            name="value"
            value={formData.value ?? ''}
            onChange={handleChange}
            step="0.1"
          />
        </div>
         <div className="form-group">
          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity ?? ''}
            onChange={handleChange}
            step="1"
          />
        </div>
        {/* ... other form fields ... */}

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

export default ObjectForm;
