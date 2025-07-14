import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import CharacterPhysical from '../../../components/characters/CharacterPhysical';

const mockCharacter = {
  characterId: '1',
  name: 'Test Character',
  speed: { attribute: { attributeValue: 5, isGrouped: false } },
  strength: { attribute: { attributeValue: 8, isGrouped: false } },
  dexterity: { attribute: { attributeValue: 7, isGrouped: false } },
  agility: { attribute: { attributeValue: 6, isGrouped: false } },
  endurance: { attribute: { attributeValue: 9, isGrouped: false } },
  weight: { attribute: { attributeValue: 70, isGrouped: false } },
  size: { attribute: { attributeValue: 3, isGrouped: false } },
  armour: { attribute: { attributeValue: 2, isGrouped: false } },
  lethality: { attribute: { attributeValue: 1, isGrouped: false } },
  intensity: { attribute: { attributeValue: 4, isGrouped: false } },
  fatigue: 2
};

const CharacterPhysicalWrapper = ({ children }) => (
  <MockedProvider mocks={[]} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('CharacterPhysical Component', () => {
  test('renders without crashing', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
  });

  test('displays physical attributes section', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText('Physical Attributes')).toBeInTheDocument();
  });

  test('displays speed attribute', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('displays strength attribute', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  test('displays dexterity attribute', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText('Dexterity')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('displays agility attribute', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText('Agility')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('displays endurance attribute', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText('Endurance')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  test('displays physical characteristics', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('displays defensive attributes', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText('Armour')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('displays offensive attributes', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText('Lethality')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Intensity')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('handles missing character data', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={null} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText('No character data available')).toBeInTheDocument();
  });

  test('handles missing attributes gracefully', () => {
    const incompleteCharacter = {
      characterId: '1',
      name: 'Incomplete Character'
    };
    
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={incompleteCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    // Should still render the section
    expect(screen.getByText('Physical Attributes')).toBeInTheDocument();
  });

  test('displays fatigue impact', () => {
    render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(screen.getByText(/Fatigue.*2/)).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <CharacterPhysicalWrapper>
        <CharacterPhysical character={mockCharacter} />
      </CharacterPhysicalWrapper>
    );
    
    expect(container.querySelector('.character-physical')).toBeInTheDocument();
  });
});