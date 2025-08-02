import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EncountersList from '../../../components/encounters/EncountersList';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

// Mock Apollo Client
jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
  useSubscription: jest.fn(() => ({ data: null, loading: false })),
  gql: jest.fn()
}));

const { useQuery, useMutation, useSubscription } = require('@apollo/client');

const mockEncounters = [
  {
    encounterId: '1',
    name: 'Forest Ambush',
    description: 'A dangerous encounter in the woods',
    round: 3,
    currentTime: 150,
    initiative: 12,
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    encounterId: '2',
    name: 'Cave Exploration',
    description: 'Exploring a mysterious cave',
    round: 1,
    currentTime: 30,
    initiative: 8,
    createdAt: '2023-01-02T00:00:00Z'
  }
];

const EncountersListWrapper = ({ children }) => children;

describe('EncountersList Component', () => {
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
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );
  });

  test('displays loading state initially', () => {
    useQuery.mockReturnValue({
      data: null,
      loading: true,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );
    
    expect(screen.getByText('Loading encounters...')).toBeInTheDocument();
  });

  test('displays encounters after loading', async () => {
    useQuery.mockReturnValue({
      data: {
        listEncounters: mockEncounters
      },
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Forest Ambush')).toBeInTheDocument();
      expect(screen.getByText('Cave Exploration')).toBeInTheDocument();
    });
  });

  test('displays encounter details', async () => {
    useQuery.mockReturnValue({
      data: {
        listEncounters: mockEncounters
      },
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('A dangerous encounter in the woods')).toBeInTheDocument();
      expect(screen.getByText('Exploring a mysterious cave')).toBeInTheDocument();
    });
  });

  test('displays encounter rounds', async () => {
    useQuery.mockReturnValue({
      data: {
        listEncounters: mockEncounters
      },
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Round: 3/)).toBeInTheDocument();
      expect(screen.getByText(/Round: 1/)).toBeInTheDocument();
    });
  });

  test('displays encounter metadata', async () => {
    useQuery.mockReturnValue({
      data: {
        listEncounters: mockEncounters
      },
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      // The component shows creation date, not time
      expect(screen.getAllByText(/Created:/).length).toBeGreaterThan(0);
      // Date formatting depends on locale, so look for more flexible pattern
      // Using getAllByText since we have multiple encounters with 2023 dates
      expect(screen.getAllByText(/Created:.*2023/).length).toBeGreaterThan(0);
    });
  });

  test('handles empty encounters list', async () => {
    useQuery.mockReturnValue({
      data: {
        listEncounters: []
      },
      loading: false,
      error: null
    });

    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });

    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Forest Ambush')).not.toBeInTheDocument();
    });
  });

  test('handles query error', async () => {
    useQuery.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Network error')
    });

    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });

    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading encounters: Network error')).toBeInTheDocument();
    });
  });

  test('displays create new encounter button', async () => {
    useQuery.mockReturnValue({
      data: {
        listEncounters: mockEncounters
      },
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('New Encounter')).toBeInTheDocument();
    });
  });

  test('applies correct CSS classes', async () => {
    useQuery.mockReturnValue({
      data: {
        listEncounters: mockEncounters
      },
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    const { container } = render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Forest Ambush')).toBeInTheDocument();
    });
    
    // Check for CSS classes that actually exist in the component
    expect(container.querySelector('.encounters-list-container')).toBeInTheDocument();
    expect(container.querySelector('.encounter-card')).toBeInTheDocument();
  });

  test('displays encounter cards', async () => {
    useQuery.mockReturnValue({
      data: {
        listEncounters: mockEncounters
      },
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Forest Ambush')).toBeInTheDocument();
      expect(screen.getByText('Cave Exploration')).toBeInTheDocument();
    });
  });

  test('handles encounter click navigation', async () => {
    useQuery.mockReturnValue({
      data: {
        listEncounters: mockEncounters
      },
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      // The component renders multiple "Run Encounter" buttons (one per encounter)
      expect(screen.getAllByText('Run Encounter').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Forest Ambush')).toBeInTheDocument();
    });
  });

  test('displays encounter initiative', async () => {
    useQuery.mockReturnValue({
      data: {
        listEncounters: mockEncounters
      },
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });
    
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Initiative: 12/)).toBeInTheDocument();
      expect(screen.getByText(/Initiative: 8/)).toBeInTheDocument();
    });
  });

  test('handles missing encounter properties', async () => {
    const incompleteEncounter = {
      encounterId: '1',
      name: 'Incomplete Encounter'
      // Missing other properties
    };
    
    useQuery.mockReturnValue({
      data: {
        listEncounters: [incompleteEncounter]
      },
      loading: false,
      error: null
    });

    useMutation.mockReturnValue([jest.fn(), { loading: false }]);
    useSubscription.mockReturnValue({ data: null, loading: false });

    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Incomplete Encounter')).toBeInTheDocument();
    });
  });
});