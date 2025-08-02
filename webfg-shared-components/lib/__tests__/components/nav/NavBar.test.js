import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import NavBar from '../../../components/nav/NavBar';
import { RecentlyViewedProvider } from '../../../context/RecentlyViewedContext';
import { LIST_ENCOUNTERS } from '../../graphql/operations';
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
const NavBarWrapper = ({
  children,
  mocks = [mockEncounterData]
}) => /*#__PURE__*/React.createElement(BrowserRouter, null, /*#__PURE__*/React.createElement(MockedProvider, {
  mocks: mocks,
  addTypename: false
}, /*#__PURE__*/React.createElement(RecentlyViewedProvider, null, children)));
describe('NavBar Component', () => {
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(NavBarWrapper, null, /*#__PURE__*/React.createElement(NavBar, null)));
  });
  test('displays application title', () => {
    render(/*#__PURE__*/React.createElement(NavBarWrapper, null, /*#__PURE__*/React.createElement(NavBar, null)));
    expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
  });
  test('displays navigation links', () => {
    render(/*#__PURE__*/React.createElement(NavBarWrapper, null, /*#__PURE__*/React.createElement(NavBar, null)));
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Objects')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getByText('Encounters')).toBeInTheDocument();
  });
  test('navigation links have correct hrefs', () => {
    render(/*#__PURE__*/React.createElement(NavBarWrapper, null, /*#__PURE__*/React.createElement(NavBar, null)));
    expect(screen.getByText('Characters').closest('a')).toHaveAttribute('href', '/characters');
    expect(screen.getByText('Objects').closest('a')).toHaveAttribute('href', '/objects');
    expect(screen.getByText('Actions').closest('a')).toHaveAttribute('href', '/actions');
    expect(screen.getByText('Conditions').closest('a')).toHaveAttribute('href', '/conditions');
  });
  test('applies correct CSS classes', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(NavBarWrapper, null, /*#__PURE__*/React.createElement(NavBar, null)));
    expect(container.querySelector('.navbar')).toBeInTheDocument();
    expect(container.querySelector('.sidebar')).toBeInTheDocument();
    expect(container.querySelector('.section-tabs')).toBeInTheDocument();
  });
  test('renders with character list prop', () => {
    const characterList = [{
      characterId: '1',
      name: 'Test Character',
      race: 'Human'
    }];
    render(/*#__PURE__*/React.createElement(NavBarWrapper, null, /*#__PURE__*/React.createElement(NavBar, {
      characterList: characterList
    })));
    expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
  });
  test('renders with object list prop', () => {
    const objectList = [{
      objectId: '1',
      name: 'Test Object',
      objectCategory: 'WEAPON'
    }];
    render(/*#__PURE__*/React.createElement(NavBarWrapper, null, /*#__PURE__*/React.createElement(NavBar, {
      objectList: objectList
    })));
    expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
  });
  test('renders with action list prop', () => {
    const actionList = [{
      actionId: '1',
      name: 'Test Action',
      type: 'COMBAT'
    }];
    render(/*#__PURE__*/React.createElement(NavBarWrapper, null, /*#__PURE__*/React.createElement(NavBar, {
      actionList: actionList
    })));
    expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
  });
  test('renders with condition list prop', () => {
    const conditionList = [{
      conditionId: '1',
      name: 'Test Condition',
      conditionType: 'STATUS'
    }];
    render(/*#__PURE__*/React.createElement(NavBarWrapper, null, /*#__PURE__*/React.createElement(NavBar, {
      conditionList: conditionList
    })));
    expect(screen.getByText('WEBFG GM')).toBeInTheDocument();
  });
});