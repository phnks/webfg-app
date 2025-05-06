import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { LIST_CHARACTERS } from "../../graphql/operations";
import "./CharacterList.css";

const CharacterList = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(LIST_CHARACTERS);

  const handleCharacterClick = (characterId) => {
    navigate(`/characters/${characterId}`);
  };

  if (loading) return <div className="loading">Loading characters...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const characters = data?.listCharacters || [];

  return (
    <div className="character-page">
      <div className="page-content">
        <h1>Characters</h1>

        {characters.length === 0 ? (
          <div className="empty-state">
            <p>No characters have been created yet.</p>
            <button
              className="create-button"
              onClick={() => navigate("/characters/new")}
              data-cy="create-character-button"
            >
              Create New Character
            </button>
          </div>
        ) : (
          <div className="character-grid">
            {characters.map(character => (
              <div
                key={character.characterId}
                className="character-card"
                onClick={() => handleCharacterClick(character.characterId)}
              >
                <h3>{character.name}</h3>
                {/* character-meta div removed */}
              </div>
            ))}

            <div
              className="character-card add-card"
              onClick={() => navigate("/characters/new")}
              data-cy="create-character-button"
            >
              <div className="add-icon">+</div>
              <h3>Create New Character</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterList;
