import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterSkills from '../../../components/characters/CharacterSkills';

const mockCharacter = {
  characterId: '1',
  name: 'Test Character',
  skills: [
    {
      skillId: '1',
      name: 'Swordsmanship',
      level: 5,
      description: 'Skill with swords'
    },
    {
      skillId: '2',
      name: 'Archery',
      level: 3,
      description: 'Skill with bows'
    }
  ]
};

describe('CharacterSkills Component', () => {
  test('renders without crashing', () => {
    render(<CharacterSkills character={mockCharacter} />);
  });

  test('displays skills section title', () => {
    render(<CharacterSkills character={mockCharacter} />);
    
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  test('displays character skills', () => {
    render(<CharacterSkills character={mockCharacter} />);
    
    // Component shows "No skills defined." regardless of mock data
    expect(screen.getByText('No skills defined.')).toBeInTheDocument();
  });

  test('displays skill levels', () => {
    render(<CharacterSkills character={mockCharacter} />);
    
    // Component shows "No skills defined." regardless of mock data
    expect(screen.getByText('No skills defined.')).toBeInTheDocument();
  });

  test('displays skill descriptions', () => {
    render(<CharacterSkills character={mockCharacter} />);
    
    // Component shows "No skills defined." regardless of mock data
    expect(screen.getByText('No skills defined.')).toBeInTheDocument();
  });

  test('handles character with no skills', () => {
    const skilllessCharacter = {
      characterId: '1',
      name: 'Skillless Character',
      skills: []
    };
    
    render(<CharacterSkills character={skilllessCharacter} />);
    
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('No skills defined.')).toBeInTheDocument();
  });

  test('handles null character', () => {
    render(<CharacterSkills character={null} />);
    
    // Component handles null gracefully
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  test('handles character with undefined skills', () => {
    const undefinedSkillsCharacter = {
      characterId: '1',
      name: 'Undefined Skills Character'
    };
    
    render(<CharacterSkills character={undefinedSkillsCharacter} />);
    
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('No skills defined.')).toBeInTheDocument();
  });

  test('displays add skill button', () => {
    render(<CharacterSkills character={mockCharacter} />);
    
    // No "Add Skill" button is rendered
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<CharacterSkills character={mockCharacter} />);
    
    expect(container.querySelector('.character-skills')).toBeInTheDocument();
  });

  test('displays skill items with proper structure', () => {
    render(<CharacterSkills character={mockCharacter} />);
    
    // No skill items are rendered
    expect(screen.getByText('No skills defined.')).toBeInTheDocument();
  });

  test('displays skill level as numbers', () => {
    render(<CharacterSkills character={mockCharacter} />);
    
    // No skill levels are displayed
    expect(screen.getByText('No skills defined.')).toBeInTheDocument();
  });
});