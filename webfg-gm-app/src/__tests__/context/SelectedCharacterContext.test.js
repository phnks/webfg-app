import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SelectedCharacterProvider, useSelectedCharacter } from '../../context/SelectedCharacterContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test component to use the context
const TestComponent = () => {
  const { selectedCharacter, selectCharacter, clearSelectedCharacter } = useSelectedCharacter();

  return (
    <div>
      <div data-testid="selected-character">
        {selectedCharacter ? selectedCharacter.name : 'No character selected'}
      </div>
      <button onClick={() => selectCharacter({ id: '1', name: 'Test Character' })}>
        Select Character
      </button>
      <button onClick={clearSelectedCharacter}>
        Clear Character
      </button>
    </div>
  );
};

describe('SelectedCharacterContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('provides initial state when no character is saved', () => {
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    expect(screen.getByTestId('selected-character')).toHaveTextContent('No character selected');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('selectedCharacter');
  });

  test('loads character from localStorage on mount', () => {
    const savedCharacter = { id: '1', name: 'Saved Character' };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedCharacter));

    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    expect(screen.getByTestId('selected-character')).toHaveTextContent('Saved Character');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('selectedCharacter');
  });

  test('handles corrupted localStorage data gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage.getItem.mockReturnValue('invalid json');

    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    expect(screen.getByTestId('selected-character')).toHaveTextContent('No character selected');
    expect(consoleSpy).toHaveBeenCalledWith('Error parsing selected character from localStorage:', expect.any(Error));
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('selectedCharacter');
    
    consoleSpy.mockRestore();
  });

  test('selects a character and saves to localStorage', () => {
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    act(() => {
      screen.getByText('Select Character').click();
    });

    expect(screen.getByTestId('selected-character')).toHaveTextContent('Test Character');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'selectedCharacter',
      JSON.stringify({ id: '1', name: 'Test Character' })
    );
  });

  test('clears selected character and removes from localStorage', () => {
    const savedCharacter = { id: '1', name: 'Saved Character' };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedCharacter));

    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    expect(screen.getByTestId('selected-character')).toHaveTextContent('Saved Character');

    act(() => {
      screen.getByText('Clear Character').click();
    });

    expect(screen.getByTestId('selected-character')).toHaveTextContent('No character selected');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('selectedCharacter');
  });

  test('saves character to localStorage when character changes', () => {
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    act(() => {
      screen.getByText('Select Character').click();
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'selectedCharacter',
      JSON.stringify({ id: '1', name: 'Test Character' })
    );
  });

  test('useSelectedCharacter hook returns correct value structure', () => {
    let contextValue;
    
    const TestHook = () => {
      contextValue = useSelectedCharacter();
      return null;
    };

    render(
      <SelectedCharacterProvider>
        <TestHook />
      </SelectedCharacterProvider>
    );

    expect(contextValue).toHaveProperty('selectedCharacter');
    expect(contextValue).toHaveProperty('selectCharacter');
    expect(contextValue).toHaveProperty('clearSelectedCharacter');
    expect(typeof contextValue.selectCharacter).toBe('function');
    expect(typeof contextValue.clearSelectedCharacter).toBe('function');
  });

  test('updates localStorage when character is cleared', () => {
    const savedCharacter = { id: '1', name: 'Saved Character' };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedCharacter));

    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    act(() => {
      screen.getByText('Clear Character').click();
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('selectedCharacter');
  });
});