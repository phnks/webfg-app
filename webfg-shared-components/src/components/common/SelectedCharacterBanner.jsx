import React from 'react';
import { Link } from 'react-router-dom';
import { useSelectedCharacter } from '../../context/SelectedCharacterContext';
import './SelectedCharacterBanner.css';

const SelectedCharacterBanner = () => {
  const { selectedCharacter, clearSelectedCharacter } = useSelectedCharacter();

  if (!selectedCharacter) {
    return null;
  }

  return (
    <div className="selected-character-banner">
      <div className="banner-content">
        <div className="banner-text">
          Selected Character: <Link to={`/characters/${selectedCharacter.characterId}`}>{selectedCharacter.name}</Link>
        </div>
        <button 
          className="clear-selection-btn" 
          onClick={clearSelectedCharacter}
          aria-label="Clear selected character"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default SelectedCharacterBanner; 