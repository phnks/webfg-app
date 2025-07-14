import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import ActionView from '../../../components/actions/ActionView';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn()
}));

const mocks = [];

const ActionViewWrapper = ({ apolloMocks = mocks, children }) => (
  <MockedProvider mocks={apolloMocks} addTypename={false}>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </MockedProvider>
);

describe('ActionView Component', () => {
  test('renders without crashing', () => {
    render(
      <ActionViewWrapper>
        <ActionView />
      </ActionViewWrapper>
    );
  });

  test('displays loading state initially', () => {
    render(
      <ActionViewWrapper>
        <ActionView />
      </ActionViewWrapper>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders with action ID from URL params', () => {
    render(
      <ActionViewWrapper>
        <ActionView />
      </ActionViewWrapper>
    );
    
    // Component should render and attempt to load action with ID '1'
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('has proper CSS classes applied', () => {
    const { container } = render(
      <ActionViewWrapper>
        <ActionView />
      </ActionViewWrapper>
    );
    
    expect(container.querySelector('.action-view-container')).toBeInTheDocument();
  });

  test('component structure includes main sections', () => {
    render(
      <ActionViewWrapper>
        <ActionView />
      </ActionViewWrapper>
    );
    
    // Component should have basic structure even in loading state
    const container = document.querySelector('.action-view-container');
    expect(container).toBeInTheDocument();
  });
});