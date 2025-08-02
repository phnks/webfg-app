import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ConditionForm from '../../../components/forms/ConditionForm';
import { CREATE_CONDITION, UPDATE_CONDITION } from '../../graphql/operations';
const mockCreateCondition = {
  request: {
    query: CREATE_CONDITION,
    variables: {
      input: {
        name: 'Test Condition',
        conditionCategory: 'PHYSICAL',
        conditionType: 'HELP',
        conditionTarget: 'SPEED',
        description: ''
      }
    }
  },
  result: {
    data: {
      createCondition: {
        conditionId: '1',
        name: 'Test Condition',
        conditionCategory: 'PHYSICAL',
        conditionType: 'HELP',
        conditionTarget: 'SPEED'
      }
    }
  }
};
const mockExistingCondition = {
  conditionId: '1',
  name: 'Existing Condition',
  conditionCategory: 'PHYSICAL',
  conditionType: 'HINDER',
  conditionTarget: 'SPEED',
  description: 'An existing condition'
};
const ConditionFormWrapper = ({
  children,
  mocks = [mockCreateCondition]
}) => /*#__PURE__*/React.createElement(BrowserRouter, null, /*#__PURE__*/React.createElement(MockedProvider, {
  mocks: mocks,
  addTypename: false
}, children));
describe('ConditionForm Component', () => {
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
  });
  test('displays form title for new condition', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    expect(screen.getByText('Create New Condition')).toBeInTheDocument();
  });
  test('displays form title for existing condition', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, {
      condition: mockExistingCondition,
      isEditing: true
    })));
    expect(screen.getByText('Edit Condition')).toBeInTheDocument();
  });
  test('displays condition name input', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
  });
  test('displays condition type select', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
  });
  test('displays description textarea', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });
  test('fills form with existing condition data', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, {
      condition: mockExistingCondition,
      isEditing: true
    })));
    expect(screen.getByDisplayValue('Existing Condition')).toBeInTheDocument();
    expect(screen.getByDisplayValue('HINDER')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PHYSICAL')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SPEED')).toBeInTheDocument();
    expect(screen.getByDisplayValue('An existing condition')).toBeInTheDocument();
  });
  test('handles name input change', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    const nameInput = screen.getByLabelText('Name *');
    fireEvent.change(nameInput, {
      target: {
        value: 'New Condition Name'
      }
    });
    expect(nameInput.value).toBe('New Condition Name');
  });
  test('handles type selection change', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    const typeSelect = screen.getByLabelText('Type');
    fireEvent.change(typeSelect, {
      target: {
        value: 'HINDER'
      }
    });
    expect(typeSelect.value).toBe('HINDER');
  });
  test('handles description change', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    const descriptionTextarea = screen.getByLabelText('Description');
    fireEvent.change(descriptionTextarea, {
      target: {
        value: 'New description'
      }
    });
    expect(descriptionTextarea.value).toBe('New description');
  });
  test('displays create button', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    expect(screen.getByText('Create Condition')).toBeInTheDocument();
  });
  test('displays cancel button', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
  test('prevents submission with empty name', async () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    const createButton = screen.getByText('Create Condition');
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(screen.getByText('Condition name is required')).toBeInTheDocument();
    });
  });
  test('handles onSuccess callback', () => {
    const mockOnSuccess = jest.fn();
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, {
      onSuccess: mockOnSuccess
    })));
    const nameInput = screen.getByLabelText('Name *');
    fireEvent.change(nameInput, {
      target: {
        value: 'Test Condition'
      }
    });
    const createButton = screen.getByText('Create Condition');
    fireEvent.click(createButton);
  });
  test('handles onClose callback', () => {
    const mockOnClose = jest.fn();
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, {
      onClose: mockOnClose
    })));
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
  test('applies correct CSS classes', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    expect(container.querySelector('.form-container')).toBeInTheDocument();
  });
  test('displays all condition type options', () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    const typeSelect = screen.getByLabelText('Type');
    const options = typeSelect.querySelectorAll('option');
    expect(options.length).toBe(2); // Should have HELP and HINDER options
  });
  test('handles form submission for new condition', async () => {
    render(/*#__PURE__*/React.createElement(ConditionFormWrapper, null, /*#__PURE__*/React.createElement(ConditionForm, null)));
    const nameInput = screen.getByLabelText('Name *');
    fireEvent.change(nameInput, {
      target: {
        value: 'Test Condition'
      }
    });
    const descriptionTextarea = screen.getByLabelText('Description');
    fireEvent.change(descriptionTextarea, {
      target: {
        value: 'A test condition'
      }
    });
    const createButton = screen.getByText('Create Condition');
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(nameInput.value).toBe('Test Condition');
    });
  });
});