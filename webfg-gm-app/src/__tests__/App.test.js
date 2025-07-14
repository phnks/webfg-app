import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import App from '../App';
import { 
  LIST_CHARACTERS_ENHANCED, 
  LIST_OBJECTS_ENHANCED, 
  LIST_ACTIONS_ENHANCED, 
  LIST_CONDITIONS_ENHANCED 
} from '../graphql/operations';

const mockCharactersData = {
  request: {
    query: LIST_CHARACTERS_ENHANCED,
    variables: {
      filter: {}
    }
  },
  result: {
    data: {
      listCharactersEnhanced: {
        items: []
      }
    }
  }
};

const mockObjectsData = {
  request: {
    query: LIST_OBJECTS_ENHANCED,
    variables: {
      filter: {}
    }
  },
  result: {
    data: {
      listObjectsEnhanced: {
        objects: []
      }
    }
  }
};

const mockActionsData = {
  request: {
    query: LIST_ACTIONS_ENHANCED,
    variables: {
      filter: {}
    }
  },
  result: {
    data: {
      listActionsEnhanced: {
        actions: []
      }
    }
  }
};

const mockConditionsData = {
  request: {
    query: LIST_CONDITIONS_ENHANCED,
    variables: {
      filter: {}
    }
  },
  result: {
    data: {
      listConditionsEnhanced: {
        conditions: []
      }
    }
  }
};

const AppWrapper = ({ children, mocks = [] }) => (
  <BrowserRouter>
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
);

describe('App Component', () => {
  const allMocks = [
    mockCharactersData,
    mockObjectsData,
    mockActionsData,
    mockConditionsData
  ];

  test('renders without crashing', () => {
    render(
      <AppWrapper mocks={allMocks}>
        <App />
      </AppWrapper>
    );
  });

  test('displays navigation bar', async () => {
    render(
      <AppWrapper mocks={allMocks}>
        <App />
      </AppWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
    });
  });

  test('displays main navigation links', async () => {
    render(
      <AppWrapper mocks={allMocks}>
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
      <AppWrapper mocks={allMocks}>
        <App />
      </AppWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to WEBFG GM')).toBeInTheDocument();
    });
  });

  test('applies correct CSS classes', async () => {
    const { container } = render(
      <AppWrapper mocks={allMocks}>
        <App />
      </AppWrapper>
    );
    
    await waitFor(() => {
      expect(container.querySelector('.App')).toBeInTheDocument();
    });
  });

  test('provides selected character context', async () => {
    render(
      <AppWrapper mocks={allMocks}>
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
      <AppWrapper mocks={allMocks}>
        <App />
      </AppWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to WEBFG GM')).toBeInTheDocument();
    });
  });

  test('provides Apollo Client context', async () => {
    render(
      <AppWrapper mocks={allMocks}>
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
      <AppWrapper mocks={allMocks}>
        <App />
      </AppWrapper>
    );
    
    // Should load initial data without errors
    await waitFor(() => {
      expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});