import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createSubscriptionMock } from '../../../test-utils';
import NavBar from '../NavBar';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
}));

describe('NavBar', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders navigation menu toggle', () => {
    renderWithProviders(<NavBar />);
    
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('toggles navigation menu on button click', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<NavBar />);
    
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Initially closed
    expect(screen.queryByRole('navigation')).not.toBeVisible();
    
    // Open menu
    await user.click(menuButton);
    expect(screen.getByRole('navigation')).toBeVisible();
    
    // Close menu
    await user.click(menuButton);
    expect(screen.queryByRole('navigation')).not.toBeVisible();
  });

  it('renders all navigation links', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<NavBar />);
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);
    
    // Check navigation links
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /characters/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /objects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /actions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /conditions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /encounters/i })).toBeInTheDocument();
  });

  it('navigates to correct routes when links clicked', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<NavBar />);
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);
    
    // Test characters link
    const charactersLink = screen.getByRole('link', { name: /characters/i });
    await user.click(charactersLink);
    expect(charactersLink.getAttribute('href')).toBe('/characters');
    
    // Test objects link
    const objectsLink = screen.getByRole('link', { name: /objects/i });
    await user.click(objectsLink);
    expect(objectsLink.getAttribute('href')).toBe('/objects');
  });

  it('highlights active navigation item', () => {
    renderWithProviders(<NavBar />, { initialEntries: ['/characters'] });
    
    const user = userEvent.setup();
    const menuButton = screen.getByRole('button', { name: /menu/i });
    user.click(menuButton);
    
    waitFor(() => {
      const charactersLink = screen.getByRole('link', { name: /characters/i });
      expect(charactersLink).toHaveClass('active');
    });
  });

  it('displays character count notification', async () => {
    renderWithProviders(<NavBar />);
    
    await waitFor(() => {
      // Should show character count based on mock data
      expect(screen.getByText('2')).toBeInTheDocument(); // Badge showing count
    });
  });

  it('updates character count on subscription', async () => {
    const subscriptionMock = createSubscriptionMock('ON_CREATE_CHARACTER', {
      onCreateCharacter: {
        id: '3',
        name: 'New Character',
        category: 'HUMAN',
        createdAt: '2023-01-02T00:00:00Z'
      }
    });

    renderWithProviders(<NavBar />, { mocks: [subscriptionMock] });
    
    await waitFor(() => {
      // Character count should update
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('handles subscription errors gracefully', async () => {
    const errorSubscriptionMock = {
      request: {
        query: require('../../../graphql/operations').ON_CREATE_CHARACTER
      },
      error: new Error('Subscription error')
    };

    renderWithProviders(<NavBar />, { mocks: [errorSubscriptionMock] });
    
    // Should still render navbar without crashing
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<NavBar />);
    
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Open menu
    await user.click(menuButton);
    expect(screen.getByRole('navigation')).toBeVisible();
    
    // Click outside (on body)
    await user.click(document.body);
    
    await waitFor(() => {
      expect(screen.queryByRole('navigation')).not.toBeVisible();
    });
  });

  it('closes menu when pressing escape key', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<NavBar />);
    
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    // Open menu
    await user.click(menuButton);
    expect(screen.getByRole('navigation')).toBeVisible();
    
    // Press escape
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByRole('navigation')).not.toBeVisible();
    });
  });

  it('displays responsive layout correctly', () => {
    renderWithProviders(<NavBar />);
    
    // Check that navbar has responsive classes
    const navbar = screen.getByRole('banner');
    expect(navbar).toHaveClass('navbar');
    
    // Menu button should be visible on mobile
    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('shows loading state while fetching data', () => {
    const loadingMock = {
      request: {
        query: require('../../../graphql/operations').LIST_CHARACTERS
      },
      result: {
        loading: true
      }
    };

    renderWithProviders(<NavBar />, { mocks: [loadingMock] });
    
    // Should show loading indicator in character count
    expect(screen.getByTestId('character-count-loading')).toBeInTheDocument();
  });

  it('handles empty character list', async () => {
    const emptyMock = {
      request: {
        query: require('../../../graphql/operations').LIST_CHARACTERS
      },
      result: {
        data: {
          listCharacters: {
            items: []
          }
        }
      }
    };

    renderWithProviders(<NavBar />, { mocks: [emptyMock] });
    
    await waitFor(() => {
      // Should show 0 count or hide count badge
      expect(screen.queryByText('0')).toBeInTheDocument();
    });
  });

  it('maintains menu state during route changes', async () => {
    const user = userEvent.setup();
    
    const { rerender } = renderWithProviders(<NavBar />, { initialEntries: ['/'] });
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);
    expect(screen.getByRole('navigation')).toBeVisible();
    
    // Simulate route change
    rerender(<NavBar />);
    
    // Menu should remain open
    expect(screen.getByRole('navigation')).toBeVisible();
  });
});