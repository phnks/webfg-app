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
    
    expect(screen.getByDisplayValue('HUMAN')).toBeInTheDocument();
  });

  test('displays will input field', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  test('displays fatigue input field', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByText('Fatigue')).toBeInTheDocument();
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
      fatigue: 5
    };
    
    render(
      <CharacterFormWrapper>
        <CharacterForm character={existingCharacter} isEditing={true} />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByDisplayValue('Existing Character')).toBeInTheDocument();
    expect(screen.getByDisplayValue('HUMAN')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
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
    
    const categorySelect = screen.getByDisplayValue('HUMAN');
    fireEvent.change(categorySelect, { target: { value: 'TREPIDITE' } });
    
    expect(categorySelect.value).toBe('TREPIDITE');
  });

  test('updates will field value', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    const willInput = screen.getByDisplayValue('10');
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