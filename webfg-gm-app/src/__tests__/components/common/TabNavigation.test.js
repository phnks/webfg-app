import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TabNavigation from '../../../components/common/TabNavigation';

const mockTabs = [
  { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
  { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
  { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> }
];

describe('TabNavigation Component', () => {
  test('renders without crashing', () => {
    render(<TabNavigation tabs={mockTabs} />);
  });

  test('displays all tab labels', () => {
    render(<TabNavigation tabs={mockTabs} />);
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  test('displays first tab content by default', () => {
    render(<TabNavigation tabs={mockTabs} />);
    
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
  });

  test('switches to clicked tab', () => {
    render(<TabNavigation tabs={mockTabs} />);
    
    fireEvent.click(screen.getByText('Tab 2'));
    
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
  });

  test('applies active class to current tab', () => {
    render(<TabNavigation tabs={mockTabs} />);
    
    const tab1Button = screen.getByText('Tab 1');
    expect(tab1Button).toHaveClass('active');
    
    fireEvent.click(screen.getByText('Tab 2'));
    
    const tab2Button = screen.getByText('Tab 2');
    expect(tab2Button).toHaveClass('active');
    expect(tab1Button).not.toHaveClass('active');
  });

  test('handles empty tabs array', () => {
    render(<TabNavigation tabs={[]} />);
    
    expect(screen.getByText('No tabs available')).toBeInTheDocument();
  });

  test('handles null tabs', () => {
    render(<TabNavigation tabs={null} />);
    
    expect(screen.getByText('No tabs available')).toBeInTheDocument();
  });

  test('respects defaultActiveTab prop', () => {
    render(<TabNavigation tabs={mockTabs} defaultActiveTab="tab2" />);
    
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
    
    const tab2Button = screen.getByText('Tab 2');
    expect(tab2Button).toHaveClass('active');
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<TabNavigation tabs={mockTabs} />);
    
    expect(container.querySelector('.tab-navigation')).toBeInTheDocument();
    expect(container.querySelector('.tab-buttons')).toBeInTheDocument();
    expect(container.querySelector('.tab-content')).toBeInTheDocument();
  });

  test('handles tab with no content', () => {
    const tabsWithEmptyContent = [
      { id: 'tab1', label: 'Tab 1', content: null },
      { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> }
    ];
    
    render(<TabNavigation tabs={tabsWithEmptyContent} />);
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  test('maintains tab state correctly', () => {
    render(<TabNavigation tabs={mockTabs} />);
    
    // Click tab 3
    fireEvent.click(screen.getByText('Tab 3'));
    expect(screen.getByText('Content 3')).toBeInTheDocument();
    
    // Click back to tab 1
    fireEvent.click(screen.getByText('Tab 1'));
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
  });
});