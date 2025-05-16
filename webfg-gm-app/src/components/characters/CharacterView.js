import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import {
  GET_CHARACTER,
  DELETE_CHARACTER,
  ON_UPDATE_CHARACTER, // Corrected import name
  ON_DELETE_CHARACTER
} from "../../graphql/operations";
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import CharacterAttributes from "./CharacterAttributes";
import CharacterSkills from "./CharacterSkills";
import CharacterStats from "./CharacterStats";
import CharacterDetails from "./CharacterDetails";
import CharacterForm from "../forms/CharacterForm";
import "./CharacterView.css";
import ErrorPopup from '../common/ErrorPopup'; // Import ErrorPopup
import CharacterBodyTreeView from './CharacterBodyTreeView'; // ADDED IMPORT

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
          <CharacterStats stats={character.stats} />
        </div>

        <div className="section-row">
          <CharacterAttributes attributes={character.attributes} />
        </div>

        <div className="section-row">
          <CharacterSkills skills={character.skills} />
        </div>

        {/* === MODIFIED SECTION START === */}
        <div className="section-row">
          <div className="section character-body">
            <h3>Body Structure</h3> 
            {character.body && character.body.length > 0 ? (
              <CharacterBodyTreeView bodyObject={character.body[0]} />
            ) : (
              <p>No body structure assigned.</p>
            )}
          </div>
        </div>
        {/* === MODIFIED SECTION END === */}

        <div className="section-row">
          <div className="section character-traits">
            <h3>Traits</h3>
            {character.traits && character.traits.length > 0 ? (
              <ul>
                {character.traits.map((trait) => (
                  <li key={trait.traitId}>{trait.name}</li>
                ))}
              </ul>
            ) : (
              <p>No traits</p>
            )}
          </div>
        </div>

        <div className="section-row">
          <div className="section character-conditions">
            <h3>Conditions</h3>
            {character.conditions && character.conditions.length > 0 ? (
              <ul>
                {character.conditions.map((condition) => (
                  <li key={condition.traitId}>{condition.name}</li>
                ))}
              </ul>
            ) : (
              <p>No conditions</p>
            )}
          </div>
        </div>

        <div className="section-row">
          <div className="section character-values">
            <h3>Values</h3>
            {character.values && character.values.length > 0 ? (
              <ul>
                {character.values.map((value) => (
                  <li key={value.valueId}>{value.valueName}</li>
                ))}
              </ul>
            ) : (
              <p>No values</p>
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
      </div>
      <ErrorPopup error={mutationError} onClose={() => setMutationError(null)} /> {/* Added ErrorPopup */}
    </div>
  );
};

export default CharacterView;
