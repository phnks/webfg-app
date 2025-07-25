import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CharacterList from '../../../components/characters/CharacterList';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

// Mock Apollo Client
jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
  gql: jest.fn()
}));

// Mock components
jest.mock('../../../components/common/SearchFilterSort', () => {
  return function MockSearchFilterSort() {
    return <div data-testid="search-filter-sort">Search Filter Sort</div>;
  };
});

jest.mock('../../../components/common/PaginationControls', () => {
  return function MockPaginationControls() {
    return <div data-testid="pagination-controls">Pagination Controls</div>;
  };
});

jest.mock('../../../components/common/ErrorPopup', () => {
  return function MockErrorPopup() {
    return <div data-testid="error-popup">Error Popup</div>;
  };
});

const { useQuery, useMutation } = require('@apollo/client');

const mockCharacters = [
  {
    characterId: '1',
    name: 'Test Character',
    characterCategory: 'HUMAN',
    will: 10,
  }
];

const CharacterListWrapper = ({ children }) => (
  <SelectedCharacterProvider>
    {children}
  </SelectedCharacterProvider>
);

describe('CharacterList Component', () => {
  beforeAll(() => {
    // Mock console to avoid test output noise
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterAll(() => {
    jest.restoreAllMocks();
  });
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });
  
  test('renders without crashing', () => {
    useQuery.mockReturnValue({
      data: null,
      loading: true,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    
    render(
      <CharacterListWrapper>
        <CharacterList />
      </CharacterListWrapper>
    );
  });

  test('displays loading state initially', () => {
    useQuery.mockReturnValue({
      data: null,
      loading: true,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    
    render(
      <CharacterListWrapper>
        <CharacterList />
      </CharacterListWrapper>
    );
    
    expect(screen.getByText('Loading characters...')).toBeInTheDocument();
  });

  test('displays characters after loading', async () => {
    useQuery.mockReturnValue({
      data: {
        listCharactersEnhanced: {
          items: mockCharacters,
          nextCursor: null,
          hasNextPage: false,
          totalCount: 1
        }
      },
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    
    render(
      <CharacterListWrapper>
        <CharacterList />
      </CharacterListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Character')).toBeInTheDocument();
    });
  });

  test('handles empty character list', async () => {
    useQuery.mockReturnValue({
      data: {
        listCharactersEnhanced: {
          items: [],
          nextCursor: null,
          hasNextPage: false,
          totalCount: 0
        }
      },
      loading: false,
      error: null
    });

    useMutation.mockReturnValue([jest.fn(), { loading: false }]);

    render(
      <CharacterListWrapper>
        <CharacterList />
      </CharacterListWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Test Character')).not.toBeInTheDocument();
    });
  });

  test('handles GraphQL error', async () => {
    useQuery.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('GraphQL error')
    });

    useMutation.mockReturnValue([jest.fn(), { loading: false }]);

    render(
      <CharacterListWrapper>
        <CharacterList />
      </CharacterListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: GraphQL error')).toBeInTheDocument();
    });
  });
});