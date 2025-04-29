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
   
   // Helper to display formula or default value
   const displayFormula = (formula, defaultValue) => {
     if (formula && formula.formulaValue) {
       return <span className="formula-value" title={formula.formulaId}>{formula.formulaValue}</span>;
     }
     return defaultValue !== undefined ? defaultValue : 'N/A';
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
             <span>Category:</span>
             <span>{action.actionCategory || "N/A"}</span>
           </div>
            <div className="detail-row">
             <span>Description:</span>
             <p>{action.description || "No description available."}</p>
           </div>
           <div className="detail-row">
             <span>Units:</span>
             <span>{action.units || "N/A"}</span>
           </div>
           <div className="detail-row">
             <span>Fatigue Cost:</span>
             <span>{action.fatigueCost !== null ? action.fatigueCost : "N/A"}</span>
           </div>

           <h3>Formulas & Defaults</h3>
           <div className="detail-row">
             <span>Initial Duration:</span>
             <span>{action.defaultInitDuration !== null && action.defaultInitDuration !== undefined ? action.defaultInitDuration : "N/A"}{action.initDuration ? " (" + displayFormula(action.initDuration) + ")" : ""}</span>
           </div>
           <div className="detail-row">
             <span>Duration:</span>
             <span>{action.defaultDuration !== null && action.defaultDuration !== undefined ? action.defaultDuration : "N/A"}{action.duration ? " (" + displayFormula(action.duration) + ")" : ""}</span>
           </div>
           <div className="detail-row">
             <span>Difficulty Class:</span>
             <span>{displayFormula(action.difficultyClass)}</span>
           </div>
           <div className="detail-row">
             <span>Guaranteed Formula:</span>
             <span>{displayFormula(action.guaranteedFormula)}</span>
           </div>
           {action.actionTargets && action.actionTargets.length > 0 ? (
             <ul className="array-list">
               {action.actionTargets.map((target, index) => (
                 <li key={`target-${index}`}>
                   {target.quantity} x {target.targetType} (Seq: {target.sequenceId})
                 </li>
               ))}
             </ul>
           ) : (
             <p>No targets defined</p>
           )}

           <h3>Sources</h3>
           {action.actionSources && action.actionSources.length > 0 ? (
             <ul className="array-list">
               {action.actionSources.map((source, index) => (
                 <li key={`source-${index}`}>
                   {source.quantity} x {source.sourceType} (Seq: {source.sequenceId})
                 </li>
               ))}
             </ul>
           ) : (
             <p>No sources defined</p>
           )}

           <h3>Effects</h3>
           {action.actionEffects && action.actionEffects.length > 0 ? (
             <ul className="array-list">
               {action.actionEffects.map((effect, index) => (
                 <li key={`effect-${index}`}>
                   {effect.effectType} (Qty: {effect.quantity}, Seq: {effect.sequenceId})
                 </li>
               ))}
             </ul>
           ) : (
             <p>No effects defined</p>
           )}
         </div>
      </div>
    </div>
  );
};

export default ActionView;
