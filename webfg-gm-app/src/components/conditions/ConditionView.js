import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CONDITION,
  DELETE_CONDITION,
  ADD_CONDITION_TO_CHARACTER
} from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import ConditionForm from "../forms/ConditionForm";
import "./ConditionView.css";
import ErrorPopup from '../common/ErrorPopup';

const ConditionView = () => {
  const { conditionId } = useParams();
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCondition, setCurrentCondition] = useState(null);
  const [addConditionSuccess, setAddConditionSuccess] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  // Get condition data
  const { data, loading, error, refetch } = useQuery(GET_CONDITION, {
    variables: { conditionId },
    onCompleted: (data) => {
      if (data && data.getCondition) {
        setCurrentCondition(data.getCondition);
      }
    }
  });

  const [deleteCondition] = useMutation(DELETE_CONDITION);
  const [addConditionToCharacter] = useMutation(ADD_CONDITION_TO_CHARACTER);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this condition?")) {
      return;
    }

    try {
      setMutationError(null);
      await deleteCondition({
        variables: { conditionId }
      });
      navigate("/conditions");
    } catch (err) {
      console.error("Error deleting condition:", err);
      setMutationError(err.message || "Failed to delete condition");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    refetch();
  };

  const handleUpdateSuccess = (updatedCondition) => {
    setCurrentCondition(updatedCondition);
    setIsEditing(false);
    refetch();
  };

  const handleAddToCharacter = async () => {
    if (!selectedCharacter) {
      alert("Please select a character first");
      return;
    }

    try {
      setMutationError(null);
      await addConditionToCharacter({
        variables: {
          characterId: selectedCharacter.characterId,
          conditionId: conditionId,
          amount: 1 // Default amount is 1
        }
      });
      setAddConditionSuccess(true);
      setTimeout(() => setAddConditionSuccess(false), 3000);
    } catch (err) {
      console.error("Error adding condition to character:", err);
      setMutationError(err.message || "Failed to add condition to character");
    }
  };

  if (loading) return <div className="loading">Loading condition...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (!currentCondition) return <div className="error">Condition not found</div>;

  const condition = currentCondition;

  return (
    <div className="condition-view">
      {mutationError && (
        <ErrorPopup 
          message={mutationError} 
          onClose={() => setMutationError(null)} 
        />
      )}

      {addConditionSuccess && (
        <div className="success-message">
          Condition added to {selectedCharacter?.name || 'selected character'}!
        </div>
      )}

      <div className="view-header">
        <div>
          <h1>{condition.name}</h1>
          <div className="condition-badges">
            <span className={`condition-type-badge ${condition.conditionType.toLowerCase()}`}>
              {condition.conditionType}
            </span>
            <span className="condition-target-badge">
              {condition.conditionTarget}
            </span>
          </div>
        </div>
        <div className="view-actions">
          {selectedCharacter && (
            <button 
              className="add-to-character-btn"
              onClick={handleAddToCharacter}
              title={`Add to ${selectedCharacter.name}`}
            >
              Add to Character
            </button>
          )}
          <button className="edit-button" onClick={handleEdit}>Edit</button>
          <button className="delete-button" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      {isEditing ? (
        <ConditionForm
          condition={condition}
          isEditing={true}
          onSuccess={handleUpdateSuccess}
          onClose={handleCancelEdit}
        />
      ) : (
        <div className="condition-sections">
          <div className="section-row">
            <div className="section">
              <h3>Description</h3>
              <p>{condition.description}</p>
            </div>
          </div>
          
          <div className="section-row">
            <div className="section">
              <h3>Details</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Category:</label>
                  <span>{condition.conditionCategory}</span>
                </div>
                <div className="detail-item">
                  <label>Type:</label>
                  <span className={`condition-type ${condition.conditionType.toLowerCase()}`}>
                    {condition.conditionType}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Target Attribute:</label>
                  <span>{condition.conditionTarget}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="section-row">
            <div className="section">
              <h3>Effect</h3>
              <p className="condition-effect">
                This condition will {condition.conditionType === 'HELP' ? 'increase' : 'decrease'} the 
                character's <strong>{condition.conditionTarget.toLowerCase()}</strong> attribute.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionView;