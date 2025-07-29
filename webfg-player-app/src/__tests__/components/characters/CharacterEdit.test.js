import React from 'react';
import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import CharacterEdit from '../../../components/characters/CharacterEdit';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

// Mock CharacterView since CharacterEdit just wraps it
jest.mock('../../../components/characters/CharacterView', () => {
  return function MockCharacterView({ startInEditMode }) {
    return <div data-testid="character-view">CharacterView with startInEditMode: {String(startInEditMode)}</div>;
  };
});

const CharacterEditWrapper = ({ children }) => (
  <BrowserRouter>
    <MockedProvider mocks={[]} addTypename={false}>
      <SelectedCharacterProvider>
        {children}
      </SelectedCharacterProvider>
    </MockedProvider>
  </BrowserRouter>
);

describe('CharacterEdit Component', () => {
  test('renders without crashing', () => {
    render(
      <CharacterEditWrapper>
        <CharacterEdit />
      </CharacterEditWrapper>
    );
  });

  test('renders CharacterView with startInEditMode prop', () => {
    const { getByTestId } = render(
      <CharacterEditWrapper>
        <CharacterEdit />
      </CharacterEditWrapper>
    );
    
    const characterView = getByTestId('character-view');
    expect(characterView).toHaveTextContent('CharacterView with startInEditMode: true');
  });

  test('passes startInEditMode as true to CharacterView', () => {
    const { getByTestId } = render(
      <CharacterEditWrapper>
        <CharacterEdit />
      </CharacterEditWrapper>
    );
    
    expect(getByTestId('character-view')).toBeInTheDocument();
  });
});