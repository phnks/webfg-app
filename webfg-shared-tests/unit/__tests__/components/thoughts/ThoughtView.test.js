import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ThoughtView from '../../../components/thoughts/ThoughtView';

// Mock dependencies
const mockNavigate = jest.fn();
const mockAddRecentlyViewed = jest.fn();
const mockRefetch = jest.fn();
const mockDeleteThought = jest.fn();
const mockAddThoughtToCharacterMind = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    thoughtId: 'test-thought-id'
  }),
  useNavigate: () => mockNavigate
}));
jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  gql: jest.fn(() => ({}))
}));
jest.mock('../../graphql/operations', () => ({
  GET_THOUGHT: 'GET_THOUGHT',
  DELETE_THOUGHT: 'DELETE_THOUGHT',
  ADD_THOUGHT_TO_CHARACTER_MIND: 'ADD_THOUGHT_TO_CHARACTER_MIND'
}));
jest.mock('../../../context/RecentlyViewedContext', () => ({
  useRecentlyViewed: () => ({
    addRecentlyViewed: mockAddRecentlyViewed
  })
}));
jest.mock('../../../context/SelectedCharacterContext', () => ({
  useSelectedCharacter: jest.fn()
}));
jest.mock('../../../components/forms/ThoughtForm', () => {
  return function MockThoughtForm({
    onClose,
    onSuccess,
    thought,
    isEditing
  }) {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "thought-form"
    }, /*#__PURE__*/React.createElement("span", null, "Thought Form - Editing: ", isEditing ? 'true' : 'false'), /*#__PURE__*/React.createElement("button", {
      onClick: () => onClose()
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      onClick: () => onSuccess('test-thought-id')
    }, "Save"));
  };
});
jest.mock('../../../components/common/ErrorPopup', () => {
  return function MockErrorPopup({
    error,
    onClose
  }) {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "error-popup"
    }, /*#__PURE__*/React.createElement("span", null, error.message), /*#__PURE__*/React.createElement("button", {
      onClick: onClose
    }, "Close Error"));
  };
});
const {
  useQuery,
  useMutation
} = require('@apollo/client');
const {
  useSelectedCharacter
} = require('../../../context/SelectedCharacterContext');
const mockThought = {
  thoughtId: 'test-thought-id',
  name: 'Test Thought',
  description: 'This is a test thought description\nWith multiple lines'
};
const mockSelectedCharacter = {
  characterId: 'char-1',
  name: 'Test Character'
};

// Mock window.confirm
const originalConfirm = window.confirm;
beforeAll(() => {
  window.confirm = jest.fn();
});
afterAll(() => {
  window.confirm = originalConfirm;
});
const ThoughtViewWrapper = ({
  children
}) => /*#__PURE__*/React.createElement(BrowserRouter, null, children);

// Helper function to create a component with loaded data
const renderThoughtViewWithData = async (thoughtData = mockThought, selectedChar = mockSelectedCharacter) => {
  useQuery.mockImplementation((query, options) => {
    const mockReturnValue = {
      loading: false,
      error: null,
      refetch: mockRefetch,
      data: thoughtData ? {
        getThought: thoughtData
      } : null
    };
    if (options?.onCompleted && mockReturnValue.data) {
      setTimeout(() => options.onCompleted(mockReturnValue.data), 0);
    }
    return mockReturnValue;
  });
  useMutation.mockImplementation(mutation => {
    if (mutation === 'DELETE_THOUGHT') {
      return [mockDeleteThought, {
        loading: false
      }];
    }
    if (mutation === 'ADD_THOUGHT_TO_CHARACTER_MIND') {
      return [mockAddThoughtToCharacterMind, {
        loading: false
      }];
    }
    return [jest.fn(), {
      loading: false
    }];
  });
  useSelectedCharacter.mockReturnValue({
    selectedCharacter: selectedChar
  });
  const result = render(/*#__PURE__*/React.createElement(ThoughtViewWrapper, null, /*#__PURE__*/React.createElement(ThoughtView, null)));

  // Wait for component to load data
  if (thoughtData) {
    await waitFor(() => {
      expect(screen.getByText(thoughtData.name)).toBeInTheDocument();
    });
  }
  return result;
};
describe('ThoughtView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Loading and Error States', () => {
    test('renders loading state', () => {
      useQuery.mockReturnValue({
        loading: true,
        error: null,
        refetch: mockRefetch,
        data: null
      });
      useMutation.mockReturnValue([jest.fn(), {
        loading: false
      }]);
      useSelectedCharacter.mockReturnValue({
        selectedCharacter: null
      });
      render(/*#__PURE__*/React.createElement(ThoughtViewWrapper, null, /*#__PURE__*/React.createElement(ThoughtView, null)));
      expect(screen.getByText('Loading thought...')).toBeInTheDocument();
    });
    test('renders error state', () => {
      useQuery.mockReturnValue({
        loading: false,
        error: {
          message: 'Network error'
        },
        refetch: mockRefetch,
        data: null
      });
      useMutation.mockReturnValue([jest.fn(), {
        loading: false
      }]);
      useSelectedCharacter.mockReturnValue({
        selectedCharacter: null
      });
      render(/*#__PURE__*/React.createElement(ThoughtViewWrapper, null, /*#__PURE__*/React.createElement(ThoughtView, null)));
      expect(screen.getByText('Error loading thought: Network error')).toBeInTheDocument();
    });
    test('renders not found state', () => {
      useQuery.mockReturnValue({
        loading: false,
        error: null,
        refetch: mockRefetch,
        data: null
      });
      useMutation.mockReturnValue([jest.fn(), {
        loading: false
      }]);
      useSelectedCharacter.mockReturnValue({
        selectedCharacter: null
      });
      render(/*#__PURE__*/React.createElement(ThoughtViewWrapper, null, /*#__PURE__*/React.createElement(ThoughtView, null)));
      expect(screen.getByText('Thought not found')).toBeInTheDocument();
    });
  });
  describe('Component Rendering with Data', () => {
    test('renders thought content correctly', async () => {
      await renderThoughtViewWithData();
      expect(screen.getByText('Test Thought')).toBeInTheDocument();
      expect(screen.getByText('This is a test thought description')).toBeInTheDocument();
      expect(screen.getByText('With multiple lines')).toBeInTheDocument();
    });
    test('renders empty description message', async () => {
      const thoughtWithoutDescription = {
        ...mockThought,
        description: null
      };
      await renderThoughtViewWithData(thoughtWithoutDescription);
      expect(screen.getByText('No description provided.')).toBeInTheDocument();
    });
    test('renders action buttons', async () => {
      await renderThoughtViewWithData();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('← Back to Thoughts')).toBeInTheDocument();
    });
    test('renders add to character mind button when character selected', async () => {
      await renderThoughtViewWithData();
      expect(screen.getByText("Add to Test Character's Mind")).toBeInTheDocument();
    });
    test('does not render add to character mind button when no character selected', async () => {
      await renderThoughtViewWithData(mockThought, null);
      expect(screen.queryByText(/Add to.*Mind/)).not.toBeInTheDocument();
    });
  });
  describe('Edit Mode', () => {
    test('shows edit form when startInEditMode is true', async () => {
      useQuery.mockImplementation((query, options) => {
        const mockReturnValue = {
          loading: false,
          error: null,
          refetch: mockRefetch,
          data: {
            getThought: mockThought
          }
        };
        if (options?.onCompleted && mockReturnValue.data) {
          setTimeout(() => options.onCompleted(mockReturnValue.data), 0);
        }
        return mockReturnValue;
      });
      useMutation.mockImplementation(mutation => {
        if (mutation === 'DELETE_THOUGHT') {
          return [mockDeleteThought, {
            loading: false
          }];
        }
        if (mutation === 'ADD_THOUGHT_TO_CHARACTER_MIND') {
          return [mockAddThoughtToCharacterMind, {
            loading: false
          }];
        }
        return [jest.fn(), {
          loading: false
        }];
      });
      useSelectedCharacter.mockReturnValue({
        selectedCharacter: mockSelectedCharacter
      });
      render(/*#__PURE__*/React.createElement(ThoughtViewWrapper, null, /*#__PURE__*/React.createElement(ThoughtView, {
        startInEditMode: true
      })));
      await waitFor(() => {
        expect(screen.getByTestId('thought-form')).toBeInTheDocument();
      });
    });
    test('switches to edit mode when edit button clicked', async () => {
      await renderThoughtViewWithData();
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      expect(screen.getByTestId('thought-form')).toBeInTheDocument();
    });
    test('cancels edit mode and refetches data', async () => {
      await renderThoughtViewWithData();
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(mockRefetch).toHaveBeenCalled();
    });
    test('handles successful update', async () => {
      await renderThoughtViewWithData();
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
  describe('Delete Functionality', () => {
    test('shows confirmation dialog and deletes on confirmation', async () => {
      window.confirm.mockReturnValue(true);
      mockDeleteThought.mockResolvedValue({});
      await renderThoughtViewWithData();
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this thought?');
      await waitFor(() => {
        expect(mockDeleteThought).toHaveBeenCalledWith({
          variables: {
            thoughtId: 'test-thought-id'
          }
        });
        expect(mockNavigate).toHaveBeenCalledWith('/thoughts');
      });
    });
    test('does not delete when confirmation cancelled', async () => {
      window.confirm.mockReturnValue(false);
      await renderThoughtViewWithData();
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      expect(mockDeleteThought).not.toHaveBeenCalled();
    });
    test('handles delete error', async () => {
      window.confirm.mockReturnValue(true);
      mockDeleteThought.mockRejectedValue(new Error('Delete failed'));
      await renderThoughtViewWithData();
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(screen.getByTestId('error-popup')).toBeInTheDocument();
        expect(screen.getByText('Delete failed')).toBeInTheDocument();
      });
    });
    test('handles delete error without message', async () => {
      window.confirm.mockReturnValue(true);
      mockDeleteThought.mockRejectedValue({});
      await renderThoughtViewWithData();
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(screen.getByTestId('error-popup')).toBeInTheDocument();
        expect(screen.getByText('Failed to delete thought')).toBeInTheDocument();
      });
    });
  });
  describe('Add to Character Mind', () => {
    test('adds thought to character mind successfully', async () => {
      mockAddThoughtToCharacterMind.mockResolvedValue({
        data: {
          addThoughtToCharacterMind: {
            success: true
          }
        }
      });
      await renderThoughtViewWithData();
      const addButton = screen.getByText("Add to Test Character's Mind");
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(mockAddThoughtToCharacterMind).toHaveBeenCalledWith({
          variables: {
            characterId: 'char-1',
            thoughtId: 'test-thought-id'
          }
        });
        expect(screen.getByText("✓ Thought successfully added to Test Character's mind!")).toBeInTheDocument();
      });
    });
    test('shows success message temporarily', async () => {
      jest.useFakeTimers();
      mockAddThoughtToCharacterMind.mockResolvedValue({
        data: {
          addThoughtToCharacterMind: {
            success: true
          }
        }
      });
      await renderThoughtViewWithData();
      const addButton = screen.getByText("Add to Test Character's Mind");
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByText("✓ Thought successfully added to Test Character's mind!")).toBeInTheDocument();
      });
      jest.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(screen.queryByText("✓ Thought successfully added to Test Character's mind!")).not.toBeInTheDocument();
      });
      jest.useRealTimers();
    });
    test('handles add to mind error with null data', async () => {
      mockAddThoughtToCharacterMind.mockResolvedValue({
        data: null
      });
      await renderThoughtViewWithData();
      const addButton = screen.getByText("Add to Test Character's Mind");
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByTestId('error-popup')).toBeInTheDocument();
        expect(screen.getByText('Mutation returned null data.')).toBeInTheDocument();
      });
    });
    test('handles already in mind error message', async () => {
      mockAddThoughtToCharacterMind.mockRejectedValue(new Error('already in character\'s mind'));
      await renderThoughtViewWithData();
      const addButton = screen.getByText("Add to Test Character's Mind");
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByText('This thought is already in the character\'s mind.')).toBeInTheDocument();
      });
    });
    test('handles not found error message', async () => {
      mockAddThoughtToCharacterMind.mockRejectedValue(new Error('not found'));
      await renderThoughtViewWithData();
      const addButton = screen.getByText("Add to Test Character's Mind");
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByText('Character or thought not found.')).toBeInTheDocument();
      });
    });
    test('handles graphQL error message', async () => {
      mockAddThoughtToCharacterMind.mockRejectedValue({
        message: 'Some message',
        // Need to have a message property to avoid TypeError
        graphQLErrors: [{
          message: 'GraphQL specific error'
        }]
      });
      await renderThoughtViewWithData();
      const addButton = screen.getByText("Add to Test Character's Mind");
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByText('GraphQL specific error')).toBeInTheDocument();
      });
    });
  });
  describe('Navigation', () => {
    test('navigates back to thoughts list', async () => {
      await renderThoughtViewWithData();
      const backButton = screen.getByText('← Back to Thoughts');
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/thoughts');
    });
  });
  describe('Recently Viewed', () => {
    test('adds thought to recently viewed on load', async () => {
      await renderThoughtViewWithData();
      expect(mockAddRecentlyViewed).toHaveBeenCalledWith({
        id: 'test-thought-id',
        name: 'Test Thought',
        type: 'thought'
      });
    });
    test('does not add to recently viewed when no data', () => {
      useQuery.mockReturnValue({
        loading: false,
        error: null,
        refetch: mockRefetch,
        data: null
      });
      useMutation.mockReturnValue([jest.fn(), {
        loading: false
      }]);
      useSelectedCharacter.mockReturnValue({
        selectedCharacter: null
      });
      render(/*#__PURE__*/React.createElement(ThoughtViewWrapper, null, /*#__PURE__*/React.createElement(ThoughtView, null)));
      expect(mockAddRecentlyViewed).not.toHaveBeenCalled();
    });
  });
  describe('Error Popup', () => {
    test('closes error popup when close button clicked', async () => {
      window.confirm.mockReturnValue(true);
      mockDeleteThought.mockRejectedValue(new Error('Delete failed'));
      await renderThoughtViewWithData();
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(screen.getByTestId('error-popup')).toBeInTheDocument();
      });
      const closeErrorButton = screen.getByText('Close Error');
      fireEvent.click(closeErrorButton);
      await waitFor(() => {
        expect(screen.queryByTestId('error-popup')).not.toBeInTheDocument();
      });
    });
  });
  describe('CSS Classes', () => {
    test('applies correct CSS classes', async () => {
      const {
        container
      } = await renderThoughtViewWithData();
      expect(container.querySelector('.thought-view')).toBeInTheDocument();
      expect(container.querySelector('.thought-header')).toBeInTheDocument();
      expect(container.querySelector('.thought-content')).toBeInTheDocument();
      expect(container.querySelector('.thought-footer')).toBeInTheDocument();
    });
  });
});