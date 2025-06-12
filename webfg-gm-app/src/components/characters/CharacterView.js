import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import {
  DELETE_CHARACTER,
  ON_UPDATE_CHARACTER,
  ON_DELETE_CHARACTER,
  ADD_OBJECT_TO_STASH,
  REMOVE_OBJECT_FROM_STASH,
  MOVE_OBJECT_TO_EQUIPMENT,
  MOVE_OBJECT_TO_READY,
  MOVE_OBJECT_FROM_READY_TO_EQUIPMENT,
  MOVE_OBJECT_FROM_EQUIPMENT_TO_STASH,
  REMOVE_CONDITION_FROM_CHARACTER,
  UPDATE_CONDITION_AMOUNT
} from "../../graphql/operations";
import { GET_CHARACTER_WITH_GROUPED } from "../../graphql/computedOperations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import CharacterAttributesBackend from "./CharacterAttributesBackend";
import ActionTestBackend from "../actions/test/ActionTestBackend";
import CharacterDetails from "./CharacterDetails";
import CharacterForm from "../forms/CharacterForm";
import "./CharacterView.css";
import ErrorPopup from '../common/ErrorPopup'; // Import ErrorPopup
import QuickAdjustPopup from '../common/QuickAdjustPopup';

const CharacterView = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { selectCharacter } = useSelectedCharacter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [testAction, setTestAction] = useState(null); // State to store action being tested
  const [mutationError, setMutationError] = useState(null); // Added mutationError state
  const [isAdjustingCondition, setIsAdjustingCondition] = useState(null); // For condition amount adjustment popup
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(false); // For collapsible inventory

  // Initial query to get character data
  const { data, loading, error, refetch } = useQuery(GET_CHARACTER_WITH_GROUPED, {
    variables: { characterId },
    onCompleted: (data) => {
      if (data && data.getCharacter) {
        setCurrentCharacter(data.getCharacter);
        // Set as selected character when viewed
        selectCharacter({
          characterId: data.getCharacter.characterId,
          name: data.getCharacter.name
        });
      }
    }
  });

  const [deleteCharacter] = useMutation(DELETE_CHARACTER);
  
  // Equipment mutations
  const [moveObjectToEquipment] = useMutation(MOVE_OBJECT_TO_EQUIPMENT, {
    onError: (err) => {
      console.error("Error moving item to equipment:", err);
      setMutationError({ 
        message: err.message || "Error moving item to equipment", 
        stack: err.stack || "No stack trace available."
      });
    }
  });
  
  const [moveObjectToReady] = useMutation(MOVE_OBJECT_TO_READY, {
    onError: (err) => {
      console.error("Error moving item to ready:", err);
      setMutationError({ 
        message: err.message || "Error moving item to ready", 
        stack: err.stack || "No stack trace available."
      });
    }
  });
  
  const [moveObjectFromReadyToEquipment] = useMutation(MOVE_OBJECT_FROM_READY_TO_EQUIPMENT, {
    onError: (err) => {
      console.error("Error moving item from ready to equipment:", err);
      setMutationError({ 
        message: err.message || "Error moving item from ready to equipment", 
        stack: err.stack || "No stack trace available."
      });
    }
  });
  
  const [moveObjectFromEquipmentToStash] = useMutation(MOVE_OBJECT_FROM_EQUIPMENT_TO_STASH, {
    onError: (err) => {
      console.error("Error moving item from equipment to stash:", err);
      setMutationError({ 
        message: err.message || "Error moving item from equipment to stash", 
        stack: err.stack || "No stack trace available."
      });
    }
  });

  const [removeObjectFromStash] = useMutation(REMOVE_OBJECT_FROM_STASH, {
    onError: (err) => {
      console.error("Error removing item from stash:", err);
      setMutationError({ 
        message: err.message || "Error removing item from stash", 
        stack: err.stack || "No stack trace available."
      });
    }
  });

  const [removeConditionFromCharacter] = useMutation(REMOVE_CONDITION_FROM_CHARACTER, {
    onError: (err) => {
      console.error("Error removing condition:", err);
      setMutationError({ 
        message: err.message || "Error removing condition", 
        stack: err.stack || "No stack trace available."
      });
    }
  });

  const [updateConditionAmount] = useMutation(UPDATE_CONDITION_AMOUNT, {
    onError: (err) => {
      console.error("Error updating condition amount:", err);
      setMutationError({ 
        message: err.message || "Error updating condition amount", 
        stack: err.stack || "No stack trace available."
      });
    }
  });

  // Subscribe to character updates
  useSubscription(ON_UPDATE_CHARACTER, {
    onData: ({ data }) => {
      const updatedCharacter = data.data.onUpdateCharacter;
      if (updatedCharacter && updatedCharacter.characterId === characterId) {
        console.log("Character update received via subscription:", updatedCharacter);
        // Refresh the character data
        setCurrentCharacter(prev => ({
          ...prev,
          ...updatedCharacter
        }));
      }
    },
    variables: { characterId } // This may not be needed if the subscription doesn't filter
  });

  // Subscribe to character deletions
  useSubscription(ON_DELETE_CHARACTER, {
    onData: ({ data }) => {
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
          variables: { characterId }
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
        setMutationError({ message: errorMessage, stack: errorStack });
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

  const handleTestAction = (action) => {
    setTestAction(action);
  };

  const handleTestClose = () => {
    setTestAction(null);
  };

  // Handler for moving item from stash to equipment
  const handleEquipItem = async (objectId) => {
    try {
      await moveObjectToEquipment({
        variables: { characterId, objectId }
      });
      refetch();
    } catch (err) {
      console.error("Error equipping item:", err);
      setMutationError({ 
        message: "Failed to equip item. " + (err.message || ""),
        stack: err.stack || "No stack trace available."
      });
    }
  };
  
  // Handler for moving item from equipment to stash
  const handleUnequipItem = async (objectId) => {
    try {
      await moveObjectFromEquipmentToStash({
        variables: { characterId, objectId }
      });
      
      // Refetch to update the UI
      refetch();
    } catch (err) {
      console.error("Error unequipping item:", err);
      setMutationError({ 
        message: "Failed to unequip item. " + (err.message || ""),
        stack: err.stack || "No stack trace available."
      });
    }
  };

  // Handler for moving item from equipment to ready
  const handleReadyItem = async (objectId) => {
    try {
      await moveObjectToReady({
        variables: { characterId, objectId }
      });
      refetch();
    } catch (err) {
      console.error("Error readying item:", err);
      setMutationError({ 
        message: "Failed to ready item. " + (err.message || ""),
        stack: err.stack || "No stack trace available."
      });
    }
  };

  // Handler for moving item from ready to equipment
  const handleUnreadyItem = async (objectId) => {
    try {
      await moveObjectFromReadyToEquipment({
        variables: { characterId, objectId }
      });
      refetch();
    } catch (err) {
      console.error("Error unreadying item:", err);
      setMutationError({ 
        message: "Failed to unready item. " + (err.message || ""),
        stack: err.stack || "No stack trace available."
      });
    }
  };

  // Handler for removing item from stash completely
  const handleRemoveItem = async (objectId) => {
    try {
      await removeObjectFromStash({
        variables: { characterId, objectId }
      });
      refetch();
    } catch (err) {
      console.error("Error removing item:", err);
      setMutationError({ 
        message: "Failed to remove item. " + (err.message || ""),
        stack: err.stack || "No stack trace available."
      });
    }
  };

  // Handler for removing a condition
  const handleRemoveCondition = async (conditionId) => {
    try {
      await removeConditionFromCharacter({
        variables: { characterId, conditionId }
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
  const handleAdjustCondition = (condition) => {
    setIsAdjustingCondition(condition);
  };
  
  // Handler for updating condition amount
  const handleConditionAmountUpdate = async (amount) => {
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

  if (loading) return <div className="loading">Loading character details...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (!currentCharacter) return <div className="error">Character not found</div>;

  const character = currentCharacter;

  if (testAction) {
    return (
      <>
        <div className="overlay" onClick={handleTestClose}></div>
        <ActionTestBackend 
          action={testAction} 
          character={character} 
          onClose={handleTestClose} 
        />
      </>
    );
  }
  
  // Show condition amount adjustment popup
  if (isAdjustingCondition) {
    return (
      <>
        <QuickAdjustPopup
          currentValue={isAdjustingCondition.amount}
          onAdjust={handleConditionAmountUpdate}
          onClose={() => setIsAdjustingCondition(null)}
          min={1}
          max={100}
          title={`Adjust ${isAdjustingCondition.name} Amount`}
        />
        {/* Keep the character view in the background */}
        <div className="character-view" style={{ pointerEvents: "none", opacity: 0.6 }}>
          {/* Character view content */}
        </div>
      </>
    );
  }

  if (isEditing) {
    return (
      <CharacterForm
        character={character}
        isEditing={true}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <div className="character-view">
      <div className="view-header">
        <div>
          <h1>{character.name}</h1>
          {/* Race display removed */}
        </div>
        <div className="view-actions">
          <button className="edit-button" onClick={handleEdit}>Edit</button>
          <button className="delete-button" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="character-sections">
        <div className="section-row">
          <CharacterDetails character={character} onUpdate={refetch} />
        </div>

        <div className="section-row">
          <CharacterAttributesBackend 
            character={character}
            groupedAttributes={character.groupedAttributes}
          />
        </div>

        <div className="section-row">
          <div className="section character-values">
            <h3>Values</h3>
            {character.values && character.values.length > 0 ? (
              <ul>
                {character.values.map((value, index) => (
                  <li key={index}>
                    {value.valueName} ({value.valueType})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No values.</p>
            )}
          </div>
        </div>





        <div className="section-row">
          <div className="section character-inventory">
            <div 
              className="inventory-header" 
              onClick={() => setIsInventoryExpanded(!isInventoryExpanded)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <h3>Inventory</h3>
              <span style={{ fontSize: '0.8em', color: '#666' }}>
                {isInventoryExpanded ? '▼' : '▶'}
              </span>
            </div>
            
            {isInventoryExpanded && (
              <div className="inventory-categories">
                {/* Stash Section */}
                <div className="inventory-category">
                  <h4 style={{ marginBottom: '8px', color: '#6c757d' }}>Stash</h4>
                  {character.stash && character.stash.length > 0 ? (
                    <ul className="inventory-list">
                      {character.stash.map((item) => (
                        <li key={item.objectId} className="inventory-item">
                          <div className="item-info">
                            <Link to={`/objects/${item.objectId}`} className="object-link">
                              {item.name} ({item.objectCategory})
                            </Link>
                          </div>
                          <div className="item-actions">
                            <button 
                              type="button"
                              className="equip-button" 
                              onClick={() => handleEquipItem(item.objectId)}
                              style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '0.8em',
                                fontWeight: '500',
                                cursor: 'pointer',
                                marginRight: '4px'
                              }}
                            >
                              Equip
                            </button>
                            <button 
                              type="button"
                              className="remove-button" 
                              onClick={() => handleRemoveItem(item.objectId)}
                              style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '0.8em',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.9em', color: '#666', margin: '4px 0' }}>No items in stash.</p>
                  )}
                </div>

                {/* Equipment Section */}
                <div className="inventory-category">
                  <h4 style={{ marginBottom: '8px', color: '#6c757d' }}>Equipment</h4>
                  {character.equipment && character.equipment.length > 0 ? (
                    <ul className="inventory-list">
                      {character.equipment.map((item) => (
                        <li key={item.objectId} className="inventory-item">
                          <div className="item-info">
                            <Link to={`/objects/${item.objectId}`} className="object-link">
                              {item.name} ({item.objectCategory})
                            </Link>
                          </div>
                          <div className="item-actions">
                            <button 
                              type="button"
                              className="ready-button" 
                              onClick={() => handleReadyItem(item.objectId)}
                              style={{
                                backgroundColor: '#007bff',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '0.8em',
                                fontWeight: '500',
                                cursor: 'pointer',
                                marginRight: '4px'
                              }}
                            >
                              Ready
                            </button>
                            <button 
                              type="button"
                              className="unequip-button" 
                              onClick={() => handleUnequipItem(item.objectId)}
                              style={{
                                backgroundColor: '#fd7e14',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '0.8em',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              Unequip
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.9em', color: '#666', margin: '4px 0' }}>Nothing equipped.</p>
                  )}
                </div>

                {/* Ready Section */}
                <div className="inventory-category">
                  <h4 style={{ marginBottom: '8px', color: '#6c757d' }}>Ready</h4>
                  {character.ready && character.ready.length > 0 ? (
                    <ul className="inventory-list">
                      {character.ready.map((item) => (
                        <li key={item.objectId} className="inventory-item">
                          <div className="item-info">
                            <Link to={`/objects/${item.objectId}`} className="object-link">
                              {item.name} ({item.objectCategory})
                            </Link>
                          </div>
                          <div className="item-actions">
                            <button 
                              type="button"
                              className="unready-button" 
                              onClick={() => handleUnreadyItem(item.objectId)}
                              style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '0.8em',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              Unready
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.9em', color: '#666', margin: '4px 0' }}>No items ready.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="section-row">
          <div className="section actions">
            <h3>Actions</h3>
            {character.actions && character.actions.length > 0 ? (
              <div>
                {character.actions.map(action => (
                  <div key={action.actionId} className="character-action">
                    <div className="action-info">
                      <div className="action-name">
                        <Link to={`/actions/${action.actionId}`}>{action.name}</Link>
                      </div>
                      <div className="action-description">{action.description}</div>
                    </div>
                    <button 
                      onClick={() => handleTestAction(action)} 
                      className="test-action-button"
                    >
                      Test
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No actions</p>
            )}
          </div>
        </div>

        <div className="section-row">
          <div className="section character-conditions">
            <h3>Conditions</h3>
            {character.conditions && character.conditions.length > 0 ? (
              <ul className="conditions-list">
                {character.conditions.map((condition) => (
                  <li key={condition.conditionId} className="condition-item">
                    <div className="condition-info">
                      <Link to={`/conditions/${condition.conditionId}`} className="condition-link">
                        <span className="condition-name">{condition.name}</span>
                        <span className={`condition-type ${condition.conditionType.toLowerCase()}`}>
                          {condition.conditionType}
                        </span>
                        <span className="condition-effect">
                          {condition.conditionTarget}: {condition.conditionType === 'HELP' ? '+' : '-'}{condition.amount}
                        </span>
                      </Link>
                    </div>
                    <div className="condition-actions">
                      <button 
                        type="button"
                        className="adjust-condition-button" 
                        onClick={() => handleAdjustCondition(condition)}
                        style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          fontSize: '0.9em',
                          fontWeight: '500',
                          cursor: 'pointer',
                          marginRight: '6px'
                        }}
                      >
                        Adjust
                      </button>
                      <button 
                        type="button"
                        className="remove-condition-button" 
                        onClick={() => handleRemoveCondition(condition.conditionId)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          fontSize: '0.9em',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No active conditions.</p>
            )}
          </div>
        </div>

        <div className="section-row">
          <div className="section character-special">
            <h3>Special Abilities</h3>
            {character.special && character.special.length > 0 ? (
              <ul className="special-list">
                {character.special.map((ability, index) => (
                  <li key={index} className="special-item">{ability}</li>
                ))}
              </ul>
            ) : (
              <p>No special abilities</p>
            )}
          </div>
        </div>
      </div>
      <ErrorPopup error={mutationError} onClose={() => setMutationError(null)} /> {/* Added ErrorPopup */}
    </div>
  );
};

export default CharacterView;
