import React, { useState } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import { CREATE_CONDITION, UPDATE_CONDITION, LIST_CONDITIONS } from "../../graphql/operations";
import "./Form.css";
import "./ConditionForm.css";
const ConditionType = ["HELP", "HINDER"];
const ConditionCategory = ["PHYSICAL", "MENTAL", "ENVIRONMENTAL", "MAGICAL", "DISEASE", "BUFF", "DEBUFF", "STATUS"];
const AttributeName = [
// BODY attributes
"SPEED", "WEIGHT", "SIZE", "ARMOUR", "ENDURANCE",
// MARTIAL attributes  
"LETHALITY", "STRENGTH", "DEXTERITY", "AGILITY", "PERCEPTION",
// MENTAL attributes
"INTENSITY", "RESOLVE", "MORALE", "INTELLIGENCE", "CHARISMA"];
const defaultConditionForm = {
  name: '',
  description: '',
  conditionCategory: ConditionCategory[0],
  conditionType: ConditionType[0],
  conditionTarget: AttributeName[0]
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
const ConditionForm = ({
  condition,
  isEditing = false,
  onClose,
  onSuccess
}) => {
  const initialFormData = isEditing && condition ? {
    ...defaultConditionForm,
    ...condition
  } : {
    ...defaultConditionForm
  };
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();
  const [createCondition, {
    loading: createLoading
  }] = useMutation(CREATE_CONDITION, {
    update(cache, {
      data: {
        createCondition
      }
    }) {
      try {
        const {
          listConditions
        } = cache.readQuery({
          query: LIST_CONDITIONS
        }) || {
          listConditions: []
        };
        cache.writeQuery({
          query: LIST_CONDITIONS,
          data: {
            listConditions: [createCondition, ...listConditions]
          }
        });
      } catch (e) {
        console.log("Cache update error:", e);
      }
    },
    onCompleted: data => {
      if (onSuccess) {
        onSuccess(data.createCondition.conditionId);
      } else {
        navigate(`/conditions/${data.createCondition.conditionId}`);
      }
    },
    onError: error => {
      console.error("Create condition error:", error);
      setError(error.message);
    }
  });
  const [updateCondition, {
    loading: updateLoading
  }] = useMutation(UPDATE_CONDITION, {
    onCompleted: data => {
      if (onSuccess) {
        onSuccess(data.updateCondition);
      }
    },
    onError: error => {
      console.error("Update condition error:", error);
      setError(error.message);
    }
  });
  const loading = createLoading || updateLoading;
  const handleInputChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async e => {
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
          variables: {
            input
          }
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
  return /*#__PURE__*/React.createElement("div", {
    className: "form-container"
  }, error && /*#__PURE__*/React.createElement(ErrorPopup, {
    error: {
      message: error
    },
    onClose: () => setError(null)
  }), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit,
    className: "condition-form"
  }, /*#__PURE__*/React.createElement("h2", null, isEditing ? 'Edit Condition' : 'Create New Condition'), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "name"
  }, "Name *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "name",
    name: "name",
    value: formData.name,
    onChange: handleInputChange,
    required: true,
    placeholder: "Enter condition name"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "description"
  }, "Description"), /*#__PURE__*/React.createElement("textarea", {
    id: "description",
    name: "description",
    value: formData.description,
    onChange: handleInputChange,
    rows: "3",
    placeholder: "Describe what this condition does"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "conditionCategory"
  }, "Category *"), /*#__PURE__*/React.createElement("select", {
    id: "conditionCategory",
    name: "conditionCategory",
    value: formData.conditionCategory,
    onChange: handleInputChange,
    required: true
  }, ConditionCategory.map(category => /*#__PURE__*/React.createElement("option", {
    key: category,
    value: category
  }, category)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "conditionType"
  }, "Type"), /*#__PURE__*/React.createElement("select", {
    id: "conditionType",
    name: "conditionType",
    value: formData.conditionType,
    onChange: handleInputChange,
    required: true
  }, ConditionType.map(type => /*#__PURE__*/React.createElement("option", {
    key: type,
    value: type
  }, type))))), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "conditionTarget"
  }, "Target Attribute"), /*#__PURE__*/React.createElement("select", {
    id: "conditionTarget",
    name: "conditionTarget",
    value: formData.conditionTarget,
    onChange: handleInputChange,
    required: true
  }, AttributeName.map(attr => /*#__PURE__*/React.createElement("option", {
    key: attr,
    value: attr
  }, attr))))), /*#__PURE__*/React.createElement("div", {
    className: "condition-preview"
  }, /*#__PURE__*/React.createElement("h4", null, "Effect Preview:"), /*#__PURE__*/React.createElement("p", null, "This condition will ", /*#__PURE__*/React.createElement("strong", null, formData.conditionType === 'HELP' ? 'increase' : 'decrease'), " the character's ", /*#__PURE__*/React.createElement("strong", null, formData.conditionTarget.toLowerCase()), " attribute.")), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleCancel,
    className: "cancel-btn"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "submit-btn"
  }, loading ? 'Saving...' : isEditing ? 'Update Condition' : 'Create Condition'))));
};
export default ConditionForm;