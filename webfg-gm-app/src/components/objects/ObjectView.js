import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { 
  GET_OBJECT, 
  DELETE_OBJECT,
  ADD_OBJECT_TO_INVENTORY,
  ON_UPDATE_OBJECT,
  ON_DELETE_OBJECT 
} from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import ObjectForm from "../forms/ObjectForm";
import "./ObjectView.css";

const ObjectView = () => {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentObject, setCurrentObject] = useState(null);
  const [addObjectSuccess, setAddObjectSuccess] = useState(false);
  
  // Initial query to get object data
  const { data, loading, error, refetch } = useQuery(GET_OBJECT, {
    variables: { objectId },
    onCompleted: (data) => {
      if (data && data.getObject) {
        setCurrentObject(data.getObject);
      }
    }
  });
  
  const [deleteObject] = useMutation(DELETE_OBJECT);
  const [addObjectToInventory] = useMutation(ADD_OBJECT_TO_INVENTORY);
  
  // Subscribe to object updates
  useSubscription(ON_UPDATE_OBJECT, {
    onData: ({ data }) => {
      const updatedObject = data.data.onUpdateObject;
      if (updatedObject && updatedObject.objectId === objectId) {
        console.log("Object update received via subscription:", updatedObject);
        // Refresh the object data
        setCurrentObject(prev => ({
          ...prev,
          ...updatedObject
        }));
      }
    }
  });
  
  // Subscribe to object deletions
  useSubscription(ON_DELETE_OBJECT, {
    onData: ({ data }) => {
      const deletedObject = data.data.onDeleteObject;
      if (deletedObject && deletedObject.objectId === objectId) {
        console.log("Object was deleted");
        // Redirect to the object list since this object no longer exists
        navigate("/objects");
      }
    }
  });
  
  // Ensure we're using the most recent data
  useEffect(() => {
    if (data && data.getObject) {
      setCurrentObject(data.getObject);
    }
  }, [data]);
  
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this object?")) {
      try {
        await deleteObject({
          variables: { objectId }
        });
        navigate("/objects");
      } catch (err) {
        console.error("Error deleting object:", err);
      }
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleEditSuccess = () => {
    setIsEditing(false);
    refetch(); // Refetch to ensure we have the latest data
  };
  
  const handleEditCancel = () => {
    setIsEditing(false);
  };
  
  // Handle adding object to selected character's inventory
  const handleAddToInventory = async () => {
    if (!selectedCharacter) return;
    
    try {
      await addObjectToInventory({
        variables: {
          characterId: selectedCharacter.characterId,
          objectId
        }
      });
      setAddObjectSuccess(true);
      setTimeout(() => setAddObjectSuccess(false), 3000);
    } catch (err) {
      console.error("Error adding object to inventory:", err);
    }
  };
  
  if (loading) return <div className="loading">Loading object details...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (!currentObject) return <div className="error">Object not found</div>;
  
  if (isEditing) {
    return (
      <ObjectForm 
        object={currentObject} 
        isEditing={true} 
        onClose={handleEditCancel} 
        onSuccess={handleEditSuccess}
      />
    );
  }
  
  return (
    <div className="object-view">
      <div className="object-header">
        <h1>{currentObject.name}</h1>
        <div className="object-actions">
          {selectedCharacter && (
            <button
              onClick={handleAddToInventory}
              className={`add-to-inventory-btn ${addObjectSuccess ? 'success' : ''}`}
              disabled={addObjectSuccess}
            >
              {addObjectSuccess ? 'Added!' : `Add to ${selectedCharacter.name}'s Inventory`}
            </button>
          )}
          <button onClick={handleEdit}>Edit</button>
          <button onClick={handleDelete} className="delete-button">Delete</button>
        </div>
      </div>
      
      <div className="object-content">
        <div className="object-details">
          <h3>Details</h3>
          <div className="detail-row">
            <span>Type:</span>
            <span>{currentObject.type || "N/A"}</span>
          </div>
          <div className="detail-row">
            <span>Description:</span>
            <p>{currentObject.description || "No description available."}</p>
          </div>
          <div className="detail-row">
            <span>Value:</span>
            <span>{currentObject.value || 0}</span>
          </div>
          <div className="detail-row">
            <span>Weight:</span>
            <span>{currentObject.weight || 0} kg</span>
          </div>
          {/* Render additional object details here */}
        </div>
      </div>
    </div>
  );
};

export default ObjectView; 