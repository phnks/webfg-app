import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ObjectList from '../../../components/objects/ObjectList';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({
    children,
    to
  }) => /*#__PURE__*/React.createElement("a", {
    href: to
  }, children)
}));

// Mock Apollo Client
jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => [jest.fn(), {
    loading: false
  }]),
  gql: jest.fn()
}));

// Mock components
jest.mock('../../../components/common/SearchFilterSort', () => {
  return function MockSearchFilterSort() {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "search-filter-sort"
    }, /*#__PURE__*/React.createElement("input", {
      className: "search-input",
      type: "text"
    }));
  };
});
jest.mock('../../../components/common/PaginationControls', () => {
  return function MockPaginationControls() {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "pagination-controls"
    }, "Pagination Controls");
  };
});
jest.mock('../../../components/common/ErrorPopup', () => {
  return function MockErrorPopup() {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "error-popup"
    }, "Error Popup");
  };
});
const {
  useQuery,
  useMutation
} = require('@apollo/client');
const mockObjects = [{
  objectId: '1',
  name: 'Sword',
  objectCategory: 'WEAPON',
  description: 'A sharp blade',
  weight: 3.0,
  size: 'MEDIUM'
}, {
  objectId: '2',
  name: 'Shield',
  objectCategory: 'ARMOR',
  description: 'Defensive equipment',
  weight: 5.0,
  size: 'LARGE'
}];
const ObjectListWrapper = ({
  children
}) => /*#__PURE__*/React.createElement(SelectedCharacterProvider, null, children);
describe('ObjectList Component', () => {
  beforeAll(() => {
    // Mock console to avoid test output noise
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });
  test('renders without crashing', () => {
    useQuery.mockReturnValue({
      data: null,
      loading: true,
      error: null
    });
    useMutation.mockReturnValue([jest.fn(), {
      loading: false
    }]);
    render(/*#__PURE__*/React.createElement(ObjectListWrapper, null, /*#__PURE__*/React.createElement(ObjectList, null)));
  });
  test('displays loading state initially', () => {
    useQuery.mockReturnValue({
      data: null,
      loading: true,
      error: null
    });
    useMutation.mockReturnValue([jest.fn(), {
      loading: false
    }]);
    render(/*#__PURE__*/React.createElement(ObjectListWrapper, null, /*#__PURE__*/React.createElement(ObjectList, null)));
    expect(screen.getByText('Loading objects...')).toBeInTheDocument();
  });
  test('displays objects after loading', async () => {
    useQuery.mockReturnValue({
      data: {
        listObjectsEnhanced: {
          items: mockObjects,
          nextCursor: null,
          hasNextPage: false,
          totalCount: 2
        }
      },
      loading: false,
      error: null
    });
    useMutation.mockReturnValue([jest.fn(), {
      loading: false
    }]);
    render(/*#__PURE__*/React.createElement(ObjectListWrapper, null, /*#__PURE__*/React.createElement(ObjectList, null)));
    await waitFor(() => {
      expect(screen.getByText('Sword')).toBeInTheDocument();
      expect(screen.getByText('Shield')).toBeInTheDocument();
    });
  });
  test('displays object details', async () => {
    useQuery.mockReturnValue({
      data: {
        listObjectsEnhanced: {
          items: mockObjects,
          nextCursor: null,
          hasNextPage: false,
          totalCount: 2
        }
      },
      loading: false,
      error: null
    });
    useMutation.mockReturnValue([jest.fn(), {
      loading: false
    }]);
    render(/*#__PURE__*/React.createElement(ObjectListWrapper, null, /*#__PURE__*/React.createElement(ObjectList, null)));
    await waitFor(() => {
      expect(screen.getByText('WEAPON')).toBeInTheDocument();
      expect(screen.getByText('ARMOR')).toBeInTheDocument();
      // Note: ObjectList component shows descriptions only in grid view, not table view
      // So we check for other properties that are displayed in table view
      expect(screen.getByText('Sword')).toBeInTheDocument();
      expect(screen.getByText('Shield')).toBeInTheDocument();
    });
  });
  test('renders search filter sort component', async () => {
    useQuery.mockReturnValue({
      data: {
        listObjectsEnhanced: {
          items: mockObjects,
          nextCursor: null,
          hasNextPage: false,
          totalCount: 2
        }
      },
      loading: false,
      error: null
    });
    useMutation.mockReturnValue([jest.fn(), {
      loading: false
    }]);
    render(/*#__PURE__*/React.createElement(ObjectListWrapper, null, /*#__PURE__*/React.createElement(ObjectList, null)));

    // Wait for component to render with data
    await waitFor(() => {
      expect(screen.getByText('Sword')).toBeInTheDocument();
    });
    expect(screen.getByTestId('search-filter-sort')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
  test('handles empty object list', async () => {
    useQuery.mockReturnValue({
      data: {
        listObjectsEnhanced: {
          items: [],
          nextCursor: null,
          hasNextPage: false,
          totalCount: 0
        }
      },
      loading: false,
      error: null
    });
    useMutation.mockReturnValue([jest.fn(), {
      loading: false
    }]);
    render(/*#__PURE__*/React.createElement(ObjectListWrapper, null, /*#__PURE__*/React.createElement(ObjectList, null)));
    await waitFor(() => {
      expect(screen.queryByText('Sword')).not.toBeInTheDocument();
    });
  });
  test('handles query error', async () => {
    useQuery.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Network error')
    });
    useMutation.mockReturnValue([jest.fn(), {
      loading: false
    }]);
    render(/*#__PURE__*/React.createElement(ObjectListWrapper, null, /*#__PURE__*/React.createElement(ObjectList, null)));
    await waitFor(() => {
      expect(screen.getByText('Error loading objects: Network error')).toBeInTheDocument();
    });
  });
  test('applies correct CSS classes', async () => {
    useQuery.mockReturnValue({
      data: {
        listObjectsEnhanced: {
          items: mockObjects,
          nextCursor: null,
          hasNextPage: false,
          totalCount: 2
        }
      },
      loading: false,
      error: null
    });
    useMutation.mockReturnValue([jest.fn(), {
      loading: false
    }]);
    const {
      container
    } = render(/*#__PURE__*/React.createElement(ObjectListWrapper, null, /*#__PURE__*/React.createElement(ObjectList, null)));

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Sword')).toBeInTheDocument();
    });

    // Check for CSS classes that should exist
    expect(container.querySelector('.object-list') || container.querySelector('.object-page')).toBeInTheDocument();
  });
  test('handles search functionality', async () => {
    useQuery.mockReturnValue({
      data: {
        listObjectsEnhanced: {
          items: mockObjects,
          nextCursor: null,
          hasNextPage: false,
          totalCount: 2
        }
      },
      loading: false,
      error: null
    });
    useMutation.mockReturnValue([jest.fn(), {
      loading: false
    }]);
    render(/*#__PURE__*/React.createElement(ObjectListWrapper, null, /*#__PURE__*/React.createElement(ObjectList, null)));

    // Wait for component to render with data
    await waitFor(() => {
      expect(screen.getByText('Sword')).toBeInTheDocument();
    });
    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, {
      target: {
        value: 'sword'
      }
    });
    expect(searchInput.value).toBe('sword');
  });
});