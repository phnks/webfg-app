import React, { useState } from "react";
import ErrorPopup from '../common/ErrorPopup';
import { useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import { CREATE_THOUGHT, UPDATE_THOUGHT } from "../../graphql/operations";
import "./Form.css";
const defaultThoughtForm = {
  name: '',
  description: ''
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
const prepareThoughtInput = data => {
  const input = {
    name: data.name,
    description: data.description || ""
  };
  return input;
};
const ThoughtForm = ({
  thought,
  isEditing = false,
  onClose,
  onSuccess
}) => {
  const initialFormData = isEditing && thought ? {
    ...defaultThoughtForm,
    ...stripTypename(thought)
  } : {
    ...defaultThoughtForm
  };
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();
  const [createThought, {
    loading: createLoading
  }] = useMutation(CREATE_THOUGHT);
  const [updateThought, {
    loading: updateLoading
  }] = useMutation(UPDATE_THOUGHT);
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
      setError({
        message: "Name is required.",
        stack: null
      });
      return;
    }
    try {
      const input = prepareThoughtInput(formData);
      let result;
      if (isEditing) {
        result = await updateThought({
          variables: {
            thoughtId: thought.thoughtId,
            input
          }
        });
        if (!result.data?.updateThought) {
          throw new Error("Failed to update thought or no data returned.");
        }
        if (onSuccess) {
          onSuccess(result.data.updateThought.thoughtId);
        } else {
          navigate(`/thoughts/${result.data.updateThought.thoughtId}`);
        }
      } else {
        result = await createThought({
          variables: {
            input
          }
        });
        if (!result.data?.createThought) {
          throw new Error("Failed to create thought or no data returned.");
        }
        if (onSuccess) {
          onSuccess(result.data.createThought.thoughtId);
        } else {
          navigate(`/thoughts/${result.data.createThought.thoughtId}`);
        }
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Error saving thought:", err);
      setError({
        message: err.message || "Failed to save thought",
        stack: err.stack || null
      });
    }
  };
  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/thoughts');
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "form-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-header"
  }, /*#__PURE__*/React.createElement("h2", null, isEditing ? 'Edit Thought' : 'Create New Thought')), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit,
    className: "entity-form"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "name"
  }, "Name *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "name",
    name: "name",
    value: formData.name,
    onChange: handleInputChange,
    placeholder: "Enter thought name",
    required: true,
    disabled: loading
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "description"
  }, "Description"), /*#__PURE__*/React.createElement("textarea", {
    id: "description",
    name: "description",
    value: formData.description,
    onChange: handleInputChange,
    placeholder: "Enter thought description",
    rows: 6,
    disabled: loading
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleCancel,
    className: "cancel-btn",
    disabled: loading
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "submit-btn",
    disabled: loading
  }, loading ? 'Saving...' : isEditing ? 'Update Thought' : 'Create Thought'))), error && /*#__PURE__*/React.createElement(ErrorPopup, {
    error: error,
    onClose: () => setError(null)
  }));
};
export default ThoughtForm;