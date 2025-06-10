import React, { useState, useEffect, useCallback } from "react";
import ErrorPopup from '../common/ErrorPopup';
import MobileNumberInput from '../common/MobileNumberInput';
import AttributeGroups, { ATTRIBUTE_GROUPS } from '../common/AttributeGroups';
import { useQuery, useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import {
  CREATE_OBJECT,
  UPDATE_OBJECT,
  LIST_OBJECTS 
} from "../../graphql/operations";
import "./Form.css";

// Enums from schema
const ObjectCategoryEnum = ["TOOL", "WEAPON", "ARMOR", "CONTAINER", "STRUCTURE", "JEWLERY", "DEVICE", "MATERIAL", "CLOTHING", "LIGHT_SOURCE", "DOCUMENT", "COMPONENT", "ARTIFACT"];
// Removed AttributeTypeEnum as we now use a simple boolean isGrouped field

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

const defaultAttribute = {
  attributeValue: 0,
  isGrouped: true
};

// Create default object form with all attributes
const createDefaultObjectForm = () => {
  const form = {
    name: "",
    objectCategory: ObjectCategoryEnum[0],
    special: [],
    equipmentIds: []
  };
  
  // Add all attributes from the new grouping
  Object.values(ATTRIBUTE_GROUPS).flat().forEach(attr => {
    form[attr] = { ...defaultAttribute };
  });
  
  return form;
};

const defaultObjectForm = createDefaultObjectForm();

const prepareObjectInput = (data) => {
  const input = {
    name: data.name,
    objectCategory: data.objectCategory || ObjectCategoryEnum[0],
    special: data.special || [],
    equipmentIds: data.equipmentIds || []
  };
  
  // Add all attributes dynamically
  Object.values(ATTRIBUTE_GROUPS).flat().forEach(attr => {
    input[attr] = {
      attributeValue: parseFloat(data[attr]?.attributeValue) || 0,
      isGrouped: data[attr]?.isGrouped !== undefined ? data[attr].isGrouped : true
    };
  });
  
  return input;
};

const ObjectForm = ({ object, isEditing = false, onClose, onSuccess }) => {
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [selectedObjectForEquipment, setSelectedObjectForEquipment] = useState('');
  const [newSpecialProperty, setNewSpecialProperty] = useState('');
  const { data: allObjectsData, loading: allObjectsLoading, error: allObjectsError } = useQuery(LIST_OBJECTS);
  
  const getInitialFormData = useCallback(() => {
    if (isEditing && object) {
      const base = stripTypename(object);
      const form = {
        name: base.name || "",
        objectCategory: base.objectCategory || ObjectCategoryEnum[0],
        special: base.special || [],
        equipmentIds: base.equipmentIds || []
      };
      
      // Add all attributes from the new grouping
      Object.values(ATTRIBUTE_GROUPS).flat().forEach(attr => {
        form[attr] = base[attr] || defaultAttribute;
      });
      
      return form;
    }
    return { ...defaultObjectForm };
  }, [isEditing, object]);

  const [formData, setFormData] = useState(getInitialFormData());
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [getInitialFormData]);

  const [createObjectMutation, { loading: createLoading }] = useMutation(CREATE_OBJECT);
  const [updateObjectMutation, { loading: updateLoading }] = useMutation(UPDATE_OBJECT);
  const loading = createLoading || updateLoading || allObjectsLoading;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const [field, nestedField, subNestedField] = name.split('.');
    const actualValue = type === 'checkbox' ? checked : value;

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

  const handleRemoveSpecialProperty = (index) => {
    setFormData(prev => ({
      ...prev,
      special: prev.special.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
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

  const availableObjectsForEquipment = allObjectsData?.listObjects
                                      ?.filter(obj => !(isEditing && object && obj.objectId === object.objectId))
                                      .slice().sort((a, b) => a.name.localeCompare(b.name)) || [];

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

  const handleRemoveEquipment = (equipmentIdToRemove) => {
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

  if (allObjectsLoading) return <p>Loading available objects...</p>;
  if (allObjectsError) return <p>Error loading object list: {allObjectsError.message}</p>;

  // Render function for individual attributes in the form
  const renderAttributeForForm = (attributeName, attribute, displayName) => {
    return (
      <div key={attributeName} className="attribute-item">
        <label>{displayName}</label>
        <div className="attribute-controls">
          <MobileNumberInput
            step="0.1"
            value={formData[attributeName]?.attributeValue || 0}
            onChange={(e) => handleChange({
              target: { name: `${attributeName}.attributeValue`, value: e.target.value }
            })}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData[attributeName]?.isGrouped !== false}
              onChange={(e) => handleChange({
                target: { name: `${attributeName}.isGrouped`, type: 'checkbox', checked: e.target.checked }
              })}
            />
            Group
          </label>
        </div>
      </div>
    );
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

        <div className="form-group">
          <AttributeGroups
            attributes={formData}
            renderAttribute={renderAttributeForForm}
            title="Attributes"
            defaultExpandedGroups={['BODY']}
          />
        </div>

        <h3>Special Properties</h3>
        <div className="form-group">
          <div>
            {formData.special.length === 0 && <p>No special properties added.</p>}
            <ul className="parts-list">
              {formData.special.map((prop, index) => (
                <li key={index}>
                  {prop}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSpecialProperty(index)} 
                    className="button-remove-part" 
                    style={{ marginLeft: "10px", fontSize: "0.8em", padding: "2px 5px" }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <input
              type="text"
              value={newSpecialProperty}
              onChange={(e) => setNewSpecialProperty(e.target.value)}
              placeholder="Enter special property"
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleAddSpecialProperty} className="button-add-part">Add Property</button>
          </div>
        </div>

        <h3>Equipment</h3>
        <div className="form-group">
          <div>
            {formData.equipmentIds.length === 0 && <p>No equipment added.</p>}
            <ul className="parts-list">
              {formData.equipmentIds.map(equipId => {
                const equipObject = availableObjectsForEquipment.find(obj => obj.objectId === equipId);
                return (
                  <li key={equipId}>
                    {equipObject ? `${equipObject.name} (ID: ${equipId})` : `ID: ${equipId}`}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveEquipment(equipId)} 
                      className="button-remove-part" 
                      style={{ marginLeft: "10px", fontSize: "0.8em", padding: "2px 5px" }}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <button type="button" onClick={() => setShowAddEquipmentModal(true)} className="button-add-part" style={{ marginTop: "10px" }}>Add Equipment</button>
        </div>

        {showAddEquipmentModal && (
          <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div className="modal-content" style={{ background: "white", padding: "20px", borderRadius: "5px", minWidth: "300px", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}>
              <h3>Select Object to Add as Equipment</h3>
              <div className="form-group">
                <label htmlFor="select-equipment-dropdown" style={{ display: "block", marginBottom: "5px" }}>Available Objects:</label>
                <select 
                  id="select-equipment-dropdown"
                  value={selectedObjectForEquipment} 
                  onChange={(e) => setSelectedObjectForEquipment(e.target.value)}
                  style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
                >
                  <option value="">-- Select an Object --</option>
                  {availableObjectsForEquipment.map(obj => (
                    <option key={obj.objectId} value={obj.objectId}>
                      {obj.name} ({obj.objectCategory})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions" style={{ textAlign: "right" }}>
                <button type="button" onClick={() => setShowAddEquipmentModal(false)} className="button-cancel" style={{ marginRight: "10px" }}>Close</button>
                <button type="button" onClick={handleAddSelectedEquipment} className="button-submit">Add Selected</button>
              </div>
            </div>
          </div>
        )}

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