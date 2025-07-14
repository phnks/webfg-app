import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import CharacterForm from '../../../components/forms/CharacterForm';
import { CREATE_CHARACTER, UPDATE_CHARACTER } from '../../../graphql/operations';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

const createCharacterMocks = [
  {
    request: {
      query: CREATE_CHARACTER,
      variables: {
        input: {
          name: 'Test Character',
          characterCategory: 'HUMAN',
          description: 'A test character'
        }
      }
    },
    result: {
      data: {
        createCharacter: {
          characterId: '1',
          name: 'Test Character',
          characterCategory: 'HUMAN',
          description: 'A test character',
          __typename: 'Character'
        }
      }
    }
  }
];

const CharacterFormWrapper = ({ apolloMocks = createCharacterMocks, children }) => (
  <MockedProvider mocks={apolloMocks} addTypename={false}>
    {children}
  </MockedProvider>
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
      description: 'An existing character'
    };
    
    render(
      <CharacterFormWrapper>
        <CharacterForm character={existingCharacter} />
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
    
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
  });

  test('displays category dropdown', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByLabelText('Category *')).toBeInTheDocument();
  });

  test('displays description textarea', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
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
      description: 'An existing character'
    };
    
    render(
      <CharacterFormWrapper>
        <CharacterForm character={existingCharacter} />
      </CharacterFormWrapper>
    );
    
    expect(screen.getByDisplayValue('Existing Character')).toBeInTheDocument();
    expect(screen.getByDisplayValue('HUMAN')).toBeInTheDocument();
    expect(screen.getByDisplayValue('An existing character')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    const submitButton = screen.getByRole('button', { name: 'Create Character' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  test('updates name field value', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name *');
    fireEvent.change(nameInput, { target: { value: 'New Character Name' } });
    
    expect(nameInput.value).toBe('New Character Name');
  });

  test('updates category field value', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    const categorySelect = screen.getByLabelText('Category *');
    fireEvent.change(categorySelect, { target: { value: 'ANIMAL' } });
    
    expect(categorySelect.value).toBe('ANIMAL');
  });

  test('updates description field value', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    const descriptionTextarea = screen.getByLabelText('Description');
    fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });
    
    expect(descriptionTextarea.value).toBe('New description');
  });

  test('submits form with valid data', async () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name *');
    const categorySelect = screen.getByLabelText('Category *');
    const descriptionTextarea = screen.getByLabelText('Description');
    const submitButton = screen.getByRole('button', { name: 'Create Character' });
    
    fireEvent.change(nameInput, { target: { value: 'Test Character' } });
    fireEvent.change(categorySelect, { target: { value: 'HUMAN' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'A test character' } });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Creating character...')).toBeInTheDocument();
    });
  });

  test('displays category options', () => {
    render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    const categorySelect = screen.getByLabelText('Category *');
    
    expect(screen.getByText('Select category')).toBeInTheDocument();
    expect(screen.getByText('Human')).toBeInTheDocument();
    expect(screen.getByText('Animal')).toBeInTheDocument();
    expect(screen.getByText('Monster')).toBeInTheDocument();
    expect(screen.getByText('Robot')).toBeInTheDocument();
    expect(screen.getByText('Spirit')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  test('handles form submission errors', async () => {
    const errorMocks = [
      {
        request: {
          query: CREATE_CHARACTER,
          variables: {
            input: {
              name: 'Test Character',
              characterCategory: 'HUMAN',
              description: 'A test character'
            }
          }
        },
        error: new Error('GraphQL error')
      }
    ];
    
    render(
      <CharacterFormWrapper apolloMocks={errorMocks}>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name *');
    const categorySelect = screen.getByLabelText('Category *');
    const submitButton = screen.getByRole('button', { name: 'Create Character' });
    
    fireEvent.change(nameInput, { target: { value: 'Test Character' } });
    fireEvent.change(categorySelect, { target: { value: 'HUMAN' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error creating character')).toBeInTheDocument();
    });
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <CharacterFormWrapper>
        <CharacterForm />
      </CharacterFormWrapper>
    );
    
    expect(container.querySelector('.character-form')).toBeInTheDocument();
  });
});