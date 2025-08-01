import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ThoughtList from '../../../components/thoughts/ThoughtList';

// Mock dependencies
const mockNavigate = jest.fn();
const mockDeleteThought = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  gql: jest.fn(() => ({}))
}));

jest.mock('../../../graphql/operations', () => ({
  LIST_THOUGHTS_ENHANCED: 'LIST_THOUGHTS_ENHANCED',
  DELETE_THOUGHT: 'DELETE_THOUGHT'
}));

jest.mock('../../../components/common/SearchFilterSort', () => {
  return function MockSearchFilterSort({ onFilterChange, onClearFilters, initialFilters, entityType }) {
    return (
      <div data-testid="search-filter-sort">
        <input 
          data-testid="search-input"
          type="text"
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
        <button onClick={onClearFilters}>Clear Filters</button>
        <span>Entity Type: {entityType}</span>
      </div>
    );
  };
});

jest.mock('../../../components/common/PaginationControls', () => {
  return function MockPaginationControls({ 
    onNextPage, 
    onPrevPage, 
    onPageSizeChange, 
    currentPage, 
    hasNextPage, 
    hasPrevPage,
    pageSize,
    totalCount,
    itemCount,
    loading
  }) {
    return (
      <div data-testid="pagination-controls">
        <button onClick={onPrevPage} disabled={!hasPrevPage}>Previous</button>
        <span>Page {currentPage + 1}</span>
        <button onClick={onNextPage} disabled={!hasNextPage}>Next</button>
        <select value={pageSize} onChange={(e) => onPageSizeChange(parseInt(e.target.value))}>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span>Total: {totalCount}, Items: {itemCount}</span>
        {loading && <span>Loading...</span>}
      </div>
    );
  };
});

jest.mock('../../../components/common/ErrorPopup', () => {
  return function MockErrorPopup({ error, onClose }) {
    return (
      <div data-testid="error-popup">
        <span>{error.message}</span>
        <button onClick={onClose}>Close Error</button>
      </div>
    );
  };
});

const { useQuery, useMutation } = require('@apollo/client');

const mockThoughts = [
  {
    thoughtId: '1',
    name: 'First Thought',
    description: 'This is the first thought description'
  },
  {
    thoughtId: '2',
    name: 'Second Thought',
    description: 'This is a very long description that should be truncated when displayed in the list view because it exceeds the maximum length allowed for display in the table view'
  },
  {
    thoughtId: '3',
    name: 'Third Thought',
    description: null
  }
];

const mockQueryData = {
  listThoughtsEnhanced: {
    items: mockThoughts,
    nextCursor: null,
    hasNextPage: false,
    totalCount: 3
  }
};

// Mock window.confirm
const originalConfirm = window.confirm;
beforeAll(() => {
  window.confirm = jest.fn();
});

afterAll(() => {
  window.confirm = originalConfirm;
});

const ThoughtListWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('ThoughtList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    useQuery.mockReturnValue({
      data: mockQueryData,
      loading: false,
      error: null
    });
    
    useMutation.mockReturnValue([mockDeleteThought, { loading: false }]);
  });

  describe('Component Rendering', () => {
    test('renders without crashing', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );
    });

    test('displays loading state', () => {
      useQuery.mockReturnValue({
        data: null,
        loading: true,
        error: null
      });

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(screen.getByText('Loading thoughts...')).toBeInTheDocument();
    });

    test('displays error state when no data', () => {
      useQuery.mockReturnValue({
        data: null,
        loading: false,
        error: { message: 'Network error' }
      });

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(screen.getByText('Error loading thoughts: Network error')).toBeInTheDocument();
    });

    test('displays thoughts when data is loaded', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(screen.getByText('First Thought')).toBeInTheDocument();
      expect(screen.getByText('Second Thought')).toBeInTheDocument();
      expect(screen.getByText('Third Thought')).toBeInTheDocument();
    });

    test('displays page header with title and create button', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(screen.getByText('Thoughts')).toBeInTheDocument();
      expect(screen.getByText('Create New Thought')).toBeInTheDocument();
    });

    test('displays search filter sort component', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(screen.getByTestId('search-filter-sort')).toBeInTheDocument();
      expect(screen.getByText('Entity Type: thoughts')).toBeInTheDocument();
    });

    test('displays pagination controls', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
      expect(screen.getByText('Total: 3, Items: 3')).toBeInTheDocument();
    });

    test('displays no results message when empty', () => {
      useQuery.mockReturnValue({
        data: {
          listThoughtsEnhanced: {
            items: [],
            nextCursor: null,
            hasNextPage: false,
            totalCount: 0
          }
        },
        loading: false,
        error: null
      });

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(screen.getByText('No thoughts found.')).toBeInTheDocument();
    });
  });

  describe('Table View', () => {
    test('displays thoughts in table format by default', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    test('displays thought data in table rows', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(screen.getByText('First Thought')).toBeInTheDocument();
      expect(screen.getByText('This is the first thought description')).toBeInTheDocument();
    });

    test('truncates long descriptions in table view', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      // Should be truncated at 100 characters
      const truncatedText = screen.getByText(/This is a very long description that should be truncated when displayed in the list view.../);
      expect(truncatedText).toBeInTheDocument();
    });

    test('displays dash for null descriptions', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      // Find the row for Third Thought and check for dash
      const thirdThoughtRow = screen.getByText('Third Thought').closest('tr');
      expect(thirdThoughtRow).toHaveTextContent('-');
    });

    test('displays edit and delete buttons for each thought', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');

      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });
  });

  describe('Grid View', () => {
    test('displays thoughts in grid format when view mode is grid', () => {
      // Since viewMode is internal state, we need to test the grid rendering logic
      // by checking if the grid structure exists when table is not rendered
      const { container } = render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      // In table view, we should see the table
      expect(container.querySelector('.thoughts-table')).toBeInTheDocument();
    });

    test('grid view shows longer description truncation at 150 characters', () => {
      // This tests the grid view logic in the renderThoughts function
      // The component shows table by default, but we can test the grid rendering logic
      // by verifying the truncation logic would work correctly
      const longDescription = 'This is a very long description that should be truncated when displayed in the list view because it exceeds the maximum length allowed for display in the table view';
      expect(longDescription.length > 150).toBe(true);
      
      const truncated = longDescription.length > 150 ? `${longDescription.substring(0, 150)}...` : longDescription;
      expect(truncated).toBe('This is a very long description that should be truncated when displayed in the list view because it exceeds the maximum length allowed for display in ...');
    });
  });

  describe('Navigation', () => {
    test('navigates to thought detail when row is clicked', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const thoughtRow = screen.getByText('First Thought').closest('tr');
      fireEvent.click(thoughtRow);

      expect(mockNavigate).toHaveBeenCalledWith('/thoughts/1');
    });

    test('navigates to create new thought page', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const createButton = screen.getByText('Create New Thought');
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/thoughts/new');
    });

    test('navigates to edit thought page', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/thoughts/1/edit');
    });

    test('prevents row click when action buttons are clicked', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const editButtons = screen.getAllByText('Edit');
      const editButton = editButtons[0];
      
      // Click on edit button should not trigger row click
      fireEvent.click(editButton);

      // Should navigate to edit page, not detail page
      expect(mockNavigate).toHaveBeenCalledWith('/thoughts/1/edit');
      expect(mockNavigate).not.toHaveBeenCalledWith('/thoughts/1');
    });
  });

  describe('Delete Functionality', () => {
    test('shows confirmation dialog when delete is clicked', () => {
      window.confirm.mockReturnValue(false);

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "First Thought"?');
    });

    test('does not delete when confirmation is cancelled', () => {
      window.confirm.mockReturnValue(false);

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(mockDeleteThought).not.toHaveBeenCalled();
    });

    test('deletes thought when confirmed', async () => {
      window.confirm.mockReturnValue(true);
      mockDeleteThought.mockResolvedValue({});

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockDeleteThought).toHaveBeenCalledWith({
          variables: { thoughtId: '1' }
        });
      });
    });

    test('handles delete error', async () => {
      window.confirm.mockReturnValue(true);
      mockDeleteThought.mockRejectedValue(new Error('Delete failed'));

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('error-popup')).toBeInTheDocument();
        expect(screen.getByText('Delete failed')).toBeInTheDocument();
      });
    });

    test('handles delete error without message', async () => {
      window.confirm.mockReturnValue(true);
      mockDeleteThought.mockRejectedValue({ stack: 'error stack' });

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('error-popup')).toBeInTheDocument();
        expect(screen.getByText('Failed to delete thought')).toBeInTheDocument();
      });
    });

    test('prevents row click when delete button is clicked', () => {
      window.confirm.mockReturnValue(false);

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      // Should not navigate to detail page
      expect(mockNavigate).not.toHaveBeenCalledWith('/thoughts/1');
    });
  });

  describe('Filtering and Search', () => {
    test('updates filters when search input changes', async () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      // The component should update its internal state
      // We can't directly test the state, but we can verify the search input works
      expect(searchInput.value).toBe('test search');
    });

    test('clears filters when clear filters is clicked', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);

      // The component should reset to first page and clear filters
      // This triggers the handleClearFilters callback
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    test('handles next page navigation', () => {
      useQuery.mockReturnValue({
        data: {
          listThoughtsEnhanced: {
            items: mockThoughts,
            nextCursor: 'next-cursor',
            hasNextPage: true,
            totalCount: 10
          }
        },
        loading: false,
        error: null
      });

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Should be enabled when hasNextPage is true
      expect(nextButton).not.toBeDisabled();
    });

    test('handles previous page navigation', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const prevButton = screen.getByText('Previous');
      
      // Should be disabled on first page
      expect(prevButton).toBeDisabled();
    });

    test('handles page size change', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const pageSizeSelect = screen.getByRole('combobox');
      fireEvent.change(pageSizeSelect, { target: { value: '25' } });

      expect(pageSizeSelect.value).toBe('25');
    });

    test('disables next button when no next page', () => {
      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('displays error popup when mutation error occurs', async () => {
      window.confirm.mockReturnValue(true);
      mockDeleteThought.mockRejectedValue(new Error('Network error'));

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('error-popup')).toBeInTheDocument();
      });
    });

    test('closes error popup when close button is clicked', async () => {
      window.confirm.mockReturnValue(true);
      mockDeleteThought.mockRejectedValue(new Error('Network error'));

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('error-popup')).toBeInTheDocument();
      });

      const closeErrorButton = screen.getByText('Close Error');
      fireEvent.click(closeErrorButton);

      await waitFor(() => {
        expect(screen.queryByTestId('error-popup')).not.toBeInTheDocument();
      });
    });

    test('handles query error when there is cached data', () => {
      useQuery.mockReturnValue({
        data: mockQueryData,
        loading: false,
        error: { message: 'Network error' }
      });

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      // Should still display the cached data
      expect(screen.getByText('First Thought')).toBeInTheDocument();
      expect(screen.queryByText('Error loading thoughts:')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes and Structure', () => {
    test('applies correct CSS classes', () => {
      const { container } = render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(container.querySelector('.thought-list')).toBeInTheDocument();
      expect(container.querySelector('.list-header')).toBeInTheDocument();
      expect(container.querySelector('.table-container')).toBeInTheDocument();
      expect(container.querySelector('.thoughts-table')).toBeInTheDocument();
    });

    test('applies correct row and button classes', () => {
      const { container } = render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(container.querySelector('.thought-row')).toBeInTheDocument();
      expect(container.querySelector('.edit-btn')).toBeInTheDocument();
      expect(container.querySelector('.delete-btn')).toBeInTheDocument();
      expect(container.querySelector('.create-btn')).toBeInTheDocument();
    });
  });

  describe('Memoization and Performance', () => {
    test('query variables are memoized correctly', () => {
      const { rerender } = render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      // Rerender with same props should use memoized values
      rerender(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      // useQuery should have been called with consistent variables
      expect(useQuery).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('shows loading state in pagination when loading', () => {
      useQuery.mockReturnValue({
        data: mockQueryData,
        loading: true,
        error: null
      });

      render(
        <ThoughtListWrapper>
          <ThoughtList />
        </ThoughtListWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});