import React, { useState, useEffect, useCallback } from "react";
import ErrorPopup from '../common/ErrorPopup';
import MobileNumberInput from '../common/MobileNumberInput';
import AttributeGroups, { ATTRIBUTE_GROUPS } from '../common/AttributeGroups';
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import { CREATE_OBJECT, UPDATE_OBJECT, LIST_OBJECTS } from "../../graphql/operations";
import "./Form.css";

// Enums from schema
const ObjectCategoryEnum = ["TOOL", "WEAPON", "ARMOR", "CONTAINER", "STRUCTURE", "JEWLERY", "DEVICE", "MATERIAL", "CLOTHING", "LIGHT_SOURCE", "DOCUMENT", "COMPONENT", "ARTIFACT"];
// Removed AttributeTypeEnum as we now use a simple boolean isGrouped field

// Helper function to strip __typename fields recursively
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
const defaultAttribute = {
  attributeValue: 0,
  isGrouped: true
};

// Create default object form with all attributes
const createDefaultObjectForm = () => {
  const form = {
    name: "",
    description: "",
    objectCategory: ObjectCategoryEnum[0],
    isEquipment: true,
    // Default to true (passive equipment like armor)
    special: [],
    equipmentIds: []
  };

  // Add all attributes from the new grouping
  Object.values(ATTRIBUTE_GROUPS).flat().forEach(attr => {
    form[attr] = {
      ...defaultAttribute
    };
  });
  return form;
};
const defaultObjectForm = createDefaultObjectForm();
const prepareObjectInput = data => {
  const input = {
    name: data.name,
    description: data.description || "",
    objectCategory: data.objectCategory || ObjectCategoryEnum[0],
    isEquipment: data.isEquipment !== undefined ? data.isEquipment : true,
    special: data.special || [],
    equipmentIds: data.equipmentIds || []
  };

  // Add all attributes dynamically
  Object.values(ATTRIBUTE_GROUPS).flat().forEach(attr => {
    const attrValue = parseFloat(data[attr]?.attributeValue) || 0;
    input[attr] = {
      attributeValue: attrValue,
      isGrouped: data[attr]?.isGrouped !== undefined ? data[attr].isGrouped : true
    };
  });
  return input;
};
const ObjectForm = ({
  object,
  isEditing = false,
  onClose,
  onSuccess
}) => {
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [selectedObjectForEquipment, setSelectedObjectForEquipment] = useState('');
  const [newSpecialProperty, setNewSpecialProperty] = useState('');
  const {
    data: allObjectsData,
    loading: allObjectsLoading,
    error: allObjectsError
  } = useQuery(LIST_OBJECTS);

  // Track if user has made changes to prevent unwanted resets
  const [hasUserChanges, setHasUserChanges] = useState(false);
  const getInitialFormData = useCallback(() => {
    if (isEditing && object) {
      const base = stripTypename(object);
      const form = {
        name: base.name || "",
        description: base.description || "",
        objectCategory: base.objectCategory || ObjectCategoryEnum[0],
        isEquipment: base.isEquipment !== undefined ? base.isEquipment : true,
        special: base.special || [],
        equipmentIds: base.equipmentIds || []
      };

      // Add all attributes from the new grouping
      Object.values(ATTRIBUTE_GROUPS).flat().forEach(attr => {
        form[attr] = base[attr] || defaultAttribute;
      });
      return form;
    }
    return {
      ...defaultObjectForm
    };
  }, [isEditing, object]);
  const [formData, setFormData] = useState(getInitialFormData());
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    // Only reset form data if user hasn't made changes
    if (!hasUserChanges) {
      setFormData(getInitialFormData());
    }
  }, [getInitialFormData, hasUserChanges]);
  const [createObjectMutation, {
    loading: createLoading
  }] = useMutation(CREATE_OBJECT);
  const [updateObjectMutation, {
    loading: updateLoading
  }] = useMutation(UPDATE_OBJECT);
  const loading = createLoading || updateLoading || allObjectsLoading;
  const handleChange = e => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;
    const [field, nestedField, subNestedField] = name.split('.');
    const actualValue = type === 'checkbox' ? checked : value;

    // Mark that user has made changes
    setHasUserChanges(true);
    setFormData(prev => {
      if (subNestedField) {
        // For nested attributes like lethality.attributeValue
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [nestedField]: actualValue
          }
        };
      } else if (nestedField) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [nestedField]: actualValue
          }
        };
      } else {
        return {
          ...prev,
          [name]: actualValue
        };
      }
    });
  };
  const handleAddSpecialProperty = () => {
    if (newSpecialProperty.trim()) {
      setFormData(prev => ({
        ...prev,
        special: [...prev.special, newSpecialProperty.trim()]
      }));
      setNewSpecialProperty('');
    }
  };
  const handleRemoveSpecialProperty = index => {
    setFormData(prev => ({
      ...prev,
      special: prev.special.filter((_, i) => i !== index)
    }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      const inputData = prepareObjectInput(formData);
      let result;
      if (isEditing) {
        result = await updateObjectMutation({
          variables: {
            objectId: object.objectId,
            input: inputData
          }
        });
        if (!result.data?.updateObject) throw new Error("Failed to update object or no data returned.");
        // Reset user changes flag after successful save
        setHasUserChanges(false);
        if (onSuccess) onSuccess(result.data.updateObject.objectId);
      } else {
        result = await createObjectMutation({
          variables: {
            input: inputData
          }
        });
        if (!result.data?.createObject) throw new Error("Failed to create object or no data returned.");
        // Reset user changes flag after successful save
        setHasUserChanges(false);
        if (onSuccess) onSuccess(result.data.createObject.objectId);
      }
    } catch (err) {
      console.error("Error saving object:", err);
      setError({
        message: err.message || "An unexpected error occurred.",
        stack: err.stack
      });
    }
  };
  const availableObjectsForEquipment = allObjectsData?.listObjects?.filter(obj => !(isEditing && object && obj.objectId === object.objectId)).slice().sort((a, b) => a.name.localeCompare(b.name)) || [];
  const handleAddSelectedEquipment = () => {
    if (selectedObjectForEquipment && !formData.equipmentIds.includes(selectedObjectForEquipment)) {
      setFormData(prev => ({
        ...prev,
        equipmentIds: [...prev.equipmentIds, selectedObjectForEquipment]
      }));
    }
    setSelectedObjectForEquipment('');
    setShowAddEquipmentModal(false);
  };
  const handleRemoveEquipment = equipmentIdToRemove => {
    setFormData(prev => ({
      ...prev,
      equipmentIds: prev.equipmentIds.filter(id => id !== equipmentIdToRemove)
    }));
  };
  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(isEditing && object ? `/objects/${object.objectId}` : "/objects");
    }
  };
  if (allObjectsLoading) return /*#__PURE__*/React.createElement("p", null, "Loading available objects...");
  if (allObjectsError) return /*#__PURE__*/React.createElement("p", null, "Error loading object list: ", allObjectsError.message);

  // Render function for individual attributes in the form
  const renderAttributeForForm = (attributeName, attribute, displayName) => {
    return /*#__PURE__*/React.createElement("div", {
      key: attributeName,
      className: "attribute-item"
    }, /*#__PURE__*/React.createElement("label", null, displayName), /*#__PURE__*/React.createElement("div", {
      className: "attribute-controls"
    }, /*#__PURE__*/React.createElement(MobileNumberInput, {
      step: "0.1",
      value: formData[attributeName]?.attributeValue || 0,
      onChange: e => handleChange({
        target: {
          name: `${attributeName}.attributeValue`,
          value: e.target.value,
          type: 'number'
        }
      })
    }), /*#__PURE__*/React.createElement("label", {
      className: "checkbox-label"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: formData[attributeName]?.isGrouped !== false,
      onChange: e => handleChange({
        target: {
          name: `${attributeName}.isGrouped`,
          value: e.target.checked,
          type: 'checkbox',
          checked: e.target.checked
        }
      })
    }), "Group")));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "form-container"
  }, /*#__PURE__*/React.createElement("h2", null, isEditing ? "Edit Object" : "Create New Object"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "name"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "name",
    name: "name",
    value: formData.name,
    onChange: handleChange,
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "description"
  }, "Description"), /*#__PURE__*/React.createElement("textarea", {
    id: "description",
    name: "description",
    value: formData.description || '',
    onChange: handleChange,
    rows: "3",
    placeholder: "Enter object description (optional)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "objectCategory"
  }, "Category"), /*#__PURE__*/React.createElement("select", {
    id: "objectCategory",
    name: "objectCategory",
    value: formData.objectCategory,
    onChange: handleChange
  }, ObjectCategoryEnum.map(cat => /*#__PURE__*/React.createElement("option", {
    key: cat,
    value: cat
  }, cat)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "isEquipment",
    className: "checkbox-label"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    id: "isEquipment",
    name: "isEquipment",
    checked: formData.isEquipment !== false,
    onChange: e => setFormData(prev => ({
      ...prev,
      isEquipment: e.target.checked
    }))
  }), "Is Equipment (provides passive benefits when equipped)"), /*#__PURE__*/React.createElement("small", {
    className: "field-help"
  }, "Check this for armor, shields, and other items that provide benefits just by being equipped. Uncheck for weapons, tools, and items that only provide benefits when actively used in actions.")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement(AttributeGroups, {
    attributes: formData,
    renderAttribute: renderAttributeForForm,
    title: "Attributes",
    defaultExpandedGroups: ['BODY']
  })), /*#__PURE__*/React.createElement("h3", null, "Special Properties"), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", null, formData.special.length === 0 && /*#__PURE__*/React.createElement("p", null, "No special properties added."), /*#__PURE__*/React.createElement("ul", {
    className: "parts-list"
  }, formData.special.map((prop, index) => /*#__PURE__*/React.createElement("li", {
    key: index
  }, prop, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleRemoveSpecialProperty(index),
    className: "button-remove-part",
    style: {
      marginLeft: "10px",
      fontSize: "0.8em",
      padding: "2px 5px"
    }
  }, "Remove"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      marginTop: '10px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newSpecialProperty,
    onChange: e => setNewSpecialProperty(e.target.value),
    placeholder: "Enter special property",
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleAddSpecialProperty,
    className: "button-add-part"
  }, "Add Property"))), /*#__PURE__*/React.createElement("h3", null, "Equipment"), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", null, formData.equipmentIds.length === 0 && /*#__PURE__*/React.createElement("p", null, "No equipment added."), /*#__PURE__*/React.createElement("ul", {
    className: "parts-list"
  }, formData.equipmentIds.map(equipId => {
    const equipObject = availableObjectsForEquipment.find(obj => obj.objectId === equipId);
    return /*#__PURE__*/React.createElement("li", {
      key: equipId
    }, equipObject ? `${equipObject.name} (ID: ${equipId})` : `ID: ${equipId}`, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleRemoveEquipment(equipId),
      className: "button-remove-part",
      style: {
        marginLeft: "10px",
        fontSize: "0.8em",
        padding: "2px 5px"
      }
    }, "Remove"));
  }))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowAddEquipmentModal(true),
    className: "button-add-part",
    style: {
      marginTop: "10px"
    }
  }, "Add Equipment")), showAddEquipmentModal && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    style: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content",
    style: {
      background: "white",
      padding: "20px",
      borderRadius: "5px",
      minWidth: "300px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
    }
  }, /*#__PURE__*/React.createElement("h3", null, "Select Object to Add as Equipment"), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "select-equipment-dropdown",
    style: {
      display: "block",
      marginBottom: "5px"
    }
  }, "Available Objects:"), /*#__PURE__*/React.createElement("select", {
    id: "select-equipment-dropdown",
    value: selectedObjectForEquipment,
    onChange: e => setSelectedObjectForEquipment(e.target.value),
    style: {
      width: "100%",
      padding: "8px",
      marginBottom: "15px"
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "-- Select an Object --"), availableObjectsForEquipment.map(obj => /*#__PURE__*/React.createElement("option", {
    key: obj.objectId,
    value: obj.objectId
  }, obj.name, " (", obj.objectCategory, ")")))), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions",
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowAddEquipmentModal(false),
    className: "button-cancel",
    style: {
      marginRight: "10px"
    }
  }, "Close"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleAddSelectedEquipment,
    className: "button-submit"
  }, "Add Selected")))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleCancel,
    className: "button-cancel"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "button-submit"
  }, loading ? isEditing ? "Updating..." : "Creating..." : isEditing ? "Update Object" : "Create Object"))), /*#__PURE__*/React.createElement(ErrorPopup, {
    error: error,
    onClose: () => setError(null)
  }));
};
export default ObjectForm;