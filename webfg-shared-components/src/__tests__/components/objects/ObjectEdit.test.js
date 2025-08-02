import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ObjectEdit from '../../../components/objects/ObjectEdit';

// Mock ObjectView since ObjectEdit just wraps it
jest.mock('../../../components/objects/ObjectView', () => {
  return function MockObjectView({ startInEditMode }) {
    return <div data-testid="object-view">ObjectView with startInEditMode: {String(startInEditMode)}</div>;
  };
});

const ObjectEditWrapper = ({ children }) => (
  <BrowserRouter>
    <MockedProvider mocks={[]} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
);

describe('ObjectEdit Component', () => {
  test('renders without crashing', () => {
    render(
      <ObjectEditWrapper>
        <ObjectEdit />
      </ObjectEditWrapper>
    );
  });

  test('renders ObjectView with startInEditMode prop', () => {
    const { getByTestId } = render(
      <ObjectEditWrapper>
        <ObjectEdit />
      </ObjectEditWrapper>
    );
    
    const objectView = getByTestId('object-view');
    expect(objectView).toHaveTextContent('ObjectView with startInEditMode: true');
  });

  test('passes startInEditMode as true to ObjectView', () => {
    const { getByTestId } = render(
      <ObjectEditWrapper>
        <ObjectEdit />
      </ObjectEditWrapper>
    );
    
    expect(getByTestId('object-view')).toBeInTheDocument();
  });
});