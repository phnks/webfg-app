import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterEquipment from '../../../components/characters/CharacterEquipment';

const mockEquipped = [
  {
    name: 'Sword',
    slot: 'RIGHT_HAND'
  },
  {
    name: 'Shield',
    slot: 'LEFT_HAND'
  },
  {
    name: 'Helmet',
    slot: 'HEAD'
  }
];

describe('CharacterEquipment Component', () => {
  test('renders without crashing', () => {
    render(<CharacterEquipment equipped={mockEquipped} />);
  });

  test('displays equipment section title', () => {
    render(<CharacterEquipment equipped={mockEquipped} />);
    
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  test('displays all equipment slots', () => {
    render(<CharacterEquipment equipped={mockEquipped} />);
    
    expect(screen.getByText('Head')).toBeInTheDocument();
    expect(screen.getByText('Torso')).toBeInTheDocument();
    expect(screen.getByText('Arms')).toBeInTheDocument();
    expect(screen.getByText('Legs')).toBeInTheDocument();
    expect(screen.getByText('Left Hand')).toBeInTheDocument();
    expect(screen.getByText('Right Hand')).toBeInTheDocument();
  });

  test('displays equipped items in correct slots', () => {
    render(<CharacterEquipment equipped={mockEquipped} />);
    
    expect(screen.getByText('Sword')).toBeInTheDocument();
    expect(screen.getByText('Shield')).toBeInTheDocument();
    expect(screen.getByText('Helmet')).toBeInTheDocument();
  });

  test('displays "Empty" for empty slots', () => {
    render(<CharacterEquipment equipped={mockEquipped} />);
    
    // Should show "Empty" for Torso, Arms, and Legs slots
    const emptySlots = screen.getAllByText('Empty');
    expect(emptySlots).toHaveLength(3);
  });

  test('handles null equipped prop', () => {
    const { container } = render(<CharacterEquipment equipped={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  test('handles undefined equipped prop', () => {
    const { container } = render(<CharacterEquipment />);
    
    expect(container.firstChild).toBeNull();
  });

  test('handles empty equipped array', () => {
    render(<CharacterEquipment equipped={[]} />);
    
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    
    // All slots should be empty
    const emptySlots = screen.getAllByText('Empty');
    expect(emptySlots).toHaveLength(6);
  });

  test('handles non-array equipped prop', () => {
    const { container } = render(<CharacterEquipment equipped="not-an-array" />);
    
    expect(container.firstChild).toBeNull();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<CharacterEquipment equipped={mockEquipped} />);
    
    expect(container.querySelector('.character-equipment')).toBeInTheDocument();
    expect(container.querySelector('.section')).toBeInTheDocument();
    expect(container.querySelector('.equipment-slots')).toBeInTheDocument();
    
    const slots = container.querySelectorAll('.equipment-slot');
    expect(slots).toHaveLength(6);
    
    const slotLabels = container.querySelectorAll('.slot-label');
    expect(slotLabels).toHaveLength(6);
    
    const slotItems = container.querySelectorAll('.slot-item');
    expect(slotItems).toHaveLength(6);
  });

  test('handles items without slot property', () => {
    const equipmentWithoutSlot = [
      { name: 'Sword' }, // No slot property
      { name: 'Shield', slot: 'LEFT_HAND' }
    ];
    
    render(<CharacterEquipment equipped={equipmentWithoutSlot} />);
    
    expect(screen.getByText('Shield')).toBeInTheDocument();
    // Sword should not appear anywhere since it has no slot
    expect(screen.queryByText('Sword')).not.toBeInTheDocument();
  });
});