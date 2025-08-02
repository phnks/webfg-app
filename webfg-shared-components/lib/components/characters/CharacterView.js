import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { DELETE_CHARACTER, ON_UPDATE_CHARACTER, ON_DELETE_CHARACTER, REMOVE_OBJECT_FROM_STASH, MOVE_OBJECT_TO_EQUIPMENT, MOVE_OBJECT_TO_READY, MOVE_OBJECT_FROM_READY_TO_EQUIPMENT, MOVE_OBJECT_FROM_EQUIPMENT_TO_STASH, REMOVE_CONDITION_FROM_CHARACTER, UPDATE_CONDITION_AMOUNT, REMOVE_ACTION_FROM_CHARACTER, REMOVE_THOUGHT_FROM_CHARACTER_MIND, MOVE_THOUGHT_TO_SUBCONSCIOUS, MOVE_THOUGHT_TO_CONSCIOUS, MOVE_THOUGHT_TO_MEMORY, UPDATE_THOUGHT_AFFINITY_KNOWLEDGE, UPDATE_INVENTORY_QUANTITY, MOVE_INVENTORY_ITEM } from "../../graphql/operations";
import { GET_CHARACTER_WITH_GROUPED } from "../../graphql/computedOperations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import { useRecentlyViewed } from "../../context/RecentlyViewedContext";
import CharacterAttributesBackend from "./CharacterAttributesBackend";
import ActionTestBackend from "../actions/test/ActionTestBackend";
import CharacterDetails from "./CharacterDetails";
import CharacterForm from "../forms/CharacterForm";
import "./CharacterView.css";
import ErrorPopup from '../common/ErrorPopup'; // Import ErrorPopup
import QuickAdjustPopup from '../common/QuickAdjustPopup';
import ThoughtAttributesModal from '../common/ThoughtAttributesModal';
import InventoryQuantityModal from '../common/InventoryQuantityModal';
import InventoryMoveModal from '../common/InventoryMoveModal';
const CharacterView = ({
  startInEditMode = false
}) => {
  const {
    characterId
  } = useParams();
  const navigate = useNavigate();
  const {
    selectCharacter
  } = useSelectedCharacter();
  const {
    addRecentlyViewed
  } = useRecentlyViewed();
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [testAction, setTestAction] = useState(null); // State to store action being tested
  const [mutationError, setMutationError] = useState(null); // Added mutationError state
  const [isAdjustingCondition, setIsAdjustingCondition] = useState(null); // For condition amount adjustment popup
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(true); // For collapsible inventory - always expanded
  const [isMindExpanded, setIsMindExpanded] = useState(true); // For collapsible mind section - always expanded
  const [isEditingThoughtAttributes, setIsEditingThoughtAttributes] = useState(null); // For thought affinity/knowledge modal
  const [isEditingInventoryQuantity, setIsEditingInventoryQuantity] = useState(null); // For inventory quantity edit
  const [inventoryMoveAction, setInventoryMoveAction] = useState(null); // For inventory movement with quantity

  // Subsection collapse states - with appropriate defaults
  const [isMemoryExpanded, setIsMemoryExpanded] = useState(false); // Memory: collapsed by default
  const [isSubconsciousExpanded, setIsSubconsciousExpanded] = useState(true); // Subconscious: expanded by default
  const [isConsciousExpanded, setIsConsciousExpanded] = useState(true); // Conscious: expanded by default
  const [isStashExpanded, setIsStashExpanded] = useState(false); // Stash: collapsed by default
  const [isEquipmentExpanded, setIsEquipmentExpanded] = useState(true); // Equipment: expanded by default
  const [isReadyExpanded, setIsReadyExpanded] = useState(true); // Ready: expanded by default

  // Initial query to get character data
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery(GET_CHARACTER_WITH_GROUPED, {
    variables: {
      characterId
    },
    onCompleted: data => {
      if (data && data.getCharacter) {
        setCurrentCharacter(data.getCharacter);
        // Set as selected character when viewed
        selectCharacter({
          characterId: data.getCharacter.characterId,
          name: data.getCharacter.name
        });
        // Add to recently viewed
        addRecentlyViewed({
          id: data.getCharacter.characterId,
          name: data.getCharacter.name,
          type: 'character'
        });
      }
    }
  });
  const [deleteCharacter] = useMutation(DELETE_CHARACTER);

  // Set edit mode when prop changes
  useEffect(() => {
    setIsEditing(startInEditMode);
  }, [startInEditMode]);

  // Equipment mutations
  const [moveObjectToEquipment] = useMutation(MOVE_OBJECT_TO_EQUIPMENT, {
    onError: err => {
      console.error("Error moving item to equipment:", err);
      setMutationError({
        message: err.message || "Error moving item to equipment",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [moveObjectToReady] = useMutation(MOVE_OBJECT_TO_READY, {
    onError: err => {
      console.error("Error moving item to ready:", err);
      setMutationError({
        message: err.message || "Error moving item to ready",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [moveObjectFromReadyToEquipment] = useMutation(MOVE_OBJECT_FROM_READY_TO_EQUIPMENT, {
    onError: err => {
      console.error("Error moving item from ready to equipment:", err);
      setMutationError({
        message: err.message || "Error moving item from ready to equipment",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [moveObjectFromEquipmentToStash] = useMutation(MOVE_OBJECT_FROM_EQUIPMENT_TO_STASH, {
    onError: err => {
      console.error("Error moving item from equipment to stash:", err);
      setMutationError({
        message: err.message || "Error moving item from equipment to stash",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [removeObjectFromStash] = useMutation(REMOVE_OBJECT_FROM_STASH, {
    onError: err => {
      console.error("Error removing item from stash:", err);
      setMutationError({
        message: err.message || "Error removing item from stash",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [removeConditionFromCharacter] = useMutation(REMOVE_CONDITION_FROM_CHARACTER, {
    onError: err => {
      console.error("Error removing condition:", err);
      setMutationError({
        message: err.message || "Error removing condition",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [updateConditionAmount] = useMutation(UPDATE_CONDITION_AMOUNT, {
    onError: err => {
      console.error("Error updating condition amount:", err);
      setMutationError({
        message: err.message || "Error updating condition amount",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [removeActionFromCharacter] = useMutation(REMOVE_ACTION_FROM_CHARACTER, {
    onError: err => {
      console.error("Error removing action from character:", err);
      setMutationError({
        message: err.message || "Error removing action from character",
        stack: err.stack || "No stack trace available."
      });
    }
  });

  // Mind-related mutations
  const [removeThoughtFromCharacterMind] = useMutation(REMOVE_THOUGHT_FROM_CHARACTER_MIND, {
    onError: err => {
      console.error("Error removing thought from character mind:", err);
      setMutationError({
        message: err.message || "Error removing thought from character mind",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [moveThoughtToSubconscious] = useMutation(MOVE_THOUGHT_TO_SUBCONSCIOUS, {
    onError: err => {
      console.error("Error moving thought to subconscious:", err);
      setMutationError({
        message: err.message || "Error moving thought to subconscious",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [moveThoughtToConscious] = useMutation(MOVE_THOUGHT_TO_CONSCIOUS, {
    onError: err => {
      console.error("Error moving thought to conscious:", err);
      setMutationError({
        message: err.message || "Error moving thought to conscious",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [moveThoughtToMemory] = useMutation(MOVE_THOUGHT_TO_MEMORY, {
    onError: err => {
      console.error("Error moving thought to memory:", err);
      setMutationError({
        message: err.message || "Error moving thought to memory",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [updateThoughtAffinityKnowledge] = useMutation(UPDATE_THOUGHT_AFFINITY_KNOWLEDGE, {
    onError: err => {
      console.error("Error updating thought affinity/knowledge:", err);
      setMutationError({
        message: err.message || "Error updating thought affinity/knowledge",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [updateInventoryQuantity] = useMutation(UPDATE_INVENTORY_QUANTITY, {
    onError: err => {
      console.error("Error updating inventory quantity:", err);
      setMutationError({
        message: err.message || "Error updating inventory quantity",
        stack: err.stack || "No stack trace available."
      });
    }
  });
  const [moveInventoryItem] = useMutation(MOVE_INVENTORY_ITEM, {
    onError: err => {
      console.error("Error moving inventory item:", err);
      setMutationError({
        message: err.message || "Error moving inventory item",
        stack: err.stack || "No stack trace available."
      });
    }
  });

  // Subscribe to character updates
  useSubscription(ON_UPDATE_CHARACTER, {
    onData: ({
      data
    }) => {
      const updatedCharacter = data.data.onUpdateCharacter;
      if (updatedCharacter && updatedCharacter.characterId === characterId) {
        console.log("Character update received via subscription:", updatedCharacter);
        // Refetch the complete character data to get updated mind relationships
        refetch();
      }
    },
    variables: {
      characterId
    } // This may not be needed if the subscription doesn't filter
  });

  // Subscribe to character deletions
  useSubscription(ON_DELETE_CHARACTER, {
    onData: ({
      data
    }) => {
      const deletedCharacter = data.data.onDeleteCharacter;
      if (deletedCharacter && deletedCharacter.characterId === characterId) {
        console.log("Character was deleted");
        // Redirect to the character list since this character no longer exists
        navigate("/characters");
      }
    }
  });

  // Ensure we're using the most recent data
  useEffect(() => {
    if (data && data.getCharacter) {
      setCurrentCharacter(data.getCharacter);
    }
  }, [data]);
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this character?")) {
      try {
        await deleteCharacter({
          variables: {
            characterId
          }
        });
        navigate("/characters");
      } catch (err) {
        console.error("Error deleting character:", err);
        let errorMessage = "An unexpected error occurred while deleting character.";
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
        setMutationError({
          message: errorMessage,
          stack: errorStack
        });
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
  const handleTestAction = action => {
    setTestAction(action);
  };
  const handleTestClose = () => {
    setTestAction(null);
  };

  // Handler for moving item from stash to equipment
  const handleEquipItem = async objectId => {
    const stashWithQuantities = getInventoryWithQuantities(character.stash || [], 'STASH');
    const equipmentWithQuantities = getInventoryWithQuantities(character.equipment || [], 'EQUIPMENT');
    const item = stashWithQuantities.find(i => i.objectId === objectId);
    const existingEquipmentItem = equipmentWithQuantities.find(i => i.objectId === objectId);

    // Always use quantity system if item has quantity > 1 OR if destination already has this item
    if (item && item.quantity > 1 || existingEquipmentItem) {
      setInventoryMoveAction({
        item,
        objectId,
        fromLocation: 'STASH',
        toLocation: 'EQUIPMENT',
        action: 'Equip',
        maxQuantity: item.quantity,
        destinationQuantity: existingEquipmentItem ? existingEquipmentItem.quantity : 0
      });
    } else {
      try {
        await moveObjectToEquipment({
          variables: {
            characterId,
            objectId
          }
        });
        refetch();
      } catch (err) {
        console.error("Error equipping item:", err);
        setMutationError({
          message: "Failed to equip item. " + (err.message || ""),
          stack: err.stack || "No stack trace available."
        });
      }
    }
  };

  // Handler for moving item from equipment to stash
  const handleUnequipItem = async objectId => {
    const equipmentWithQuantities = getInventoryWithQuantities(character.equipment || [], 'EQUIPMENT');
    const stashWithQuantities = getInventoryWithQuantities(character.stash || [], 'STASH');
    const item = equipmentWithQuantities.find(i => i.objectId === objectId);
    const existingStashItem = stashWithQuantities.find(i => i.objectId === objectId);

    // Always use quantity system if item has quantity > 1 OR if destination already has this item
    if (item && item.quantity > 1 || existingStashItem) {
      setInventoryMoveAction({
        item,
        objectId,
        fromLocation: 'EQUIPMENT',
        toLocation: 'STASH',
        action: 'Stash',
        maxQuantity: item.quantity,
        destinationQuantity: existingStashItem ? existingStashItem.quantity : 0
      });
    } else {
      try {
        await moveObjectFromEquipmentToStash({
          variables: {
            characterId,
            objectId
          }
        });
        refetch();
      } catch (err) {
        console.error("Error unequipping item:", err);
        setMutationError({
          message: "Failed to unequip item. " + (err.message || ""),
          stack: err.stack || "No stack trace available."
        });
      }
    }
  };

  // Handler for moving item from equipment to ready
  const handleReadyItem = async objectId => {
    const equipmentWithQuantities = getInventoryWithQuantities(character.equipment || [], 'EQUIPMENT');
    const readyWithQuantities = getInventoryWithQuantities(character.ready || [], 'READY');
    const item = equipmentWithQuantities.find(i => i.objectId === objectId);
    const existingReadyItem = readyWithQuantities.find(i => i.objectId === objectId);

    // Always use quantity system if item has quantity > 1 OR if destination already has this item
    if (item && item.quantity > 1 || existingReadyItem) {
      setInventoryMoveAction({
        item,
        objectId,
        fromLocation: 'EQUIPMENT',
        toLocation: 'READY',
        action: 'Ready',
        maxQuantity: item.quantity,
        destinationQuantity: existingReadyItem ? existingReadyItem.quantity : 0
      });
    } else {
      try {
        await moveObjectToReady({
          variables: {
            characterId,
            objectId
          }
        });
        refetch();
      } catch (err) {
        console.error("Error readying item:", err);
        setMutationError({
          message: "Failed to ready item. " + (err.message || ""),
          stack: err.stack || "No stack trace available."
        });
      }
    }
  };

  // Handler for moving item from ready to equipment
  const handleUnreadyItem = async objectId => {
    const readyWithQuantities = getInventoryWithQuantities(character.ready || [], 'READY');
    const equipmentWithQuantities = getInventoryWithQuantities(character.equipment || [], 'EQUIPMENT');
    const item = readyWithQuantities.find(i => i.objectId === objectId);
    const existingEquipmentItem = equipmentWithQuantities.find(i => i.objectId === objectId);

    // Always use quantity system if item has quantity > 1 OR if destination already has this item
    if (item && item.quantity > 1 || existingEquipmentItem) {
      setInventoryMoveAction({
        item,
        objectId,
        fromLocation: 'READY',
        toLocation: 'EQUIPMENT',
        action: 'Unready',
        maxQuantity: item.quantity,
        destinationQuantity: existingEquipmentItem ? existingEquipmentItem.quantity : 0
      });
    } else {
      try {
        await moveObjectFromReadyToEquipment({
          variables: {
            characterId,
            objectId
          }
        });
        refetch();
      } catch (err) {
        console.error("Error unreadying item:", err);
        setMutationError({
          message: "Failed to unready item. " + (err.message || ""),
          stack: err.stack || "No stack trace available."
        });
      }
    }
  };

  // Handler for removing item from stash completely
  const handleRemoveItem = async objectId => {
    const stashWithQuantities = getInventoryWithQuantities(character.stash || [], 'STASH');
    const item = stashWithQuantities.find(i => i.objectId === objectId);
    if (item && item.quantity > 1) {
      setInventoryMoveAction({
        item,
        objectId,
        fromLocation: 'STASH',
        toLocation: null,
        // null indicates removal
        action: 'Remove',
        maxQuantity: item.quantity
      });
    } else {
      try {
        await removeObjectFromStash({
          variables: {
            characterId,
            objectId
          }
        });
        refetch();
      } catch (err) {
        console.error("Error removing item:", err);
        setMutationError({
          message: "Failed to remove item. " + (err.message || ""),
          stack: err.stack || "No stack trace available."
        });
      }
    }
  };

  // Handler for removing a condition
  const handleRemoveCondition = async conditionId => {
    try {
      await removeConditionFromCharacter({
        variables: {
          characterId,
          conditionId
        }
      });

      // Refetch to update the UI
      refetch();
    } catch (err) {
      console.error("Error removing condition:", err);
      setMutationError({
        message: "Failed to remove condition. " + (err.message || ""),
        stack: err.stack || "No stack trace available."
      });
    }
  };

  // Handler for showing condition amount adjustment popup
  const handleAdjustCondition = condition => {
    setIsAdjustingCondition(condition);
  };

  // Handler for updating condition amount
  const handleConditionAmountUpdate = async amount => {
    if (!isAdjustingCondition) return;
    try {
      await updateConditionAmount({
        variables: {
          characterId,
          conditionId: isAdjustingCondition.conditionId,
          amount
        }
      });

      // Refetch to update the UI
      refetch();
      // Close the popup
      setIsAdjustingCondition(null);
    } catch (err) {
      console.error("Error updating condition amount:", err);
      setMutationError({
        message: "Failed to update condition amount. " + (err.message || ""),
        stack: err.stack || "No stack trace available."
      });
    }
  };

  // Handler for removing an action from character
  const handleRemoveAction = async actionId => {
    try {
      await removeActionFromCharacter({
        variables: {
          characterId,
          actionId
        }
      });

      // Refetch to update the UI
      refetch();
    } catch (err) {
      console.error("Error removing action:", err);
      setMutationError({
        message: "Failed to remove action. " + (err.message || ""),
        stack: err.stack || "No stack trace available."
      });
    }
  };

  // Mind-related handlers
  const handleRemoveThought = async thoughtId => {
    try {
      await removeThoughtFromCharacterMind({
        variables: {
          characterId,
          thoughtId
        }
      });
      refetch();
    } catch (err) {
      console.error("Error removing thought:", err);
      setMutationError({
        message: err.message || "Error removing thought",
        stack: err.stack || "No stack trace available."
      });
    }
  };
  const handleMoveThought = async (thoughtId, newLocation) => {
    try {
      if (newLocation === 'MEMORY') {
        await moveThoughtToMemory({
          variables: {
            characterId,
            thoughtId
          }
        });
      } else if (newLocation === 'SUBCONSCIOUS') {
        await moveThoughtToSubconscious({
          variables: {
            characterId,
            thoughtId
          }
        });
      } else if (newLocation === 'CONSCIOUS') {
        await moveThoughtToConscious({
          variables: {
            characterId,
            thoughtId
          }
        });
      }
      refetch();
    } catch (err) {
      console.error("Error moving thought:", err);
      setMutationError({
        message: err.message || "Error moving thought",
        stack: err.stack || "No stack trace available."
      });
    }
  };
  const handleEditThoughtAttributes = mindThought => {
    setIsEditingThoughtAttributes(mindThought);
  };
  const handleNavigateToThought = thoughtId => {
    navigate(`/thoughts/${thoughtId}`);
  };
  const handleUpdateThoughtAttributes = async (thoughtId, affinity, knowledge) => {
    try {
      await updateThoughtAffinityKnowledge({
        variables: {
          characterId,
          thoughtId,
          affinity,
          knowledge
        }
      });
      setIsEditingThoughtAttributes(null);
      refetch();
    } catch (err) {
      console.error("Error updating thought attributes:", err);
      setMutationError({
        message: err.message || "Error updating thought attributes",
        stack: err.stack || "No stack trace available."
      });
    }
  };

  // Inventory quantity handlers
  const handleEditInventoryQuantity = (item, location) => {
    setIsEditingInventoryQuantity({
      ...item,
      location
    });
  };
  const handleUpdateInventoryQuantity = async (objectId, quantity) => {
    if (!isEditingInventoryQuantity) return;
    try {
      await updateInventoryQuantity({
        variables: {
          characterId,
          objectId,
          quantity,
          location: isEditingInventoryQuantity.location
        }
      });
      setIsEditingInventoryQuantity(null);
      refetch();
    } catch (err) {
      console.error("Error updating inventory quantity:", err);
      setMutationError({
        message: err.message || "Error updating inventory quantity",
        stack: err.stack || "No stack trace available."
      });
    }
  };
  const handleInventoryMoveWithQuantity = async quantity => {
    if (!inventoryMoveAction) return;
    const {
      objectId,
      fromLocation,
      toLocation
    } = inventoryMoveAction;
    try {
      if (toLocation === null) {
        // Handle removal - we need to update quantity to reduce it
        const currentItem = character.inventoryItems?.find(item => item.objectId === objectId && item.inventoryLocation === fromLocation);
        if (currentItem && currentItem.quantity > quantity) {
          // Reduce quantity
          await updateInventoryQuantity({
            variables: {
              characterId,
              objectId,
              quantity: currentItem.quantity - quantity,
              location: fromLocation
            }
          });
        } else {
          // Remove completely
          await removeObjectFromStash({
            variables: {
              characterId,
              objectId
            }
          });
        }
      } else {
        // Move between locations
        await moveInventoryItem({
          variables: {
            characterId,
            objectId,
            quantity,
            fromLocation,
            toLocation
          }
        });
      }
      setInventoryMoveAction(null);
      refetch();
    } catch (err) {
      console.error("Error moving inventory item:", err);
      setMutationError({
        message: err.message || "Error moving inventory item",
        stack: err.stack || "No stack trace available."
      });
    }
  };

  // Helper function to get inventory data with quantities
  const getInventoryWithQuantities = (items, location) => {
    const inventoryItems = character.inventoryItems || [];
    const itemMap = new Map();

    // Build quantity map
    inventoryItems.filter(invItem => invItem.inventoryLocation === location).forEach(invItem => {
      itemMap.set(invItem.objectId, invItem.quantity);
    });

    // Enhance items with quantities
    return items.map(item => ({
      ...item,
      quantity: itemMap.get(item.objectId) || 1
    }));
  };
  if (loading) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading character details...");
  if (error) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Error: ", error.message);
  if (!currentCharacter) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Character not found");
  const character = currentCharacter;
  if (testAction) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "overlay",
      onClick: handleTestClose
    }), /*#__PURE__*/React.createElement(ActionTestBackend, {
      action: testAction,
      character: character,
      onClose: handleTestClose
    }));
  }

  // Show condition amount adjustment popup
  if (isAdjustingCondition) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(QuickAdjustPopup, {
      currentValue: isAdjustingCondition.amount,
      onAdjust: handleConditionAmountUpdate,
      onClose: () => setIsAdjustingCondition(null),
      min: 1,
      max: 100,
      title: `Adjust ${isAdjustingCondition.name} Amount`
    }), /*#__PURE__*/React.createElement("div", {
      className: "character-view",
      style: {
        pointerEvents: "none",
        opacity: 0.6
      }
    }));
  }
  if (isEditing) {
    return /*#__PURE__*/React.createElement(CharacterForm, {
      character: character,
      isEditing: true,
      onClose: handleEditCancel,
      onSuccess: handleEditSuccess
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "character-view"
  }, /*#__PURE__*/React.createElement("div", {
    className: "view-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, character.name)), /*#__PURE__*/React.createElement("div", {
    className: "view-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "edit-button",
    onClick: handleEdit
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: handleDelete
  }, "Delete"))), /*#__PURE__*/React.createElement("div", {
    className: "character-sections"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-row"
  }, /*#__PURE__*/React.createElement(CharacterDetails, {
    character: character,
    onUpdate: refetch
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-row"
  }, /*#__PURE__*/React.createElement(CharacterAttributesBackend, {
    character: character,
    groupedAttributes: character.groupedAttributes,
    readyGroupedAttributes: character.readyGroupedAttributes
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section character-mind"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mind-header",
    onClick: () => setIsMindExpanded(!isMindExpanded),
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("h3", null, "Mind"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8em',
      color: '#666'
    }
  }, isMindExpanded ? '▼' : '▶')), isMindExpanded && /*#__PURE__*/React.createElement("div", {
    className: "mind-categories"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mind-category"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setIsMemoryExpanded(!isMemoryExpanded),
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      color: '#6c757d'
    }
  }, "Memory"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7em',
      color: '#666'
    }
  }, isMemoryExpanded ? '▼' : '▶')), isMemoryExpanded && /*#__PURE__*/React.createElement("div", null, character.mind && character.mind.filter(mt => mt.location === 'MEMORY').length > 0 ? /*#__PURE__*/React.createElement("ul", {
    className: "mind-list"
  }, character.mind.filter(mindThought => mindThought.location === 'MEMORY').map(mindThought => {
    const thought = character.mindThoughts?.find(t => t.thoughtId === mindThought.thoughtId);
    return /*#__PURE__*/React.createElement("li", {
      key: mindThought.thoughtId,
      className: "mind-item"
    }, /*#__PURE__*/React.createElement("div", {
      className: "thought-info"
    }, /*#__PURE__*/React.createElement(Link, {
      to: `/thoughts/${mindThought.thoughtId}`,
      className: "thought-link"
    }, thought?.name || 'Unknown Thought'), /*#__PURE__*/React.createElement("div", {
      className: "thought-attributes"
    }, /*#__PURE__*/React.createElement("span", {
      className: "thought-attribute clickable",
      onClick: () => handleEditThoughtAttributes(mindThought),
      style: {
        cursor: 'pointer',
        color: '#007bff',
        textDecoration: 'underline'
      }
    }, "Affinity: ", mindThought.affinity), ' | ', /*#__PURE__*/React.createElement("span", {
      className: "thought-attribute clickable",
      onClick: () => handleEditThoughtAttributes(mindThought),
      style: {
        cursor: 'pointer',
        color: '#007bff',
        textDecoration: 'underline'
      }
    }, "Knowledge: ", mindThought.knowledge))), /*#__PURE__*/React.createElement("div", {
      className: "thought-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "move-button",
      onClick: () => handleMoveThought(mindThought.thoughtId, 'SUBCONSCIOUS'),
      style: {
        marginRight: '4px',
        fontSize: '12px',
        padding: '2px 6px'
      }
    }, "\u2192 Sub"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "remove-button",
      onClick: () => handleRemoveThought(mindThought.thoughtId),
      style: {
        fontSize: '12px',
        padding: '2px 6px'
      }
    }, "Remove")));
  })) : /*#__PURE__*/React.createElement("p", {
    style: {
      color: '#6c757d',
      fontStyle: 'italic',
      marginBottom: '16px'
    }
  }, "No thoughts in memory"))), /*#__PURE__*/React.createElement("div", {
    className: "mind-category"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setIsSubconsciousExpanded(!isSubconsciousExpanded),
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      color: '#6c757d'
    }
  }, "Subconscious"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7em',
      color: '#666'
    }
  }, isSubconsciousExpanded ? '▼' : '▶')), isSubconsciousExpanded && /*#__PURE__*/React.createElement("div", null, character.mind && character.mind.filter(mt => mt.location === 'SUBCONSCIOUS').length > 0 ? /*#__PURE__*/React.createElement("ul", {
    className: "mind-list"
  }, character.mind.filter(mindThought => mindThought.location === 'SUBCONSCIOUS').map(mindThought => {
    const thought = character.mindThoughts?.find(t => t.thoughtId === mindThought.thoughtId);
    return /*#__PURE__*/React.createElement("li", {
      key: mindThought.thoughtId,
      className: "mind-item"
    }, /*#__PURE__*/React.createElement("div", {
      className: "thought-info"
    }, /*#__PURE__*/React.createElement(Link, {
      to: `/thoughts/${mindThought.thoughtId}`,
      className: "thought-link"
    }, thought?.name || 'Unknown Thought'), /*#__PURE__*/React.createElement("div", {
      className: "thought-attributes"
    }, /*#__PURE__*/React.createElement("span", {
      className: "thought-attribute clickable",
      onClick: () => handleEditThoughtAttributes(mindThought),
      style: {
        cursor: 'pointer',
        color: '#007bff',
        textDecoration: 'underline'
      }
    }, "Affinity: ", mindThought.affinity), ' | ', /*#__PURE__*/React.createElement("span", {
      className: "thought-attribute clickable",
      onClick: () => handleEditThoughtAttributes(mindThought),
      style: {
        cursor: 'pointer',
        color: '#007bff',
        textDecoration: 'underline'
      }
    }, "Knowledge: ", mindThought.knowledge))), /*#__PURE__*/React.createElement("div", {
      className: "thought-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "move-button",
      onClick: () => handleMoveThought(mindThought.thoughtId, 'MEMORY'),
      style: {
        marginRight: '4px',
        fontSize: '12px',
        padding: '2px 6px'
      }
    }, "\u2192 Memory"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "move-button",
      onClick: () => handleMoveThought(mindThought.thoughtId, 'CONSCIOUS'),
      style: {
        marginRight: '4px',
        fontSize: '12px',
        padding: '2px 6px'
      }
    }, "\u2192 Conscious"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "remove-button",
      onClick: () => handleRemoveThought(mindThought.thoughtId),
      style: {
        fontSize: '12px',
        padding: '2px 6px'
      }
    }, "Remove")));
  })) : /*#__PURE__*/React.createElement("p", {
    style: {
      color: '#6c757d',
      fontStyle: 'italic',
      marginBottom: '16px'
    }
  }, "No thoughts in subconscious"))), /*#__PURE__*/React.createElement("div", {
    className: "mind-category"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setIsConsciousExpanded(!isConsciousExpanded),
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      color: '#6c757d'
    }
  }, "Conscious"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7em',
      color: '#666'
    }
  }, isConsciousExpanded ? '▼' : '▶')), isConsciousExpanded && /*#__PURE__*/React.createElement("div", null, character.mind && character.mind.filter(mt => mt.location === 'CONSCIOUS').length > 0 ? /*#__PURE__*/React.createElement("ul", {
    className: "mind-list"
  }, character.mind.filter(mindThought => mindThought.location === 'CONSCIOUS').map(mindThought => {
    const thought = character.mindThoughts?.find(t => t.thoughtId === mindThought.thoughtId);
    return /*#__PURE__*/React.createElement("li", {
      key: mindThought.thoughtId,
      className: "mind-item"
    }, /*#__PURE__*/React.createElement("div", {
      className: "thought-info"
    }, /*#__PURE__*/React.createElement(Link, {
      to: `/thoughts/${mindThought.thoughtId}`,
      className: "thought-link"
    }, thought?.name || 'Unknown Thought'), /*#__PURE__*/React.createElement("div", {
      className: "thought-attributes"
    }, /*#__PURE__*/React.createElement("span", {
      className: "thought-attribute clickable",
      onClick: () => handleEditThoughtAttributes(mindThought),
      style: {
        cursor: 'pointer',
        color: '#007bff',
        textDecoration: 'underline'
      }
    }, "Affinity: ", mindThought.affinity), ' | ', /*#__PURE__*/React.createElement("span", {
      className: "thought-attribute clickable",
      onClick: () => handleEditThoughtAttributes(mindThought),
      style: {
        cursor: 'pointer',
        color: '#007bff',
        textDecoration: 'underline'
      }
    }, "Knowledge: ", mindThought.knowledge))), /*#__PURE__*/React.createElement("div", {
      className: "thought-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "move-button",
      onClick: () => handleMoveThought(mindThought.thoughtId, 'SUBCONSCIOUS'),
      style: {
        marginRight: '4px',
        fontSize: '12px',
        padding: '2px 6px'
      }
    }, "\u2192 Sub"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "remove-button",
      onClick: () => handleRemoveThought(mindThought.thoughtId),
      style: {
        fontSize: '12px',
        padding: '2px 6px'
      }
    }, "Remove")));
  })) : /*#__PURE__*/React.createElement("p", {
    style: {
      color: '#6c757d',
      fontStyle: 'italic',
      marginBottom: '16px'
    }
  }, "No thoughts in conscious")))))), /*#__PURE__*/React.createElement("div", {
    className: "section-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section character-inventory"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inventory-header",
    onClick: () => setIsInventoryExpanded(!isInventoryExpanded),
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("h3", null, "Inventory"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8em',
      color: '#666'
    }
  }, isInventoryExpanded ? '▼' : '▶')), isInventoryExpanded && /*#__PURE__*/React.createElement("div", {
    className: "inventory-categories"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inventory-category"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setIsStashExpanded(!isStashExpanded),
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      color: '#6c757d'
    }
  }, "Stash"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7em',
      color: '#666'
    }
  }, isStashExpanded ? '▼' : '▶')), isStashExpanded && /*#__PURE__*/React.createElement("div", null, character.stash && character.stash.length > 0 ? /*#__PURE__*/React.createElement("ul", {
    className: "inventory-list"
  }, getInventoryWithQuantities(character.stash, 'STASH').map(item => /*#__PURE__*/React.createElement("li", {
    key: item.objectId,
    className: "inventory-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "item-info"
  }, /*#__PURE__*/React.createElement(Link, {
    to: `/objects/${item.objectId}`,
    className: "object-link"
  }, item.name, " (", item.objectCategory, ")"), /*#__PURE__*/React.createElement("span", {
    className: "item-quantity",
    onClick: () => handleEditInventoryQuantity(item, 'STASH'),
    style: {
      marginLeft: '8px',
      color: '#007bff',
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    title: "Click to edit quantity"
  }, "x", item.quantity)), /*#__PURE__*/React.createElement("div", {
    className: "item-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "equip-button",
    onClick: () => handleEquipItem(item.objectId),
    style: {
      backgroundColor: '#28a745',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '0.8em',
      fontWeight: '500',
      cursor: 'pointer',
      marginRight: '4px'
    }
  }, "Equip"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "remove-button",
    onClick: () => handleRemoveItem(item.objectId),
    style: {
      backgroundColor: '#dc3545',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '0.8em',
      fontWeight: '500',
      cursor: 'pointer'
    }
  }, "Remove"))))) : /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.9em',
      color: '#666',
      margin: '4px 0'
    }
  }, "No items in stash."))), /*#__PURE__*/React.createElement("div", {
    className: "inventory-category"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setIsEquipmentExpanded(!isEquipmentExpanded),
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      color: '#6c757d'
    }
  }, "Equipment"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7em',
      color: '#666'
    }
  }, isEquipmentExpanded ? '▼' : '▶')), isEquipmentExpanded && /*#__PURE__*/React.createElement("div", null, character.equipment && character.equipment.length > 0 ? /*#__PURE__*/React.createElement("ul", {
    className: "inventory-list"
  }, getInventoryWithQuantities(character.equipment, 'EQUIPMENT').map(item => /*#__PURE__*/React.createElement("li", {
    key: item.objectId,
    className: "inventory-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "item-info"
  }, /*#__PURE__*/React.createElement(Link, {
    to: `/objects/${item.objectId}`,
    className: "object-link"
  }, item.name, " (", item.objectCategory, ")"), /*#__PURE__*/React.createElement("span", {
    className: "item-quantity",
    onClick: () => handleEditInventoryQuantity(item, 'EQUIPMENT'),
    style: {
      marginLeft: '8px',
      color: '#007bff',
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    title: "Click to edit quantity"
  }, "x", item.quantity)), /*#__PURE__*/React.createElement("div", {
    className: "item-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ready-button",
    onClick: () => handleReadyItem(item.objectId),
    style: {
      backgroundColor: '#007bff',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '0.8em',
      fontWeight: '500',
      cursor: 'pointer',
      marginRight: '4px'
    }
  }, "Ready"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "unequip-button",
    onClick: () => handleUnequipItem(item.objectId),
    style: {
      backgroundColor: '#fd7e14',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '0.8em',
      fontWeight: '500',
      cursor: 'pointer'
    }
  }, "Unequip"))))) : /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.9em',
      color: '#666',
      margin: '4px 0'
    }
  }, "Nothing equipped."))), /*#__PURE__*/React.createElement("div", {
    className: "inventory-category"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setIsReadyExpanded(!isReadyExpanded),
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      color: '#6c757d'
    }
  }, "Ready"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7em',
      color: '#666'
    }
  }, isReadyExpanded ? '▼' : '▶')), isReadyExpanded && /*#__PURE__*/React.createElement("div", null, character.ready && character.ready.length > 0 ? /*#__PURE__*/React.createElement("ul", {
    className: "inventory-list"
  }, getInventoryWithQuantities(character.ready, 'READY').map(item => /*#__PURE__*/React.createElement("li", {
    key: item.objectId,
    className: "inventory-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "item-info"
  }, /*#__PURE__*/React.createElement(Link, {
    to: `/objects/${item.objectId}`,
    className: "object-link"
  }, item.name, " (", item.objectCategory, ")"), /*#__PURE__*/React.createElement("span", {
    className: "item-quantity",
    onClick: () => handleEditInventoryQuantity(item, 'READY'),
    style: {
      marginLeft: '8px',
      color: '#007bff',
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    title: "Click to edit quantity"
  }, "x", item.quantity)), /*#__PURE__*/React.createElement("div", {
    className: "item-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "unready-button",
    onClick: () => handleUnreadyItem(item.objectId),
    style: {
      backgroundColor: '#6c757d',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '0.8em',
      fontWeight: '500',
      cursor: 'pointer'
    }
  }, "Unready"))))) : /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.9em',
      color: '#666',
      margin: '4px 0'
    }
  }, "No items ready.")))))), /*#__PURE__*/React.createElement("div", {
    className: "section-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section actions"
  }, /*#__PURE__*/React.createElement("h3", null, "Actions"), character.actions && character.actions.length > 0 ? /*#__PURE__*/React.createElement("div", null, character.actions.map(action => /*#__PURE__*/React.createElement("div", {
    key: action.actionId,
    className: "character-action"
  }, /*#__PURE__*/React.createElement("div", {
    className: "action-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "action-name"
  }, /*#__PURE__*/React.createElement(Link, {
    to: `/actions/${action.actionId}`
  }, action.name)), /*#__PURE__*/React.createElement("div", {
    className: "action-description"
  }, action.description)), /*#__PURE__*/React.createElement("div", {
    className: "action-buttons"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleTestAction(action),
    className: "test-action-button"
  }, "Test"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "remove-action-button",
    onClick: () => handleRemoveAction(action.actionId),
    style: {
      backgroundColor: '#dc3545',
      color: 'white',
      padding: '4px 10px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '0.9em',
      fontWeight: '500',
      cursor: 'pointer',
      marginLeft: '8px'
    }
  }, "Remove"))))) : /*#__PURE__*/React.createElement("p", null, "No actions"))), /*#__PURE__*/React.createElement("div", {
    className: "section-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section character-conditions"
  }, /*#__PURE__*/React.createElement("h3", null, "Conditions"), character.conditions && character.conditions.length > 0 ? /*#__PURE__*/React.createElement("ul", {
    className: "conditions-list"
  }, character.conditions.map(condition => /*#__PURE__*/React.createElement("li", {
    key: condition.conditionId,
    className: "condition-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "condition-info"
  }, /*#__PURE__*/React.createElement(Link, {
    to: `/conditions/${condition.conditionId}`,
    className: "condition-link"
  }, /*#__PURE__*/React.createElement("span", {
    className: "condition-name"
  }, condition.name), /*#__PURE__*/React.createElement("span", {
    className: `condition-type ${condition.conditionType.toLowerCase()}`
  }, condition.conditionType), /*#__PURE__*/React.createElement("span", {
    className: "condition-effect"
  }, condition.conditionTarget, ": ", condition.conditionType === 'HELP' ? '+' : '-', condition.amount))), /*#__PURE__*/React.createElement("div", {
    className: "condition-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "adjust-condition-button",
    onClick: () => handleAdjustCondition(condition),
    style: {
      backgroundColor: '#007bff',
      color: 'white',
      padding: '4px 10px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '0.9em',
      fontWeight: '500',
      cursor: 'pointer',
      marginRight: '6px'
    }
  }, "Adjust"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "remove-condition-button",
    onClick: () => handleRemoveCondition(condition.conditionId),
    style: {
      backgroundColor: '#dc3545',
      color: 'white',
      padding: '4px 10px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '0.9em',
      fontWeight: '500',
      cursor: 'pointer'
    }
  }, "Remove"))))) : /*#__PURE__*/React.createElement("p", null, "No active conditions."))), /*#__PURE__*/React.createElement("div", {
    className: "section-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section character-special"
  }, /*#__PURE__*/React.createElement("h3", null, "Special Abilities"), character.special && character.special.length > 0 ? /*#__PURE__*/React.createElement("ul", {
    className: "special-list"
  }, character.special.map((ability, index) => /*#__PURE__*/React.createElement("li", {
    key: index,
    className: "special-item"
  }, ability))) : /*#__PURE__*/React.createElement("p", null, "No special abilities")))), /*#__PURE__*/React.createElement(ErrorPopup, {
    error: mutationError,
    onClose: () => setMutationError(null)
  }), " ", isEditingThoughtAttributes && /*#__PURE__*/React.createElement(ThoughtAttributesModal, {
    mindThought: isEditingThoughtAttributes,
    onSave: handleUpdateThoughtAttributes,
    onCancel: () => setIsEditingThoughtAttributes(null)
  }), isEditingInventoryQuantity && /*#__PURE__*/React.createElement(InventoryQuantityModal, {
    item: isEditingInventoryQuantity,
    onSave: handleUpdateInventoryQuantity,
    onCancel: () => setIsEditingInventoryQuantity(null)
  }), inventoryMoveAction && /*#__PURE__*/React.createElement(InventoryMoveModal, {
    item: inventoryMoveAction.item,
    action: inventoryMoveAction.action,
    maxQuantity: inventoryMoveAction.maxQuantity,
    destinationQuantity: inventoryMoveAction.destinationQuantity || 0,
    onConfirm: handleInventoryMoveWithQuantity,
    onCancel: () => setInventoryMoveAction(null)
  }));
};
export default CharacterView;