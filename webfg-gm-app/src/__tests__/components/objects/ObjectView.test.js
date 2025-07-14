import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ObjectView from '../../../components/objects/ObjectView';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

const mockObject = {
  objectId: '1',
  name: 'Magic Sword',
  objectCategory: 'WEAPON',
  description: 'A powerful enchanted weapon',
  weight: 3.5,
  size: 'MEDIUM',
  speed: 10,
  intensity: 15,
  attributes: [
    {
      attributeId: '1',
      name: 'Damage',
      attributeValue: 20
    }
  ]
};

const mockSelectedCharacter = {
  characterId: '1',
  name: 'Test Character'
};

const ObjectViewWrapper = ({ children }) => (
  <BrowserRouter>
    <MockedProvider mocks={[]} addTypename={false}>
      <SelectedCharacterProvider value={{ selectedCharacter: mockSelectedCharacter }}>
        {children}
      </SelectedCharacterProvider>
    </MockedProvider>
  </BrowserRouter>
);

describe('ObjectView Component', () => {
  test('renders without crashing', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
  });

  test('displays object name', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
  });

  test('displays object category', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('WEAPON')).toBeInTheDocument();
  });

  test('displays object description', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('A powerful enchanted weapon')).toBeInTheDocument();
  });

  test('displays object weight', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  test('displays object size', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  test('displays object speed', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('displays object intensity', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  test('displays object attributes', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Damage')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  test('displays edit button', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('displays delete button', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('displays add to character buttons when character is selected', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Add to Equipment')).toBeInTheDocument();
    expect(screen.getByText('Add to Ready')).toBeInTheDocument();
    expect(screen.getByText('Add to Stash')).toBeInTheDocument();
  });

  test('handles null object gracefully', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={null} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Object not found')).toBeInTheDocument();
  });

  test('handles object with missing attributes', () => {
    const incompleteObject = {
      objectId: '1',
      name: 'Simple Object'
    };
    
    render(
      <ObjectViewWrapper>
        <ObjectView object={incompleteObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Simple Object')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(container.querySelector('.object-view')).toBeInTheDocument();
  });

  test('handles object without attributes array', () => {
    const objectWithoutAttributes = {
      ...mockObject,
      attributes: null
    };
    
    render(
      <ObjectViewWrapper>
        <ObjectView object={objectWithoutAttributes} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
    expect(screen.getByText('No attributes')).toBeInTheDocument();
  });

  test('handles empty attributes array', () => {
    const objectWithEmptyAttributes = {
      ...mockObject,
      attributes: []
    };
    
    render(
      <ObjectViewWrapper>
        <ObjectView object={objectWithEmptyAttributes} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
    expect(screen.getByText('No attributes')).toBeInTheDocument();
  });
});