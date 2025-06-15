import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  SelectedCharacterProvider, 
  useSelectedCharacter 
} from '../SelectedCharacterContext';
import { mockLocalStorage, setupTestEnvironment } from '../../../test-utils';

setupTestEnvironment();

// Test component to interact with context
function TestComponent() {
  const { selectedCharacter, setSelectedCharacter, clearSelectedCharacter } = useSelectedCharacter();
  
  return (
    <div>
      <div data-testid="selected-character">
        {selectedCharacter ? selectedCharacter.name : 'None'}
      </div>
      <button
        onClick={() => setSelectedCharacter({ id: '1', name: 'Test Character' })}
        data-testid="set-character"
      >
        Set Character
      </button>
      <button
        onClick={clearSelectedCharacter}
        data-testid="clear-character"
      >
        Clear Character
      </button>
    </div>
  );
}

describe('SelectedCharacterContext', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('provides default null selected character', () => {
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );
    
    expect(screen.getByTestId('selected-character')).toHaveTextContent('None');
  });

  it('sets selected character', async () => {
    const user = userEvent.setup();
    
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );
    
    const setButton = screen.getByTestId('set-character');
    await user.click(setButton);
    
    expect(screen.getByTestId('selected-character')).toHaveTextContent('Test Character');
  });

  it('clears selected character', async () => {
    const user = userEvent.setup();
    
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );
    
    // Set character first
    const setButton = screen.getByTestId('set-character');
    await user.click(setButton);
    expect(screen.getByTestId('selected-character')).toHaveTextContent('Test Character');
    
    // Clear character
    const clearButton = screen.getByTestId('clear-character');
    await user.click(clearButton);
    expect(screen.getByTestId('selected-character')).toHaveTextContent('None');
  });

  it('persists selected character to localStorage', async () => {
    const user = userEvent.setup();
    
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );
    
    const setButton = screen.getByTestId('set-character');
    await user.click(setButton);
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'selectedCharacter',
      JSON.stringify({ id: '1', name: 'Test Character' })
    );
  });

  it('loads selected character from localStorage on initialization', () => {
    const savedCharacter = { id: '2', name: 'Saved Character' };
    mockLocalStorage.store.selectedCharacter = JSON.stringify(savedCharacter);
    
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );
    
    expect(screen.getByTestId('selected-character')).toHaveTextContent('Saved Character');
  });

  it('handles invalid localStorage data gracefully', () => {
    mockLocalStorage.store.selectedCharacter = 'invalid json';
    
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );
    
    // Should fall back to default state
    expect(screen.getByTestId('selected-character')).toHaveTextContent('None');
  });

  it('removes localStorage item when character is cleared', async () => {
    const user = userEvent.setup();
    
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );
    
    // Set character first
    const setButton = screen.getByTestId('set-character');
    await user.click(setButton);
    
    // Clear character
    const clearButton = screen.getByTestId('clear-character');
    await user.click(clearButton);
    
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('selectedCharacter');
  });

  it('accepts initial character prop', () => {
    const initialCharacter = { id: '3', name: 'Initial Character' };
    
    render(
      <SelectedCharacterProvider initialCharacter={initialCharacter}>
        <TestComponent />
      </SelectedCharacterProvider>
    );
    
    expect(screen.getByTestId('selected-character')).toHaveTextContent('Initial Character');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSelectedCharacter must be used within SelectedCharacterProvider');
    
    console.error = originalError;
  });

  it('handles multiple context updates correctly', async () => {
    const user = userEvent.setup();
    
    function MultiUpdateComponent() {
      const { selectedCharacter, setSelectedCharacter } = useSelectedCharacter();
      
      const handleMultipleUpdates = () => {
        setSelectedCharacter({ id: '1', name: 'First' });
        setSelectedCharacter({ id: '2', name: 'Second' });
        setSelectedCharacter({ id: '3', name: 'Third' });
      };
      
      return (
        <div>
          <div data-testid="selected-character">
            {selectedCharacter ? selectedCharacter.name : 'None'}
          </div>
          <button onClick={handleMultipleUpdates} data-testid="multi-update">
            Multiple Updates
          </button>
        </div>
      );
    }
    
    render(
      <SelectedCharacterProvider>
        <MultiUpdateComponent />
      </SelectedCharacterProvider>
    );
    
    const updateButton = screen.getByTestId('multi-update');
    await user.click(updateButton);
    
    // Should show the last update
    expect(screen.getByTestId('selected-character')).toHaveTextContent('Third');
  });

  it('maintains character data integrity', async () => {
    const user = userEvent.setup();
    
    function DataIntegrityComponent() {
      const { selectedCharacter, setSelectedCharacter } = useSelectedCharacter();
      
      const handleSetCharacter = () => {
        const character = {
          id: '1',
          name: 'Test Character',
          category: 'HUMAN',
          attributes: {
            strength: 10,
            dexterity: 10
          }
        };
        setSelectedCharacter(character);
      };
      
      return (
        <div>
          <div data-testid="character-data">
            {selectedCharacter ? JSON.stringify(selectedCharacter) : 'None'}
          </div>
          <button onClick={handleSetCharacter} data-testid="set-complex-character">
            Set Complex Character
          </button>
        </div>
      );
    }
    
    render(
      <SelectedCharacterProvider>
        <DataIntegrityComponent />
      </SelectedCharacterProvider>
    );
    
    const setButton = screen.getByTestId('set-complex-character');
    await user.click(setButton);
    
    const characterData = screen.getByTestId('character-data').textContent;
    const parsedData = JSON.parse(characterData);
    
    expect(parsedData.id).toBe('1');
    expect(parsedData.name).toBe('Test Character');
    expect(parsedData.category).toBe('HUMAN');
    expect(parsedData.attributes.strength).toBe(10);
  });

  it('handles localStorage quota exceeded gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock localStorage to throw quota exceeded error
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );
    
    const setButton = screen.getByTestId('set-character');
    
    // Should not crash when localStorage fails
    await user.click(setButton);
    
    // Character should still be set in memory
    expect(screen.getByTestId('selected-character')).toHaveTextContent('Test Character');
  });
});