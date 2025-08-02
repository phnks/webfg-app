import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CONDITION, DELETE_CONDITION, ADD_CONDITION_TO_CHARACTER } from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import { useRecentlyViewed } from "../../context/RecentlyViewedContext";
import ConditionForm from "../forms/ConditionForm";
import "./ConditionView.css";
import ErrorPopup from '../common/ErrorPopup';
const ConditionView = ({
  startInEditMode = false
}) => {
  const {
    conditionId
  } = useParams();
  const navigate = useNavigate();
  const {
    selectedCharacter
  } = useSelectedCharacter();
  const {
    addRecentlyViewed
  } = useRecentlyViewed();
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [currentCondition, setCurrentCondition] = useState(null);
  const [addConditionSuccess, setAddConditionSuccess] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  // Get condition data
  const {
    loading,
    error,
    refetch
  } = useQuery(GET_CONDITION, {
    variables: {
      conditionId
    },
    onCompleted: data => {
      if (data && data.getCondition) {
        setCurrentCondition(data.getCondition);
        // Add to recently viewed
        addRecentlyViewed({
          id: data.getCondition.conditionId,
          name: data.getCondition.name,
          type: 'condition'
        });
      }
    }
  });
  const [deleteCondition] = useMutation(DELETE_CONDITION);
  const [addConditionToCharacter] = useMutation(ADD_CONDITION_TO_CHARACTER);

  // Set edit mode when prop changes
  useEffect(() => {
    setIsEditing(startInEditMode);
  }, [startInEditMode]);
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this condition?")) {
      return;
    }
    try {
      setMutationError(null);
      await deleteCondition({
        variables: {
          conditionId
        }
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
  const handleUpdateSuccess = updatedCondition => {
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
  if (loading) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading condition...");
  if (error) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Error: ", error.message);
  if (!currentCondition) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Condition not found");
  const condition = currentCondition;
  return /*#__PURE__*/React.createElement("div", {
    className: "condition-view"
  }, mutationError && /*#__PURE__*/React.createElement(ErrorPopup, {
    message: mutationError,
    onClose: () => setMutationError(null)
  }), addConditionSuccess && /*#__PURE__*/React.createElement("div", {
    className: "success-message"
  }, "Condition added to ", selectedCharacter?.name || 'selected character', "!"), /*#__PURE__*/React.createElement("div", {
    className: "view-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, condition.name), /*#__PURE__*/React.createElement("div", {
    className: "condition-badges"
  }, /*#__PURE__*/React.createElement("span", {
    className: `condition-type-badge ${condition.conditionType.toLowerCase()}`
  }, condition.conditionType), /*#__PURE__*/React.createElement("span", {
    className: "condition-target-badge"
  }, condition.conditionTarget))), /*#__PURE__*/React.createElement("div", {
    className: "view-actions"
  }, selectedCharacter && /*#__PURE__*/React.createElement("button", {
    className: "add-to-character-btn",
    onClick: handleAddToCharacter,
    title: `Add to ${selectedCharacter.name}`
  }, "Add to Character"), /*#__PURE__*/React.createElement("button", {
    className: "edit-button",
    onClick: handleEdit
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: handleDelete
  }, "Delete"))), isEditing ? /*#__PURE__*/React.createElement(ConditionForm, {
    condition: condition,
    isEditing: true,
    onSuccess: handleUpdateSuccess,
    onClose: handleCancelEdit
  }) : /*#__PURE__*/React.createElement("div", {
    className: "condition-sections"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("h3", null, "Description"), /*#__PURE__*/React.createElement("p", null, condition.description))), /*#__PURE__*/React.createElement("div", {
    className: "section-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("h3", null, "Details"), /*#__PURE__*/React.createElement("div", {
    className: "detail-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-item"
  }, /*#__PURE__*/React.createElement("label", null, "Category:"), /*#__PURE__*/React.createElement("span", null, condition.conditionCategory)), /*#__PURE__*/React.createElement("div", {
    className: "detail-item"
  }, /*#__PURE__*/React.createElement("label", null, "Type:"), /*#__PURE__*/React.createElement("span", {
    className: `condition-type ${condition.conditionType.toLowerCase()}`
  }, condition.conditionType)), /*#__PURE__*/React.createElement("div", {
    className: "detail-item"
  }, /*#__PURE__*/React.createElement("label", null, "Target Attribute:"), /*#__PURE__*/React.createElement("span", null, condition.conditionTarget))))), /*#__PURE__*/React.createElement("div", {
    className: "section-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("h3", null, "Effect"), /*#__PURE__*/React.createElement("p", {
    className: "condition-effect"
  }, "This condition will ", condition.conditionType === 'HELP' ? 'increase' : 'decrease', " the character's ", /*#__PURE__*/React.createElement("strong", null, condition.conditionTarget.toLowerCase()), " attribute.")))));
};
export default ConditionView;