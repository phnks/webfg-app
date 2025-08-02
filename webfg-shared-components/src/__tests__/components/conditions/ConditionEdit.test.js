import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ConditionEdit from '../../../components/conditions/ConditionEdit';

// Mock ConditionView since ConditionEdit just wraps it
jest.mock('../../../components/conditions/ConditionView', () => {
  return function MockConditionView({ startInEditMode }) {
    return <div data-testid="condition-view">ConditionView with startInEditMode: {String(startInEditMode)}</div>;
  };
});

const ConditionEditWrapper = ({ children }) => (
  <BrowserRouter>
    <MockedProvider mocks={[]} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
);

describe('ConditionEdit Component', () => {
  test('renders without crashing', () => {
    render(
      <ConditionEditWrapper>
        <ConditionEdit />
      </ConditionEditWrapper>
    );
  });

  test('renders ConditionView with startInEditMode prop', () => {
    const { getByTestId } = render(
      <ConditionEditWrapper>
        <ConditionEdit />
      </ConditionEditWrapper>
    );
    
    const conditionView = getByTestId('condition-view');
    expect(conditionView).toHaveTextContent('ConditionView with startInEditMode: true');
  });

  test('passes startInEditMode as true to ConditionView', () => {
    const { getByTestId } = render(
      <ConditionEditWrapper>
        <ConditionEdit />
      </ConditionEditWrapper>
    );
    
    expect(getByTestId('condition-view')).toBeInTheDocument();
  });
});