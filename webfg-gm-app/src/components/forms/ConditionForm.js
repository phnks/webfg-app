import React, { useState } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import {
  CREATE_CONDITION,
  UPDATE_CONDITION,
  LIST_CONDITIONS
} from "../../graphql/operations";
import "./Form.css";
import "./ConditionForm.css";

const ConditionType = ["HELP", "HINDER"];
const ConditionCategory = ["PHYSICAL", "MENTAL", "ENVIRONMENTAL", "MAGICAL", "DISEASE", "BUFF", "DEBUFF", "STATUS"];
const AttributeName = ["LETHALITY", "ARMOUR", "ENDURANCE", "STRENGTH", "DEXTERITY", "AGILITY", "PERCEPTION", "CHARISMA", "INTELLIGENCE", "RESOLVE", "MORALE"];

const defaultConditionForm = {
  name: '',
  description: '',
  conditionCategory: ConditionCategory[0],
  conditionType: ConditionType[0],
  conditionTarget: AttributeName[0]
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

const prepareConditionInput = (data, isEditing) => {
  const input = {
    name: data.name,
    description: data.description || "",
    conditionCategory: data.conditionCategory,
    conditionType: data.conditionType,
    conditionTarget: data.conditionTarget
  };
  if (!isEditing) {
    delete input.conditionId;
  }
  return input;
};

const ConditionForm = ({ condition, isEditing = false, onClose, onSuccess }) => {
  const initialFormData = isEditing && condition
    ? { ...defaultConditionForm, ...condition }
    : { ...defaultConditionForm };

  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();

  const [createCondition, { loading: createLoading }] = useMutation(CREATE_CONDITION, {
    update(cache, { data: { createCondition } }) {
      try {
        const { listConditions } = cache.readQuery({ query: LIST_CONDITIONS }) || { listConditions: [] };
        cache.writeQuery({
          query: LIST_CONDITIONS,
          data: { listConditions: [createCondition, ...listConditions] },
        });
      } catch (e) {
        console.log("Cache update error:", e);
      }
    },
    onCompleted: (data) => {
      if (onSuccess) {
        onSuccess(data.createCondition.conditionId);
      } else {
        navigate(`/conditions/${data.createCondition.conditionId}`);
      }
    },
    onError: (error) => {
      console.error("Create condition error:", error);
      setError(error.message);
    }
  });

  const [updateCondition, { loading: updateLoading }] = useMutation(UPDATE_CONDITION, {
    onCompleted: (data) => {
      if (onSuccess) {
        onSuccess(data.updateCondition);
      }
    },
    onError: (error) => {
      console.error("Update condition error:", error);
      setError(error.message);
    }
  });

  const loading = createLoading || updateLoading;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Condition name is required");
      return;
    }


    try {
      const input = prepareConditionInput(formData, isEditing);
      
      if (isEditing) {
        await updateCondition({
          variables: {
            conditionId: condition.conditionId,
            input: input
          }
        });
      } else {
        await createCondition({
          variables: { input }
        });
      }
    } catch (err) {
      console.error("Form submission error:", err);
      setError(err.message || "An error occurred while saving the condition");
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/conditions');
    }
  };

  return (
    <div className="form-container">
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
      
      <form onSubmit={handleSubmit} className="condition-form">
        <h2>{isEditing ? 'Edit Condition' : 'Create New Condition'}</h2>

        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter condition name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            placeholder="Describe what this condition does"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="conditionCategory">Category *</label>
            <select
              id="conditionCategory"
              name="conditionCategory"
              value={formData.conditionCategory}
              onChange={handleInputChange}
              required
            >
              {ConditionCategory.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="conditionType">Type</label>
            <select
              id="conditionType"
              name="conditionType"
              value={formData.conditionType}
              onChange={handleInputChange}
              required
            >
              {ConditionType.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="conditionTarget">Target Attribute</label>
            <select
              id="conditionTarget"
              name="conditionTarget"
              value={formData.conditionTarget}
              onChange={handleInputChange}
              required
            >
              {AttributeName.map(attr => (
                <option key={attr} value={attr}>
                  {attr}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="condition-preview">
          <h4>Effect Preview:</h4>
          <p>
            This condition will <strong>{formData.conditionType === 'HELP' ? 'increase' : 'decrease'}</strong> the 
            character's <strong>{formData.conditionTarget.toLowerCase()}</strong> attribute.
          </p>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Saving...' : (isEditing ? 'Update Condition' : 'Create Condition')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConditionForm;