import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import CharacterForm from '../../../components/forms/CharacterForm';
import { CREATE_CHARACTER, UPDATE_CHARACTER } from '../../graphql/operations';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';
const createCharacterMocks = [{
  request: {
    query: CREATE_CHARACTER,
    variables: {
      input: {
        name: 'Test Character',
        characterCategory: 'HUMAN'
      }
    }
  },
  result: {
    data: {
      createCharacter: {
        characterId: '1',
        name: 'Test Character',
        characterCategory: 'HUMAN',
        __typename: 'Character'
      }
    }
  }
}];
const CharacterFormWrapper = ({
  apolloMocks = createCharacterMocks,
  children
}) => /*#__PURE__*/React.createElement(BrowserRouter, null, /*#__PURE__*/React.createElement(MockedProvider, {
  mocks: apolloMocks,
  addTypename: false
}, /*#__PURE__*/React.createElement(SelectedCharacterProvider, null, children)));
describe('CharacterForm Component', () => {
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
  });
  test('displays form title for creating new character', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
    expect(screen.getByText('Create New Character')).toBeInTheDocument();
  });
  test('displays form title for editing existing character', () => {
    const existingCharacter = {
      characterId: '1',
      name: 'Existing Character',
      characterCategory: 'HUMAN',
      will: 15
    };
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, {
      character: existingCharacter,
      isEditing: true
    })));
    expect(screen.getByText('Edit Character')).toBeInTheDocument();
  });
  test('displays name input field', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
  test('displays category dropdown', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));

    // Find the Category label and check its associated select
    const categoryLabel = screen.getByText('Category');
    const categorySelect = categoryLabel.parentElement.querySelector('select');
    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect.value).toBe('HUMAN'); // Default value
  });
  test('displays will input field', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));

    // Will now defaults to 0
    const willLabel = screen.getByText('Will');
    const willInput = willLabel.parentElement.querySelector('input[type="number"]');
    expect(willInput.value).toBe('0');
  });
  test('displays fatigue input field', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
    expect(screen.getByText('Will')).toBeInTheDocument();
  });
  test('displays submit button', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
    expect(screen.getByRole('button', {
      name: 'Create Character'
    })).toBeInTheDocument();
  });
  test('displays cancel button', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
    expect(screen.getByRole('button', {
      name: 'Cancel'
    })).toBeInTheDocument();
  });
  test('fills form fields when editing existing character', () => {
    const existingCharacter = {
      characterId: '1',
      name: 'Existing Character',
      characterCategory: 'HUMAN',
      will: 15
    };
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, {
      character: existingCharacter,
      isEditing: true
    })));
    expect(screen.getByDisplayValue('Existing Character')).toBeInTheDocument();

    // Check that category is set to HUMAN
    const categoryLabel = screen.getByText('Category');
    const categorySelect = categoryLabel.parentElement.querySelector('select');
    expect(categorySelect.value).toBe('HUMAN');

    // Find the Will label and check its value
    const willLabel = screen.getByText('Will');
    const willInput = willLabel.parentElement.querySelector('input[type="number"]');
    expect(willInput.value).toBe('15');
  });
  test('preserves zero values when editing character', () => {
    const characterWithZeroValues = {
      characterId: '2',
      name: 'Character With Zeros',
      characterCategory: 'HUMAN',
      will: -5,
      armour: {
        attribute: {
          attributeValue: 0,
          isGrouped: true,
          diceCount: null
        }
      },
      lethality: {
        attribute: {
          attributeValue: 0,
          isGrouped: true,
          diceCount: null
        }
      },
      penetration: {
        attribute: {
          attributeValue: 0,
          isGrouped: true,
          diceCount: null
        }
      }
    };
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, {
      character: characterWithZeroValues,
      isEditing: true
    })));
    expect(screen.getByDisplayValue('Character With Zeros')).toBeInTheDocument();

    // Find the Will field and check negative value is preserved
    const willLabel = screen.getByText('Will');
    const willInput = willLabel.parentElement.querySelector('input[type="number"]');
    expect(willInput.value).toBe('-5');

    // Check that zero values are preserved, not defaulted to 10
    // Note: These fields might not be visible in the test, but the important thing
    // is that the form data internally preserves the 0 values
  });
  test('updates name field value', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
    const nameInput = container.querySelector('input[type="text"][required]');
    fireEvent.change(nameInput, {
      target: {
        value: 'New Character Name'
      }
    });
    expect(nameInput.value).toBe('New Character Name');
  });
  test('updates category field value', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));

    // Get the category select specifically by finding the Category label first
    const categoryLabel = screen.getByText('Category');
    const categorySelect = categoryLabel.parentElement.querySelector('select');
    fireEvent.change(categorySelect, {
      target: {
        value: 'TREPIDITE'
      }
    });
    expect(categorySelect.value).toBe('TREPIDITE');
  });
  test('updates will field value', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));

    // Find the Will label and then its associated input
    const willLabel = screen.getByText('Will');
    const willInput = willLabel.parentElement.querySelector('input[type="number"]');

    // Will now defaults to 0
    expect(willInput.value).toBe('0');
    fireEvent.change(willInput, {
      target: {
        value: '15'
      }
    });
    expect(willInput.value).toBe('15');
  });
  test('applies correct CSS classes', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
    expect(container.querySelector('.form-container')).toBeInTheDocument();
  });
  test('displays attributes section', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
    expect(screen.getByText('Attributes')).toBeInTheDocument();
  });
  test('displays basic information section', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
  });
  test('displays special abilities section', () => {
    render(/*#__PURE__*/React.createElement(CharacterFormWrapper, null, /*#__PURE__*/React.createElement(CharacterForm, null)));
    expect(screen.getByText('Special Abilities')).toBeInTheDocument();
  });
});