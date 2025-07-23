import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_THOUGHT,
  DELETE_THOUGHT
} from "../../graphql/operations";
import { useRecentlyViewed } from "../../context/RecentlyViewedContext";
import ThoughtForm from "../forms/ThoughtForm";
import "./ThoughtView.css";
import ErrorPopup from '../common/ErrorPopup';

const ThoughtView = ({ startInEditMode = false }) => {
  const { thoughtId } = useParams();
  const navigate = useNavigate();
  const { addRecentlyViewed } = useRecentlyViewed();
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [currentThought, setCurrentThought] = useState(null);
  const [mutationError, setMutationError] = useState(null);

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
    </div>
  );
};

export default ThoughtView;