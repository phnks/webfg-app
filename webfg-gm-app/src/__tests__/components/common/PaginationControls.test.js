import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaginationControls from '../../../components/common/PaginationControls';

describe('PaginationControls Component', () => {
  const defaultProps = {
    hasNextPage: true,
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    onPageSizeChange: jest.fn(),
    pageSize: 10,
    currentItemCount: 25,
    isLoading: false,
    hasPreviousPage: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<PaginationControls {...defaultProps} />);
  });

  test('displays current item count', () => {
    render(<PaginationControls {...defaultProps} currentItemCount={25} />);
    
    expect(screen.getByText('25 items')).toBeInTheDocument();
  });

  test('displays page size selector', () => {
    render(<PaginationControls {...defaultProps} />);
    
    expect(screen.getByLabelText('Items per page:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  test('displays page size options', () => {
    render(<PaginationControls {...defaultProps} />);
    
    const select = screen.getByLabelText('Items per page:');
    expect(select).toBeInTheDocument();
    
    const options = [10, 25, 50, 100];
    options.forEach(option => {
      expect(screen.getByText(option.toString())).toBeInTheDocument();
    });
  });

  test('calls onPageSizeChange when page size changes', () => {
    const mockOnPageSizeChange = jest.fn();
    render(<PaginationControls {...defaultProps} onPageSizeChange={mockOnPageSizeChange} />);
    
    const select = screen.getByLabelText('Items per page:');
    fireEvent.change(select, { target: { value: '25' } });
    
    expect(mockOnPageSizeChange).toHaveBeenCalledWith(25);
  });

  test('shows Previous button when hasPreviousPage is true', () => {
    render(<PaginationControls {...defaultProps} hasPreviousPage={true} />);
    
    const previousButton = screen.getByText('← Previous');
    expect(previousButton).toBeInTheDocument();
    expect(previousButton).not.toBeDisabled();
  });

  test('shows Next button when hasNextPage is true', () => {
    render(<PaginationControls {...defaultProps} hasNextPage={true} />);
    
    const nextButton = screen.getByText('Next →');
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();
  });

  test('disables Previous button when hasPreviousPage is false', () => {
    render(<PaginationControls {...defaultProps} hasPreviousPage={false} />);
    
    const previousButton = screen.getByText('← Previous');
    expect(previousButton).toBeDisabled();
  });

  test('disables Next button when hasNextPage is false', () => {
    render(<PaginationControls {...defaultProps} hasNextPage={false} />);
    
    const nextButton = screen.getByText('Next →');
    expect(nextButton).toBeDisabled();
  });

  test('calls onPrevious when Previous button is clicked', () => {
    const mockOnPrevious = jest.fn();
    render(<PaginationControls {...defaultProps} onPrevious={mockOnPrevious} hasPreviousPage={true} />);
    
    fireEvent.click(screen.getByText('← Previous'));
    expect(mockOnPrevious).toHaveBeenCalled();
  });

  test('calls onNext when Next button is clicked', () => {
    const mockOnNext = jest.fn();
    render(<PaginationControls {...defaultProps} onNext={mockOnNext} hasNextPage={true} />);
    
    fireEvent.click(screen.getByText('Next →'));
    expect(mockOnNext).toHaveBeenCalled();
  });

  test('disables controls when loading', () => {
    render(<PaginationControls {...defaultProps} isLoading={true} />);
    
    const select = screen.getByLabelText('Items per page:');
    const previousButton = screen.getByText('← Previous');
    const nextButton = screen.getByText('Next →');
    
    expect(select).toBeDisabled();
    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  test('displays zero items correctly', () => {
    render(<PaginationControls {...defaultProps} currentItemCount={0} />);
    
    expect(screen.getByText('0 items')).toBeInTheDocument();
  });

  test('uses default props correctly', () => {
    render(
      <PaginationControls 
        hasNextPage={false}
        onNext={jest.fn()}
        onPrevious={jest.fn()}
        onPageSizeChange={jest.fn()}
      />
    );
    
    expect(screen.getByText('0 items')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });
});