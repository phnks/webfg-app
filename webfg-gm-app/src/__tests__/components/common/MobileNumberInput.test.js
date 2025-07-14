import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNumberInput from '../../../components/common/MobileNumberInput';

describe('MobileNumberInput Component', () => {
  const defaultProps = {
    value: 5,
    onChange: jest.fn(),
    min: 0,
    max: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<MobileNumberInput {...defaultProps} />);
  });

  test('displays current value', () => {
    render(<MobileNumberInput {...defaultProps} value={7} />);
    
    expect(screen.getByDisplayValue('7')).toBeInTheDocument();
  });

  test('displays decrease button', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('displays increase button', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  test('calls onChange when decrease button is clicked', () => {
    const mockOnChange = jest.fn();
    render(<MobileNumberInput {...defaultProps} value={5} onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByText('-'));
    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  test('calls onChange when increase button is clicked', () => {
    const mockOnChange = jest.fn();
    render(<MobileNumberInput {...defaultProps} value={5} onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByText('+'));
    expect(mockOnChange).toHaveBeenCalledWith(6);
  });

  test('does not decrease below minimum value', () => {
    const mockOnChange = jest.fn();
    render(<MobileNumberInput {...defaultProps} value={0} min={0} onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByText('-'));
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('does not increase above maximum value', () => {
    const mockOnChange = jest.fn();
    render(<MobileNumberInput {...defaultProps} value={10} max={10} onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByText('+'));
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('disables decrease button at minimum value', () => {
    render(<MobileNumberInput {...defaultProps} value={0} min={0} />);
    
    const decreaseButton = screen.getByText('-');
    expect(decreaseButton).toBeDisabled();
  });

  test('disables increase button at maximum value', () => {
    render(<MobileNumberInput {...defaultProps} value={10} max={10} />);
    
    const increaseButton = screen.getByText('+');
    expect(increaseButton).toBeDisabled();
  });

  test('calls onChange when input value changes', () => {
    const mockOnChange = jest.fn();
    render(<MobileNumberInput {...defaultProps} onChange={mockOnChange} />);
    
    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: '8' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(8);
  });

  test('handles invalid input gracefully', () => {
    const mockOnChange = jest.fn();
    render(<MobileNumberInput {...defaultProps} onChange={mockOnChange} />);
    
    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: 'abc' } });
    
    // Should not call onChange for invalid input
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('handles empty input', () => {
    const mockOnChange = jest.fn();
    render(<MobileNumberInput {...defaultProps} onChange={mockOnChange} />);
    
    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: '' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(0);
  });

  test('respects min/max bounds on direct input', () => {
    const mockOnChange = jest.fn();
    render(<MobileNumberInput {...defaultProps} min={0} max={10} onChange={mockOnChange} />);
    
    const input = screen.getByDisplayValue('5');
    
    // Test above max
    fireEvent.change(input, { target: { value: '15' } });
    expect(mockOnChange).toHaveBeenCalledWith(10);
    
    // Test below min
    fireEvent.change(input, { target: { value: '-5' } });
    expect(mockOnChange).toHaveBeenCalledWith(0);
  });
});