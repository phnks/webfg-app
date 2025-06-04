import React, { useState } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useMutation, useQuery } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import {
  CREATE_ACTION,
  UPDATE_ACTION,
  LIST_ACTIONS
} from "../../graphql/operations";
import "./Form.css";

const ActionCategory = ["MOVE", "ATTACK", "DEFEND", "RECOVER", "INTERACT", "MANIPULATE", "ASSIST"];
const AttributeName = ["LETHALITY", "ARMOUR", "ENDURANCE", "STRENGTH", "DEXTERITY", "AGILITY", "PERCEPTION", "CHARISMA", "INTELLIGENCE", "RESOLVE", "MORALE"];
const TargetType = ["OBJECT", "CHARACTER", "ACTION"];
const EffectType = ["HELP", "HINDER", "DESTROY", "TRIGGER_ACTION"];

const defaultActionForm = {
  name: '',
  actionCategory: ActionCategory[0],
  sourceAttribute: AttributeName[0],
  targetAttribute: AttributeName[0],
  description: '',
  targetType: TargetType[0],
  effectType: EffectType[0],
  triggeredActionId: null
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
    sourceAttribute: data.sourceAttribute,
    targetAttribute: data.targetAttribute,
    description: data.description || "",
    targetType: data.targetType,
    effectType: data.effectType
  };
  if (data.effectType === 'TRIGGER_ACTION' && data.triggeredActionId) {
    input.triggeredActionId = data.triggeredActionId;
  }
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
  const navigate = useNavigate();

  const { data: actionsData } = useQuery(LIST_ACTIONS);
  const availableActions = actionsData?.listActions || [];

  const [createAction, { loading: createLoading }] = useMutation(CREATE_ACTION, {
    update(cache, { data: { createAction } }) {
      try {
        const { listActions } = cache.readQuery({ query: LIST_ACTIONS }) || { listActions: [] };
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const cleanedData = stripTypename(formData);
      const inputData = prepareActionInput(cleanedData, isEditing);

      console.log(isEditing ? "Updating action with input:" : "Creating action with input:", inputData);

      let result;
      if (isEditing) {
        result = await updateAction({
          variables: {
            actionId: action.actionId,
            input: inputData
          }
        });
        if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
            throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
        }
        onSuccess(result.data.updateAction.actionId);
      } else {
        result = await createAction({
          variables: {
            input: inputData
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

        <div className="form-group">
          <label htmlFor="sourceAttribute">Source Attribute</label>
          <select
            id="sourceAttribute"
            name="sourceAttribute"
            value={formData.sourceAttribute || ""}
            onChange={handleChange}
            required
          >
            {AttributeName.map(attr => <option key={attr} value={attr}>{attr}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="targetAttribute">Target Attribute</label>
          <select
            id="targetAttribute"
            name="targetAttribute"
            value={formData.targetAttribute || ""}
            onChange={handleChange}
            required
          >
            {AttributeName.map(attr => <option key={attr} value={attr}>{attr}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="targetType">Target Type</label>
          <select
            id="targetType"
            name="targetType"
            value={formData.targetType || ""}
            onChange={handleChange}
            required
          >
            {TargetType.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="effectType">Effect Type</label>
          <select
            id="effectType"
            name="effectType"
            value={formData.effectType || ""}
            onChange={handleChange}
            required
          >
            {EffectType.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        {formData.effectType === 'TRIGGER_ACTION' && (
          <div className="form-group">
            <label htmlFor="triggeredActionId">Triggered Action</label>
            <select
              id="triggeredActionId"
              name="triggeredActionId"
              value={formData.triggeredActionId || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select an action to trigger...</option>
              {availableActions.map(action => (
                <option key={action.actionId} value={action.actionId}>
                  {action.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
          />
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