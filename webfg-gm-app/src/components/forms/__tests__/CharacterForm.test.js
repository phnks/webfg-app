import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMutationMock, mockCharacters } from '../../../test-utils';
import CharacterForm from '../CharacterForm';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: undefined })
}));

describe('CharacterForm', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders create character form', () => {
    renderWithProviders(<CharacterForm />);
    
    expect(screen.getByText('Create Character')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    
    // Check that all attribute fields are present
    const attributes = ['strength', 'dexterity', 'agility', 'endurance', 'vigor', 
                       'perception', 'intelligence', 'will', 'social', 'faith', 
                       'armor', 'lethality'];
    
    attributes.forEach(attr => {
      expect(screen.getByLabelText(new RegExp(attr, 'i'))).toBeInTheDocument();
    });
  });

  it('renders edit character form with existing data', () => {
    const character = mockCharacters[0];
    
    renderWithProviders(<CharacterForm character={character} />);
    
    expect(screen.getByText('Edit Character')).toBeInTheDocument();
    expect(screen.getByDisplayValue(character.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(character.description)).toBeInTheDocument();
    expect(screen.getByDisplayValue(character.strength.toString())).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CharacterForm />);
    
    const submitButton = screen.getByRole('button', { name: /create character/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('validates attribute minimum values', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CharacterForm />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const strengthInput = screen.getByLabelText(/strength/i);
    
    await user.type(nameInput, 'Test Character');
    await user.clear(strengthInput);
    await user.type(strengthInput, '-5');
    
    const submitButton = screen.getByRole('button', { name: /create character/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/must be at least 0/i)).toBeInTheDocument();
    });
  });

  it('creates character successfully', async () => {
    const user = userEvent.setup();
    
    const createMock = createMutationMock(
      'CREATE_CHARACTER',
      {
        input: {
          name: 'Test Character',
          category: 'HUMAN',
          description: 'Test description',
          strength: 10,
          dexterity: 10,
          agility: 10,
          endurance: 10,
          vigor: 10,
          perception: 10,
          intelligence: 10,
          will: 10,
          social: 10,
          faith: 10,
          armor: 10,
          lethality: 10
        }
      },
      {
        createCharacter: {
          id: '123',
          name: 'Test Character',
          category: 'HUMAN',
          description: 'Test description',
          strength: 10,
          dexterity: 10,
          agility: 10,
          endurance: 10,
          vigor: 10,
          perception: 10,
          intelligence: 10,
          will: 10,
          social: 10,
          faith: 10,
          armor: 10,
          lethality: 10
        }
      }
    );
    
    renderWithProviders(<CharacterForm />, { mocks: [createMock] });
    
    // Fill form
    await user.type(screen.getByLabelText(/name/i), 'Test Character');
    await user.selectOptions(screen.getByLabelText(/category/i), 'HUMAN');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    
    // Set attributes
    const attributes = ['strength', 'dexterity', 'agility', 'endurance', 'vigor', 
                       'perception', 'intelligence', 'will', 'social', 'faith', 
                       'armor', 'lethality'];
    
    for (const attr of attributes) {
      const input = screen.getByLabelText(new RegExp(attr, 'i'));
      await user.clear(input);
      await user.type(input, '10');
    }
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create character/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/characters/123');
    });
  });

  it('updates character successfully', async () => {
    const user = userEvent.setup();
    const character = mockCharacters[0];
    
    const updateMock = createMutationMock(
      'UPDATE_CHARACTER',
      {
        input: {
          id: character.id,
          name: 'Updated Character',
          category: character.category,
          description: character.description,
          strength: character.strength,
          dexterity: character.dexterity,
          agility: character.agility,
          endurance: character.endurance,
          vigor: character.vigor,
          perception: character.perception,
          intelligence: character.intelligence,
          will: character.will,
          social: character.social,
          faith: character.faith,
          armor: character.armor,
          lethality: character.lethality
        }
      },
      {
        updateCharacter: {
          ...character,
          name: 'Updated Character'
        }
      }
    );
    
    renderWithProviders(<CharacterForm character={character} />, { mocks: [updateMock] });
    
    // Update name
    const nameInput = screen.getByDisplayValue(character.name);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Character');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /update character/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/characters/${character.id}`);
    });
  });

  it('handles form errors gracefully', async () => {
    const user = userEvent.setup();
    
    const errorMock = createMutationMock(
      'CREATE_CHARACTER',
      expect.any(Object),
      null,
      new Error('Network error')
    );
    
    renderWithProviders(<CharacterForm />, { mocks: [errorMock] });
    
    // Fill minimal form
    await user.type(screen.getByLabelText(/name/i), 'Test Character');
    await user.selectOptions(screen.getByLabelText(/category/i), 'HUMAN');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create character/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error.*creating.*character/i)).toBeInTheDocument();
    });
  });

  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CharacterForm />);
    
    // Fill form
    const nameInput = screen.getByLabelText(/name/i);
    const strengthInput = screen.getByLabelText(/strength/i);
    
    await user.type(nameInput, 'Test Character');
    await user.clear(strengthInput);
    await user.type(strengthInput, '15');
    
    // Reset form
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);
    
    // Check form is reset
    expect(nameInput.value).toBe('');
    expect(strengthInput.value).toBe('1'); // Default value
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    
    const slowMock = {
      ...createMutationMock('CREATE_CHARACTER', expect.any(Object), { createCharacter: {} }),
      delay: 1000 // Simulate slow response
    };
    
    renderWithProviders(<CharacterForm />, { mocks: [slowMock] });
    
    // Fill minimal form
    await user.type(screen.getByLabelText(/name/i), 'Test Character');
    await user.selectOptions(screen.getByLabelText(/category/i), 'HUMAN');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create character/i });
    await user.click(submitButton);
    
    // Check loading state
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('handles all character categories', () => {
    renderWithProviders(<CharacterForm />);
    
    const categorySelect = screen.getByLabelText(/category/i);
    const categories = ['HUMAN', 'ANIMAL', 'DIVINE', 'DEMONIC', 'UNDEAD', 'CONSTRUCT', 'ELEMENTAL'];
    
    categories.forEach(category => {
      expect(screen.getByRole('option', { name: category })).toBeInTheDocument();
    });
  });

  it('properly initializes default attribute values', () => {
    renderWithProviders(<CharacterForm />);
    
    const attributes = ['strength', 'dexterity', 'agility', 'endurance', 'vigor', 
                       'perception', 'intelligence', 'will', 'social', 'faith', 
                       'armor', 'lethality'];
    
    attributes.forEach(attr => {
      const input = screen.getByLabelText(new RegExp(attr, 'i'));
      expect(input.value).toBe('1'); // Default minimum value
    });
  });
});