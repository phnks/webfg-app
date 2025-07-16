import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import NavBar from '../../../components/nav/NavBar';
import { LIST_ENCOUNTERS } from '../../../graphql/operations';

const mockEncounterData = {
  request: {
    query: LIST_ENCOUNTERS
  },
  result: {
    data: {
      listEncounters: []
    }
  }
};

const NavBarWrapper = ({ children, mocks = [mockEncounterData] }) => (
  <BrowserRouter>
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
);

describe('NavBar Component', () => {
  test('renders without crashing', () => {
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
  });

  test('displays application title', () => {
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
    
    expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
  });

  test('displays navigation links', () => {
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
    
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Objects')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getByText('Encounters')).toBeInTheDocument();
  });

  test('navigation links have correct hrefs', () => {
    render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
    
    expect(screen.getByText('Characters').closest('a')).toHaveAttribute('href', '/characters');
    expect(screen.getByText('Objects').closest('a')).toHaveAttribute('href', '/objects');
    expect(screen.getByText('Actions').closest('a')).toHaveAttribute('href', '/actions');
    expect(screen.getByText('Conditions').closest('a')).toHaveAttribute('href', '/conditions');
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <NavBarWrapper>
        <NavBar />
      </NavBarWrapper>
    );
    
    expect(container.querySelector('.navbar')).toBeInTheDocument();
    expect(container.querySelector('.sidebar')).toBeInTheDocument();
    expect(container.querySelector('.section-tabs')).toBeInTheDocument();
  });

  test('renders with character list prop', () => {
    const characterList = [
      { characterId: '1', name: 'Test Character', race: 'Human' }
    ];
    
    render(
      <NavBarWrapper>
        <NavBar characterList={characterList} />
      </NavBarWrapper>
    );
    
    expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
  });

  test('renders with object list prop', () => {
    const objectList = [
      { objectId: '1', name: 'Test Object', objectCategory: 'WEAPON' }
    ];
    
    render(
      <NavBarWrapper>
        <NavBar objectList={objectList} />
      </NavBarWrapper>
    );
    
    expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
  });

  test('renders with action list prop', () => {
    const actionList = [
      { actionId: '1', name: 'Test Action', type: 'COMBAT' }
    ];
    
    render(
      <NavBarWrapper>
        <NavBar actionList={actionList} />
      </NavBarWrapper>
    );
    
    expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
  });

  test('renders with condition list prop', () => {
    const conditionList = [
      { conditionId: '1', name: 'Test Condition', conditionType: 'STATUS' }
    ];
    
    render(
      <NavBarWrapper>
        <NavBar conditionList={conditionList} />
      </NavBarWrapper>
    );
    
    expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
  });
});