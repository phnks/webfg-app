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
    render(<SearchFilterSort {...defaultProps} />);
  });

  test('displays search input', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search characters by name...')).toBeInTheDocument();
  });

  test('displays filter dropdown', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
  });

  test('displays sort dropdown', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    expect(screen.getByDisplayValue('Default Order')).toBeInTheDocument();
  });

  test('displays sort order button', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  test('displays search and filter header', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    expect(screen.getByText('Search & Filter')).toBeInTheDocument();
    expect(screen.getByText('Show Advanced Filters')).toBeInTheDocument();
  });

  test('shows advanced filters when toggle clicked', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    const toggleButton = screen.getByText('Show Advanced Filters');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Hide Advanced Filters')).toBeInTheDocument();
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
  });

  test('handles search input changes', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search characters by name...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(searchInput.value).toBe('test');
  });

  test('handles category filter changes', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'HUMAN' } });
    
    expect(categorySelect.value).toBe('HUMAN');
  });

  test('shows clear all button when filters are active', () => {
    render(<SearchFilterSort {...defaultProps} initialFilters={{ search: 'test' }} />);
    
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  test('calls onFilterChange when search button clicked', () => {
    const mockOnFilterChange = jest.fn();
    render(<SearchFilterSort {...defaultProps} onFilterChange={mockOnFilterChange} />);
    
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);
    
    expect(mockOnFilterChange).toHaveBeenCalled();
  });
});