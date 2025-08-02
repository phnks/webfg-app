import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaginationControls from '../../../components/common/PaginationControls';
describe('PaginationControls Component', () => {
  const mockOnNext = jest.fn();
  const mockOnPrevious = jest.fn();
  const mockOnPageSizeChange = jest.fn();
  const defaultProps = {
    hasNextPage: true,
    onNext: mockOnNext,
    onPrevious: mockOnPrevious,
    onPageSizeChange: mockOnPageSizeChange,
    pageSize: 10,
    currentItemCount: 25,
    isLoading: false,
    hasPreviousPage: false
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(PaginationControls, defaultProps));
  });
  test('displays current item count', () => {
    render(/*#__PURE__*/React.createElement(PaginationControls, defaultProps));
    expect(screen.getByText('25 items')).toBeInTheDocument();
  });
  test('displays page size selector with correct options', () => {
    render(/*#__PURE__*/React.createElement(PaginationControls, defaultProps));
    expect(screen.getByLabelText('Items per page:')).toBeInTheDocument();
    const select = screen.getByDisplayValue('10');
    expect(select).toBeInTheDocument();

    // Check all options are present
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
  test('displays pagination buttons', () => {
    render(/*#__PURE__*/React.createElement(PaginationControls, defaultProps));
    expect(screen.getByText('← Previous')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
  });
  test('calls onNext when next button is clicked', () => {
    render(/*#__PURE__*/React.createElement(PaginationControls, defaultProps));
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });
  test('calls onPrevious when previous button is clicked', () => {
    const props = {
      ...defaultProps,
      hasPreviousPage: true
    };
    render(/*#__PURE__*/React.createElement(PaginationControls, props));
    const previousButton = screen.getByText('← Previous');
    fireEvent.click(previousButton);
    expect(mockOnPrevious).toHaveBeenCalledTimes(1);
  });
  test('calls onPageSizeChange when page size is changed', () => {
    render(/*#__PURE__*/React.createElement(PaginationControls, defaultProps));
    const select = screen.getByDisplayValue('10');
    fireEvent.change(select, {
      target: {
        value: '25'
      }
    });
    expect(mockOnPageSizeChange).toHaveBeenCalledWith(25);
  });
  test('disables previous button when hasPreviousPage is false', () => {
    render(/*#__PURE__*/React.createElement(PaginationControls, defaultProps));
    const previousButton = screen.getByText('← Previous');
    expect(previousButton).toBeDisabled();
  });
  test('disables next button when hasNextPage is false', () => {
    const props = {
      ...defaultProps,
      hasNextPage: false
    };
    render(/*#__PURE__*/React.createElement(PaginationControls, props));
    const nextButton = screen.getByText('Next →');
    expect(nextButton).toBeDisabled();
  });
  test('disables buttons when loading', () => {
    const props = {
      ...defaultProps,
      isLoading: true
    };
    render(/*#__PURE__*/React.createElement(PaginationControls, props));
    const previousButton = screen.getByText('← Previous');
    const nextButton = screen.getByText('Next →');
    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });
  test('disables page size selector when loading', () => {
    const props = {
      ...defaultProps,
      isLoading: true
    };
    render(/*#__PURE__*/React.createElement(PaginationControls, props));
    const select = screen.getByDisplayValue('10');
    expect(select).toBeDisabled();
  });
  test('enables previous button when hasPreviousPage is true', () => {
    const props = {
      ...defaultProps,
      hasPreviousPage: true
    };
    render(/*#__PURE__*/React.createElement(PaginationControls, props));
    const previousButton = screen.getByText('← Previous');
    expect(previousButton).not.toBeDisabled();
  });
  test('applies correct CSS classes', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(PaginationControls, defaultProps));
    expect(container.querySelector('.pagination-controls')).toBeInTheDocument();
    expect(container.querySelector('.pagination-info')).toBeInTheDocument();
    expect(container.querySelector('.item-count')).toBeInTheDocument();
    expect(container.querySelector('.page-size-selector')).toBeInTheDocument();
    expect(container.querySelector('.page-size-select')).toBeInTheDocument();
    expect(container.querySelector('.pagination-buttons')).toBeInTheDocument();
    expect(container.querySelector('.pagination-btn.previous')).toBeInTheDocument();
    expect(container.querySelector('.pagination-btn.next')).toBeInTheDocument();
  });
  test('handles default props correctly', () => {
    const minimalProps = {
      hasNextPage: true,
      onNext: mockOnNext,
      onPrevious: mockOnPrevious,
      onPageSizeChange: mockOnPageSizeChange
    };
    render(/*#__PURE__*/React.createElement(PaginationControls, minimalProps));
    expect(screen.getByText('0 items')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByText('← Previous')).toBeDisabled();
  });
  test('handles different page sizes', () => {
    const props = {
      ...defaultProps,
      pageSize: 50
    };
    render(/*#__PURE__*/React.createElement(PaginationControls, props));
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });
  test('handles zero items', () => {
    const props = {
      ...defaultProps,
      currentItemCount: 0
    };
    render(/*#__PURE__*/React.createElement(PaginationControls, props));
    expect(screen.getByText('0 items')).toBeInTheDocument();
  });
  test('handles large item counts', () => {
    const props = {
      ...defaultProps,
      currentItemCount: 1000
    };
    render(/*#__PURE__*/React.createElement(PaginationControls, props));
    expect(screen.getByText('1000 items')).toBeInTheDocument();
  });
});