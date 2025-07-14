import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import EncountersList from '../../../components/encounters/EncountersList';
import { LIST_ENCOUNTERS } from '../../../graphql/operations';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

const mockEncounters = [
  {
    encounterId: '1',
    name: 'Test Encounter',
    description: 'A test encounter',
    round: 1,
    initiative: 10,
    __typename: 'Encounter'
  }
];

const mocks = [
  {
    request: {
      query: LIST_ENCOUNTERS,
      variables: {}
    },
    result: {
      data: {
        listEncounters: mockEncounters
      }
    }
  }
];

const EncountersListWrapper = ({ apolloMocks = mocks, children }) => (
  <MockedProvider mocks={apolloMocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('EncountersList Component', () => {
  test('renders without crashing', () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );
  });

  test('displays loading state initially', () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays encounters after loading', async () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Encounter')).toBeInTheDocument();
    });
  });

  test('handles GraphQL error', async () => {
    const errorMocks = [
      {
        request: {
          query: LIST_ENCOUNTERS,
          variables: {}
        },
        error: new Error('GraphQL error')
      }
    ];

    render(
      <EncountersListWrapper apolloMocks={errorMocks}>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: GraphQL error')).toBeInTheDocument();
    });
  });
});