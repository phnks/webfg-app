function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilterSort from '../../../components/common/SearchFilterSort';
describe('SearchFilterSort Component', () => {
  const defaultProps = {
    entityType: 'characters',
    onFilterChange: jest.fn(),
    initialFilters: {},
    onClearFilters: jest.fn()
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(SearchFilterSort, defaultProps));
  });
  test('displays search input', () => {
    render(/*#__PURE__*/React.createElement(SearchFilterSort, defaultProps));
    expect(screen.getByPlaceholderText('Search characters by name...')).toBeInTheDocument();
  });
  test('displays filter dropdown', () => {
    render(/*#__PURE__*/React.createElement(SearchFilterSort, defaultProps));
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
  });
  test('displays sort dropdown', () => {
    render(/*#__PURE__*/React.createElement(SearchFilterSort, defaultProps));
    expect(screen.getByDisplayValue('Default Order')).toBeInTheDocument();
  });
  test('displays sort order button', () => {
    render(/*#__PURE__*/React.createElement(SearchFilterSort, defaultProps));
    expect(screen.getByText('Search')).toBeInTheDocument();
  });
  test('displays search and filter header', () => {
    render(/*#__PURE__*/React.createElement(SearchFilterSort, defaultProps));
    expect(screen.getByText('Search & Filter')).toBeInTheDocument();
    expect(screen.getByText('Show Advanced Filters')).toBeInTheDocument();
  });
  test('shows advanced filters when toggle clicked', () => {
    render(/*#__PURE__*/React.createElement(SearchFilterSort, defaultProps));
    const toggleButton = screen.getByText('Show Advanced Filters');
    fireEvent.click(toggleButton);
    expect(screen.getByText('Hide Advanced Filters')).toBeInTheDocument();
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
  });
  test('handles search input changes', () => {
    render(/*#__PURE__*/React.createElement(SearchFilterSort, defaultProps));
    const searchInput = screen.getByPlaceholderText('Search characters by name...');
    fireEvent.change(searchInput, {
      target: {
        value: 'test'
      }
    });
    expect(searchInput.value).toBe('test');
  });
  test('handles category filter changes', () => {
    render(/*#__PURE__*/React.createElement(SearchFilterSort, defaultProps));
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, {
      target: {
        value: 'HUMAN'
      }
    });
    expect(categorySelect.value).toBe('HUMAN');
  });
  test('shows clear all button when filters are active', () => {
    render(/*#__PURE__*/React.createElement(SearchFilterSort, _extends({}, defaultProps, {
      initialFilters: {
        search: 'test'
      }
    })));
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });
  test('calls onFilterChange when search button clicked', () => {
    const mockOnFilterChange = jest.fn();
    render(/*#__PURE__*/React.createElement(SearchFilterSort, _extends({}, defaultProps, {
      onFilterChange: mockOnFilterChange
    })));
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);
    expect(mockOnFilterChange).toHaveBeenCalled();
  });
});