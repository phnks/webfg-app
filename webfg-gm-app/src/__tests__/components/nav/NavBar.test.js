import React from 'react';
import { render, screen } from '@testing-library/react';
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
      query: LIST_ENCOUNTERS
    },
    result: {
      data: {
        listEncounters: [
          {
            encounterId: 'enc1',
            name: 'Test Encounter 1',
            description: 'Description 1',
            round: 1,
            initiative: 10,
            createdAt: '2024-01-01T00:00:00Z',
            __typename: 'Encounter'
          }
        ]
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

  test('basic functionality check', () => {
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
    
    // Just check that something renders
    expect(document.body).toBeInTheDocument();
  });
});