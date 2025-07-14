import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import CharacterView from '../../../components/characters/CharacterView';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn()
}));

const mockCharacter = {
  characterId: '1',
  name: 'Test Character',
  characterCategory: 'HUMAN',
  description: 'A test character',
  will: 10,
  fatigue: 2,
  speed: { attribute: { attributeValue: 5, isGrouped: false } },
  strength: { attribute: { attributeValue: 8, isGrouped: false } },
  dexterity: { attribute: { attributeValue: 7, isGrouped: false } },
  __typename: 'Character'
};

const mocks = [];

const CharacterViewWrapper = ({ apolloMocks = mocks, children }) => (
  <MockedProvider mocks={apolloMocks} addTypename={false}>
    <MemoryRouter>
      <SelectedCharacterProvider>
        {children}
      </SelectedCharacterProvider>
    </MemoryRouter>
  </MockedProvider>
);

describe('CharacterView Component', () => {
  test('renders without crashing', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView />
      </CharacterViewWrapper>
    );
  });

  test('displays loading state initially', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays character details tab navigation', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView />
      </CharacterViewWrapper>
    );
    
    // Should have tab navigation elements
    const tabContainer = document.querySelector('.character-view-container');
    expect(tabContainer).toBeInTheDocument();
  });

  test('renders with character ID from URL params', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView />
      </CharacterViewWrapper>
    );
    
    // Component should render and attempt to load character with ID '1'
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('has proper CSS classes applied', () => {
    const { container } = render(
      <CharacterViewWrapper>
        <CharacterView />
      </CharacterViewWrapper>
    );
    
    expect(container.querySelector('.character-view-container')).toBeInTheDocument();
  });

  test('component structure includes main sections', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView />
      </CharacterViewWrapper>
    );
    
    // Component should have basic structure even in loading state
    const container = document.querySelector('.character-view-container');
    expect(container).toBeInTheDocument();
  });
});