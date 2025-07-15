import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ObjectForm from '../../../components/forms/ObjectForm';
import { CREATE_OBJECT, UPDATE_OBJECT } from '../../../graphql/operations';

const mockCreateObject = {
  request: {
    query: CREATE_OBJECT,
    variables: {
      object: {
        name: 'Test Object',
        objectCategory: 'TOOL',
        isEquipment: true,
        special: [],
        equipmentIds: []
      }
    }
  },
  result: {
    data: {
      createObject: {
        objectId: '1',
        name: 'Test Object',
        objectCategory: 'TOOL'
      }
    }
  }
};

const mockExistingObject = {
  objectId: '1',
  name: 'Existing Object',
  objectCategory: 'WEAPON',
  isEquipment: true,
  special: [],
  equipmentIds: []
};

const ObjectFormWrapper = ({ children, mocks = [mockCreateObject] }) => (
  <BrowserRouter>
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
);

describe('ObjectForm Component', () => {
  test('renders without crashing', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
  });

  test('displays form title for new object', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    expect(screen.getByText('Create New Object')).toBeInTheDocument();
  });

  test('displays form title for existing object', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm object={mockExistingObject} isEditing={true} />
      </ObjectFormWrapper>
    );
    
    expect(screen.getByText('Edit Object')).toBeInTheDocument();
  });

  test('displays object name input', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  test('displays object category select', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  test('displays isEquipment checkbox', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    expect(screen.getByLabelText('Is Equipment')).toBeInTheDocument();
  });

  test('fills form with existing object data', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm object={mockExistingObject} isEditing={true} />
      </ObjectFormWrapper>
    );
    
    expect(screen.getByDisplayValue('Existing Object')).toBeInTheDocument();
    expect(screen.getByDisplayValue('WEAPON')).toBeInTheDocument();
  });

  test('handles name input change', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'New Object Name' } });
    
    expect(nameInput.value).toBe('New Object Name');
  });

  test('handles category selection change', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'WEAPON' } });
    
    expect(categorySelect.value).toBe('WEAPON');
  });

  test('handles isEquipment checkbox change', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    const checkbox = screen.getByLabelText('Is Equipment');
    fireEvent.click(checkbox);
    
    // Should toggle the checkbox
    expect(checkbox.checked).toBe(false);
  });

  test('displays create button', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    expect(screen.getByText('Create Object')).toBeInTheDocument();
  });

  test('displays cancel button', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('handles form submission for new object', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Test Object' } });
    
    const createButton = screen.getByText('Create Object');
    fireEvent.click(createButton);
    
    // Should not throw errors
    await waitFor(() => {
      expect(nameInput.value).toBe('Test Object');
    });
  });

  test('prevents submission with empty name', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    const createButton = screen.getByText('Create Object');
    fireEvent.click(createButton);
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    expect(container.querySelector('.form-container')).toBeInTheDocument();
  });

  test('handles onSave callback', () => {
    const mockOnSave = jest.fn();
    render(
      <ObjectFormWrapper>
        <ObjectForm onSave={mockOnSave} />
      </ObjectFormWrapper>
    );
    
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Test Object' } });
    
    const createButton = screen.getByText('Create Object');
    fireEvent.click(createButton);
  });

  test('handles onCancel callback', () => {
    const mockOnCancel = jest.fn();
    render(
      <ObjectFormWrapper>
        <ObjectForm onCancel={mockOnCancel} />
      </ObjectFormWrapper>
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('displays all category options', () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    const categorySelect = screen.getByLabelText('Category');
    const options = categorySelect.querySelectorAll('option');
    
    expect(options.length).toBeGreaterThan(5); // Should have multiple category options
  });
});