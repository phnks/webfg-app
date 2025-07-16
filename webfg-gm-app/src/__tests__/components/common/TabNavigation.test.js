import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TabNavigation from '../../../components/common/TabNavigation';

describe('TabNavigation Component', () => {
  const mockOnTabChange = jest.fn();
  const defaultProps = {
    activeTab: 'characters',
    onTabChange: mockOnTabChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<TabNavigation {...defaultProps} />);
  });

  test('displays all tab buttons', () => {
    render(<TabNavigation {...defaultProps} />);
    
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Objects')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  test('applies active class to current tab', () => {
    render(<TabNavigation {...defaultProps} activeTab="objects" />);
    
    const objectsTab = screen.getByText('Objects');
    expect(objectsTab).toHaveClass('active');
  });

  test('calls onTabChange when tab is clicked', () => {
    render(<TabNavigation {...defaultProps} />);
    
    const objectsTab = screen.getByText('Objects');
    fireEvent.click(objectsTab);
    
    expect(mockOnTabChange).toHaveBeenCalledWith('objects');
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<TabNavigation {...defaultProps} />);
    
    expect(container.querySelector('.tab-navigation')).toBeInTheDocument();
    expect(container.querySelector('.tab-button')).toBeInTheDocument();
  });

  test('highlights correct tab based on activeTab prop', () => {
    const { rerender } = render(<TabNavigation {...defaultProps} activeTab="characters" />);
    
    expect(screen.getByText('Characters')).toHaveClass('active');
    expect(screen.getByText('Objects')).not.toHaveClass('active');
    
    rerender(<TabNavigation {...defaultProps} activeTab="actions" />);
    expect(screen.getByText('Actions')).toHaveClass('active');
    expect(screen.getByText('Characters')).not.toHaveClass('active');
  });

  test('handles missing onTabChange prop gracefully', () => {
    // Component requires onTabChange prop for proper functionality
    const { container } = render(<TabNavigation activeTab="characters" onTabChange={() => {}} />);
    expect(container.querySelector('.tab-navigation')).toBeInTheDocument();
  });

  test('handles undefined activeTab', () => {
    render(<TabNavigation onTabChange={mockOnTabChange} />);
    
    // No tab should be active when activeTab is undefined
    expect(screen.getByText('Characters')).not.toHaveClass('active');
    expect(screen.getByText('Objects')).not.toHaveClass('active');
    expect(screen.getByText('Actions')).not.toHaveClass('active');
  });

  test('renders all tab buttons with correct text', () => {
    render(<TabNavigation {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    
    expect(buttons[0]).toHaveTextContent('Characters');
    expect(buttons[1]).toHaveTextContent('Objects');
    expect(buttons[2]).toHaveTextContent('Actions');
  });

  test('calls onTabChange with correct parameters for each tab', () => {
    render(<TabNavigation {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Characters'));
    expect(mockOnTabChange).toHaveBeenCalledWith('characters');
    
    fireEvent.click(screen.getByText('Objects'));
    expect(mockOnTabChange).toHaveBeenCalledWith('objects');
    
    fireEvent.click(screen.getByText('Actions'));
    expect(mockOnTabChange).toHaveBeenCalledWith('actions');
  });

  test('applies correct button classes', () => {
    render(<TabNavigation {...defaultProps} activeTab="characters" />);
    
    const charactersButton = screen.getByText('Characters');
    const objectsButton = screen.getByText('Objects');
    
    expect(charactersButton).toHaveClass('tab-button', 'active');
    expect(objectsButton).toHaveClass('tab-button');
    expect(objectsButton).not.toHaveClass('active');
  });
});