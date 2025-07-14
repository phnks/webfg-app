import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import VirtualTableTop from '../../../components/encounters/VirtualTableTop';

const mockEncounter = {
  encounterId: '1',
  name: 'Test Encounter',
  description: 'A test encounter',
  round: 1,
  initiative: 10,
  characters: [
    {
      characterId: '1',
      name: 'Hero',
      position: { x: 5, y: 5 }
    },
    {
      characterId: '2',
      name: 'Villain',
      position: { x: 10, y: 10 }
    }
  ],
  objects: [
    {
      objectId: '1',
      name: 'Rock',
      position: { x: 3, y: 3 }
    }
  ],
  terrain: [
    {
      terrainId: '1',
      name: 'Wall',
      position: { x: 8, y: 8 }
    }
  ]
};

const VirtualTableTopWrapper = ({ children }) => (
  <MockedProvider mocks={[]} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('VirtualTableTop Component', () => {
  test('renders without crashing', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
  });

  test('displays VTT title', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getByText('Virtual Table Top')).toBeInTheDocument();
  });

  test('displays encounter name', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getByText('Test Encounter')).toBeInTheDocument();
  });

  test('displays current round', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getByText('Round: 1')).toBeInTheDocument();
  });

  test('displays grid canvas', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    const canvas = screen.getByRole('img'); // Canvas has img role in testing
    expect(canvas).toBeInTheDocument();
  });

  test('displays character list', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('Villain')).toBeInTheDocument();
  });

  test('displays character positions', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getByText('(5, 5)')).toBeInTheDocument();
    expect(screen.getByText('(10, 10)')).toBeInTheDocument();
  });

  test('displays objects list', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getByText('Objects')).toBeInTheDocument();
    expect(screen.getByText('Rock')).toBeInTheDocument();
    expect(screen.getByText('(3, 3)')).toBeInTheDocument();
  });

  test('displays terrain list', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getByText('Terrain')).toBeInTheDocument();
    expect(screen.getByText('Wall')).toBeInTheDocument();
    expect(screen.getByText('(8, 8)')).toBeInTheDocument();
  });

  test('handles encounter without data', () => {
    const emptyEncounter = {
      encounterId: '1',
      name: 'Empty Encounter',
      characters: [],
      objects: [],
      terrain: []
    };
    
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={emptyEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getByText('Empty Encounter')).toBeInTheDocument();
    expect(screen.getByText('No characters')).toBeInTheDocument();
    expect(screen.getByText('No objects')).toBeInTheDocument();
    expect(screen.getByText('No terrain')).toBeInTheDocument();
  });

  test('handles null encounter', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={null} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getByText('No encounter loaded')).toBeInTheDocument();
  });

  test('displays grid controls', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getByText('Grid Size:')).toBeInTheDocument();
    expect(screen.getByText('Zoom:')).toBeInTheDocument();
  });

  test('handles grid size change', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    const gridSizeInput = screen.getByDisplayValue('30'); // Default grid size
    fireEvent.change(gridSizeInput, { target: { value: '40' } });
    
    expect(gridSizeInput.value).toBe('40');
  });

  test('handles zoom change', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    const zoomInput = screen.getByDisplayValue('1'); // Default zoom
    fireEvent.change(zoomInput, { target: { value: '1.5' } });
    
    expect(zoomInput.value).toBe('1.5');
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(container.querySelector('.virtual-table-top')).toBeInTheDocument();
    expect(container.querySelector('.vtt-grid')).toBeInTheDocument();
    expect(container.querySelector('.vtt-sidebar')).toBeInTheDocument();
  });

  test('displays move character buttons', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    expect(screen.getAllByText('Move')).toHaveLength(2); // One for each character
  });

  test('enables movement mode when Move is clicked', () => {
    render(
      <VirtualTableTopWrapper>
        <VirtualTableTop encounter={mockEncounter} />
      </VirtualTableTopWrapper>
    );
    
    const moveButtons = screen.getAllByText('Move');
    fireEvent.click(moveButtons[0]);
    
    expect(screen.getByText('Click on grid to move Hero')).toBeInTheDocument();
  });
});