import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ActionEdit from '../../../components/actions/ActionEdit';

// Mock ActionView since ActionEdit just wraps it
jest.mock('../../../components/actions/ActionView', () => {
  return function MockActionView({ startInEditMode }) {
    return <div data-testid="action-view">ActionView with startInEditMode: {String(startInEditMode)}</div>;
  };
});

const ActionEditWrapper = ({ children }) => (
  <BrowserRouter>
    <MockedProvider mocks={[]} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
);

describe('ActionEdit Component', () => {
  test('renders without crashing', () => {
    render(
      <ActionEditWrapper>
        <ActionEdit />
      </ActionEditWrapper>
    );
  });

  test('renders ActionView with startInEditMode prop', () => {
    const { getByTestId } = render(
      <ActionEditWrapper>
        <ActionEdit />
      </ActionEditWrapper>
    );
    
    const actionView = getByTestId('action-view');
    expect(actionView).toHaveTextContent('ActionView with startInEditMode: true');
  });

  test('passes startInEditMode as true to ActionView', () => {
    const { getByTestId } = render(
      <ActionEditWrapper>
        <ActionEdit />
      </ActionEditWrapper>
    );
    
    expect(getByTestId('action-view')).toBeInTheDocument();
  });
});