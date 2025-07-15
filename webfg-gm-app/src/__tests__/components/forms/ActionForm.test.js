import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import ActionForm from '../../../components/forms/ActionForm';
import { CREATE_ACTION, UPDATE_ACTION, LIST_ACTIONS } from '../../../graphql/operations';

const mockListActions = {
  request: {
    query: LIST_ACTIONS,
    variables: {}
  },
  result: {
    data: {
      listActions: [
        {
          actionId: '1',
          name: 'Test Action',
          actionCategory: 'MOVE',
          sourceAttribute: 'SPEED',
          targetAttribute: 'SPEED',
          description: 'A test action',
          targetType: 'OBJECT',
          effectType: 'HELP',
          objectUsage: 'NONE',
          formula: 'CONTEST'
        }
      ]
    }
  }
};

const createActionMocks = [
  mockListActions,
  {
    request: {
      query: CREATE_ACTION,
      variables: {
        input: {
          name: 'Test Action',
          actionCategory: 'MOVE',
          sourceAttribute: 'SPEED',
          targetAttribute: 'SPEED',
          description: 'A test action',
          targetType: 'OBJECT',
          effectType: 'HELP',
          objectUsage: 'NONE',
          formula: 'CONTEST'
        }
      }
    },
    result: {
      data: {
        createAction: {
          actionId: '1',
          name: 'Test Action',
          actionCategory: 'MOVE',
          sourceAttribute: 'SPEED',
          targetAttribute: 'SPEED',
          description: 'A test action',
          targetType: 'OBJECT',
          effectType: 'HELP',
          objectUsage: 'NONE',
          formula: 'CONTEST',
          __typename: 'Action'
        }
      }
    }
  }
];

const ActionFormWrapper = ({ apolloMocks = createActionMocks, children }) => (
  <BrowserRouter>
    <MockedProvider mocks={apolloMocks} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
);

describe('ActionForm Component', () => {
  test('renders without crashing', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
  });

  test('displays form title for creating new action', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    expect(screen.getByText('Create Action')).toBeInTheDocument();
  });

  test('displays form title for editing existing action', () => {
    const existingAction = {
      actionId: '1',
      name: 'Existing Action',
      actionCategory: 'MOVE',
      sourceAttribute: 'SPEED',
      targetAttribute: 'SPEED',
      description: 'An existing action',
      targetType: 'OBJECT',
      effectType: 'HELP',
      objectUsage: 'NONE',
      formula: 'CONTEST'
    };
    
    render(
      <ActionFormWrapper>
        <ActionForm action={existingAction} isEditing={true} />
      </ActionFormWrapper>
    );
    
    expect(screen.getByText('Edit Action')).toBeInTheDocument();
  });

  test('displays name input field', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  test('displays description textarea', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  test('displays source attribute dropdown', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    expect(screen.getByLabelText('Source Attribute')).toBeInTheDocument();
  });

  test('displays target attribute dropdown', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    expect(screen.getByLabelText('Target Attribute')).toBeInTheDocument();
  });

  test('displays submit button', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  test('displays cancel button', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('fills form fields when editing existing action', () => {
    const existingAction = {
      actionId: '1',
      name: 'Existing Action',
      actionCategory: 'MOVE',
      sourceAttribute: 'SPEED',
      targetAttribute: 'SPEED',
      description: 'An existing action',
      targetType: 'OBJECT',
      effectType: 'HELP',
      objectUsage: 'NONE',
      formula: 'CONTEST'
    };
    
    render(
      <ActionFormWrapper>
        <ActionForm action={existingAction} isEditing={true} />
      </ActionFormWrapper>
    );
    
    expect(screen.getByDisplayValue('Existing Action')).toBeInTheDocument();
    expect(screen.getByDisplayValue('An existing action')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('SPEED')).toHaveLength(2);
    expect(screen.getByDisplayValue('MOVE')).toBeInTheDocument();
    expect(screen.getByDisplayValue('OBJECT')).toBeInTheDocument();
    expect(screen.getByDisplayValue('HELP')).toBeInTheDocument();
    expect(screen.getByDisplayValue('NONE')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CONTEST')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    const submitButton = screen.getByRole('button', { name: 'Create' });
    const nameInput = screen.getByLabelText('Name');
    
    // HTML5 validation will prevent submission
    expect(nameInput).toBeRequired();
    expect(submitButton).toBeInTheDocument();
  });

  test('updates name field value', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'New Action Name' } });
    
    expect(nameInput.value).toBe('New Action Name');
  });

  test('updates description field value', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    const descriptionTextarea = screen.getByLabelText('Description');
    fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });
    
    expect(descriptionTextarea.value).toBe('New description');
  });

  test('updates source attribute field value', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    const sourceAttributeSelect = screen.getByLabelText('Source Attribute');
    fireEvent.change(sourceAttributeSelect, { target: { value: 'DEXTERITY' } });
    
    expect(sourceAttributeSelect.value).toBe('DEXTERITY');
  });

  test('updates target attribute field value', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    const targetAttributeSelect = screen.getByLabelText('Target Attribute');
    fireEvent.change(targetAttributeSelect, { target: { value: 'AGILITY' } });
    
    expect(targetAttributeSelect.value).toBe('AGILITY');
  });

  test('submits form with valid data', async () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name');
    const descriptionTextarea = screen.getByLabelText('Description');
    const sourceAttributeSelect = screen.getByLabelText('Source Attribute');
    const targetAttributeSelect = screen.getByLabelText('Target Attribute');
    const submitButton = screen.getByRole('button', { name: 'Create' });
    
    fireEvent.change(nameInput, { target: { value: 'Test Action' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'A test action' } });
    fireEvent.change(sourceAttributeSelect, { target: { value: 'SPEED' } });
    fireEvent.change(targetAttributeSelect, { target: { value: 'SPEED' } });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  test('displays attribute options', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    // Check for some common attributes
    expect(screen.getAllByText('STRENGTH')).toHaveLength(2); // Source and target dropdowns
    expect(screen.getAllByText('DEXTERITY')).toHaveLength(2);
    expect(screen.getAllByText('AGILITY')).toHaveLength(2);
  });

  test('handles form submission errors', async () => {
    const errorMocks = [
      mockListActions,
      {
        request: {
          query: CREATE_ACTION,
          variables: {
            input: {
              name: 'Test Action',
              actionCategory: 'MOVE',
              sourceAttribute: 'STRENGTH',
              targetAttribute: 'STRENGTH',
              description: '',
              targetType: 'OBJECT',
              effectType: 'HELP',
              objectUsage: 'NONE',
              formula: 'CONTEST'
            }
          }
        },
        error: new Error('GraphQL error')
      }
    ];
    
    render(
      <ActionFormWrapper apolloMocks={errorMocks}>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name');
    const sourceAttributeSelect = screen.getByLabelText('Source Attribute');
    const targetAttributeSelect = screen.getByLabelText('Target Attribute');
    const submitButton = screen.getByRole('button', { name: 'Create' });
    
    fireEvent.change(nameInput, { target: { value: 'Test Action' } });
    fireEvent.change(sourceAttributeSelect, { target: { value: 'STRENGTH' } });
    fireEvent.change(targetAttributeSelect, { target: { value: 'STRENGTH' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // The error popup should display an error message
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    expect(container.querySelector('.form-container')).toBeInTheDocument();
  });
});