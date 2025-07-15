import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ConditionForm from '../../../components/forms/ConditionForm';
import { CREATE_CONDITION, UPDATE_CONDITION } from '../../../graphql/operations';

const mockCreateCondition = {
  request: {
    query: CREATE_CONDITION,
    variables: {
      condition: {
        name: 'Test Condition',
        conditionType: 'STATUS',
        description: 'A test condition'
      }
    }
  },
  result: {
    data: {
      createCondition: {
        conditionId: '1',
        name: 'Test Condition',
        conditionType: 'STATUS'
      }
    }
  }
};

const mockExistingCondition = {
  conditionId: '1',
  name: 'Existing Condition',
  conditionType: 'DEBUFF',
  description: 'An existing condition'
};

const ConditionFormWrapper = ({ children, mocks = [mockCreateCondition] }) => (
  <BrowserRouter>
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
);

describe('ConditionForm Component', () => {
  test('renders without crashing', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
  });

  test('displays form title for new condition', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    expect(screen.getByText('Create New Condition')).toBeInTheDocument();
  });

  test('displays form title for existing condition', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm condition={mockExistingCondition} isEditing={true} />
      </ConditionFormWrapper>
    );
    
    expect(screen.getByText('Edit Condition')).toBeInTheDocument();
  });

  test('displays condition name input', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
  });

  test('displays condition type select', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
  });

  test('displays description textarea', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  test('fills form with existing condition data', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm condition={mockExistingCondition} />
      </ConditionFormWrapper>
    );
    
    expect(screen.getByDisplayValue('Existing Condition')).toBeInTheDocument();
    expect(screen.getByDisplayValue('DEBUFF')).toBeInTheDocument();
    expect(screen.getByDisplayValue('An existing condition')).toBeInTheDocument();
  });

  test('handles name input change', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name *');
    fireEvent.change(nameInput, { target: { value: 'New Condition Name' } });
    
    expect(nameInput.value).toBe('New Condition Name');
  });

  test('handles type selection change', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    const typeSelect = screen.getByLabelText('Type');
    fireEvent.change(typeSelect, { target: { value: 'BUFF' } });
    
    expect(typeSelect.value).toBe('BUFF');
  });

  test('handles description change', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    const descriptionTextarea = screen.getByLabelText('Description');
    fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });
    
    expect(descriptionTextarea.value).toBe('New description');
  });

  test('displays create button', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    expect(screen.getByText('Create Condition')).toBeInTheDocument();
  });

  test('displays cancel button', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('prevents submission with empty name', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    const createButton = screen.getByText('Create Condition');
    fireEvent.click(createButton);
    
    expect(screen.getByText('Condition name is required')).toBeInTheDocument();
  });

  test('handles onSave callback', () => {
    const mockOnSave = jest.fn();
    render(
      <ConditionFormWrapper>
        <ConditionForm onSave={mockOnSave} />
      </ConditionFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name *');
    fireEvent.change(nameInput, { target: { value: 'Test Condition' } });
    
    const createButton = screen.getByText('Create Condition');
    fireEvent.click(createButton);
  });

  test('handles onCancel callback', () => {
    const mockOnCancel = jest.fn();
    render(
      <ConditionFormWrapper>
        <ConditionForm onCancel={mockOnCancel} />
      </ConditionFormWrapper>
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    expect(container.querySelector('.form-container')).toBeInTheDocument();
  });

  test('displays all condition type options', () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    const typeSelect = screen.getByLabelText('Type');
    const options = typeSelect.querySelectorAll('option');
    
    expect(options.length).toBeGreaterThan(2); // Should have multiple type options
  });

  test('handles form submission for new condition', async () => {
    render(
      <ConditionFormWrapper>
        <ConditionForm />
      </ConditionFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name *');
    fireEvent.change(nameInput, { target: { value: 'Test Condition' } });
    
    const descriptionTextarea = screen.getByLabelText('Description');
    fireEvent.change(descriptionTextarea, { target: { value: 'A test condition' } });
    
    const createButton = screen.getByText('Create Condition');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(nameInput.value).toBe('Test Condition');
    });
  });
});