import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ACTION,
  DELETE_ACTION,
  ADD_ACTION_TO_CHARACTER
} from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import ActionForm from "../forms/ActionForm";
import "./ActionView.css";
import ErrorPopup from '../common/ErrorPopup';

const ActionView = () => {
  const { actionId } = useParams();
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [addActionSuccess, setAddActionSuccess] = useState(false);
  const [mutationError, setMutationError] = useState(null);

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
    if (!selectedCharacter) {
      setMutationError({ message: "Please select a character first.", stack: null });
      return;
    }

    try {
      const result = await addActionToCharacter({
        variables: {
          characterId: selectedCharacter.characterId,
          actionId
        }
      });
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }

      setAddActionSuccess(true);
      setTimeout(() => setAddActionSuccess(false), 3000);
    } catch (err) {
      console.error("Error adding action to character:", err);
      let errorMessage = "An unexpected error occurred while adding action to character.";
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
      setMutationError({ message: errorMessage, stack: errorStack });
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this action?")) {
      try {
        await deleteAction({
          variables: { actionId }
        });
        navigate("/actions");
      } catch (err) {
        console.error("Error deleting action:", err);
        let errorMessage = "An unexpected error occurred while deleting action.";
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
        setMutationError({ message: errorMessage, stack: errorStack });
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    refetch();
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
              {addActionSuccess ? 'Added!' : selectedCharacter ? `Add to ${selectedCharacter.name}'s Actions` : 'Add to Character'}
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
             <span>Source Attribute:</span>
             <span>{action.sourceAttribute || "N/A"}</span>
           </div>
           <div className="detail-row">
             <span>Target Attribute:</span>
             <span>{action.targetAttribute || "N/A"}</span>
           </div>
           <div className="detail-row">
             <span>Description:</span>
             <p>{action.description || "No description available."}</p>
           </div>

           <h3>Targets</h3>
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
      <ErrorPopup error={mutationError} onClose={() => setMutationError(null)} />
    </div>
  );
};

export default ActionView;