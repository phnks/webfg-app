import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterEquipment from '../../../components/characters/CharacterEquipment';

const mockCharacter = {
  characterId: '1',
  name: 'Test Character',
  equipment: [
    {
      objectId: '1',
      name: 'Sword',
      objectCategory: 'WEAPON'
    },
    {
      objectId: '2',
      name: 'Shield',
      objectCategory: 'ARMOR'
    }
  ],
  ready: [
    {
      objectId: '3',
      name: 'Potion',
      objectCategory: 'CONSUMABLE'
    }
  ],
  stash: [
    {
      objectId: '4',
      name: 'Rope',
      objectCategory: 'TOOL'
    }
  ]
};

describe('CharacterEquipment Component', () => {
  test('renders without crashing', () => {
    render(<CharacterEquipment character={mockCharacter} />);
  });

  test('displays character equipment section', () => {
    render(<CharacterEquipment character={mockCharacter} />);
    
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  test('displays equipped items', () => {
    render(<CharacterEquipment character={mockCharacter} />);
    
    expect(screen.getByText('Sword')).toBeInTheDocument();
    expect(screen.getByText('Shield')).toBeInTheDocument();
  });

  test('displays ready items', () => {
    render(<CharacterEquipment character={mockCharacter} />);
    
    expect(screen.getByText('Ready Items')).toBeInTheDocument();
    expect(screen.getByText('Potion')).toBeInTheDocument();
  });

  test('displays stash items', () => {
    render(<CharacterEquipment character={mockCharacter} />);
    
    expect(screen.getByText('Stash')).toBeInTheDocument();
    expect(screen.getByText('Rope')).toBeInTheDocument();
  });

  test('handles character with no equipment', () => {
    const emptyCharacter = {
      characterId: '1',
      name: 'Empty Character',
      equipment: [],
      ready: [],
      stash: []
    };
    
    render(<CharacterEquipment character={emptyCharacter} />);
    
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('No equipment')).toBeInTheDocument();
  });

  test('handles null character', () => {
    render(<CharacterEquipment character={null} />);
    
    expect(screen.getByText('No character data')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<CharacterEquipment character={mockCharacter} />);
    
    expect(container.querySelector('.character-equipment')).toBeInTheDocument();
  });
});