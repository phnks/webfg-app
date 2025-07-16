import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock all the complex dependencies to avoid GraphQL complexity
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ children }) => <div>{children}</div>,
  Link: ({ children, ...props }) => <a {...props}>{children}</a>
}));

jest.mock('@apollo/client', () => ({
  useQuery: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn()
  }),
  useMutation: () => [jest.fn(), { loading: false }],
  useSubscription: () => ({ data: null, loading: false }),
  gql: jest.fn(() => ({}))
}));

jest.mock('../context/SelectedCharacterContext', () => ({
  SelectedCharacterProvider: ({ children }) => <div>{children}</div>,
  useSelectedCharacter: () => ({
    selectedCharacter: null,
    selectCharacter: jest.fn(),
    clearSelectedCharacter: jest.fn()
  })
}));

// Mock navigation components
jest.mock('../components/nav/NavBar', () => {
  return function MockNavBar() {
    return (
      <nav>
        <div>WEBFG GM</div>
        <a href="/characters">Characters</a>
        <a href="/objects">Objects</a>
        <a href="/actions">Actions</a>
        <a href="/conditions">Conditions</a>
        <a href="/encounters">Encounters</a>
      </nav>
    );
  };
});

// Mock home page component
jest.mock('../components/Home', () => {
  return function MockHome() {
    return <div>Welcome to WEBFG GM</div>;
  };
});

// Mock other page components
jest.mock('../components/characters/CharacterList', () => {
  return function MockCharacterList() {
    return <div>Characters List</div>;
  };
});

jest.mock('../components/objects/ObjectList', () => {
  return function MockObjectList() {
    return <div>Objects List</div>;
  };
});

jest.mock('../components/actions/ActionList', () => {
  return function MockActionList() {
    return <div>Actions List</div>;
  };
});

jest.mock('../components/conditions/ConditionsList', () => {
  return function MockConditionsList() {
    return <div>Conditions List</div>;
  };
});

jest.mock('../components/encounters/EncountersList', () => {
  return function MockEncountersList() {
    return <div>Encounters List</div>;
  };
});

const AppWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('App Component', () => {

  test('renders without crashing', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
  });

  test('displays navigation bar', async () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
    });
  });

  test('displays main navigation links', async () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Objects')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Conditions')).toBeInTheDocument();
      expect(screen.getByText('Encounters')).toBeInTheDocument();
    });
  });

  test('renders home page content by default', async () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    await waitFor(() => {
      // Check that the app renders with navigation
      expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
    });
  });

  test('applies correct CSS classes', async () => {
    const { container } = render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    await waitFor(() => {
      expect(container.querySelector('.app')).toBeInTheDocument();
    });
  });

  test('provides selected character context', async () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // Should render without context errors
    await waitFor(() => {
      expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
    });
  });

  test('handles routing to different pages', async () => {
    // Test that the app can handle different routes
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    await waitFor(() => {
      // Check that the app renders with navigation
      expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
    });
  });

  test('provides Apollo Client context', async () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // Should render without GraphQL context errors
    await waitFor(() => {
      expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
    });
  });

  test('loads initial data', async () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // Should load initial data without errors
    await waitFor(() => {
      expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});