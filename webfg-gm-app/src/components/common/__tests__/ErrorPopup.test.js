import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorPopup from '../ErrorPopup';

describe('ErrorPopup', () => {
  it('renders error message when error prop is provided', () => {
    const errorMessage = 'Something went wrong!';
    
    render(<ErrorPopup error={errorMessage} />);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('does not render when error prop is null', () => {
    render(<ErrorPopup error={null} />);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render when error prop is undefined', () => {
    render(<ErrorPopup error={undefined} />);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render when error prop is empty string', () => {
    render(<ErrorPopup error="" />);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<ErrorPopup error="Test error" />);
    
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();
    
    render(<ErrorPopup error="Test error" onClose={onCloseMock} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after timeout when autoDismiss is true', () => {
    jest.useFakeTimers();
    const onCloseMock = jest.fn();
    
    render(
      <ErrorPopup 
        error="Test error" 
        onClose={onCloseMock} 
        autoDismiss={true}
        timeout={3000}
      />
    );
    
    expect(onCloseMock).not.toHaveBeenCalled();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });

  it('does not auto-dismiss when autoDismiss is false', () => {
    jest.useFakeTimers();
    const onCloseMock = jest.fn();
    
    render(
      <ErrorPopup 
        error="Test error" 
        onClose={onCloseMock} 
        autoDismiss={false}
      />
    );
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(onCloseMock).not.toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  it('uses default timeout when not provided', () => {
    jest.useFakeTimers();
    const onCloseMock = jest.fn();
    
    render(
      <ErrorPopup 
        error="Test error" 
        onClose={onCloseMock} 
        autoDismiss={true}
      />
    );
    
    // Should use default timeout (likely 5000ms)
    act(() => {
      jest.advanceTimersByTime(4999);
    });
    expect(onCloseMock).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });

  it('clears timeout when component unmounts', () => {
    jest.useFakeTimers();
    const onCloseMock = jest.fn();
    
    const { unmount } = render(
      <ErrorPopup 
        error="Test error" 
        onClose={onCloseMock} 
        autoDismiss={true}
        timeout={3000}
      />
    );
    
    // Unmount before timeout
    unmount();
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Should not call onClose after unmount
    expect(onCloseMock).not.toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  it('resets timeout when error message changes', () => {
    jest.useFakeTimers();
    const onCloseMock = jest.fn();
    
    const { rerender } = render(
      <ErrorPopup 
        error="First error" 
        onClose={onCloseMock} 
        autoDismiss={true}
        timeout={3000}
      />
    );
    
    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    
    // Change error message
    rerender(
      <ErrorPopup 
        error="Second error" 
        onClose={onCloseMock} 
        autoDismiss={true}
        timeout={3000}
      />
    );
    
    // Should reset timeout
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(onCloseMock).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });

  it('handles Error object as error prop', () => {
    const errorObject = new Error('Network error');
    
    render(<ErrorPopup error={errorObject} />);
    
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('handles GraphQL error object', () => {
    const graphqlError = {
      message: 'GraphQL error occurred',
      extensions: {
        code: 'BAD_REQUEST'
      }
    };
    
    render(<ErrorPopup error={graphqlError} />);
    
    expect(screen.getByText('GraphQL error occurred')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<ErrorPopup error="Test error" />);
    
    const popup = screen.getByRole('alert');
    expect(popup).toHaveClass('error-popup');
  });

  it('applies custom className when provided', () => {
    render(<ErrorPopup error="Test error" className="custom-error" />);
    
    const popup = screen.getByRole('alert');
    expect(popup).toHaveClass('error-popup', 'custom-error');
  });

  it('renders with different severity levels', () => {
    const { rerender } = render(
      <ErrorPopup error="Test error" severity="error" />
    );
    
    let popup = screen.getByRole('alert');
    expect(popup).toHaveClass('severity-error');
    
    rerender(<ErrorPopup error="Test warning" severity="warning" />);
    popup = screen.getByRole('alert');
    expect(popup).toHaveClass('severity-warning');
    
    rerender(<ErrorPopup error="Test info" severity="info" />);
    popup = screen.getByRole('alert');
    expect(popup).toHaveClass('severity-info');
  });

  it('shows icon based on severity', () => {
    const { rerender } = render(
      <ErrorPopup error="Test error" severity="error" />
    );
    
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    
    rerender(<ErrorPopup error="Test warning" severity="warning" />);
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    
    rerender(<ErrorPopup error="Test info" severity="info" />);
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
  });

  it('handles long error messages gracefully', () => {
    const longError = 'This is a very long error message that should be handled gracefully by the component and should not break the layout or cause any accessibility issues when displayed to the user.';
    
    render(<ErrorPopup error={longError} />);
    
    expect(screen.getByText(longError)).toBeInTheDocument();
    
    const popup = screen.getByRole('alert');
    expect(popup).toBeInTheDocument();
  });

  it('is accessible with keyboard navigation', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();
    
    render(<ErrorPopup error="Test error" onClose={onCloseMock} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    
    // Tab to close button
    await user.tab();
    expect(closeButton).toHaveFocus();
    
    // Press Enter to close
    await user.keyboard('{Enter}');
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();
    
    render(<ErrorPopup error="Test error" onClose={onCloseMock} />);
    
    // Press Escape
    await user.keyboard('{Escape}');
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});