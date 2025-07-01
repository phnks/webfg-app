import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import App from '../src/App';

// Mock all external dependencies
jest.mock('../src/components/nav/NavBar', () => {
  return function MockNavBar() {
    return <div data-testid="navbar">Navigation</div>;
  };
});

jest.mock('../src/components/Home', () => {
  return function MockHome() {
    return <div data-testid="home">Home Component</div>;
  };
});

jest.mock('../src/components/characters/CharacterList', () => {
  return function MockCharacterList() {
    return <div data-testid="character-list">Character List</div>;
  };
});

jest.mock('../src/components/objects/ObjectList', () => {
  return function MockObjectList() {
    return <div data-testid="object-list">Object List</div>;
  };
});

jest.mock('../src/components/actions/ActionList', () => {
  return function MockActionList() {
    return <div data-testid="action-list">Action List</div>;
  };
});

jest.mock('../src/components/conditions/ConditionsList', () => {
  return function MockConditionsList() {
    return <div data-testid="conditions-list">Conditions List</div>;
  };
});

jest.mock('../src/components/encounters/EncountersList', () => {
  return function MockEncountersList() {
    return <div data-testid="encounters-list">Encounters List</div>;
  };
});

const mocks = [];

const AppWrapper = ({ children }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
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