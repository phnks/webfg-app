import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ActionEdit from '../../../components/actions/ActionEdit';

// Mock ActionView since ActionEdit just wraps it
jest.mock('../../../components/actions/ActionView', () => {
  return function MockActionView({
    startInEditMode
  }) {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "action-view"
    }, "ActionView with startInEditMode: ", String(startInEditMode));
  };
});
const ActionEditWrapper = ({
  children
}) => /*#__PURE__*/React.createElement(BrowserRouter, null, /*#__PURE__*/React.createElement(MockedProvider, {
  mocks: [],
  addTypename: false
}, children));
describe('ActionEdit Component', () => {
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(ActionEditWrapper, null, /*#__PURE__*/React.createElement(ActionEdit, null)));
  });
  test('renders ActionView with startInEditMode prop', () => {
    const {
      getByTestId
    } = render(/*#__PURE__*/React.createElement(ActionEditWrapper, null, /*#__PURE__*/React.createElement(ActionEdit, null)));
    const actionView = getByTestId('action-view');
    expect(actionView).toHaveTextContent('ActionView with startInEditMode: true');
  });
  test('passes startInEditMode as true to ActionView', () => {
    const {
      getByTestId
    } = render(/*#__PURE__*/React.createElement(ActionEditWrapper, null, /*#__PURE__*/React.createElement(ActionEdit, null)));
    expect(getByTestId('action-view')).toBeInTheDocument();
  });
});