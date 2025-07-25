import React from 'react';
import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { SelectedCharacterProvider } from '../context/SelectedCharacterContext';

// Mock Apollo Client queries and mutations
export const mockCharacters = [
  {
    id: '1',
    name: 'The Guy',
    category: 'HUMAN',
    description: 'A perfectly average person with 10 in every attribute',
    strength: 10,
    dexterity: 10,
    agility: 10,
    endurance: 10,
    vigor: 10,
    obscurity: 10,
    intelligence: 10,
    will: 10,
    social: 10,
    faith: 10,
    armor: 10,
    lethality: 10,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Commoner',
    category: 'HUMAN',
    description: 'A weak individual with 1 in every attribute',
    strength: 1,
    dexterity: 1,
    agility: 1,
    endurance: 1,
    vigor: 1,
    obscurity: 1,
    intelligence: 1,
    will: 1,
    social: 1,
    faith: 1,
    armor: 1,
    lethality: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

export const mockObjects = [
  {
    id: '1',
    name: 'Longsword',
    category: 'WEAPON',
    description: 'A standard medieval longsword',
    speed: 3,
    weight: 15,
    size: 4,
    armor: 0,
    lethality: 15,
    dexterity: 2,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Chainmail',
    category: 'ARMOR',
    description: 'Flexible armor made of interlocking metal rings',
    speed: -2,
    weight: 40,
    size: 3,
    armor: 20,
    agility: -3,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

export const mockActions = [
  {
    id: '1',
    name: 'Hit',
    description: 'A basic attack action',
    source: 'dexterity',
    target: 'agility',
    type: 'trigger',
    triggersActionId: '2',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Break',
    description: 'Breaking armor or objects',
    source: 'strength',
    target: 'armor',
    type: 'trigger',
    triggersActionId: '3',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

export const mockConditions = [
  {
    id: '1',
    name: 'Grapple',
    description: 'Being held or restrained by an opponent',
    type: 'hinder',
    attribute: 'agility',
    value: 5,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Aim',
    description: 'Taking careful aim to improve accuracy',
    type: 'help',
    attribute: 'dexterity',
    value: 3,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

// Default GraphQL mocks
export const defaultMocks = [
  {
    request: {
      query: require('../graphql/operations').LIST_CHARACTERS
    },
    result: {
      data: {
        listCharacters: {
          items: mockCharacters
        }
      }
    }
  },
  {
    request: {
      query: require('../graphql/operations').LIST_OBJECTS
    },
    result: {
      data: {
        listObjects: {
          items: mockObjects
        }
      }
    }
  },
  {
    request: {
      query: require('../graphql/operations').LIST_ACTIONS
    },
    result: {
      data: {
        listActions: {
          items: mockActions
        }
      }
    }
  },
  {
    request: {
      query: require('../graphql/operations').LIST_CONDITIONS
    },
    result: {
      data: {
        listConditions: {
          items: mockConditions
        }
      }
    }
  }
];

// Custom render function that includes all providers
export function renderWithProviders(
  ui,
  {
    mocks = defaultMocks,
    initialEntries = ['/'],
    selectedCharacter = null,
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={initialEntries}>
          <SelectedCharacterProvider initialCharacter={selectedCharacter}>
            {children}
          </SelectedCharacterProvider>
        </MemoryRouter>
      </MockedProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    // Return additional utilities for testing
    mockCharacters,
    mockObjects,
    mockActions,
    mockConditions
  };
}

// Helper to create mutation mocks
export function createMutationMock(mutationName, variables, result, error = null) {
  return {
    request: {
      query: require('../graphql/operations')[mutationName],
      variables
    },
    result: error ? { errors: [error] } : { data: result },
    error: error
  };
}

// Helper to create subscription mocks
export function createSubscriptionMock(subscriptionName, result) {
  return {
    request: {
      query: require('../graphql/operations')[subscriptionName]
    },
    result: {
      data: result
    }
  };
}

// Mock localStorage for testing
export const mockLocalStorage = {
  store: {},
  getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  })
};

// Setup function for tests
export function setupTestEnvironment() {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
  });

  // Clear localStorage before each test
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });
}

// Utility to wait for Apollo Client operations
export async function waitForApollo() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

// Form testing utilities
export const formUtils = {
  fillInput: (input, value) => {
    input.focus();
    input.setSelectionRange(0, input.value.length);
    input.type(value);
  },
  
  selectOption: (select, value) => {
    select.focus();
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  },
  
  submitForm: (form) => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
};

export * from '@testing-library/react';
export { renderWithProviders as render };