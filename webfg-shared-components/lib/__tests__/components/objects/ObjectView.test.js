import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ObjectView from '../../../components/objects/ObjectView';

// Mock all the complex dependencies to avoid GraphQL complexity
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    objectId: 'test-object-id'
  }),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    search: ''
  }),
  Link: ({
    children,
    ...props
  }) => /*#__PURE__*/React.createElement("a", props, children)
}));
jest.mock('@apollo/client', () => ({
  useQuery: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn()
  }),
  useMutation: () => [jest.fn(), {
    loading: false
  }],
  useSubscription: () => ({
    data: null,
    loading: false
  }),
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
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "object-form"
    }, "Object Form");
  };
});
jest.mock('../../../components/common/AttributeGroups', () => {
  return function MockAttributeGroups({
    attributes,
    renderAttribute,
    title
  }) {
    const attributeKeys = ['weight', 'size', 'speed'];
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "attribute-groups"
    }, /*#__PURE__*/React.createElement("h3", null, title), attributeKeys.map(key => {
      const attribute = attributes?.[key];
      if (!attribute) return null;
      if (renderAttribute) {
        return /*#__PURE__*/React.createElement("div", {
          key: key
        }, renderAttribute(key, attribute, key));
      }
      return /*#__PURE__*/React.createElement("div", {
        key: key
      }, key, ": ", attribute.attributeValue);
    }), attributes?.attributes?.map((attr, index) => /*#__PURE__*/React.createElement("div", {
      key: index
    }, renderAttribute ? renderAttribute(attr.name, attr, attr.name) : `${attr.name}: ${attr.attributeValue}`)));
  };
});
jest.mock('../../../components/common/ErrorPopup', () => {
  return function MockErrorPopup() {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "error-popup"
    }, "Error Popup");
  };
});
jest.mock('../../../components/common/AttributeBreakdownPopup', () => {
  return function MockAttributeBreakdownPopup() {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "attribute-breakdown-popup"
    }, "Attribute Breakdown Popup");
  };
});
const mockObject = {
  objectId: '1',
  name: 'Magic Sword',
  objectCategory: 'WEAPON',
  description: 'A powerful enchanted weapon',
  weight: {
    attributeValue: 3.5,
    isGrouped: true
  },
  size: {
    attributeValue: 'MEDIUM',
    isGrouped: true
  },
  speed: {
    attributeValue: 10,
    isGrouped: true
  },
  attributes: [{
    attributeId: '1',
    name: 'Damage',
    attributeValue: 20
  }]
};
const mockSelectedCharacter = {
  characterId: '1',
  name: 'Test Character'
};
const ObjectViewWrapper = ({
  children
}) => /*#__PURE__*/React.createElement(BrowserRouter, null, children);
describe('ObjectView Component', () => {
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));
  });
  test('displays object name', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
  });
  test('displays object category', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));
    expect(screen.getByText('WEAPON')).toBeInTheDocument();
  });
  test('displays object description', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));
    expect(screen.getByText('A powerful enchanted weapon')).toBeInTheDocument();
  });
  test('displays object weight', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });
  test('displays object size', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });
  test('displays object speed', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));
    expect(screen.getByText('10')).toBeInTheDocument();
  });
  test('displays object attributes', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));

    // Check that the attribute groups component is rendered
    expect(container.querySelector('[data-testid="attribute-groups"]')).toBeInTheDocument();
  });
  test('displays edit button', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });
  test('displays delete button', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
  test('displays add to character buttons when character is selected', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));

    // Check that the add to stash button is rendered when character is selected
    expect(screen.getByText(/Add to.*Stash/)).toBeInTheDocument();
  });
  test('handles null object gracefully', () => {
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: null
    })));
    expect(screen.getByText('Object not found')).toBeInTheDocument();
  });
  test('handles object with missing attributes', () => {
    const incompleteObject = {
      objectId: '1',
      name: 'Simple Object'
    };
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: incompleteObject
    })));
    expect(screen.getByText('Simple Object')).toBeInTheDocument();
  });
  test('applies correct CSS classes', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: mockObject
    })));
    expect(container.querySelector('.object-view')).toBeInTheDocument();
  });
  test('handles object without attributes array', () => {
    const objectWithoutAttributes = {
      ...mockObject,
      attributes: null
    };
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: objectWithoutAttributes
    })));
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
    // Check that the attribute groups component is still rendered
    expect(screen.getByTestId('attribute-groups')).toBeInTheDocument();
  });
  test('handles empty attributes array', () => {
    const objectWithEmptyAttributes = {
      ...mockObject,
      attributes: []
    };
    render(/*#__PURE__*/React.createElement(ObjectViewWrapper, null, /*#__PURE__*/React.createElement(ObjectView, {
      object: objectWithEmptyAttributes
    })));
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
    // Check that the attribute groups component is still rendered
    expect(screen.getByTestId('attribute-groups')).toBeInTheDocument();
  });
});