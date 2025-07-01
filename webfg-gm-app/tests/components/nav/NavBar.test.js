import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import NavBar from '../../../src/components/nav/NavBar';
import { LIST_ENCOUNTERS } from '../../../src/graphql/operations';

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaBars: () => <div data-testid="menu-icon">Menu</div>,
  FaTimes: () => <div data-testid="close-icon">Close</div>,
  FaUser: () => <div data-testid="user-icon">User</div>,
  FaCube: () => <div data-testid="cube-icon">Cube</div>,
  FaBolt: () => <div data-testid="bolt-icon">Bolt</div>,
  FaHome: () => <div data-testid="home-icon">Home</div>,
  FaChessBoard: () => <div data-testid="chess-icon">Chess</div>,
  FaExclamationTriangle: () => <div data-testid="warning-icon">Warning</div>
}));

const mocks = [
  {
    request: {
      query: LIST_ENCOUNTERS
    },
    result: {
      data: {
        listEncounters: []
      }
    }
  }
];

const NavBarWrapper = ({ children, ...props }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    <BrowserRouter>
      <NavBar {...props} />
      {children}
    </BrowserRouter>
  </MockedProvider>
);

describe('NavBar Component', () => {
  const defaultProps = {
    characterList: [
      { characterId: '1', name: 'Test Character 1' },
      { characterId: '2', name: 'Test Character 2' }
    ],
    objectList: [
      { objectId: '1', name: 'Test Object 1' },
      { objectId: '2', name: 'Test Object 2' }
    ],
    actionList: [
      { actionId: '1', name: 'Test Action 1' },
      { actionId: '2', name: 'Test Action 2' }
    ],
    conditionList: [
      { conditionId: '1', name: 'Test Condition 1' },
      { conditionId: '2', name: 'Test Condition 2' }
    ]
  };

  test('renders navigation bar', () => {
    render(<NavBarWrapper {...defaultProps} />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('renders menu toggle button', () => {
    render(<NavBarWrapper {...defaultProps} />);
    
    const menuButton = screen.getByTestId('menu-icon').closest('button');
    expect(menuButton).toBeInTheDocument();
  });

  test('toggles menu when menu button is clicked', () => {
    render(<NavBarWrapper {...defaultProps} />);
    
    const menuButton = screen.getByTestId('menu-icon').closest('button');
    
    // Menu should be closed initially
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    
    // Click to open
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click to close
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('renders main navigation links', () => {
    render(<NavBarWrapper {...defaultProps} />);
    
    // Open the menu to see the links
    const menuButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Objects')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getByText('Encounters')).toBeInTheDocument();
  });

  test('renders navigation icons', () => {
    render(<NavBarWrapper {...defaultProps} />);
    
    // Open the menu to see the icons
    const menuButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(menuButton);
    
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByTestId('cube-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bolt-icon')).toBeInTheDocument();
    expect(screen.getByTestId('chess-icon')).toBeInTheDocument();
  });

  test('handles empty lists gracefully', () => {
    const emptyProps = {
      characterList: [],
      objectList: [],
      actionList: [],
      conditionList: []
    };
    
    render(<NavBarWrapper {...emptyProps} />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('handles undefined lists gracefully', () => {
    render(<NavBarWrapper />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<NavBarWrapper {...defaultProps} />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('navbar');
  });

  test('menu closes when clicking outside', () => {
    render(<NavBarWrapper {...defaultProps} />);
    
    const menuButton = screen.getByTestId('menu-icon').closest('button');
    
    // Open menu
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click outside (on document body)
    fireEvent.mouseDown(document.body);
    
    // Menu should close
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('keyboard navigation works', () => {
    render(<NavBarWrapper {...defaultProps} />);
    
    const menuButton = screen.getByTestId('menu-icon').closest('button');
    
    // Test Enter key
    fireEvent.keyDown(menuButton, { key: 'Enter', code: 'Enter' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Test Space key
    fireEvent.keyDown(menuButton, { key: ' ', code: 'Space' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('displays character count in navigation', () => {
    render(<NavBarWrapper {...defaultProps} />);
    
    // Open menu to see counts
    const menuButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(menuButton);
    
    // Should show count of characters
    expect(screen.getByText(/2/)).toBeInTheDocument(); // 2 characters
  });

  test('accessibility attributes are correct', () => {
    render(<NavBarWrapper {...defaultProps} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label');
    
    const menuButton = screen.getByTestId('menu-icon').closest('button');
    expect(menuButton).toHaveAttribute('aria-expanded');
    expect(menuButton).toHaveAttribute('aria-controls');
  });

  test('handles window resize', () => {
    render(<NavBarWrapper {...defaultProps} />);
    
    // Simulate window resize
    global.innerWidth = 500;
    fireEvent(window, new Event('resize'));
    
    // Component should still render correctly
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  describe('Active section highlighting', () => {
    test('highlights current section based on location', () => {
      // Mock useLocation to return characters path
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => ({ pathname: '/characters' })
      }));
      
      render(<NavBarWrapper {...defaultProps} />);
      
      const menuButton = screen.getByTestId('menu-icon').closest('button');
      fireEvent.click(menuButton);
      
      const charactersLink = screen.getByText('Characters').closest('a');
      expect(charactersLink).toHaveClass('active');
    });
  });
});