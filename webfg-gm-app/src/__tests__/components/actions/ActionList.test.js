import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import ActionList from '../../../components/actions/ActionList';
import { LIST_ACTIONS_ENHANCED } from '../../../graphql/operations';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

const mockActions = [
  {
    actionId: '1',
    name: 'Attack',
    description: 'Basic attack action',
    sourceAttribute: 'STRENGTH',
    targetAttribute: 'DEFENSE',
    __typename: 'Action'
  }
];

const mocks = [
  {
    request: {
      query: LIST_ACTIONS_ENHANCED,
      variables: {}
    },
    result: {
      data: {
        listActionsEnhanced: {
          actions: mockActions,
          totalCount: 1,
          __typename: 'ActionListResult'
        }
      }
    }
  }
];

const ActionListWrapper = ({ apolloMocks = mocks, children }) => (
  <MockedProvider mocks={apolloMocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('ActionList Component', () => {
  test('renders without crashing', () => {
    render(
      <ActionListWrapper>
        <ActionList />
      </ActionListWrapper>
    );
  });

  test('displays loading state initially', () => {
    render(
      <ActionListWrapper>
        <ActionList />
      </ActionListWrapper>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays actions after loading', async () => {
    render(
      <ActionListWrapper>
        <ActionList />
      </ActionListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Attack')).toBeInTheDocument();
    });
  });

  test('handles empty action list', async () => {
    const emptyMocks = [
      {
        request: {
          query: LIST_ACTIONS_ENHANCED,
          variables: {}
        },
        result: {
          data: {
            listActionsEnhanced: {
              actions: [],
              totalCount: 0,
              __typename: 'ActionListResult'
            }
          }
        }
      }
    ];

    render(
      <ActionListWrapper apolloMocks={emptyMocks}>
        <ActionList />
      </ActionListWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Attack')).not.toBeInTheDocument();
    });
  });

  test('handles GraphQL error', async () => {
    const errorMocks = [
      {
        request: {
          query: LIST_ACTIONS_ENHANCED,
          variables: {}
        },
        error: new Error('GraphQL error')
      }
    ];

    render(
      <ActionListWrapper apolloMocks={errorMocks}>
        <ActionList />
      </ActionListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: GraphQL error')).toBeInTheDocument();
    });
  });
});