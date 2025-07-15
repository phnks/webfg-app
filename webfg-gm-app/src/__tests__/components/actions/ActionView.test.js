import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ActionView from '../../../components/actions/ActionView';

// Mock all the complex dependencies to avoid GraphQL complexity
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ actionId: 'test-action-id' }),
  useNavigate: () => jest.fn(),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>
}));

jest.mock('@apollo/client', () => ({
  useQuery: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn()
  }),
  useMutation: () => [jest.fn(), { loading: false }],
  useSubscription: () => ({ data: null, loading: false }),
  gql: jest.fn(() => ({}))
}));

jest.mock('../../../context/SelectedCharacterContext', () => ({
  useSelectedCharacter: () => ({
    selectedCharacter: {
      characterId: '1',
      name: 'Test Character'
    }
  })
}));

jest.mock('../../../components/forms/ActionForm', () => {
  return function MockActionForm() {
    return <div data-testid="action-form">Action Form</div>;
  };
});

jest.mock('../../../components/actions/test/ActionTestBackend', () => {
  return function MockActionTestBackend() {
    return <div data-testid="action-test-backend">Action Test Backend</div>;
  };
});

jest.mock('../../../components/common/ErrorPopup', () => {
  return function MockErrorPopup() {
    return <div data-testid="error-popup">Error Popup</div>;
  };
});

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
    {children}
  </BrowserRouter>
);

describe('ActionView Component', () => {
  test('renders without crashing', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
  });

  test('displays action name', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Sword Attack')).toBeInTheDocument();
  });

  test('displays action type', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('COMBAT')).toBeInTheDocument();
  });

  test('displays action description', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('A powerful sword strike')).toBeInTheDocument();
  });

  test('displays action difficulty', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('displays action damage', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('2d6+3')).toBeInTheDocument();
  });

  test('displays action range', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('REACH')).toBeInTheDocument();
  });

  test('displays action duration', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('INSTANT')).toBeInTheDocument();
  });

  test('displays action requirements', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Must have a sword equipped')).toBeInTheDocument();
  });

  test('displays action effects', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Deals slashing damage')).toBeInTheDocument();
  });

  test('displays edit button', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('displays delete button', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('handles null action gracefully', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={null} />
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
        <ActionView actionProp={incompleteAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Simple Action')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
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
          actionProp={mockAction} 
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
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Difficulty:')).toBeInTheDocument();
  });

  test('displays action damage label', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Damage:')).toBeInTheDocument();
  });

  test('displays action range label', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Range:')).toBeInTheDocument();
  });

  test('displays action duration label', () => {
    render(
      <ActionViewWrapper>
        <ActionView actionProp={mockAction} />
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
        <ActionView actionProp={actionWithUndefined} />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });
});