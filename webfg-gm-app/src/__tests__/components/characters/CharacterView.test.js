import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import CharacterView from '../../../components/characters/CharacterView';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

const mockCharacter = {
  characterId: '1',
  name: 'Test Character',
  characterCategory: 'HUMAN',
  race: 'Human',
  description: 'A test character for unit testing',
  will: 10,
  fatigue: 2,
  hitPoints: { current: 15, max: 20 },
  stats: {
    hitPoints: { current: 15, max: 20 },
    fatigue: { current: 2, max: 10 },
    exhaustion: { current: 0, max: 5 },
    surges: { current: 3, max: 3 }
  },
  equipment: [
    {
      objectId: '1',
      name: 'Sword',
      objectCategory: 'WEAPON'
    }
  ],
  ready: [],
  stash: [],
  skills: [
    {
      skillId: '1',
      name: 'Swordsmanship',
      level: 5,
      description: 'Skill with swords'
    }
  ],
  attributes: [
    {
      attributeId: '1',
      name: 'Strength',
      attributeValue: 12
    }
  ]
};

const CharacterViewWrapper = ({ children }) => (
  <BrowserRouter>
    <MockedProvider mocks={[]} addTypename={false}>
      <SelectedCharacterProvider>
        {children}
      </SelectedCharacterProvider>
    </MockedProvider>
  </BrowserRouter>
);

describe('CharacterView Component', () => {
  test('renders without crashing', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
  });

  test('displays character name', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Test Character')).toBeInTheDocument();
  });

  test('displays character category', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('HUMAN')).toBeInTheDocument();
  });

  test('displays character description', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('A test character for unit testing')).toBeInTheDocument();
  });

  test('displays edit button', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('displays delete button', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('displays select character button', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Select Character')).toBeInTheDocument();
  });

  test('displays character details section', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Character Details')).toBeInTheDocument();
  });

  test('displays character stats section', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });

  test('displays character equipment section', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  test('displays character skills section', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  test('handles null character gracefully', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={null} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Character not found')).toBeInTheDocument();
  });

  test('handles character without stats', () => {
    const characterWithoutStats = {
      ...mockCharacter,
      stats: null
    };
    
    render(
      <CharacterViewWrapper>
        <CharacterView character={characterWithoutStats} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Test Character')).toBeInTheDocument();
  });

  test('handles character without equipment', () => {
    const characterWithoutEquipment = {
      ...mockCharacter,
      equipment: null
    };
    
    render(
      <CharacterViewWrapper>
        <CharacterView character={characterWithoutEquipment} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('Test Character')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(container.querySelector('.character-view')).toBeInTheDocument();
  });

  test('displays tab navigation', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    // Should display tabs for different character sections
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Physical')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  test('displays character will and fatigue', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
    
    expect(screen.getByText('10')).toBeInTheDocument(); // will
    expect(screen.getByText('2')).toBeInTheDocument(); // fatigue
  });
});