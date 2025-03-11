import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const SelectedCharacterContext = createContext();

// Custom hook for using the context
export const useSelectedCharacter = () => {
  return useContext(SelectedCharacterContext);
};

// Provider component
export const SelectedCharacterProvider = ({ children }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // Load from localStorage on initial render
  useEffect(() => {
    const savedCharacter = localStorage.getItem('selectedCharacter');
    if (savedCharacter) {
      try {
        setSelectedCharacter(JSON.parse(savedCharacter));
      } catch (e) {
        console.error('Error parsing selected character from localStorage:', e);
        localStorage.removeItem('selectedCharacter');
      }
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (selectedCharacter) {
      localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
    } else {
      localStorage.removeItem('selectedCharacter');
    }
  }, [selectedCharacter]);

  const selectCharacter = (character) => {
    setSelectedCharacter(character);
  };

  const clearSelectedCharacter = () => {
    setSelectedCharacter(null);
  };

  const value = {
    selectedCharacter,
    selectCharacter,
    clearSelectedCharacter
  };

  return (
    <SelectedCharacterContext.Provider value={value}>
      {children}
    </SelectedCharacterContext.Provider>
  );
}; 