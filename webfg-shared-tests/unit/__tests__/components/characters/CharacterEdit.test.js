import React from 'react';
import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import CharacterEdit from '../../../components/characters/CharacterEdit';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

// Mock CharacterView since CharacterEdit just wraps it
jest.mock('../../../components/characters/CharacterView', () => {
  return function MockCharacterView({
    startInEditMode
  }) {
    return /*#__PURE__*/React.createElement("div", {
      "data-testid": "character-view"
    }, "CharacterView with startInEditMode: ", String(startInEditMode));
  };
});
const CharacterEditWrapper = ({
  children
}) => /*#__PURE__*/React.createElement(BrowserRouter, null, /*#__PURE__*/React.createElement(MockedProvider, {
  mocks: [],
  addTypename: false
}, /*#__PURE__*/React.createElement(SelectedCharacterProvider, null, children)));
describe('CharacterEdit Component', () => {
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(CharacterEditWrapper, null, /*#__PURE__*/React.createElement(CharacterEdit, null)));
  });
  test('renders CharacterView with startInEditMode prop', () => {
    const {
      getByTestId
    } = render(/*#__PURE__*/React.createElement(CharacterEditWrapper, null, /*#__PURE__*/React.createElement(CharacterEdit, null)));
    const characterView = getByTestId('character-view');
    expect(characterView).toHaveTextContent('CharacterView with startInEditMode: true');
  });
  test('passes startInEditMode as true to CharacterView', () => {
    const {
      getByTestId
    } = render(/*#__PURE__*/React.createElement(CharacterEditWrapper, null, /*#__PURE__*/React.createElement(CharacterEdit, null)));
    expect(getByTestId('character-view')).toBeInTheDocument();
  });
});