import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import CharacterDetails from '../../../components/characters/CharacterDetails';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '1' })
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
  agility: { attribute: { attributeValue: 6, isGrouped: false } },
  endurance: { attribute: { attributeValue: 9, isGrouped: false } },
  perception: { attribute: { attributeValue: 4, isGrouped: false } },
  intelligence: { attribute: { attributeValue: 7, isGrouped: false } },
  charisma: { attribute: { attributeValue: 5, isGrouped: false } },
  resolve: { attribute: { attributeValue: 8, isGrouped: false } },
  morale: { attribute: { attributeValue: 6, isGrouped: false } },
  weight: { attribute: { attributeValue: 70, isGrouped: false } },
  size: { attribute: { attributeValue: 3, isGrouped: false } },
  armour: { attribute: { attributeValue: 2, isGrouped: false } },
  lethality: { attribute: { attributeValue: 1, isGrouped: false } },
  intensity: { attribute: { attributeValue: 4, isGrouped: false } }
};

const CharacterDetailsWrapper = ({ children }) => (
  <MockedProvider mocks={[]} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('CharacterDetails Component', () => {
  test('renders without crashing', () => {
    render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={mockCharacter} />
      </CharacterDetailsWrapper>
    );
  });

  test('displays character name', () => {
    render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={mockCharacter} />
      </CharacterDetailsWrapper>
    );
    
    expect(screen.getByText('Test Character')).toBeInTheDocument();
  });

  test('displays character category', () => {
    render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={mockCharacter} />
      </CharacterDetailsWrapper>
    );
    
    expect(screen.getByText('HUMAN')).toBeInTheDocument();
  });

  test('displays character description', () => {
    render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={mockCharacter} />
      </CharacterDetailsWrapper>
    );
    
    expect(screen.getByText('A test character')).toBeInTheDocument();
  });

  test('displays will and fatigue stats', () => {
    render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={mockCharacter} />
      </CharacterDetailsWrapper>
    );
    
    expect(screen.getByText(/Will.*10/)).toBeInTheDocument();
    expect(screen.getByText(/Fatigue.*2/)).toBeInTheDocument();
  });

  test('displays physical attributes', () => {
    render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={mockCharacter} />
      </CharacterDetailsWrapper>
    );
    
    expect(screen.getByText(/Speed.*5/)).toBeInTheDocument();
    expect(screen.getByText(/Strength.*8/)).toBeInTheDocument();
    expect(screen.getByText(/Dexterity.*7/)).toBeInTheDocument();
  });

  test('displays mental attributes', () => {
    render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={mockCharacter} />
      </CharacterDetailsWrapper>
    );
    
    expect(screen.getByText(/Intelligence.*7/)).toBeInTheDocument();
    expect(screen.getByText(/Perception.*4/)).toBeInTheDocument();
  });

  test('displays size and weight', () => {
    render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={mockCharacter} />
      </CharacterDetailsWrapper>
    );
    
    expect(screen.getByText(/Weight.*70/)).toBeInTheDocument();
    expect(screen.getByText(/Size.*3/)).toBeInTheDocument();
  });

  test('handles missing character gracefully', () => {
    render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={null} />
      </CharacterDetailsWrapper>
    );
    
    expect(screen.getByText('No character data available')).toBeInTheDocument();
  });

  test('handles missing attributes gracefully', () => {
    const incompleteCharacter = {
      characterId: '1',
      name: 'Incomplete Character',
      characterCategory: 'HUMAN'
    };
    
    render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={incompleteCharacter} />
      </CharacterDetailsWrapper>
    );
    
    expect(screen.getByText('Incomplete Character')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <CharacterDetailsWrapper>
        <CharacterDetails character={mockCharacter} />
      </CharacterDetailsWrapper>
    );
    
    expect(container.querySelector('.character-details')).toBeInTheDocument();
  });
});