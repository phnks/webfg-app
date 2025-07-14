import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ActionList from '../../../components/actions/ActionList';
import { LIST_ACTIONS_ENHANCED } from '../../../graphql/operations';

const mockActionsData = {
  request: {
    query: LIST_ACTIONS_ENHANCED,
    variables: {
      filter: {
        pagination: {
          limit: 10,
          cursor: null
        }
      }
    }
  },
  result: {
    data: {
      listActionsEnhanced: {
        actions: [
          {
            actionId: '1',
            name: 'Sword Attack',
            type: 'COMBAT',
            description: 'Strike with a sword',
            difficulty: 5
          },
          {
            actionId: '2',
            name: 'Heal',
            type: 'MAGIC',
            description: 'Restore health points',
            difficulty: 3
          }
        ],
        hasMore: false,
        nextCursor: null
      }
    }
  }
};

const ActionListWrapper = ({ children, mocks = [mockActionsData] }) => (
  <BrowserRouter>
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
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
      expect(screen.getByText('Sword Attack')).toBeInTheDocument();
      expect(screen.getByText('Heal')).toBeInTheDocument();
    });
  });

  test('displays action details', async () => {
    render(
      <ActionListWrapper>
        <ActionList />
      </ActionListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('COMBAT')).toBeInTheDocument();
      expect(screen.getByText('MAGIC')).toBeInTheDocument();
      expect(screen.getByText('Strike with a sword')).toBeInTheDocument();
      expect(screen.getByText('Restore health points')).toBeInTheDocument();
    });
  });

  test('renders search filter sort component', () => {
    render(
      <ActionListWrapper>
        <ActionList />
      </ActionListWrapper>
    );
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('handles empty action list', () => {
    const emptyMock = {
      request: {
        query: LIST_ACTIONS_ENHANCED,
        variables: {
          filter: {
            pagination: {
              limit: 10,
              cursor: null
            }
          }
        }
      },
      result: {
        data: {
          listActionsEnhanced: {
            actions: [],
            hasMore: false,
            nextCursor: null
          }
        }
      }
    };

    render(
      <ActionListWrapper mocks={[emptyMock]}>
        <ActionList />
      </ActionListWrapper>
    );

    expect(screen.getByText('No actions found')).toBeInTheDocument();
  });

  test('handles query error', () => {
    const errorMock = {
      request: {
        query: LIST_ACTIONS_ENHANCED,
        variables: {
          filter: {
            pagination: {
              limit: 10,
              cursor: null
            }
          }
        }
      },
      error: new Error('Network error')
    };

    render(
      <ActionListWrapper mocks={[errorMock]}>
        <ActionList />
      </ActionListWrapper>
    );

    expect(screen.getByText('Error loading actions')).toBeInTheDocument();
  });

  test('applies correct CSS classes', async () => {
    const { container } = render(
      <ActionListWrapper>
        <ActionList />
      </ActionListWrapper>
    );
    
    expect(container.querySelector('.action-list')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(container.querySelector('.actions-table')).toBeInTheDocument();
    });
  });
});