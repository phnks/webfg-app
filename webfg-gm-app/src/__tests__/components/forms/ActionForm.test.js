import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import ActionForm from '../../../components/forms/ActionForm';
import { CREATE_ACTION, UPDATE_ACTION } from '../../../graphql/operations';

const createActionMocks = [
  {
    request: {
      query: CREATE_ACTION,
      variables: {
        input: {
          name: 'Test Action',
          description: 'A test action',
          sourceAttribute: 'STRENGTH',
          targetAttribute: 'DEFENSE'
        }
      }
    },
    result: {
      data: {
        createAction: {
          actionId: '1',
          name: 'Test Action',
          description: 'A test action',
          sourceAttribute: 'STRENGTH',
          targetAttribute: 'DEFENSE',
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
    
    expect(screen.getByText('Create New Action')).toBeInTheDocument();
  });

  test('displays form title for editing existing action', () => {
    const existingAction = {
      actionId: '1',
      name: 'Existing Action',
      description: 'An existing action',
      sourceAttribute: 'STRENGTH',
      targetAttribute: 'DEFENSE'
    };
    
    render(
      <ActionFormWrapper>
        <ActionForm action={existingAction} />
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
    
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
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
    
    expect(screen.getByRole('button', { name: 'Create Action' })).toBeInTheDocument();
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
      description: 'An existing action',
      sourceAttribute: 'STRENGTH',
      targetAttribute: 'DEFENSE'
    };
    
    render(
      <ActionFormWrapper>
        <ActionForm action={existingAction} />
      </ActionFormWrapper>
    );
    
    expect(screen.getByDisplayValue('Existing Action')).toBeInTheDocument();
    expect(screen.getByDisplayValue('An existing action')).toBeInTheDocument();
    expect(screen.getByDisplayValue('STRENGTH')).toBeInTheDocument();
    expect(screen.getByDisplayValue('DEFENSE')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    const submitButton = screen.getByRole('button', { name: 'Create Action' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  test('updates name field value', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name *');
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
    
    const nameInput = screen.getByLabelText('Name *');
    const descriptionTextarea = screen.getByLabelText('Description');
    const sourceAttributeSelect = screen.getByLabelText('Source Attribute');
    const targetAttributeSelect = screen.getByLabelText('Target Attribute');
    const submitButton = screen.getByRole('button', { name: 'Create Action' });
    
    fireEvent.change(nameInput, { target: { value: 'Test Action' } });
    fireEvent.change(descriptionTextarea, { target: { value: 'A test action' } });
    fireEvent.change(sourceAttributeSelect, { target: { value: 'STRENGTH' } });
    fireEvent.change(targetAttributeSelect, { target: { value: 'DEFENSE' } });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Creating action...')).toBeInTheDocument();
    });
  });

  test('displays attribute options', () => {
    render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    expect(screen.getByText('Select source attribute')).toBeInTheDocument();
    expect(screen.getByText('Select target attribute')).toBeInTheDocument();
    
    // Check for some common attributes
    expect(screen.getAllByText('Strength')).toHaveLength(2); // Source and target dropdowns
    expect(screen.getAllByText('Dexterity')).toHaveLength(2);
    expect(screen.getAllByText('Agility')).toHaveLength(2);
  });

  test('handles form submission errors', async () => {
    const errorMocks = [
      {
        request: {
          query: CREATE_ACTION,
          variables: {
            input: {
              name: 'Test Action',
              description: 'A test action',
              sourceAttribute: 'STRENGTH',
              targetAttribute: 'DEFENSE'
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
    
    const nameInput = screen.getByLabelText('Name *');
    const sourceAttributeSelect = screen.getByLabelText('Source Attribute');
    const targetAttributeSelect = screen.getByLabelText('Target Attribute');
    const submitButton = screen.getByRole('button', { name: 'Create Action' });
    
    fireEvent.change(nameInput, { target: { value: 'Test Action' } });
    fireEvent.change(sourceAttributeSelect, { target: { value: 'STRENGTH' } });
    fireEvent.change(targetAttributeSelect, { target: { value: 'DEFENSE' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error creating action')).toBeInTheDocument();
    });
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <ActionFormWrapper>
        <ActionForm />
      </ActionFormWrapper>
    );
    
    expect(container.querySelector('.action-form')).toBeInTheDocument();
  });
});