import React, { useState } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useMutation, useQuery } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import { CREATE_ACTION, UPDATE_ACTION, LIST_ACTIONS } from "../../graphql/operations";
import "./Form.css";
const ActionCategory = ["MOVE", "ATTACK", "DEFEND", "RECOVER", "INTERACT", "MANIPULATE", "ASSIST"];
const AttributeName = [
// BODY attributes
"SPEED", "WEIGHT", "SIZE", "ARMOUR", "ENDURANCE",
// MARTIAL attributes  
"LETHALITY", "STRENGTH", "DEXTERITY", "AGILITY", "PERCEPTION",
// MENTAL attributes
"INTENSITY", "RESOLVE", "MORALE", "INTELLIGENCE", "CHARISMA"];
const TargetType = ["OBJECT", "CHARACTER", "ACTION"];
const EffectType = ["HELP", "HINDER", "DESTROY", "TRIGGER_ACTION"];
const ObjectUsage = ["NONE", "ANY", "TOOL", "WEAPON", "ARMOR", "CONTAINER", "STRUCTURE", "JEWLERY", "DEVICE", "MATERIAL", "CLOTHING", "LIGHT_SOURCE", "DOCUMENT", "COMPONENT", "ARTIFACT"];
const ActionFormula = ["CONTEST", "SUBTRACT", "DELTA"];
const defaultActionForm = {
  name: '',
  actionCategory: ActionCategory[0],
  sourceAttribute: AttributeName[0],
  targetAttribute: AttributeName[0],
  description: '',
  targetType: TargetType[0],
  effectType: EffectType[0],
  triggeredActionId: null,
  objectUsage: ObjectUsage[0],
  formula: ActionFormula[0] // Default to CONTEST
};
const stripTypename = obj => {
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
    effectType: data.effectType,
    objectUsage: data.objectUsage,
    formula: data.formula || "CONTEST"
  };
  if (data.effectType === 'TRIGGER_ACTION' && data.triggeredActionId) {
    input.triggeredActionId = data.triggeredActionId;
  }
  if (!isEditing) {
    delete input.actionId;
  }
  return input;
};
const ActionForm = ({
  action,
  isEditing = false,
  onClose,
  onSuccess
}) => {
  const initialFormData = isEditing && action ? {
    ...defaultActionForm,
    ...action
  } : {
    ...defaultActionForm
  };
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();
  const {
    data: actionsData
  } = useQuery(LIST_ACTIONS);
  const availableActions = actionsData?.listActions || [];
  const [createAction, {
    loading: createLoading
  }] = useMutation(CREATE_ACTION, {
    update(cache, {
      data: {
        createAction
      }
    }) {
      try {
        const {
          listActions
        } = cache.readQuery({
          query: LIST_ACTIONS
        }) || {
          listActions: []
        };
        cache.writeQuery({
          query: LIST_ACTIONS,
          data: {
            listActions: [...listActions, createAction]
          }
        });
        console.log("Action created successfully:", createAction);
      } catch (err) {
        console.error("Error updating cache:", err);
      }
    }
  });
  const [updateAction, {
    loading: updateLoading
  }] = useMutation(UPDATE_ACTION);
  const loading = createLoading || updateLoading;
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  const handleSubmit = async e => {
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
        if (!result.data || result.errors && result.errors.length > 0 || result.data && Object.values(result.data).every(value => value === null)) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
        }
        onSuccess(result.data.updateAction.actionId);
      } else {
        result = await createAction({
          variables: {
            input: inputData
          }
        });
        if (!result.data || result.errors && result.errors.length > 0 || result.data && Object.values(result.data).every(value => value === null)) {
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
      setError({
        message: errorMessage,
        stack: errorStack
      });
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
  return /*#__PURE__*/React.createElement("div", {
    className: "form-container"
  }, /*#__PURE__*/React.createElement("h2", null, isEditing ? "Edit Action" : "Create Action"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "name"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "name",
    name: "name",
    value: formData.name || "",
    onChange: handleChange,
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "actionCategory"
  }, "Category"), /*#__PURE__*/React.createElement("select", {
    id: "actionCategory",
    name: "actionCategory",
    value: formData.actionCategory || "",
    onChange: handleChange,
    required: true
  }, ActionCategory.map(cat => /*#__PURE__*/React.createElement("option", {
    key: cat,
    value: cat
  }, cat)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "sourceAttribute"
  }, "Source Attribute"), /*#__PURE__*/React.createElement("select", {
    id: "sourceAttribute",
    name: "sourceAttribute",
    value: formData.sourceAttribute || "",
    onChange: handleChange,
    required: true
  }, AttributeName.map(attr => /*#__PURE__*/React.createElement("option", {
    key: attr,
    value: attr
  }, attr)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "targetAttribute"
  }, "Target Attribute"), /*#__PURE__*/React.createElement("select", {
    id: "targetAttribute",
    name: "targetAttribute",
    value: formData.targetAttribute || "",
    onChange: handleChange,
    required: true
  }, AttributeName.map(attr => /*#__PURE__*/React.createElement("option", {
    key: attr,
    value: attr
  }, attr)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "targetType"
  }, "Target Type"), /*#__PURE__*/React.createElement("select", {
    id: "targetType",
    name: "targetType",
    value: formData.targetType || "",
    onChange: handleChange,
    required: true
  }, TargetType.map(type => /*#__PURE__*/React.createElement("option", {
    key: type,
    value: type
  }, type)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "effectType"
  }, "Effect Type"), /*#__PURE__*/React.createElement("select", {
    id: "effectType",
    name: "effectType",
    value: formData.effectType || "",
    onChange: handleChange,
    required: true
  }, EffectType.map(type => /*#__PURE__*/React.createElement("option", {
    key: type,
    value: type
  }, type)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "objectUsage"
  }, "Object Usage"), /*#__PURE__*/React.createElement("select", {
    id: "objectUsage",
    name: "objectUsage",
    value: formData.objectUsage || "",
    onChange: handleChange,
    required: true
  }, ObjectUsage.map(usage => /*#__PURE__*/React.createElement("option", {
    key: usage,
    value: usage
  }, usage)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "formula"
  }, "Formula"), /*#__PURE__*/React.createElement("select", {
    id: "formula",
    name: "formula",
    value: formData.formula || "",
    onChange: handleChange,
    required: true
  }, ActionFormula.map(formula => /*#__PURE__*/React.createElement("option", {
    key: formula,
    value: formula
  }, formula)))), formData.effectType === 'TRIGGER_ACTION' && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "triggeredActionId"
  }, "Triggered Action"), /*#__PURE__*/React.createElement("select", {
    id: "triggeredActionId",
    name: "triggeredActionId",
    value: formData.triggeredActionId || "",
    onChange: handleChange,
    required: true
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select an action to trigger..."), availableActions.map(action => /*#__PURE__*/React.createElement("option", {
    key: action.actionId,
    value: action.actionId
  }, action.name)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "description"
  }, "Description"), /*#__PURE__*/React.createElement("textarea", {
    id: "description",
    name: "description",
    value: formData.description || "",
    onChange: handleChange
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleCancel
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading
  }, loading ? isEditing ? "Updating..." : "Creating..." : isEditing ? "Update" : "Create"))), /*#__PURE__*/React.createElement(ErrorPopup, {
    error: error,
    onClose: () => setError(null)
  }));
};
export default ActionForm;