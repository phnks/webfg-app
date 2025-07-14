import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import ConditionsList from '../../../components/conditions/ConditionsList';
import { LIST_CONDITIONS_ENHANCED } from '../../../graphql/operations';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

const mockConditions = [
  {
    conditionId: '1',
    name: 'Poison',
    description: 'Venomous effect',
    conditionCategory: 'HARMFUL',
    __typename: 'Condition'
  }
];

const mocks = [
  {
    request: {
      query: LIST_CONDITIONS_ENHANCED,
      variables: {}
    },
    result: {
      data: {
        listConditionsEnhanced: {
          conditions: mockConditions,
          totalCount: 1,
          __typename: 'ConditionListResult'
        }
      }
    }
  }
];

const ConditionsListWrapper = ({ apolloMocks = mocks, children }) => (
  <MockedProvider mocks={apolloMocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('ConditionsList Component', () => {
  test('renders without crashing', () => {
    render(
      <ConditionsListWrapper>
        <ConditionsList />
      </ConditionsListWrapper>
    );
  });

  test('displays loading state initially', () => {
    render(
      <ConditionsListWrapper>
        <ConditionsList />
      </ConditionsListWrapper>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays conditions after loading', async () => {
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
    const emptyMocks = [
      {
        request: {
          query: LIST_CONDITIONS_ENHANCED,
          variables: {}
        },
        result: {
          data: {
            listConditionsEnhanced: {
              conditions: [],
              totalCount: 0,
              __typename: 'ConditionListResult'
            }
          }
        }
      }
    ];

    render(
      <ConditionsListWrapper apolloMocks={emptyMocks}>
        <ConditionsList />
      </ConditionsListWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Poison')).not.toBeInTheDocument();
    });
  });

  test('handles GraphQL error', async () => {
    const errorMocks = [
      {
        request: {
          query: LIST_CONDITIONS_ENHANCED,
          variables: {}
        },
        error: new Error('GraphQL error')
      }
    ];

    render(
      <ConditionsListWrapper apolloMocks={errorMocks}>
        <ConditionsList />
      </ConditionsListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: GraphQL error')).toBeInTheDocument();
    });
  });
});