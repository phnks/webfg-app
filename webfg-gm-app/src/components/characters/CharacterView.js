import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import {
  GET_CHARACTER,
  DELETE_CHARACTER,
  ON_UPDATE_CHARACTER, // Corrected import name
  ON_DELETE_CHARACTER,
  ADD_OBJECT_TO_EQUIPMENT,
  REMOVE_OBJECT_FROM_INVENTORY,
  ADD_OBJECT_TO_INVENTORY,
  REMOVE_OBJECT_FROM_EQUIPMENT
} from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import CharacterAttributes from "./CharacterAttributes";


import CharacterDetails from "./CharacterDetails";
import CharacterForm from "../forms/CharacterForm";
import "./CharacterView.css";
import ErrorPopup from '../common/ErrorPopup'; // Import ErrorPopup

const CharacterView = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { selectCharacter } = useSelectedCharacter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [mutationError, setMutationError] = useState(null); // Added mutationError state

  // Initial query to get character data
  const { data, loading, error, refetch } = useQuery(GET_CHARACTER, {
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
  const [addObjectToEquipment] = useMutation(ADD_OBJECT_TO_EQUIPMENT, {
    onError: (err) => {
      console.error("Error equipping item:", err);
      setMutationError({ 
        message: err.message || "Error equipping item", 
        stack: err.stack || "No stack trace available."
      });
    }
  });
  
  const [removeObjectFromInventory] = useMutation(REMOVE_OBJECT_FROM_INVENTORY, {
    onError: (err) => {
      console.error("Error removing item from inventory:", err);
      setMutationError({ 
        message: err.message || "Error removing item from inventory", 
        stack: err.stack || "No stack trace available."
      });
    }
  });
  
  const [addObjectToInventory] = useMutation(ADD_OBJECT_TO_INVENTORY, {
    onError: (err) => {
      console.error("Error adding item to inventory:", err);
      setMutationError({ 
        message: err.message || "Error adding item to inventory", 
        stack: err.stack || "No stack trace available."
      });
    }
  });
  
  const [removeObjectFromEquipment] = useMutation(REMOVE_OBJECT_FROM_EQUIPMENT, {
    onError: (err) => {
      console.error("Error unequipping item:", err);
      setMutationError({ 
        message: err.message || "Error unequipping item", 
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

  // Handler for equipping an item
  const handleEquipItem = async (objectId) => {
    try {
      // First add the object to equipment
      await addObjectToEquipment({
        variables: { characterId, objectId }
      });
      
      // Then remove it from inventory
      await removeObjectFromInventory({
        variables: { characterId, objectId }
      });
      
      // Refetch to update the UI
      refetch();
    } catch (err) {
      console.error("Error in equip item flow:", err);
      setMutationError({ 
        message: "Failed to equip item. " + (err.message || ""),
        stack: err.stack || "No stack trace available."
      });
    }
  };
  
  // Handler for unequipping an item
  const handleUnequipItem = async (objectId) => {
    try {
      // First add the object back to inventory
      await addObjectToInventory({
        variables: { characterId, objectId }
      });
      
      // Then remove it from equipment
      await removeObjectFromEquipment({
        variables: { characterId, objectId }
      });
      
      // Refetch to update the UI
      refetch();
    } catch (err) {
      console.error("Error in unequip item flow:", err);
      setMutationError({ 
        message: "Failed to unequip item. " + (err.message || ""),
        stack: err.stack || "No stack trace available."
      });
    }
  };

  if (loading) return <div className="loading">Loading character details...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (!currentCharacter) return <div className="error">Character not found</div>;

  const character = currentCharacter;



  const addAction = (actionId) => {
    // Implementation
  };

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
          <CharacterDetails character={character} />
        </div>

        <div className="section-row">
          <CharacterAttributes 
            lethality={character.lethality}
            armour={character.armour}
            endurance={character.endurance}
            strength={character.strength}
            dexterity={character.dexterity}
            agility={character.agility}
            perception={character.perception}
            charisma={character.charisma}
            intelligence={character.intelligence}
            resolve={character.resolve}
            morale={character.morale}
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
          <div className="section character-equipment">
            <h3>Equipment</h3>
            {character.equipment && character.equipment.length > 0 ? (
              <ul className="equipment-list">
                {character.equipment.map((item) => (
                  <li key={item.objectId} className="equipment-item">
                    <div className="item-info">
                      <Link to={`/objects/${item.objectId}`} className="object-link">
                        {item.name} ({item.objectCategory})
                      </Link>
                    </div>
                    <button 
                      type="button"
                      className="unequip-button" 
                      onClick={() => handleUnequipItem(item.objectId)}
                      style={{
                        backgroundColor: '#fd7e14',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '0.9em',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Unequip
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nothing equipped.</p>
            )}
          </div>
        </div>

        <div className="section-row">
          <div className="section character-inventory">
            <h3>Inventory</h3>
            {character.inventory && character.inventory.length > 0 ? (
              <ul className="inventory-list">
                {character.inventory.map((item) => (
                  <li key={item.objectId} className="inventory-item">
                    <div className="item-info">
                      <Link to={`/objects/${item.objectId}`} className="object-link">
                        {item.name} ({item.objectCategory})
                      </Link>
                    </div>
                    <button 
                      type="button"
                      className="equip-button" 
                      onClick={() => handleEquipItem(item.objectId)}
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '0.9em',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Equip
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No items in inventory.</p>
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
                    <div className="action-name">{action.name}</div>
                    <div className="action-description">{action.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No actions</p>
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
