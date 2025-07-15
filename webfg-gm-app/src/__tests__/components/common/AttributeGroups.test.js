import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttributeGroups, { ATTRIBUTE_GROUPS } from '../../../components/common/AttributeGroups';

const mockAttributes = {
  strength: { attribute: { attributeValue: 12, isGrouped: false } },
  dexterity: { attribute: { attributeValue: 14, isGrouped: false } },
  intelligence: { attribute: { attributeValue: 10, isGrouped: false } },
  will: { attribute: { attributeValue: 8, isGrouped: false } }
};

const mockOnAttributeChange = jest.fn();

describe('AttributeGroups Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
      />
    );
  });

  test('displays attribute group sections', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    expect(screen.getByText('Physical Attributes')).toBeInTheDocument();
    expect(screen.getByText('Mental Attributes')).toBeInTheDocument();
  });

  test('displays attribute names', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Dexterity')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Will')).toBeInTheDocument();
  });

  test('displays attribute values', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(screen.getByDisplayValue('14')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();
  });

  test('handles attribute value changes', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    const strengthInput = screen.getByDisplayValue('12');
    fireEvent.change(strengthInput, { target: { value: '15' } });
    
    expect(mockOnAttributeChange).toHaveBeenCalledWith('strength', {
      attribute: { attributeValue: 15, isGrouped: false }
    });
  });

  test('handles missing attributes gracefully', () => {
    render(
      <AttributeGroups 
        attributes={{}}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    expect(screen.getByText('Physical Attributes')).toBeInTheDocument();
    expect(screen.getByText('Mental Attributes')).toBeInTheDocument();
  });

  test('handles null attributes', () => {
    render(
      <AttributeGroups 
        attributes={null}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    expect(screen.getByText('Physical Attributes')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    expect(container.querySelector('.attribute-groups')).toBeInTheDocument();
    expect(container.querySelector('.attribute-group')).toBeInTheDocument();
  });

  test('displays all defined attribute groups', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    // Should display all groups defined in ATTRIBUTE_GROUPS
    Object.keys(ATTRIBUTE_GROUPS).forEach(groupName => {
      expect(screen.getByText(ATTRIBUTE_GROUPS[groupName].label)).toBeInTheDocument();
    });
  });

  test('handles grouped attributes', () => {
    const groupedAttributes = {
      strength: { attribute: { attributeValue: 12, isGrouped: true } },
      dexterity: { attribute: { attributeValue: 14, isGrouped: true } }
    };
    
    render(
      <AttributeGroups 
        attributes={groupedAttributes}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(screen.getByDisplayValue('14')).toBeInTheDocument();
  });

  test('handles readonly mode', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
        readonly={true}
      />
    );
    
    const strengthInput = screen.getByDisplayValue('12');
    expect(strengthInput).toBeDisabled();
  });

  test('validates numeric input', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    const strengthInput = screen.getByDisplayValue('12');
    fireEvent.change(strengthInput, { target: { value: 'invalid' } });
    
    // Should not call onChange with invalid value
    expect(mockOnAttributeChange).not.toHaveBeenCalled();
  });

  test('displays attribute labels correctly', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
      />
    );
    
    // Check that all attribute labels are present
    ATTRIBUTE_GROUPS.physical.attributes.forEach(attr => {
      expect(screen.getByText(attr.charAt(0).toUpperCase() + attr.slice(1))).toBeInTheDocument();
    });
  });

  test('handles attribute deletion', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        onAttributeChange={mockOnAttributeChange}
        allowDelete={true}
      />
    );
    
    // Should show delete buttons if allowDelete is true
    const deleteButtons = screen.getAllByText('×');
    expect(deleteButtons.length).toBeGreaterThan(0);
  });
});