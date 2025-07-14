import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ObjectList from '../../../components/objects/ObjectList';
import { LIST_OBJECTS_ENHANCED, ADD_OBJECT_TO_STASH, DELETE_OBJECT } from '../../../graphql/operations';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

const mockObjectsData = {
  request: {
    query: LIST_OBJECTS_ENHANCED,
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
      listObjectsEnhanced: {
        objects: [
          {
            objectId: '1',
            name: 'Sword',
            objectCategory: 'WEAPON',
            description: 'A sharp blade',
            weight: 3.0,
            size: 'MEDIUM'
          },
          {
            objectId: '2',
            name: 'Shield',
            objectCategory: 'ARMOR',
            description: 'Defensive equipment',
            weight: 5.0,
            size: 'LARGE'
          }
        ],
        hasMore: false,
        nextCursor: null
      }
    }
  }
};

const mockSelectedCharacter = {
  characterId: '1',
  name: 'Test Character'
};

const ObjectListWrapper = ({ children, mocks = [mockObjectsData] }) => (
  <BrowserRouter>
    <MockedProvider mocks={mocks} addTypename={false}>
      <SelectedCharacterProvider value={{ selectedCharacter: mockSelectedCharacter }}>
        {children}
      </SelectedCharacterProvider>
    </MockedProvider>
  </BrowserRouter>
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
      expect(screen.getByText('Shield')).toBeInTheDocument();
    });
  });

  test('displays object details', async () => {
    render(
      <ObjectListWrapper>
        <ObjectList />
      </ObjectListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('WEAPON')).toBeInTheDocument();
      expect(screen.getByText('ARMOR')).toBeInTheDocument();
      expect(screen.getByText('A sharp blade')).toBeInTheDocument();
      expect(screen.getByText('Defensive equipment')).toBeInTheDocument();
    });
  });

  test('renders search filter sort component', () => {
    render(
      <ObjectListWrapper>
        <ObjectList />
      </ObjectListWrapper>
    );
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('handles empty object list', () => {
    const emptyMock = {
      request: {
        query: LIST_OBJECTS_ENHANCED,
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
          listObjectsEnhanced: {
            objects: [],
            hasMore: false,
            nextCursor: null
          }
        }
      }
    };

    render(
      <ObjectListWrapper mocks={[emptyMock]}>
        <ObjectList />
      </ObjectListWrapper>
    );

    expect(screen.getByText('No objects found')).toBeInTheDocument();
  });

  test('handles query error', () => {
    const errorMock = {
      request: {
        query: LIST_OBJECTS_ENHANCED,
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
      <ObjectListWrapper mocks={[errorMock]}>
        <ObjectList />
      </ObjectListWrapper>
    );

    expect(screen.getByText('Error loading objects')).toBeInTheDocument();
  });

  test('applies correct CSS classes', async () => {
    const { container } = render(
      <ObjectListWrapper>
        <ObjectList />
      </ObjectListWrapper>
    );
    
    expect(container.querySelector('.object-list')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(container.querySelector('.objects-table')).toBeInTheDocument();
    });
  });

  test('handles search functionality', () => {
    render(
      <ObjectListWrapper>
        <ObjectList />
      </ObjectListWrapper>
    );
    
    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'sword' } });
    
    expect(searchInput.value).toBe('sword');
  });
});