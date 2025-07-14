import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import CharacterList from '../../../components/characters/CharacterList';
import { LIST_CHARACTERS_ENHANCED } from '../../../graphql/operations';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

const mockCharacters = [
  {
    characterId: '1',
    name: 'Test Character',
    characterCategory: 'HUMAN',
    will: 10,
    fatigue: 2,
    __typename: 'Character'
  }
];

const mocks = [
  {
    request: {
      query: LIST_CHARACTERS_ENHANCED,
      variables: {}
    },
    result: {
      data: {
        listCharactersEnhanced: {
          characters: mockCharacters,
          totalCount: 1,
          __typename: 'CharacterListResult'
        }
      }
    }
  }
];

const CharacterListWrapper = ({ apolloMocks = mocks, children }) => (
  <MockedProvider mocks={apolloMocks} addTypename={false}>
    <SelectedCharacterProvider>
      {children}
    </SelectedCharacterProvider>
  </MockedProvider>
);

describe('CharacterList Component', () => {
  test('renders without crashing', () => {
    render(
      <CharacterListWrapper>
        <CharacterList />
      </CharacterListWrapper>
    );
  });

  test('displays loading state initially', () => {
    render(
      <CharacterListWrapper>
        <CharacterList />
      </CharacterListWrapper>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays characters after loading', async () => {
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
    const emptyMocks = [
      {
        request: {
          query: LIST_CHARACTERS_ENHANCED,
          variables: {}
        },
        result: {
          data: {
            listCharactersEnhanced: {
              characters: [],
              totalCount: 0,
              __typename: 'CharacterListResult'
            }
          }
        }
      }
    ];

    render(
      <CharacterListWrapper apolloMocks={emptyMocks}>
        <CharacterList />
      </CharacterListWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Test Character')).not.toBeInTheDocument();
    });
  });

  test('handles GraphQL error', async () => {
    const errorMocks = [
      {
        request: {
          query: LIST_CHARACTERS_ENHANCED,
          variables: {}
        },
        error: new Error('GraphQL error')
      }
    ];

    render(
      <CharacterListWrapper apolloMocks={errorMocks}>
        <CharacterList />
      </CharacterListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: GraphQL error')).toBeInTheDocument();
    });
  });
});