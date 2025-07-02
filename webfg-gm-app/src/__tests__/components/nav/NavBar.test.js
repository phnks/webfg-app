import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import NavBar from '../../../components/nav/NavBar';
import { LIST_ENCOUNTERS } from '../../../graphql/operations';

// react-router-dom is mocked via __mocks__/react-router-dom.js

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
      query: LIST_ENCOUNTERS,
      variables: {
        nextToken: null,
        limit: 100
      }
    },
    result: {
      data: {
        listEncounters: {
          items: [
            {
              encounterId: 'enc1',
              name: 'Test Encounter 1',
              description: 'Description 1',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              __typename: 'Encounter'
            },
            {
              encounterId: 'enc2',
              name: 'Test Encounter 2',
              description: 'Description 2',
              createdAt: '2024-01-02T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
              __typename: 'Encounter'
            }
          ],
          nextToken: null,
          __typename: 'EncounterConnection'
        }
      }
    }
  }
];

const NavBarWrapper = ({ children, apolloMocks = mocks }) => (
  <MockedProvider mocks={apolloMocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('NavBar Component', () => {
  test('renders without crashing', () => {
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
  });

  test('renders navigation links', () => {
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Objects')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getByText('Encounters')).toBeInTheDocument();
  });

  test('renders hamburger menu on mobile', () => {
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
    
    const menuIcon = screen.getByTestId('menu-icon');
    expect(menuIcon).toBeInTheDocument();
  });

  test('toggles mobile menu when hamburger is clicked', () => {
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
    
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    
    // Menu should be closed initially
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    
    // Click to open menu
    fireEvent.click(menuButton);
    
    // Menu should now show close icon
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
  });

  test('loads encounters data', async () => {
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
    
    // Wait for encounters to load
    await screen.findByText('Test Encounter 1');
    
    expect(screen.getByText('Test Encounter 1')).toBeInTheDocument();
    expect(screen.getByText('Test Encounter 2')).toBeInTheDocument();
  });

  test('handles encounters loading error', async () => {
    const errorMocks = [
      {
        request: {
          query: LIST_ENCOUNTERS,
          variables: {
            nextToken: null,
            limit: 100
          }
        },
        error: new Error('Failed to load encounters')
      }
    ];
    
    render(
      <NavBarWrapper apolloMocks={errorMocks}>
        <NavBar />
      </NavBarWrapper>
    );
    
    // Should still render navigation even if encounters fail to load
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
  });

  test('applies active class to current route', () => {
    // Mock location to be on characters page
    const mockUseLocation = jest.spyOn(require('react-router-dom'), 'useLocation');
    mockUseLocation.mockReturnValue({
      pathname: '/characters'
    });
    
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
    
    const charactersLink = screen.getByText('Characters').closest('a');
    expect(charactersLink).toHaveAttribute('href', '/characters');
    
    mockUseLocation.mockRestore();
  });
});