import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ActionView from '../../../components/actions/ActionView';

const mockAction = {
  actionId: '1',
  name: 'Sword Attack',
  type: 'COMBAT',
  description: 'A powerful sword strike',
  difficulty: 5,
  damage: '2d6+3',
  range: 'REACH',
  duration: 'INSTANT',
  requirements: 'Must have a sword equipped',
  effects: 'Deals slashing damage'
};

const ActionViewWrapper = ({ children }) => (
  <BrowserRouter>
    <MockedProvider mocks={[]} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
);

describe('ActionView Component', () => {
  test('renders without crashing', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
  });

  test('displays action name', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Sword Attack')).toBeInTheDocument();
  });

  test('displays action type', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('COMBAT')).toBeInTheDocument();
  });

  test('displays action description', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('A powerful sword strike')).toBeInTheDocument();
  });

  test('displays action difficulty', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('displays action damage', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('2d6+3')).toBeInTheDocument();
  });

  test('displays action range', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('REACH')).toBeInTheDocument();
  });

  test('displays action duration', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('INSTANT')).toBeInTheDocument();
  });

  test('displays action requirements', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Must have a sword equipped')).toBeInTheDocument();
  });

  test('displays action effects', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Deals slashing damage')).toBeInTheDocument();
  });

  test('displays edit button', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('displays delete button', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('handles null action gracefully', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={null} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Action not found')).toBeInTheDocument();
  });

  test('handles action with missing properties', () => {
    const incompleteAction = {
      actionId: '1',
      name: 'Simple Action'
    };
    
    render(
      <ActionViewWrapper>
        <ActionView action={incompleteAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Simple Action')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(container.querySelector('.action-view')).toBeInTheDocument();
  });

  test('handles click events on buttons', () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    
    render(
      <ActionViewWrapper>
        <ActionView 
          action={mockAction} 
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </ActionViewWrapper>
    );
    
    const editButton = screen.getByText('Edit');
    const deleteButton = screen.getByText('Delete');
    
    fireEvent.click(editButton);
    fireEvent.click(deleteButton);
    
    expect(mockOnEdit).toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalled();
  });

  test('displays action difficulty label', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Difficulty:')).toBeInTheDocument();
  });

  test('displays action damage label', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Damage:')).toBeInTheDocument();
  });

  test('displays action range label', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Range:')).toBeInTheDocument();
  });

  test('displays action duration label', () => {
    render(
      <ActionViewWrapper>
        <ActionView action={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Duration:')).toBeInTheDocument();
  });

  test('handles undefined properties gracefully', () => {
    const actionWithUndefined = {
      actionId: '1',
      name: 'Test Action',
      type: undefined,
      description: undefined
    };
    
    render(
      <ActionViewWrapper>
        <ActionView action={actionWithUndefined} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });
});