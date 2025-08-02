import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ConditionEdit from '../../../components/conditions/ConditionEdit';

// Mock ConditionView since ConditionEdit just wraps it
jest.mock('../../../components/conditions/ConditionView', () => {
  return function MockConditionView({
    startInEditMode
  }) {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "condition-view"
    }, "ConditionView with startInEditMode: ", String(startInEditMode));
  };
});
const ConditionEditWrapper = ({
  children
}) => /*#__PURE__*/React.createElement(BrowserRouter, null, /*#__PURE__*/React.createElement(MockedProvider, {
  mocks: [],
  addTypename: false
}, children));
describe('ConditionEdit Component', () => {
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(ConditionEditWrapper, null, /*#__PURE__*/React.createElement(ConditionEdit, null)));
  });
  test('renders ConditionView with startInEditMode prop', () => {
    const {
      getByTestId
    } = render(/*#__PURE__*/React.createElement(ConditionEditWrapper, null, /*#__PURE__*/React.createElement(ConditionEdit, null)));
    const conditionView = getByTestId('condition-view');
    expect(conditionView).toHaveTextContent('ConditionView with startInEditMode: true');
  });
  test('passes startInEditMode as true to ConditionView', () => {
    const {
      getByTestId
    } = render(/*#__PURE__*/React.createElement(ConditionEditWrapper, null, /*#__PURE__*/React.createElement(ConditionEdit, null)));
    expect(getByTestId('condition-view')).toBeInTheDocument();
  });
});