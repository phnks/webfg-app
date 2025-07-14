import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterStats from '../../../components/characters/CharacterStats';

const mockStats = {
  hitPoints: {
    current: 15,
    max: 20
  },
  fatigue: {
    current: 2,
    max: 10
  },
  exhaustion: {
    current: 0,
    max: 5
  },
  surges: {
    current: 3,
    max: 3
  }
};

describe('CharacterStats Component', () => {
  test('renders without crashing', () => {
    render(<CharacterStats stats={mockStats} />);
  });

  test('displays stats section title', () => {
    render(<CharacterStats stats={mockStats} />);
    
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });

  test('displays hit points with current/max values', () => {
    render(<CharacterStats stats={mockStats} />);
    
    expect(screen.getByText('Hit Points')).toBeInTheDocument();
    expect(screen.getByText('15 / 20')).toBeInTheDocument();
  });

  test('displays fatigue with current/max values', () => {
    render(<CharacterStats stats={mockStats} />);
    
    expect(screen.getByText('Fatigue')).toBeInTheDocument();
    expect(screen.getByText('2 / 10')).toBeInTheDocument();
  });

  test('displays exhaustion with current/max values', () => {
    render(<CharacterStats stats={mockStats} />);
    
    expect(screen.getByText('Exhaustion')).toBeInTheDocument();
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
  });

  test('displays surges with current/max values', () => {
    render(<CharacterStats stats={mockStats} />);
    
    expect(screen.getByText('Surges')).toBeInTheDocument();
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  test('handles null stats', () => {
    render(<CharacterStats stats={null} />);
    
    // Component returns null when no stats
    expect(screen.queryByText('Stats')).not.toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<CharacterStats stats={mockStats} />);
    
    expect(container.querySelector('.character-stats')).toBeInTheDocument();
    expect(container.querySelector('.stats-container')).toBeInTheDocument();
  });

  test('renders stat bars with proper structure', () => {
    const { container } = render(<CharacterStats stats={mockStats} />);
    
    const statBars = container.querySelectorAll('.stat-bar');
    expect(statBars).toHaveLength(4); // One for each stat
    
    const statFills = container.querySelectorAll('.stat-fill');
    expect(statFills).toHaveLength(4); // One fill for each bar
  });

  test('calculates correct percentage widths for stat bars', () => {
    const { container } = render(<CharacterStats stats={mockStats} />);
    
    const statFills = container.querySelectorAll('.stat-fill');
    
    // Hit Points: 15/20 = 75%
    expect(statFills[0]).toHaveStyle('width: 75%');
    
    // Fatigue: 2/10 = 20%
    expect(statFills[1]).toHaveStyle('width: 20%');
    
    // Exhaustion: 0/5 = 0%
    expect(statFills[2]).toHaveStyle('width: 0%');
    
    // Surges: 3/3 = 100%
    expect(statFills[3]).toHaveStyle('width: 100%');
  });
});