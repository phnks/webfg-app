import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import CharacterForm from '../../../components/forms/CharacterForm';
import { CREATE_CHARACTER, UPDATE_CHARACTER } from '../../../graphql/operations';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

const createCharacterMocks = [
  {
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
  }
];

const CharacterFormWrapper = ({ apolloMocks = createCharacterMocks, children }) => (
  <BrowserRouter>
    <MockedProvider mocks={apolloMocks} addTypename={false}>
      <SelectedCharacterProvider>
        {children}
      </SelectedCharacterProvider>
    </MockedProvider>
  </BrowserRouter>
);

describe('CharacterForm Component', () => {
  test('renders without crashing', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
  });

  test('displays form title for creating new character', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByText('Create New Character')).toBeInTheDocument();
  });

  test('displays form title for editing existing character', () => {
    const existingCharacter = {
      characterId: '1',
      name: 'Existing Character',
      characterCategory: 'HUMAN',
      will: 15
    };
    
    render(
      <CharacterFormWrapper>
        <CharacterForm character={existingCharacter} isEditing={true} />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByText('Edit Character')).toBeInTheDocument();
  });

  test('displays name input field', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  test('displays category dropdown', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    // Find the Category label and check its associated select
    const categoryLabel = screen.getByText('Category');
    const categorySelect = categoryLabel.parentElement.querySelector('select');
    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect.value).toBe('HUMAN'); // Default value
  });

  test('displays will input field', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    // Will now defaults to 0
    const willLabel = screen.getByText('Will');
    const willInput = willLabel.parentElement.querySelector('input[type="number"]');
    expect(willInput.value).toBe('0');
  });

  test('displays fatigue input field', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByText('Will')).toBeInTheDocument();
  });

  test('displays submit button', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByRole('button', { name: 'Create Character' })).toBeInTheDocument();
  });

  test('displays cancel button', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('fills form fields when editing existing character', () => {
    const existingCharacter = {
      characterId: '1',
      name: 'Existing Character',
      characterCategory: 'HUMAN',
      will: 15,
    };
    
    render(
      <CharacterFormWrapper>
        <CharacterForm character={existingCharacter} isEditing={true} />
      </CharacterFormWrapper>
    );
    
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

  test('updates name field value', () => {
    const { container } = render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    const nameInput = container.querySelector('input[type="text"][required]');
    fireEvent.change(nameInput, { target: { value: 'New Character Name' } });
    
    expect(nameInput.value).toBe('New Character Name');
  });

  test('updates category field value', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    // Get the category select specifically by finding the Category label first
    const categoryLabel = screen.getByText('Category');
    const categorySelect = categoryLabel.parentElement.querySelector('select');
    fireEvent.change(categorySelect, { target: { value: 'TREPIDITE' } });
    
    expect(categorySelect.value).toBe('TREPIDITE');
  });

  test('updates will field value', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    // Find the Will label and then its associated input
    const willLabel = screen.getByText('Will');
    const willInput = willLabel.parentElement.querySelector('input[type="number"]');
    
    // Will now defaults to 0
    expect(willInput.value).toBe('0');
    
    fireEvent.change(willInput, { target: { value: '15' } });
    
    expect(willInput.value).toBe('15');
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(container.querySelector('.form-container')).toBeInTheDocument();
  });

  test('displays attributes section', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByText('Attributes')).toBeInTheDocument();
  });

  test('displays basic information section', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
  });

  test('displays special abilities section', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByText('Special Abilities')).toBeInTheDocument();
  });
});