import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNumberInput from '../../../components/common/MobileNumberInput';

describe('MobileNumberInput Component', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    value: 10,
    onChange: mockOnChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<MobileNumberInput {...defaultProps} />);
  });

  test('displays the correct value', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    const input = screen.getByDisplayValue('10');
    expect(input).toBeInTheDocument();
  });

  test('calls onChange when value changes', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    const input = screen.getByDisplayValue('10');
    fireEvent.change(input, { target: { value: '20' } });
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  test('accepts additional props', () => {
    render(<MobileNumberInput {...defaultProps} placeholder="Enter number" />);
    
    const input = screen.getByPlaceholderText('Enter number');
    expect(input).toBeInTheDocument();
  });

  test('has correct input type', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    const input = screen.getByDisplayValue('10');
    expect(input).toHaveAttribute('type', 'number');
  });

  test('selects text on focus', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    const input = screen.getByDisplayValue('10');
    const selectSpy = jest.spyOn(input, 'select');
    
    fireEvent.focus(input);
    expect(selectSpy).toHaveBeenCalled();
  });

  test('selects text on click', () => {
    render(<MobileNumberInput {...defaultProps} />);
    
    const input = screen.getByDisplayValue('10');
    const selectSpy = jest.spyOn(input, 'select');
    
    fireEvent.click(input);
    expect(selectSpy).toHaveBeenCalled();
  });

  test('handles zero value', () => {
    render(<MobileNumberInput value={0} onChange={mockOnChange} />);
    
    const input = screen.getByDisplayValue('0');
    expect(input).toBeInTheDocument();
  });

  test('handles empty value', () => {
    render(<MobileNumberInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByRole('spinbutton');
    expect(input.value).toBe('');
  });

  test('handles null value', () => {
    render(<MobileNumberInput value={null} onChange={mockOnChange} />);
    
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });

  test('passes through className prop', () => {
    render(<MobileNumberInput {...defaultProps} className="custom-class" />);
    
    const input = screen.getByDisplayValue('10');
    expect(input).toHaveClass('custom-class');
  });

  test('passes through disabled prop', () => {
    render(<MobileNumberInput {...defaultProps} disabled />);
    
    const input = screen.getByDisplayValue('10');
    expect(input).toBeDisabled();
  });

  test('handles string value', () => {
    render(<MobileNumberInput value="15" onChange={mockOnChange} />);
    
    const input = screen.getByDisplayValue('15');
    expect(input).toBeInTheDocument();
  });

  test('handles min and max props', () => {
    render(<MobileNumberInput {...defaultProps} min="0" max="100" />);
    
    const input = screen.getByDisplayValue('10');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  test('handles step prop', () => {
    render(<MobileNumberInput {...defaultProps} step="0.1" />);
    
    const input = screen.getByDisplayValue('10');
    expect(input).toHaveAttribute('step', '0.1');
  });
});