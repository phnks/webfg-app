import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuickAdjustWidget from '../../../components/common/QuickAdjustWidget';

describe('QuickAdjustWidget Component', () => {
  const mockOnAdjust = jest.fn();

  const defaultProps = {
    currentValue: 10,
    onAdjust: mockOnAdjust,
    min: 0,
    max: 20
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('renders without crashing', () => {
    render(<QuickAdjustWidget {...defaultProps} />);
  });

  test('displays increment and decrement buttons', () => {
    render(<QuickAdjustWidget {...defaultProps} />);
    
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('−')).toBeInTheDocument();
  });

  test('displays adjust amount input', () => {
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const input = screen.getByDisplayValue('1');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', '1');
  });

  test('calls onAdjust with incremented value when + button clicked', async () => {
    mockOnAdjust.mockResolvedValue();
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    
    await waitFor(() => {
      expect(mockOnAdjust).toHaveBeenCalledWith(11);
    });
  });

  test('calls onAdjust with decremented value when - button clicked', async () => {
    mockOnAdjust.mockResolvedValue();
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const decrementButton = screen.getByText('−');
    fireEvent.click(decrementButton);
    
    await waitFor(() => {
      expect(mockOnAdjust).toHaveBeenCalledWith(9);
    });
  });

  test('allows changing adjust amount', () => {
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '5' } });
    
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  test('uses custom adjust amount for increment', async () => {
    mockOnAdjust.mockResolvedValue();
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '3' } });
    
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    
    await waitFor(() => {
      expect(mockOnAdjust).toHaveBeenCalledWith(13);
    });
  });

  test('uses custom adjust amount for decrement', async () => {
    mockOnAdjust.mockResolvedValue();
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '2' } });
    
    const decrementButton = screen.getByText('−');
    fireEvent.click(decrementButton);
    
    await waitFor(() => {
      expect(mockOnAdjust).toHaveBeenCalledWith(8);
    });
  });

  test('respects minimum value constraint', async () => {
    const props = { ...defaultProps, currentValue: 1, min: 0 };
    mockOnAdjust.mockResolvedValue();
    render(<QuickAdjustWidget {...props} />);
    
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '2' } });
    
    const decrementButton = screen.getByText('−');
    fireEvent.click(decrementButton);
    
    // Should not call onAdjust because result would be below min
    expect(mockOnAdjust).not.toHaveBeenCalled();
  });

  test('respects maximum value constraint', async () => {
    const props = { ...defaultProps, currentValue: 19, max: 20 };
    mockOnAdjust.mockResolvedValue();
    render(<QuickAdjustWidget {...props} />);
    
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '2' } });
    
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    
    // Should not call onAdjust because result would be above max
    expect(mockOnAdjust).not.toHaveBeenCalled();
  });

  test('disables decrement button when at minimum', () => {
    const props = { ...defaultProps, currentValue: 0, min: 0 };
    render(<QuickAdjustWidget {...props} />);
    
    const decrementButton = screen.getByText('−');
    expect(decrementButton).toBeDisabled();
  });

  test('disables increment button when at maximum', () => {
    const props = { ...defaultProps, currentValue: 20, max: 20 };
    render(<QuickAdjustWidget {...props} />);
    
    const incrementButton = screen.getByText('+');
    expect(incrementButton).toBeDisabled();
  });

  test('handles empty input gracefully', () => {
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '' } });
    
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  test('rejects non-numeric input', () => {
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: 'abc' } });
    
    // Should still show '1' because non-numeric input is rejected
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });

  test('handles onAdjust error gracefully', async () => {
    const error = new Error('Adjustment failed');
    mockOnAdjust.mockRejectedValue(error);
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to adjust value:', error);
    });
  });

  test('applies loading state during adjustment', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockOnAdjust.mockReturnValue(promise);
    
    const { container } = render(<QuickAdjustWidget {...defaultProps} />);
    
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    
    // Should be in loading state
    expect(container.querySelector('.loading')).toBeInTheDocument();
    expect(incrementButton).toBeDisabled();
    expect(screen.getByText('−')).toBeDisabled();
    expect(screen.getByDisplayValue('1')).toBeDisabled();
    
    // Resolve the promise
    resolvePromise();
    
    await waitFor(() => {
      expect(container.querySelector('.loading')).not.toBeInTheDocument();
    });
  });

  test('prevents multiple simultaneous adjustments', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockOnAdjust.mockReturnValue(promise);
    
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const incrementButton = screen.getByText('+');
    
    // First click
    fireEvent.click(incrementButton);
    
    // Second click while first is still processing
    fireEvent.click(incrementButton);
    
    // Should only be called once
    expect(mockOnAdjust).toHaveBeenCalledTimes(1);
    
    resolvePromise();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<QuickAdjustWidget {...defaultProps} />);
    
    expect(container.querySelector('.quick-adjust-wrapper')).toBeInTheDocument();
    expect(container.querySelector('.quick-adjust-widget')).toBeInTheDocument();
    expect(container.querySelector('.adjust-button.increment')).toBeInTheDocument();
    expect(container.querySelector('.adjust-button.decrement')).toBeInTheDocument();
    expect(container.querySelector('.adjust-amount')).toBeInTheDocument();
  });

  test('sets button titles correctly', () => {
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const incrementButton = screen.getByText('+');
    const decrementButton = screen.getByText('−');
    
    expect(incrementButton).toHaveAttribute('title', 'Increase by 1');
    expect(decrementButton).toHaveAttribute('title', 'Decrease by 1');
  });

  test('updates button titles when adjust amount changes', () => {
    render(<QuickAdjustWidget {...defaultProps} />);
    
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '5' } });
    
    const incrementButton = screen.getByText('+');
    const decrementButton = screen.getByText('−');
    
    expect(incrementButton).toHaveAttribute('title', 'Increase by 5');
    expect(decrementButton).toHaveAttribute('title', 'Decrease by 5');
  });

  test('handles default props correctly', () => {
    const minimalProps = {
      currentValue: 5,
      onAdjust: mockOnAdjust
    };
    
    render(<QuickAdjustWidget {...minimalProps} />);
    
    // Should render without issues and use default min=0, max=null
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('−')).toBeInTheDocument();
  });
});