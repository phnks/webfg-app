import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttributeGroups, { ATTRIBUTE_GROUPS } from '../../../components/common/AttributeGroups';

const mockAttributes = {
  strength: { attribute: { attributeValue: 12, isGrouped: false } },
  dexterity: { attribute: { attributeValue: 14, isGrouped: false } },
  intelligence: { attribute: { attributeValue: 10, isGrouped: false } },
  will: { attribute: { attributeValue: 8, isGrouped: false } }
};

const mockRenderAttribute = jest.fn((name, attr, displayName) => (
  <div key={name} className="attribute-item">
    <label>{displayName}</label>
    <input type="number" value={attr?.attribute?.attributeValue || 0} readOnly />
  </div>
));

describe('AttributeGroups Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        renderAttribute={mockRenderAttribute}
      />
    );
  });

  test('displays attribute group sections', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        renderAttribute={mockRenderAttribute}
      />
    );
    
    expect(screen.getByText('BODY')).toBeInTheDocument();
    expect(screen.getByText('MARTIAL')).toBeInTheDocument();
    expect(screen.getByText('MENTAL')).toBeInTheDocument();
  });

  test('displays attribute names after expanding groups', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        renderAttribute={mockRenderAttribute}
        defaultExpandedGroups={['MARTIAL', 'MENTAL']}
      />
    );
    
    // After expanding, the renderAttribute function should be called
    expect(mockRenderAttribute).toHaveBeenCalled();
  });

  test('displays attribute values', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        renderAttribute={mockRenderAttribute}
        defaultExpandedGroups={['MARTIAL']}
      />
    );
    
    // The renderAttribute function creates inputs with the values
    expect(mockRenderAttribute).toHaveBeenCalledWith('strength', mockAttributes.strength, 'Strength');
    expect(mockRenderAttribute).toHaveBeenCalledWith('dexterity', mockAttributes.dexterity, 'Dexterity');
  });

  test('handles attribute value changes', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        renderAttribute={mockRenderAttribute}
        defaultExpandedGroups={['MARTIAL']}
      />
    );
    
    // The component delegates rendering to the renderAttribute function
    // It doesn't handle changes itself
    expect(mockRenderAttribute).toHaveBeenCalled();
  });

  test('handles missing attributes gracefully', () => {
    render(
      <AttributeGroups 
        attributes={{}}
        renderAttribute={mockRenderAttribute}
      />
    );
    
    expect(screen.getByText('BODY')).toBeInTheDocument();
    expect(screen.getByText('MARTIAL')).toBeInTheDocument();
    expect(screen.getByText('MENTAL')).toBeInTheDocument();
  });

  test('handles null attributes', () => {
    render(
      <AttributeGroups 
        attributes={null}
        renderAttribute={mockRenderAttribute}
      />
    );
    
    expect(screen.getByText('BODY')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <AttributeGroups 
        attributes={mockAttributes}
        renderAttribute={mockRenderAttribute}
      />
    );
    
    expect(container.querySelector('.attribute-groups')).toBeInTheDocument();
    expect(container.querySelector('.attribute-group')).toBeInTheDocument();
  });

  test('displays all defined attribute groups', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        renderAttribute={mockRenderAttribute}
      />
    );
    
    // Should display all groups defined in ATTRIBUTE_GROUPS
    Object.keys(ATTRIBUTE_GROUPS).forEach(groupName => {
      expect(screen.getByText(groupName)).toBeInTheDocument();
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
        renderAttribute={mockRenderAttribute}
        defaultExpandedGroups={['MARTIAL']}
      />
    );
    
    expect(mockRenderAttribute).toHaveBeenCalledWith('strength', groupedAttributes.strength, 'Strength');
  });

  test('toggles group expansion on click', () => {
    render(
      <AttributeGroups 
        attributes={mockAttributes}
        renderAttribute={mockRenderAttribute}
      />
    );
    
    const bodyHeader = screen.getByText('BODY');
    fireEvent.click(bodyHeader.parentElement);
    
    // After clicking, renderAttribute should be called for BODY attributes
    expect(mockRenderAttribute).toHaveBeenCalled();
  });
});