import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThoughtAttributesModal from '../../../components/common/ThoughtAttributesModal';

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();

const mockMindThought = {
  thoughtId: 'test-thought-id',
  affinity: 5,
  knowledge: 8
};

describe('ThoughtAttributesModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders without crashing', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
    });

    test('displays modal title', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Thought Attributes')).toBeInTheDocument();
    });

    test('displays affinity label and input', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText('Affinity:')).toBeInTheDocument();
      const affinityInput = screen.getByLabelText('Affinity:');
      expect(affinityInput).toHaveAttribute('type', 'number');
      expect(affinityInput).toHaveValue(5);
    });

    test('displays knowledge label and input', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText('Knowledge:')).toBeInTheDocument();
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      expect(knowledgeInput).toHaveAttribute('type', 'number');
      expect(knowledgeInput).toHaveValue(8);
    });

    test('displays save and cancel buttons', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Initial Values', () => {
    test('initializes with provided affinity value', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      expect(affinityInput).toHaveValue(5);
    });

    test('initializes with provided knowledge value', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const knowledgeInput = screen.getByLabelText('Knowledge:');
      expect(knowledgeInput).toHaveValue(8);
    });

    test('handles zero values correctly', () => {
      const zeroValueThought = {
        thoughtId: 'test-thought-id', 
        affinity: 0,
        knowledge: 0
      };

      render(
        <ThoughtAttributesModal
          mindThought={zeroValueThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      
      expect(affinityInput).toHaveValue(0);
      expect(knowledgeInput).toHaveValue(0);
    });

    test('handles negative values correctly', () => {
      const negativeValueThought = {
        thoughtId: 'test-thought-id',
        affinity: -3,
        knowledge: -1
      };

      render(
        <ThoughtAttributesModal
          mindThought={negativeValueThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      
      expect(affinityInput).toHaveValue(-3);
      expect(knowledgeInput).toHaveValue(-1);
    });
  });

  describe('Input Interactions', () => {
    test('updates affinity value when input changes', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      fireEvent.change(affinityInput, { target: { value: '7' } });

      expect(affinityInput).toHaveValue(7);
    });

    test('updates knowledge value when input changes', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const knowledgeInput = screen.getByLabelText('Knowledge:');
      fireEvent.change(knowledgeInput, { target: { value: '3' } });

      expect(knowledgeInput).toHaveValue(3);
    });

    test('handles empty string input for affinity', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      fireEvent.change(affinityInput, { target: { value: '' } });

      expect(affinityInput).toHaveValue(null);
    });

    test('handles empty string input for knowledge', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const knowledgeInput = screen.getByLabelText('Knowledge:');
      fireEvent.change(knowledgeInput, { target: { value: '' } });

      expect(knowledgeInput).toHaveValue(null);
    });

    test('handles decimal values in affinity input', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      fireEvent.change(affinityInput, { target: { value: '5.5' } });

      expect(affinityInput).toHaveValue(5.5);
    });

    test('handles decimal values in knowledge input', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const knowledgeInput = screen.getByLabelText('Knowledge:');
      fireEvent.change(knowledgeInput, { target: { value: '2.7' } });

      expect(knowledgeInput).toHaveValue(2.7);
    });
  });

  describe('Save Functionality', () => {
    test('calls onSave with correct parameters when save button is clicked', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith('test-thought-id', 5, 8);
    });

    test('calls onSave with updated values after input changes', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      
      fireEvent.change(affinityInput, { target: { value: '9' } });
      fireEvent.change(knowledgeInput, { target: { value: '2' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith('test-thought-id', 9, 2);
    });

    test('parses string values to integers when saving', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      
      fireEvent.change(affinityInput, { target: { value: '10' } });
      fireEvent.change(knowledgeInput, { target: { value: '7' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith('test-thought-id', 10, 7);
      expect(typeof mockOnSave.mock.calls[0][1]).toBe('number');
      expect(typeof mockOnSave.mock.calls[0][2]).toBe('number');
    });

    test('handles decimal values by parsing to integers', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      
      fireEvent.change(affinityInput, { target: { value: '5.9' } });
      fireEvent.change(knowledgeInput, { target: { value: '3.2' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // parseInt should truncate decimals
      expect(mockOnSave).toHaveBeenCalledWith('test-thought-id', 5, 3);
    });

    test('handles empty values when saving', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      
      fireEvent.change(affinityInput, { target: { value: '' } });
      fireEvent.change(knowledgeInput, { target: { value: '' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // parseInt('') returns NaN, but the component passes it through
      expect(mockOnSave).toHaveBeenCalledWith('test-thought-id', NaN, NaN);
    });

    test('saves with zero values correctly', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      
      fireEvent.change(affinityInput, { target: { value: '0' } });
      fireEvent.change(knowledgeInput, { target: { value: '0' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith('test-thought-id', 0, 0);
    });

    test('saves with negative values correctly', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      
      fireEvent.change(affinityInput, { target: { value: '-2' } });
      fireEvent.change(knowledgeInput, { target: { value: '-5' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith('test-thought-id', -2, -5);
    });
  });

  describe('Cancel Functionality', () => {
    test('calls onCancel when cancel button is clicked', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('does not call onSave when cancel is clicked', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('CSS Classes and Structure', () => {
    test('applies correct CSS classes to modal overlay', () => {
      const { container } = render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(container.querySelector('.modal-overlay')).toBeInTheDocument();
    });

    test('applies correct CSS classes to modal content', () => {
      const { container } = render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(container.querySelector('.modal-content')).toBeInTheDocument();
    });

    test('applies correct CSS classes to form groups', () => {
      const { container } = render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const formGroups = container.querySelectorAll('.form-group');
      expect(formGroups).toHaveLength(2); // One for affinity, one for knowledge
    });

    test('applies correct CSS classes to inputs', () => {
      const { container } = render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const attributeInputs = container.querySelectorAll('.attribute-input');
      expect(attributeInputs).toHaveLength(2); // Affinity and knowledge inputs
    });

    test('applies correct CSS classes to modal actions', () => {
      const { container } = render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(container.querySelector('.modal-actions')).toBeInTheDocument();
    });

    test('applies correct CSS classes to buttons', () => {
      const { container } = render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(container.querySelector('.save-btn')).toBeInTheDocument();
      expect(container.querySelector('.cancel-btn')).toBeInTheDocument();
    });
  });

  describe('Input IDs and Labels', () => {
    test('affinity input has correct id and htmlFor relationship', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityLabel = screen.getByText('Affinity:');
      const affinityInput = screen.getByLabelText('Affinity:');
      
      expect(affinityLabel).toHaveAttribute('for', 'affinity');
      expect(affinityInput).toHaveAttribute('id', 'affinity');
    });

    test('knowledge input has correct id and htmlFor relationship', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const knowledgeLabel = screen.getByText('Knowledge:');
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      
      expect(knowledgeLabel).toHaveAttribute('for', 'knowledge');
      expect(knowledgeInput).toHaveAttribute('id', 'knowledge');
    });
  });

  describe('Accessibility', () => {
    test('inputs are properly labeled for screen readers', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      const knowledgeInput = screen.getByLabelText('Knowledge:');
      
      expect(affinityInput).toBeInTheDocument();
      expect(knowledgeInput).toBeInTheDocument();
    });

    test('buttons have appropriate text content', () => {
      render(
        <ThoughtAttributesModal
          mindThought={mockMindThought}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: 'Save' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      
      expect(saveButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    test('handles missing thoughtId gracefully', () => {
      const thoughtWithoutId = {
        affinity: 5,
        knowledge: 8
      };

      render(
        <ThoughtAttributesModal
          mindThought={thoughtWithoutId}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(undefined, 5, 8);
    });

    test('handles undefined affinity value', () => {
      const thoughtWithUndefinedAffinity = {
        thoughtId: 'test-thought-id',
        affinity: undefined,
        knowledge: 8
      };

      render(
        <ThoughtAttributesModal
          mindThought={thoughtWithUndefinedAffinity}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const affinityInput = screen.getByLabelText('Affinity:');
      expect(affinityInput).toHaveValue(null);
    });

    test('handles undefined knowledge value', () => {
      const thoughtWithUndefinedKnowledge = {
        thoughtId: 'test-thought-id',
        affinity: 5,
        knowledge: undefined
      };

      render(
        <ThoughtAttributesModal
          mindThought={thoughtWithUndefinedKnowledge}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const knowledgeInput = screen.getByLabelText('Knowledge:');
      expect(knowledgeInput).toHaveValue(null);
    });
  });
});