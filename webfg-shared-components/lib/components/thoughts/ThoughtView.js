import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_THOUGHT, DELETE_THOUGHT, ADD_THOUGHT_TO_CHARACTER_MIND } from "../../graphql/operations";
import { useRecentlyViewed } from "../../context/RecentlyViewedContext";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import ThoughtForm from "../forms/ThoughtForm";
import "./ThoughtView.css";
import ErrorPopup from '../common/ErrorPopup';
const ThoughtView = ({
  startInEditMode = false
}) => {
  const {
    thoughtId
  } = useParams();
  const navigate = useNavigate();
  const {
    addRecentlyViewed
  } = useRecentlyViewed();
  const {
    selectedCharacter
  } = useSelectedCharacter();
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [currentThought, setCurrentThought] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [addThoughtSuccess, setAddThoughtSuccess] = useState(false);

  // Get thought data
  const {
    loading,
    error,
    refetch
  } = useQuery(GET_THOUGHT, {
    variables: {
      thoughtId
    },
    onCompleted: data => {
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
        variables: {
          thoughtId
        }
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
  const handleUpdateSuccess = updatedThoughtId => {
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
      if (!result.data || result.errors && result.errors.length > 0 || result.data && Object.values(result.data).every(value => value === null)) {
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
  if (loading) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading thought...");
  if (error) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Error loading thought: ", error.message);
  if (!currentThought) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Thought not found");
  if (isEditing) {
    return /*#__PURE__*/React.createElement(ThoughtForm, {
      thought: currentThought,
      isEditing: true,
      onClose: handleCancelEdit,
      onSuccess: handleUpdateSuccess
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "thought-view"
  }, /*#__PURE__*/React.createElement("div", {
    className: "thought-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "thought-title"
  }, /*#__PURE__*/React.createElement("h1", null, currentThought.name)), /*#__PURE__*/React.createElement("div", {
    className: "thought-actions"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleEdit,
    className: "edit-btn"
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    onClick: handleDelete,
    className: "delete-btn"
  }, "Delete"), selectedCharacter && /*#__PURE__*/React.createElement("button", {
    onClick: handleAddToCharacterMind,
    className: "add-to-mind-btn"
  }, "Add to ", selectedCharacter.name, "'s Mind"))), /*#__PURE__*/React.createElement("div", {
    className: "thought-content"
  }, currentThought.description && /*#__PURE__*/React.createElement("div", {
    className: "thought-description"
  }, /*#__PURE__*/React.createElement("h3", null, "Description"), /*#__PURE__*/React.createElement("div", {
    className: "description-content"
  }, currentThought.description.split('\n').map((line, index) => /*#__PURE__*/React.createElement("p", {
    key: index
  }, line)))), !currentThought.description && /*#__PURE__*/React.createElement("div", {
    className: "empty-description"
  }, /*#__PURE__*/React.createElement("p", null, "No description provided."))), /*#__PURE__*/React.createElement("div", {
    className: "thought-footer"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate('/thoughts'),
    className: "back-btn"
  }, "\u2190 Back to Thoughts")), mutationError && /*#__PURE__*/React.createElement(ErrorPopup, {
    error: {
      message: mutationError,
      stack: null
    },
    onClose: () => setMutationError(null)
  }), addThoughtSuccess && /*#__PURE__*/React.createElement("div", {
    className: "success-message"
  }, "\u2713 Thought successfully added to ", selectedCharacter?.name, "'s mind!"));
};
export default ThoughtView;