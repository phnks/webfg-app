import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ConditionsList from '../../../components/conditions/ConditionsList';

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

jest.mock('../../../context/SelectedCharacterContext', () => ({
  useSelectedCharacter: () => ({
    selectedCharacter: {
      characterId: '1',
      name: 'Test Character'
    },
    selectCharacter: jest.fn(),
    clearSelectedCharacter: jest.fn()
  })
}));

const { useQuery, useMutation } = require('@apollo/client');

const mockConditions = [
  {
    conditionId: '1',
    name: 'Poison',
    description: 'Venomous effect',
    conditionCategory: 'HARMFUL',
    conditionType: 'DEBUFF',
    conditionTarget: 'ATTRIBUTE'
  }
];

const ConditionsListWrapper = ({ children }) => children;

describe('ConditionsList Component', () => {
  beforeAll(() => {
    // Mock console.warn to avoid test output noise
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
      <ConditionsListWrapper>
        <ConditionsList />
      </ConditionsListWrapper>
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
      <ConditionsListWrapper>
        <ConditionsList />
      </ConditionsListWrapper>
    );
    
    expect(screen.getByText('Loading conditions...')).toBeInTheDocument();
  });

  test('displays conditions after loading', async () => {
    useQuery.mockReturnValue({
      data: {
        listConditionsEnhanced: {
          items: mockConditions,
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
      <ConditionsListWrapper>
        <ConditionsList />
      </ConditionsListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Poison')).toBeInTheDocument();
    });
  });

  test('handles empty conditions list', async () => {
    useQuery.mockReturnValue({
      data: {
        listConditionsEnhanced: {
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
      <ConditionsListWrapper>
        <ConditionsList />
      </ConditionsListWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Poison')).not.toBeInTheDocument();
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
      <ConditionsListWrapper>
        <ConditionsList />
      </ConditionsListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: GraphQL error')).toBeInTheDocument();
    });
  });
});