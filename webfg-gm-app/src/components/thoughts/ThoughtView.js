import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_THOUGHT,
  DELETE_THOUGHT,
  ADD_THOUGHT_TO_CHARACTER_MIND
} from "../../graphql/operations";
import { useRecentlyViewed } from "../../context/RecentlyViewedContext";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import ThoughtForm from "../forms/ThoughtForm";
import "./ThoughtView.css";
import ErrorPopup from '../common/ErrorPopup';

const ThoughtView = ({ startInEditMode = false }) => {
  const { thoughtId } = useParams();
  const navigate = useNavigate();
  const { addRecentlyViewed } = useRecentlyViewed();
  const { selectedCharacter } = useSelectedCharacter();
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [currentThought, setCurrentThought] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [addThoughtSuccess, setAddThoughtSuccess] = useState(false);

  // Get thought data
  const { loading, error, refetch } = useQuery(GET_THOUGHT, {
    variables: { thoughtId },
    onCompleted: (data) => {
      if (data && data.getThought) {
        setCurrentThought(data.getThought);
        // Add to recently viewed
        addRecentlyViewed({
          id: data.getThought.thoughtId,
          name: data.getThought.name,
          type: 'thought'
        });
      }
    }
  });

  const [deleteThought] = useMutation(DELETE_THOUGHT);
  const [addThoughtToCharacterMind] = useMutation(ADD_THOUGHT_TO_CHARACTER_MIND);

  // Set edit mode when prop changes
  useEffect(() => {
    setIsEditing(startInEditMode);
  }, [startInEditMode]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this thought?")) {
      return;
    }

    try {
      setMutationError(null);
      await deleteThought({
        variables: { thoughtId }
      });
      navigate("/thoughts");
    } catch (err) {
      console.error("Error deleting thought:", err);
      setMutationError(err.message || "Failed to delete thought");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    refetch();
  };

  const handleUpdateSuccess = (updatedThoughtId) => {
    setIsEditing(false);
    refetch();
  };

  const handleAddToCharacterMind = async () => {
    if (!selectedCharacter) {
      setMutationError("Please select a character first");
      return;
    }

    try {
      setMutationError(null);
      const result = await addThoughtToCharacterMind({
        variables: {
          characterId: selectedCharacter.characterId,
          thoughtId
        }
      });
      
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
        throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
      
      setAddThoughtSuccess(true);
      setTimeout(() => setAddThoughtSuccess(false), 3000);
    } catch (err) {
      console.error("Error adding thought to character's mind:", err);
      let errorMessage = "An unexpected error occurred while adding thought to character's mind.";
      
      if (err.message.includes("already in character's mind")) {
        errorMessage = "This thought is already in the character's mind.";
      } else if (err.message.includes("not found")) {
        errorMessage = "Character or thought not found.";
      } else if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setMutationError(errorMessage);
    }
  };

  if (loading) return <div className="loading">Loading thought...</div>;
  if (error) return <div className="error">Error loading thought: {error.message}</div>;
  if (!currentThought) return <div className="error">Thought not found</div>;

  if (isEditing) {
    return (
      <ThoughtForm
        thought={currentThought}
        isEditing={true}
        onClose={handleCancelEdit}
        onSuccess={handleUpdateSuccess}
      />
    );
  }

  return (
    <div className="thought-view">
      <div className="thought-header">
        <div className="thought-title">
          <h1>{currentThought.name}</h1>
        </div>
        <div className="thought-actions">
          <button 
            onClick={handleEdit}
            className="edit-btn"
          >
            Edit
          </button>
          <button 
            onClick={handleDelete}
            className="delete-btn"
          >
            Delete
          </button>
          {selectedCharacter && (
            <button 
              onClick={handleAddToCharacterMind}
              className="add-to-mind-btn"
            >
              Add to {selectedCharacter.name}'s Mind
            </button>
          )}
        </div>
      </div>

      <div className="thought-content">
        {currentThought.description && (
          <div className="thought-description">
            <h3>Description</h3>
            <div className="description-content">
              {currentThought.description.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {!currentThought.description && (
          <div className="empty-description">
            <p>No description provided.</p>
          </div>
        )}
      </div>

      <div className="thought-footer">
        <button 
          onClick={() => navigate('/thoughts')}
          className="back-btn"
        >
          ← Back to Thoughts
        </button>
      </div>

      {mutationError && (
        <ErrorPopup 
          error={{ message: mutationError, stack: null }}
          onClose={() => setMutationError(null)} 
        />
      )}

      {addThoughtSuccess && (
        <div className="success-message">
          ✓ Thought successfully added to {selectedCharacter?.name}'s mind!
        </div>
      )}
    </div>
  );
};

export default ThoughtView;