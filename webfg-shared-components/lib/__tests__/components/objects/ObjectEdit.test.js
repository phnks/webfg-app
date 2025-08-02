import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ObjectEdit from '../../../components/objects/ObjectEdit';

// Mock ObjectView since ObjectEdit just wraps it
jest.mock('../../../components/objects/ObjectView', () => {
  return function MockObjectView({
    startInEditMode
  }) {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "object-view"
    }, "ObjectView with startInEditMode: ", String(startInEditMode));
  };
});
const ObjectEditWrapper = ({
  children
}) => /*#__PURE__*/React.createElement(BrowserRouter, null, /*#__PURE__*/React.createElement(MockedProvider, {
  mocks: [],
  addTypename: false
}, children));
describe('ObjectEdit Component', () => {
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(ObjectEditWrapper, null, /*#__PURE__*/React.createElement(ObjectEdit, null)));
  });
  test('renders ObjectView with startInEditMode prop', () => {
    const {
      getByTestId
    } = render(/*#__PURE__*/React.createElement(ObjectEditWrapper, null, /*#__PURE__*/React.createElement(ObjectEdit, null)));
    const objectView = getByTestId('object-view');
    expect(objectView).toHaveTextContent('ObjectView with startInEditMode: true');
  });
  test('passes startInEditMode as true to ObjectView', () => {
    const {
      getByTestId
    } = render(/*#__PURE__*/React.createElement(ObjectEditWrapper, null, /*#__PURE__*/React.createElement(ObjectEdit, null)));
    expect(getByTestId('object-view')).toBeInTheDocument();
  });
});