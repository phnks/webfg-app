import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ObjectView from '../../../components/objects/ObjectView';

// Mock all the complex dependencies to avoid GraphQL complexity
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ objectId: 'test-object-id' }),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ search: '' }),
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

jest.mock('../../../context/RecentlyViewedContext', () => ({
  useRecentlyViewed: () => ({
    recentlyViewed: [],
    addRecentlyViewed: jest.fn(),
    clearRecentlyViewed: jest.fn()
  })
}));

jest.mock('../../../components/forms/ObjectForm', () => {
  return function MockObjectForm() {
    return <div data-testid="object-form">Object Form</div>;
  };
});

jest.mock('../../../components/common/AttributeGroups', () => {
  return function MockAttributeGroups({ attributes, renderAttribute, title }) {
    const attributeKeys = ['weight', 'size', 'speed', 'intensity'];
    return (
      <div data-testid="attribute-groups">
        <h3>{title}</h3>
        {attributeKeys.map((key) => {
          const attribute = attributes?.[key];
          if (!attribute) return null;
          
          if (renderAttribute) {
            return (
              <div key={key}>
                {renderAttribute(key, attribute, key)}
              </div>
            );
          }
          
          return (
            <div key={key}>
              {key}: {attribute.attributeValue}
            </div>
          );
        })}
        {attributes?.attributes?.map((attr, index) => (
          <div key={index}>
            {renderAttribute ? renderAttribute(attr.name, attr, attr.name) : `${attr.name}: ${attr.attributeValue}`}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../../components/common/ErrorPopup', () => {
  return function MockErrorPopup() {
    return <div data-testid="error-popup">Error Popup</div>;
  };
});

jest.mock('../../../components/common/AttributeBreakdownPopup', () => {
  return function MockAttributeBreakdownPopup() {
    return <div data-testid="attribute-breakdown-popup">Attribute Breakdown Popup</div>;
  };
});

const mockObject = {
  objectId: '1',
  name: 'Magic Sword',
  objectCategory: 'WEAPON',
  description: 'A powerful enchanted weapon',
  weight: { attributeValue: 3.5, isGrouped: true },
  size: { attributeValue: 'MEDIUM', isGrouped: true },
  speed: { attributeValue: 10, isGrouped: true },
  intensity: { attributeValue: 15, isGrouped: true },
  attributes: [
    {
      attributeId: '1',
      name: 'Damage',
      attributeValue: 20
    }
  ]
};

const mockSelectedCharacter = {
  characterId: '1',
  name: 'Test Character'
};

const ObjectViewWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('ObjectView Component', () => {
  test('renders without crashing', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
  });

  test('displays object name', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
  });

  test('displays object category', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('WEAPON')).toBeInTheDocument();
  });

  test('displays object description', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('A powerful enchanted weapon')).toBeInTheDocument();
  });

  test('displays object weight', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  test('displays object size', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  test('displays object speed', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('displays object intensity', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  test('displays object attributes', () => {
    const { container } = render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    // Check that the attribute groups component is rendered
    expect(container.querySelector('[data-testid="attribute-groups"]')).toBeInTheDocument();
  });

  test('displays edit button', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('displays delete button', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('displays add to character buttons when character is selected', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    // Check that the add to stash button is rendered when character is selected
    expect(screen.getByText(/Add to.*Stash/)).toBeInTheDocument();
  });

  test('handles null object gracefully', () => {
    render(
      <ObjectViewWrapper>
        <ObjectView object={null} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Object not found')).toBeInTheDocument();
  });

  test('handles object with missing attributes', () => {
    const incompleteObject = {
      objectId: '1',
      name: 'Simple Object'
    };
    
    render(
      <ObjectViewWrapper>
        <ObjectView object={incompleteObject} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Simple Object')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <ObjectViewWrapper>
        <ObjectView object={mockObject} />
      </ObjectViewWrapper>
    );
    
    expect(container.querySelector('.object-view')).toBeInTheDocument();
  });

  test('handles object without attributes array', () => {
    const objectWithoutAttributes = {
      ...mockObject,
      attributes: null
    };
    
    render(
      <ObjectViewWrapper>
        <ObjectView object={objectWithoutAttributes} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
    // Check that the attribute groups component is still rendered
    expect(screen.getByTestId('attribute-groups')).toBeInTheDocument();
  });

  test('handles empty attributes array', () => {
    const objectWithEmptyAttributes = {
      ...mockObject,
      attributes: []
    };
    
    render(
      <ObjectViewWrapper>
        <ObjectView object={objectWithEmptyAttributes} />
      </ObjectViewWrapper>
    );
    
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
    // Check that the attribute groups component is still rendered
    expect(screen.getByTestId('attribute-groups')).toBeInTheDocument();
  });
});