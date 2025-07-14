import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPopup from '../../../components/common/ErrorPopup';

describe('ErrorPopup Component', () => {
  const mockError = {
    message: 'Test error message',
    stack: 'Error stack trace here'
  };
  
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing when error is provided', () => {
    render(<ErrorPopup error={mockError} onClose={mockOnClose} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  test('does not render when no error provided', () => {
    const { container } = render(<ErrorPopup error={null} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  test('displays error message', () => {
    render(<ErrorPopup error={mockError} onClose={mockOnClose} />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('displays error stack trace when available', () => {
    render(<ErrorPopup error={mockError} onClose={mockOnClose} />);
    expect(screen.getByText('Stack Trace:')).toBeInTheDocument();
    expect(screen.getByText('Error stack trace here')).toBeInTheDocument();
  });

  test('does not display stack trace when not available', () => {
    const errorWithoutStack = { message: 'Test error' };
    render(<ErrorPopup error={errorWithoutStack} onClose={mockOnClose} />);
    expect(screen.queryByText('Stack Trace:')).not.toBeInTheDocument();
  });

  test('calls onClose when dismiss button is clicked', () => {
    render(<ErrorPopup error={mockError} onClose={mockOnClose} />);
    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<ErrorPopup error={mockError} onClose={mockOnClose} />);
    expect(container.querySelector('.error-popup')).toBeInTheDocument();
    expect(container.querySelector('.error-popup-content')).toBeInTheDocument();
  });

  test('displays message label', () => {
    render(<ErrorPopup error={mockError} onClose={mockOnClose} />);
    expect(screen.getByText('Message:')).toBeInTheDocument();
  });

  test('handles error with only message', () => {
    const simpleError = { message: 'Simple error' };
    render(<ErrorPopup error={simpleError} onClose={mockOnClose} />);
    expect(screen.getByText('Simple error')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  test('handles undefined error', () => {
    const { container } = render(<ErrorPopup error={undefined} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  test('handles error without message', () => {
    const errorWithoutMessage = { stack: 'Just stack' };
    render(<ErrorPopup error={errorWithoutMessage} onClose={mockOnClose} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });
});