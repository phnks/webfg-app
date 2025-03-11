import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { 
  GET_ACTION, 
  DELETE_ACTION,
  ADD_ACTION_TO_CHARACTER,
  ON_UPDATE_ACTION,
  ON_DELETE_ACTION 
} from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import ActionForm from "../forms/ActionForm";
import "./ActionView.css";

const ActionView = () => {
  const { actionId } = useParams();
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [addActionSuccess, setAddActionSuccess] = useState(false);
  
  // Initial query to get action data
  const { data, loading, error, refetch } = useQuery(GET_ACTION, {
    variables: { actionId },
    onCompleted: (data) => {
      if (data && data.getAction) {
        setCurrentAction(data.getAction);
      }
    }
  });
  
  const [deleteAction] = useMutation(DELETE_ACTION);
  const [addActionToCharacter] = useMutation(ADD_ACTION_TO_CHARACTER);
  
  // Handle adding action to selected character
  const handleAddToCharacter = async () => {
    if (!selectedCharacter) return;
    
    try {
      await addActionToCharacter({
        variables: {
          characterId: selectedCharacter.characterId,
          actionId
        }
      });
      setAddActionSuccess(true);
      setTimeout(() => setAddActionSuccess(false), 3000);
    } catch (err) {
      console.error("Error adding action to character:", err);
    }
  };
  
  // Subscribe to action updates
  useSubscription(ON_UPDATE_ACTION, {
    onData: ({ data }) => {
      const updatedAction = data.data.onUpdateAction;
      if (updatedAction && updatedAction.actionId === actionId) {
        console.log("Action update received via subscription:", updatedAction);
        // Refresh the action data
        setCurrentAction(prev => ({
          ...prev,
          ...updatedAction
        }));
      }
    }
  });
  
  // Subscribe to action deletions
  useSubscription(ON_DELETE_ACTION, {
    onData: ({ data }) => {
      const deletedAction = data.data.onDeleteAction;
      if (deletedAction && deletedAction.actionId === actionId) {
        console.log("Action was deleted");
        // Redirect to the action list since this action no longer exists
        navigate("/actions");
      }
    }
  });
  
  // Ensure we're using the most recent data
  useEffect(() => {
    if (data && data.getAction) {
      setCurrentAction(data.getAction);
    }
  }, [data]);
  
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this action?")) {
      try {
        await deleteAction({
          variables: { actionId }
        });
        navigate("/actions");
      } catch (err) {
        console.error("Error deleting action:", err);
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
  
  if (loading) return <div className="loading">Loading action details...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (!currentAction) return <div className="error">Action not found</div>;
  
  const action = currentAction;
  
  if (isEditing) {
    return (
      <ActionForm 
        action={action} 
        isEditing={true} 
        onClose={handleEditCancel} 
        onSuccess={handleEditSuccess}
      />
    );
  }
  
  const renderEffectPhase = (phaseEffects, phaseName) => {
    if (!phaseEffects) return null;

    return (
      <div className="effect-phase">
        <h4>{phaseName} Effects</h4>
        <div className="effect-details">
          {phaseEffects.type && (
            <div className="effect-item">
              <span className="label">Type:</span>
              <span className="value">{phaseEffects.type}</span>
            </div>
          )}
          {phaseEffects.amount && (
            <div className="effect-item">
              <span className="label">Amount:</span>
              <span className="value">{phaseEffects.amount}</span>
            </div>
          )}
          {phaseEffects.resource && (
            <div className="effect-item">
              <span className="label">Resource:</span>
              <span className="value">{phaseEffects.resource}</span>
            </div>
          )}
          {phaseEffects.targetType && (
            <div className="effect-item">
              <span className="label">Target Type:</span>
              <span className="value">{phaseEffects.targetType}</span>
            </div>
          )}
          {phaseEffects.range && (
            <div className="effect-item">
              <span className="label">Range:</span>
              <span className="value">{phaseEffects.range}</span>
            </div>
          )}
          {phaseEffects.cancelable !== undefined && (
            <div className="effect-item">
              <span className="label">Cancelable:</span>
              <span className="value">{phaseEffects.cancelable ? "Yes" : "No"}</span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="action-view">
      <div className="action-header">
        <h1>{action.name}</h1>
        <div className="action-actions">
          {selectedCharacter && (
            <button
              onClick={handleAddToCharacter}
              className={`add-to-character-btn ${addActionSuccess ? 'success' : ''}`}
              disabled={addActionSuccess}
            >
              {addActionSuccess ? 'Added!' : `Add to ${selectedCharacter.name}'s Actions`}
            </button>
          )}
          <button onClick={handleEdit}>Edit</button>
          <button onClick={handleDelete} className="delete-button">Delete</button>
        </div>
      </div>
      
      <div className="action-content">
        <div className="action-details">
          <h3>Details</h3>
          <div className="detail-row">
            <span>Type:</span>
            <span>{action.type || "N/A"}</span>
          </div>
          <div className="detail-row">
            <span>Description:</span>
            <p>{action.description || "No description available."}</p>
          </div>
          <div className="detail-row">
            <span>Duration:</span>
            <span>
              {action.timing?.duration} {action.timing?.timeUnit?.toLowerCase()}
            </span>
          </div>
          <div className="detail-row">
            <span>Range:</span>
            <span>{action.rangeInMeters} meters</span>
          </div>
          <div className="detail-row">
            <span>Targets:</span>
            <span>{action.targetCount}</span>
          </div>
          
          <h3>Effects</h3>
          {action.effects ? (
            <div className="effects-container">
              {renderEffectPhase(action.effects.start, "Start")}
              {renderEffectPhase(action.effects.during, "During")}
              {renderEffectPhase(action.effects.end, "End")}
            </div>
          ) : (
            <p>No effects defined</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionView; 