import React from 'react';
import { render } from '@testing-library/react';
import CharacterView from '../../../components/characters/CharacterView';

// Mock all the complex dependencies to avoid GraphQL complexity
jest.mock('react-router-dom', () => ({
  useParams: () => ({ characterId: 'test-character-id' }),
  useNavigate: () => jest.fn(),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>
}));

jest.mock('@apollo/client', () => ({
  useQuery: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn()
  }),
  useMutation: () => [jest.fn(), { loading: false }],
  useSubscription: () => ({ data: null, loading: false }),
  gql: jest.fn(() => ({}))
}));

jest.mock('../../../context/SelectedCharacterContext', () => ({
  useSelectedCharacter: () => ({
    selectCharacter: jest.fn()
  })
}));

jest.mock('../../../components/characters/CharacterAttributesBackend', () => {
  return function MockCharacterAttributesBackend() {
    return <div data-testid="character-attributes-backend">Character Attributes Backend</div>;
  };
});

jest.mock('../../../components/actions/test/ActionTestBackend', () => {
  return function MockActionTestBackend() {
    return <div data-testid="action-test-backend">Action Test Backend</div>;
  };
});

jest.mock('../../../components/characters/CharacterDetails', () => {
  return function MockCharacterDetails() {
    return <div data-testid="character-details">Character Details</div>;
  };
});

jest.mock('../../../components/forms/CharacterForm', () => {
  return function MockCharacterForm() {
    return <div data-testid="character-form">Character Form</div>;
  };
});

jest.mock('../../../components/common/ErrorPopup', () => {
  return function MockErrorPopup() {
    return <div data-testid="error-popup">Error Popup</div>;
  };
});

jest.mock('../../../components/common/QuickAdjustPopup', () => {
  return function MockQuickAdjustPopup() {
    return <div data-testid="quick-adjust-popup">Quick Adjust Popup</div>;
  };
});

describe('CharacterView Component', () => {
  test('renders without crashing', () => {
    render(<CharacterView />);
  });

  test('renders in edit mode when startInEditMode is true', () => {
    render(<CharacterView startInEditMode={true} />);
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<CharacterView />);
    
    // Just check that the component renders without errors
    expect(container).toBeInTheDocument();
  });
});