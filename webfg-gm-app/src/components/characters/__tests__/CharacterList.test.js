import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockCharacters } from '../../../test-utils';
import CharacterList from '../CharacterList';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
}));

describe('CharacterList', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders character list with loading state', () => {
    const loadingMock = {
      request: {
        query: require('../../../graphql/operations').LIST_CHARACTERS
      },
      result: {
        loading: true
      }
    };

    renderWithProviders(<CharacterList />, { mocks: [loadingMock] });
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders character list with data', async () => {
    renderWithProviders(<CharacterList />);
    
    await waitFor(() => {
      expect(screen.getByText('The Guy')).toBeInTheDocument();
      expect(screen.getByText('Commoner')).toBeInTheDocument();
    });

    // Check character details are displayed
    expect(screen.getByText('HUMAN')).toBeInTheDocument();
    expect(screen.getByText(/perfectly average person/i)).toBeInTheDocument();
  });

  it('renders error state when query fails', async () => {
    const errorMock = {
      request: {
        query: require('../../../graphql/operations').LIST_CHARACTERS
      },
      error: new Error('Network error')
    };

    renderWithProviders(<CharacterList />, { mocks: [errorMock] });
    
    await waitFor(() => {
      expect(screen.getByText(/error.*loading.*characters/i)).toBeInTheDocument();
    });
  });

  it('displays create character button', async () => {
    renderWithProviders(<CharacterList />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create character/i })).toBeInTheDocument();
    });
  });

  it('navigates to create character form when create button clicked', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CharacterList />);
    
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /create character/i });
      expect(createButton).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create character/i });
    await user.click(createButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/characters/new');
  });

  it('displays character cards with correct information', async () => {
    renderWithProviders(<CharacterList />);
    
    await waitFor(() => {
      // Check The Guy character card
      const theGuyCard = screen.getByText('The Guy').closest('[data-testid="character-card"]');
      expect(theGuyCard).toContainHTML('The Guy');
      expect(theGuyCard).toContainHTML('HUMAN');
      expect(theGuyCard).toContainHTML('perfectly average person');
      
      // Check Commoner character card
      const commonerCard = screen.getByText('Commoner').closest('[data-testid="character-card"]');
      expect(commonerCard).toContainHTML('Commoner');
      expect(commonerCard).toContainHTML('weak individual');
    });
  });

  it('handles character card clicks for navigation', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CharacterList />);
    
    await waitFor(() => {
      expect(screen.getByText('The Guy')).toBeInTheDocument();
    });

    const characterCard = screen.getByText('The Guy').closest('[data-testid="character-card"]');
    await user.click(characterCard);
    
    expect(mockNavigate).toHaveBeenCalledWith('/characters/1');
  });

  it('displays empty state when no characters exist', async () => {
    const emptyMock = {
      request: {
        query: require('../../../graphql/operations').LIST_CHARACTERS
      },
      result: {
        data: {
          listCharacters: {
            items: []
          }
        }
      }
    };

    renderWithProviders(<CharacterList />, { mocks: [emptyMock] });
    
    await waitFor(() => {
      expect(screen.getByText(/no characters found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first character/i)).toBeInTheDocument();
    });
  });

  it('displays character attribute preview', async () => {
    renderWithProviders(<CharacterList />);
    
    await waitFor(() => {
      // Check that key attributes are displayed for The Guy
      const theGuyCard = screen.getByText('The Guy').closest('[data-testid="character-card"]');
      expect(theGuyCard).toContainHTML('Str: 10');
      expect(theGuyCard).toContainHTML('Dex: 10');
      expect(theGuyCard).toContainHTML('Agi: 10');
    });
  });

  it('filters characters by category', async () => {
    const user = userEvent.setup();
    
    // Add a non-human character to test data
    const mixedCharactersMock = {
      request: {
        query: require('../../../graphql/operations').LIST_CHARACTERS
      },
      result: {
        data: {
          listCharacters: {
            items: [
              ...mockCharacters,
              {
                id: '3',
                name: 'Divine Being',
                category: 'DIVINE',
                description: 'A divine entity',
                strength: 50,
                dexterity: 50,
                agility: 50,
                endurance: 50,
                vigor: 50,
                perception: 50,
                intelligence: 50,
                will: 50,
                social: 50,
                faith: 50,
                armor: 50,
                lethality: 50,
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z'
              }
            ]
          }
        }
      }
    };

    renderWithProviders(<CharacterList />, { mocks: [mixedCharactersMock] });
    
    await waitFor(() => {
      expect(screen.getByText('The Guy')).toBeInTheDocument();
      expect(screen.getByText('Divine Being')).toBeInTheDocument();
    });

    // Filter by HUMAN category
    const categoryFilter = screen.getByLabelText(/filter by category/i);
    await user.selectOptions(categoryFilter, 'HUMAN');
    
    await waitFor(() => {
      expect(screen.getByText('The Guy')).toBeInTheDocument();
      expect(screen.getByText('Commoner')).toBeInTheDocument();
      expect(screen.queryByText('Divine Being')).not.toBeInTheDocument();
    });

    // Filter by DIVINE category
    await user.selectOptions(categoryFilter, 'DIVINE');
    
    await waitFor(() => {
      expect(screen.queryByText('The Guy')).not.toBeInTheDocument();
      expect(screen.queryByText('Commoner')).not.toBeInTheDocument();
      expect(screen.getByText('Divine Being')).toBeInTheDocument();
    });

    // Clear filter
    await user.selectOptions(categoryFilter, 'ALL');
    
    await waitFor(() => {
      expect(screen.getByText('The Guy')).toBeInTheDocument();
      expect(screen.getByText('Commoner')).toBeInTheDocument();
      expect(screen.getByText('Divine Being')).toBeInTheDocument();
    });
  });

  it('searches characters by name', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CharacterList />);
    
    await waitFor(() => {
      expect(screen.getByText('The Guy')).toBeInTheDocument();
      expect(screen.getByText('Commoner')).toBeInTheDocument();
    });

    // Search for "Guy"
    const searchInput = screen.getByPlaceholderText(/search characters/i);
    await user.type(searchInput, 'Guy');
    
    await waitFor(() => {
      expect(screen.getByText('The Guy')).toBeInTheDocument();
      expect(screen.queryByText('Commoner')).not.toBeInTheDocument();
    });

    // Clear search
    await user.clear(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('The Guy')).toBeInTheDocument();
      expect(screen.getByText('Commoner')).toBeInTheDocument();
    });
  });

  it('sorts characters by different criteria', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CharacterList />);
    
    await waitFor(() => {
      expect(screen.getByText('The Guy')).toBeInTheDocument();
    });

    // Test sorting by name
    const sortSelect = screen.getByLabelText(/sort by/i);
    await user.selectOptions(sortSelect, 'name_asc');
    
    // Characters should be sorted alphabetically
    const characterCards = screen.getAllByTestId('character-card');
    expect(characterCards[0]).toHaveTextContent('Commoner');
    expect(characterCards[1]).toHaveTextContent('The Guy');

    // Test sorting by creation date
    await user.selectOptions(sortSelect, 'created_desc');
    
    // Should maintain order since both have same creation date
    expect(screen.getByText('The Guy')).toBeInTheDocument();
    expect(screen.getByText('Commoner')).toBeInTheDocument();
  });
});