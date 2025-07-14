import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilterSort from '../../../components/common/SearchFilterSort';

describe('SearchFilterSort Component', () => {
  const defaultProps = {
    searchTerm: '',
    setSearchTerm: jest.fn(),
    sortBy: 'name',
    setSortBy: jest.fn(),
    sortOrder: 'asc',
    setSortOrder: jest.fn(),
    filterBy: '',
    setFilterBy: jest.fn(),
    filterOptions: [
      { value: '', label: 'All' },
      { value: 'HUMAN', label: 'Human' },
      { value: 'ANIMAL', label: 'Animal' }
    ],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'category', label: 'Category' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<SearchFilterSort {...defaultProps} />);
  });

  test('displays search input', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('displays filter dropdown', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    expect(screen.getByDisplayValue('All')).toBeInTheDocument();
  });

  test('displays sort dropdown', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    expect(screen.getByDisplayValue('Name')).toBeInTheDocument();
  });

  test('displays sort order button', () => {
    render(<SearchFilterSort {...defaultProps} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('calls setSearchTerm when search input changes', () => {
    const mockSetSearchTerm = jest.fn();
    render(<SearchFilterSort {...defaultProps} setSearchTerm={mockSetSearchTerm} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(mockSetSearchTerm).toHaveBeenCalledWith('test');
  });

  test('calls setFilterBy when filter changes', () => {
    const mockSetFilterBy = jest.fn();
    render(<SearchFilterSort {...defaultProps} setFilterBy={mockSetFilterBy} />);
    
    const filterSelect = screen.getByDisplayValue('All');
    fireEvent.change(filterSelect, { target: { value: 'HUMAN' } });
    
    expect(mockSetFilterBy).toHaveBeenCalledWith('HUMAN');
  });

  test('calls setSortBy when sort option changes', () => {
    const mockSetSortBy = jest.fn();
    render(<SearchFilterSort {...defaultProps} setSortBy={mockSetSortBy} />);
    
    const sortSelect = screen.getByDisplayValue('Name');
    fireEvent.change(sortSelect, { target: { value: 'category' } });
    
    expect(mockSetSortBy).toHaveBeenCalledWith('category');
  });

  test('calls setSortOrder when sort order button is clicked', () => {
    const mockSetSortOrder = jest.fn();
    render(<SearchFilterSort {...defaultProps} setSortOrder={mockSetSortOrder} />);
    
    const sortOrderButton = screen.getByRole('button');
    fireEvent.click(sortOrderButton);
    
    expect(mockSetSortOrder).toHaveBeenCalledWith('desc');
  });

  test('toggles sort order correctly', () => {
    const mockSetSortOrder = jest.fn();
    render(<SearchFilterSort {...defaultProps} sortOrder="desc" setSortOrder={mockSetSortOrder} />);
    
    const sortOrderButton = screen.getByRole('button');
    fireEvent.click(sortOrderButton);
    
    expect(mockSetSortOrder).toHaveBeenCalledWith('asc');
  });

  test('displays current search term', () => {
    render(<SearchFilterSort {...defaultProps} searchTerm="test search" />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput.value).toBe('test search');
  });

  test('displays current filter selection', () => {
    render(<SearchFilterSort {...defaultProps} filterBy="HUMAN" />);
    
    expect(screen.getByDisplayValue('Human')).toBeInTheDocument();
  });

  test('displays current sort selection', () => {
    render(<SearchFilterSort {...defaultProps} sortBy="category" />);
    
    expect(screen.getByDisplayValue('Category')).toBeInTheDocument();
  });
});