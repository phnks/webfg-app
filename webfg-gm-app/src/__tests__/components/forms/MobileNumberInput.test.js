import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNumberInput from '../../../components/forms/MobileNumberInput';

describe('MobileNumberInput Component', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    value: 10,
    onChange: mockOnChange,
    label: 'Test Input',
    min: 0,
    max: 100,
    step: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<MobileNumberInput {...defaultProps} />);
  });

  test('displays label', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    expect(screen.getByText('Test Input')).toBeInTheDocument();
  });

  test('displays current value', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  test('displays increment and decrement buttons', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('calls onChange when increment button is clicked', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    
    expect(mockOnChange).toHaveBeenCalledWith(11);
  });

  test('calls onChange when decrement button is clicked', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    const decrementButton = screen.getByText('-');
    fireEvent.click(decrementButton);
    
    expect(mockOnChange).toHaveBeenCalledWith(9);
  });

  test('calls onChange when input value changes', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    const input = screen.getByDisplayValue('10');
    fireEvent.change(input, { target: { value: '15' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(15);
  });

  test('respects minimum value constraint', () => {
    render(<MobileNumberInput {...defaultProps} value={0} />);
    
    const decrementButton = screen.getByText('-');
    fireEvent.click(decrementButton);
    
    // Should not go below minimum
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('respects maximum value constraint', () => {
    render(<MobileNumberInput {...defaultProps} value={100} />);
    
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    
    // Should not go above maximum
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('uses custom step value', () => {
    render(<MobileNumberInput {...defaultProps} step={5} />);
    
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    
    expect(mockOnChange).toHaveBeenCalledWith(15);
  });

  test('handles invalid input gracefully', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    const input = screen.getByDisplayValue('10');
    fireEvent.change(input, { target: { value: 'invalid' } });
    
    // Should not call onChange with invalid number
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('handles empty input value', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    const input = screen.getByDisplayValue('10');
    fireEvent.change(input, { target: { value: '' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(0);
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<MobileNumberInput {...defaultProps} />);
    
    expect(container.querySelector('.mobile-number-input')).toBeInTheDocument();
    expect(container.querySelector('.number-controls')).toBeInTheDocument();
  });

  test('disables decrement button at minimum value', () => {
    render(<MobileNumberInput {...defaultProps} value={0} />);
    
    const decrementButton = screen.getByText('-');
    expect(decrementButton).toBeDisabled();
  });

  test('disables increment button at maximum value', () => {
    render(<MobileNumberInput {...defaultProps} value={100} />);
    
    const incrementButton = screen.getByText('+');
    expect(incrementButton).toBeDisabled();
  });

  test('handles decimal step values', () => {
    render(<MobileNumberInput {...defaultProps} step={0.5} value={10.5} />);
    
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    
    expect(mockOnChange).toHaveBeenCalledWith(11);
  });

  test('handles undefined min/max gracefully', () => {
    render(<MobileNumberInput value={10} onChange={mockOnChange} label="Test" />);
    
    const incrementButton = screen.getByText('+');
    const decrementButton = screen.getByText('-');
    
    fireEvent.click(incrementButton);
    expect(mockOnChange).toHaveBeenCalledWith(11);
    
    fireEvent.click(decrementButton);
    expect(mockOnChange).toHaveBeenCalledWith(9);
  });
});