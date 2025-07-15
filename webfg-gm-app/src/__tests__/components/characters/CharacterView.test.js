import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import CharacterView from '../../../components/characters/CharacterView';
import { SelectedCharacterProvider } from '../../../context/SelectedCharacterContext';

// Mock all complex subcomponents to avoid GraphQL dependencies
jest.mock('../../../components/characters/CharacterStats', () => {
  return function MockCharacterStats() {
    return <div data-testid="character-stats">Character Stats</div>;
  };
});

jest.mock('../../../components/characters/CharacterPhysical', () => {
  return function MockCharacterPhysical() {
    return <div data-testid="character-physical">Character Physical</div>;
  };
});

jest.mock('../../../components/characters/CharacterEquipment', () => {
  return function MockCharacterEquipment() {
    return <div data-testid="character-equipment">Character Equipment</div>;
  };
});

jest.mock('../../../components/characters/CharacterStash', () => {
  return function MockCharacterStash() {
    return <div data-testid="character-stash">Character Stash</div>;
  };
});

jest.mock('../../../components/characters/CharacterReadyObjects', () => {
  return function MockCharacterReadyObjects() {
    return <div data-testid="character-ready-objects">Character Ready Objects</div>;
  };
});

jest.mock('../../../components/characters/CharacterActions', () => {
  return function MockCharacterActions() {
    return <div data-testid="character-actions">Character Actions</div>;
  };
});

jest.mock('../../../components/characters/CharacterConditions', () => {
  return function MockCharacterConditions() {
    return <div data-testid="character-conditions">Character Conditions</div>;
  };
});

jest.mock('../../../components/characters/CharacterBodyParts', () => {
  return function MockCharacterBodyParts() {
    return <div data-testid="character-body-parts">Character Body Parts</div>;
  };
});

jest.mock('../../../components/characters/CharacterForm', () => {
  return function MockCharacterForm() {
    return <div data-testid="character-form">Character Form</div>;
  };
});

const CharacterViewWrapper = ({ children }) => (
  <BrowserRouter>
    <MockedProvider mocks={[]} addTypename={false}>
      <SelectedCharacterProvider>
        {children}
      </SelectedCharacterProvider>
    </MockedProvider>
  </BrowserRouter>
);

describe('CharacterView Component', () => {
  test('renders without crashing', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView />
      </CharacterViewWrapper>
    );
  });

  test('renders with character prop', () => {
    const mockCharacter = {
      id: '1',
      name: 'Test Character',
      description: 'A test character'
    };
    
    render(
      <CharacterViewWrapper>
        <CharacterView character={mockCharacter} />
      </CharacterViewWrapper>
    );
  });

  test('renders with startInEditMode prop', () => {
    render(
      <CharacterViewWrapper>
        <CharacterView startInEditMode={true} />
      </CharacterViewWrapper>
    );
  });
});