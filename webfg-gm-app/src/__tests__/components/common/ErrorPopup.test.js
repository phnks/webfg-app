import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPopup from '../../../components/common/ErrorPopup';

describe('ErrorPopup Component', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    error: 'Something went wrong',
    onClose: mockOnClose
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<ErrorPopup {...defaultProps} />);
  });

  test('displays error message', () => {
    render(<ErrorPopup {...defaultProps} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('displays close button', () => {
    render(<ErrorPopup {...defaultProps} />);
    
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(<ErrorPopup {...defaultProps} />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('does not render when error is null', () => {
    render(<ErrorPopup error={null} onClose={mockOnClose} />);
    
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  test('does not render when error is empty string', () => {
    render(<ErrorPopup error="" onClose={mockOnClose} />);
    
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  test('handles long error messages', () => {
    const longError = 'This is a very long error message that should still be displayed properly in the error popup component';
    render(<ErrorPopup error={longError} onClose={mockOnClose} />);
    
    expect(screen.getByText(longError)).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<ErrorPopup {...defaultProps} />);
    
    expect(container.querySelector('.error-popup')).toBeInTheDocument();
  });

  test('handles error as Error object', () => {
    const errorObj = new Error('Network error');
    render(<ErrorPopup error={errorObj.message} onClose={mockOnClose} />);
    
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  test('handles undefined onClose gracefully', () => {
    render(<ErrorPopup error="Test error" />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton); // Should not throw error
  });
});