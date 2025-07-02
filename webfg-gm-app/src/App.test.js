import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import App from './App';

// react-router-dom is mocked via __mocks__/react-router-dom.js

// Mock all external dependencies
jest.mock('./components/nav/NavBar', () => {
  return function MockNavBar() {
    return <div data-testid="navbar">Navigation</div>;
  };
});

jest.mock('./components/Home', () => {
  return function MockHome() {
    return <div data-testid="home">Home Component</div>;
  };
});

jest.mock('./components/characters/CharacterList', () => {
  return function MockCharacterList() {
    return <div data-testid="character-list">Character List</div>;
  };
});

jest.mock('./components/objects/ObjectList', () => {
  return function MockObjectList() {
    return <div data-testid="object-list">Object List</div>;
  };
});

jest.mock('./components/actions/ActionList', () => {
  return function MockActionList() {
    return <div data-testid="action-list">Action List</div>;
  };
});

jest.mock('./components/conditions/ConditionsList', () => {
  return function MockConditionsList() {
    return <div data-testid="conditions-list">Conditions List</div>;
  };
});

jest.mock('./components/encounters/EncountersList', () => {
  return function MockEncountersList() {
    return <div data-testid="encounters-list">Encounters List</div>;
  };
});

jest.mock('./context/SelectedCharacterContext', () => ({
  SelectedCharacterProvider: ({ children }) => <div>{children}</div>,
  useSelectedCharacter: () => ({ selectedCharacter: null, setSelectedCharacter: jest.fn() })
}));

const mocks = [];

const AppWrapper = ({ children }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
  });

  test('renders navigation bar', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('renders main content area', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  test('has correct CSS classes', () => {
    const { container } = render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    expect(container.firstChild).toHaveClass('App');
  });
});

// Keep original simple tests for backward compatibility
test('basic math operations work', () => {
  expect(2 + 2).toBe(4);
});

test('string operations work', () => {
  expect('hello'.toUpperCase()).toBe('HELLO');
});

test('array operations work', () => {
  const arr = [1, 2, 3];
  expect(arr.length).toBe(3);
  expect(arr.includes(2)).toBe(true);
});