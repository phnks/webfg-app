import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SelectedCharacterBanner from '../../../components/common/SelectedCharacterBanner';

// Mock the SelectedCharacterContext
const mockClearSelectedCharacter = jest.fn();
const mockUseSelectedCharacter = {
  selectedCharacter: null,
  clearSelectedCharacter: mockClearSelectedCharacter
};
jest.mock('../../../context/SelectedCharacterContext', () => ({
  useSelectedCharacter: () => mockUseSelectedCharacter
}));
const renderWithRouter = component => {
  return render(/*#__PURE__*/React.createElement(BrowserRouter, null, component));
};
describe('SelectedCharacterBanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('renders nothing when no character is selected', () => {
    mockUseSelectedCharacter.selectedCharacter = null;
    const {
      container
    } = renderWithRouter(/*#__PURE__*/React.createElement(SelectedCharacterBanner, null));

    // Should render nothing - BrowserRouter creates a div, so check that it's empty
    expect(container.querySelector('.selected-character-banner')).not.toBeInTheDocument();
  });
  test('renders banner when character is selected', () => {
    mockUseSelectedCharacter.selectedCharacter = {
      characterId: 'char-123',
      name: 'Test Character'
    };
    renderWithRouter(/*#__PURE__*/React.createElement(SelectedCharacterBanner, null));
    expect(screen.getByText('Selected Character:')).toBeInTheDocument();
    expect(screen.getByText('Test Character')).toBeInTheDocument();
  });
  test('displays character name as link', () => {
    mockUseSelectedCharacter.selectedCharacter = {
      characterId: 'char-123',
      name: 'Test Character'
    };
    renderWithRouter(/*#__PURE__*/React.createElement(SelectedCharacterBanner, null));
    const characterLink = screen.getByRole('link', {
      name: 'Test Character'
    });
    expect(characterLink).toBeInTheDocument();
    expect(characterLink).toHaveAttribute('href', '/characters/char-123');
  });
  test('displays clear selection button', () => {
    mockUseSelectedCharacter.selectedCharacter = {
      characterId: 'char-123',
      name: 'Test Character'
    };
    renderWithRouter(/*#__PURE__*/React.createElement(SelectedCharacterBanner, null));
    const clearButton = screen.getByRole('button', {
      name: 'Clear selected character'
    });
    expect(clearButton).toBeInTheDocument();
    expect(clearButton).toHaveTextContent('×');
  });
  test('calls clearSelectedCharacter when clear button is clicked', () => {
    mockUseSelectedCharacter.selectedCharacter = {
      characterId: 'char-123',
      name: 'Test Character'
    };
    renderWithRouter(/*#__PURE__*/React.createElement(SelectedCharacterBanner, null));
    const clearButton = screen.getByRole('button', {
      name: 'Clear selected character'
    });
    fireEvent.click(clearButton);
    expect(mockClearSelectedCharacter).toHaveBeenCalledTimes(1);
  });
  test('applies correct CSS classes', () => {
    mockUseSelectedCharacter.selectedCharacter = {
      characterId: 'char-123',
      name: 'Test Character'
    };
    const {
      container
    } = renderWithRouter(/*#__PURE__*/React.createElement(SelectedCharacterBanner, null));
    expect(container.querySelector('.selected-character-banner')).toBeInTheDocument();
    expect(container.querySelector('.banner-content')).toBeInTheDocument();
    expect(container.querySelector('.banner-text')).toBeInTheDocument();
    expect(container.querySelector('.clear-selection-btn')).toBeInTheDocument();
  });
  test('handles character with missing characterId', () => {
    mockUseSelectedCharacter.selectedCharacter = {
      name: 'Test Character'
      // Missing characterId
    };
    renderWithRouter(/*#__PURE__*/React.createElement(SelectedCharacterBanner, null));
    expect(screen.getByText('Test Character')).toBeInTheDocument();
    const characterLink = screen.getByRole('link', {
      name: 'Test Character'
    });
    expect(characterLink).toHaveAttribute('href', '/characters/undefined');
  });
  test('handles character with missing name', () => {
    mockUseSelectedCharacter.selectedCharacter = {
      characterId: 'char-123'
      // Missing name
    };
    renderWithRouter(/*#__PURE__*/React.createElement(SelectedCharacterBanner, null));
    expect(screen.getByText('Selected Character:')).toBeInTheDocument();
    const characterLink = screen.getByRole('link');
    expect(characterLink).toHaveAttribute('href', '/characters/char-123');
  });
});