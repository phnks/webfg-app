import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import ObjectList from '../../../components/objects/ObjectList';
import { LIST_OBJECTS_ENHANCED } from '../../../graphql/operations';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

const mockObjects = [
  {
    objectId: '1',
    name: 'Sword',
    objectCategory: 'WEAPON',
    description: 'A sharp blade',
    __typename: 'Object'
  }
];

const mocks = [
  {
    request: {
      query: LIST_OBJECTS_ENHANCED,
      variables: {}
    },
    result: {
      data: {
        listObjectsEnhanced: {
          objects: mockObjects,
          totalCount: 1,
          __typename: 'ObjectListResult'
        }
      }
    }
  }
];

const ObjectListWrapper = ({ apolloMocks = mocks, children }) => (
  <MockedProvider mocks={apolloMocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('ObjectList Component', () => {
  test('renders without crashing', () => {
    render(
      <ObjectListWrapper>
        <ObjectList />
      </ObjectListWrapper>
    );
  });

  test('displays loading state initially', () => {
    render(
      <ObjectListWrapper>
        <ObjectList />
      </ObjectListWrapper>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays objects after loading', async () => {
    render(
      <ObjectListWrapper>
        <ObjectList />
      </ObjectListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Sword')).toBeInTheDocument();
    });
  });

  test('handles empty object list', async () => {
    const emptyMocks = [
      {
        request: {
          query: LIST_OBJECTS_ENHANCED,
          variables: {}
        },
        result: {
          data: {
            listObjectsEnhanced: {
              objects: [],
              totalCount: 0,
              __typename: 'ObjectListResult'
            }
          }
        }
      }
    ];

    render(
      <ObjectListWrapper apolloMocks={emptyMocks}>
        <ObjectList />
      </ObjectListWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Sword')).not.toBeInTheDocument();
    });
  });

  test('handles GraphQL error', async () => {
    const errorMocks = [
      {
        request: {
          query: LIST_OBJECTS_ENHANCED,
          variables: {}
        },
        error: new Error('GraphQL error')
      }
    ];

    render(
      <ObjectListWrapper apolloMocks={errorMocks}>
        <ObjectList />
      </ObjectListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: GraphQL error')).toBeInTheDocument();
    });
  });
});