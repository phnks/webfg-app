import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectedCharacterProvider, useSelectedCharacter } from '../../context/SelectedCharacterContext';

// Test component that uses the context
const TestComponent = () => {
  const { selectedCharacter, setSelectedCharacter } = useSelectedCharacter();

  return (
    <div>
      <div data-testid="selected-character">
        {selectedCharacter ? selectedCharacter.name : 'No character selected'}
      </div>
      <button 
        onClick={() => setSelectedCharacter({ characterId: '1', name: 'Test Character' })}
        data-testid="select-character"
      >
        Select Character
      </button>
      <button 
        onClick={() => setSelectedCharacter(null)}
        data-testid="clear-character"
      >
        Clear Character
      </button>
    </div>
  );
};

describe('SelectedCharacterContext', () => {
  test('provides default context values', () => {
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    expect(screen.getByTestId('selected-character')).toHaveTextContent('No character selected');
  });

  test('allows setting selected character', () => {
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    const selectButton = screen.getByTestId('select-character');
    fireEvent.click(selectButton);

    expect(screen.getByTestId('selected-character')).toHaveTextContent('Test Character');
  });

  test('allows clearing selected character', () => {
    render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    // First select a character
    const selectButton = screen.getByTestId('select-character');
    fireEvent.click(selectButton);
    expect(screen.getByTestId('selected-character')).toHaveTextContent('Test Character');

    // Then clear it
    const clearButton = screen.getByTestId('clear-character');
    fireEvent.click(clearButton);
    expect(screen.getByTestId('selected-character')).toHaveTextContent('No character selected');
  });

  test('maintains selected character across re-renders', () => {
    const { rerender } = render(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    const selectButton = screen.getByTestId('select-character');
    fireEvent.click(selectButton);

    rerender(
      <SelectedCharacterProvider>
        <TestComponent />
      </SelectedCharacterProvider>
    );

    expect(screen.getByTestId('selected-character')).toHaveTextContent('Test Character');
  });

  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow();

    consoleSpy.mockRestore();
  });
});