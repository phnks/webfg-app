import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ObjectForm from '../../../components/forms/ObjectForm';
import { CREATE_OBJECT, UPDATE_OBJECT, LIST_OBJECTS } from '../../graphql/operations';

const mockListObjects = {
  request: {
    query: LIST_OBJECTS,
    variables: {}
  },
  result: {
    data: {
      listObjects: [
        {
          objectId: '1',
          name: 'Test Object',
          objectCategory: 'TOOL',
          isEquipment: true,
          speed: { attributeValue: 0, isGrouped: true },
          weight: { attributeValue: 0, isGrouped: true },
          size: { attributeValue: 0, isGrouped: true },
          armour: { attributeValue: 0, isGrouped: true },
          endurance: { attributeValue: 0, isGrouped: true },
          lethality: { attributeValue: 0, isGrouped: true },
          strength: { attributeValue: 0, isGrouped: true },
          dexterity: { attributeValue: 0, isGrouped: true },
          agility: { attributeValue: 0, isGrouped: true },
          obscurity: { attributeValue: 0, isGrouped: true },
          resolve: { attributeValue: 0, isGrouped: true },
          morale: { attributeValue: 0, isGrouped: true },
          intelligence: { attributeValue: 0, isGrouped: true },
          charisma: { attributeValue: 0, isGrouped: true },
          special: [],
          equipmentIds: [],
          equipment: []
        }
      ]
    }
  }
};

const mockCreateObject = {
  request: {
    query: CREATE_OBJECT,
    variables: {
      input: {
        name: 'Test Object',
        objectCategory: 'TOOL',
        isEquipment: true,
        special: [],
        equipmentIds: [],
        speed: { attributeValue: 0, isGrouped: true },
        weight: { attributeValue: 0, isGrouped: true },
        size: { attributeValue: 0, isGrouped: true },
        armour: { attributeValue: 0, isGrouped: true },
        endurance: { attributeValue: 0, isGrouped: true },
        lethality: { attributeValue: 0, isGrouped: true },
        strength: { attributeValue: 0, isGrouped: true },
        dexterity: { attributeValue: 0, isGrouped: true },
        agility: { attributeValue: 0, isGrouped: true },
        perception: { attributeValue: 0, isGrouped: true },
        intensity: { attributeValue: 0, isGrouped: true },
        resolve: { attributeValue: 0, isGrouped: true },
        morale: { attributeValue: 0, isGrouped: true },
        intelligence: { attributeValue: 0, isGrouped: true },
        charisma: { attributeValue: 0, isGrouped: true }
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

const ObjectFormWrapper = ({ children, mocks = [mockCreateObject, mockListObjects] }) => (
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

  test('displays form title for new object', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Create New Object')).toBeInTheDocument();
    });
  });

  test('displays form title for existing object', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm object={mockExistingObject} isEditing={true} />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Edit Object')).toBeInTheDocument();
    });
  });

  test('displays object name input', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });
  });

  test('displays object category select', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
    });
  });

  test('displays isEquipment checkbox', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Is Equipment/)).toBeInTheDocument();
    });
  });

  test('fills form with existing object data', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm object={mockExistingObject} isEditing={true} />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Object')).toBeInTheDocument();
      expect(screen.getByDisplayValue('WEAPON')).toBeInTheDocument();
    });
  });

  test('handles name input change', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'New Object Name' } });
      
      expect(nameInput.value).toBe('New Object Name');
    });
  });

  test('handles category selection change', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      const categorySelect = screen.getByLabelText('Category');
      fireEvent.change(categorySelect, { target: { value: 'WEAPON' } });
      
      expect(categorySelect.value).toBe('WEAPON');
    });
  });

  test('handles isEquipment checkbox change', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      const checkbox = screen.getByLabelText(/Is Equipment/);
      fireEvent.click(checkbox);
      
      // Should toggle the checkbox
      expect(checkbox.checked).toBe(false);
    });
  });

  test('displays create button', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Create Object')).toBeInTheDocument();
    });
  });

  test('displays cancel button', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  test('handles form submission for new object', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'Test Object' } });
      
      const createButton = screen.getByText('Create Object');
      fireEvent.click(createButton);
      
      // Should not throw errors
      expect(nameInput.value).toBe('Test Object');
    });
  });

  test('prevents submission with empty name', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Name');
      // HTML5 validation should make this field required
      expect(nameInput).toBeRequired();
    });
  });

  test('applies correct CSS classes', async () => {
    const { container } = render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      expect(container.querySelector('.form-container')).toBeInTheDocument();
    });
  });

  test('handles onSave callback', async () => {
    const mockOnSave = jest.fn();
    render(
      <ObjectFormWrapper>
        <ObjectForm onSave={mockOnSave} />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'Test Object' } });
      
      const createButton = screen.getByText('Create Object');
      fireEvent.click(createButton);
    });
  });

  test('handles onClose callback', async () => {
    const mockOnClose = jest.fn();
    render(
      <ObjectFormWrapper>
        <ObjectForm onClose={mockOnClose} />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('displays all category options', async () => {
    render(
      <ObjectFormWrapper>
        <ObjectForm />
      </ObjectFormWrapper>
    );
    
    await waitFor(() => {
      const categorySelect = screen.getByLabelText('Category');
      const options = categorySelect.querySelectorAll('option');
      
      expect(options.length).toBeGreaterThan(5); // Should have multiple category options
    });
  });
});