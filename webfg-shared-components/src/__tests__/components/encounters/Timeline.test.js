import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import Timeline from '../../../components/encounters/Timeline';
import { GET_ACTIONS } from '../../../graphql/operations';

const mockHistory = [
  {
    eventId: '1',
    round: 1,
    initiative: 15,
    type: 'ACTION',
    description: 'Hero attacks with sword',
    characterId: '1',
    characterName: 'Hero',
    timestamp: '2023-01-01T10:00:00Z',
    actionId: 'action1',
    time: 10.5
  },
  {
    eventId: '2',
    round: 1,
    initiative: 12,
    type: 'MOVEMENT',
    description: 'Villain moves north',
    characterId: '2',
    characterName: 'Villain',
    timestamp: '2023-01-01T10:01:00Z',
    time: 15.2
  }
];

const mockActionData = {
  request: {
    query: GET_ACTIONS,
    variables: { actionIds: ['action1'] }
  },
  result: {
    data: {
      getActions: [
        {
          actionId: 'action1',
          name: 'Sword Attack'
        }
      ]
    }
  }
};

const TimelineWrapper = ({ children }) => (
  <MockedProvider mocks={[mockActionData]} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('Timeline Component', () => {
  test('renders without crashing', () => {
    render(
      <TimelineWrapper>
        <Timeline history={mockHistory} currentTime={100} />
      </TimelineWrapper>
    );
  });

  test('renders with empty history', () => {
    render(
      <TimelineWrapper>
        <Timeline history={[]} currentTime={100} />
      </TimelineWrapper>
    );
  });

  test('renders with null history', () => {
    render(
      <TimelineWrapper>
        <Timeline history={null} currentTime={100} />
      </TimelineWrapper>
    );
  });

  test('renders with undefined history', () => {
    render(
      <TimelineWrapper>
        <Timeline history={undefined} currentTime={100} />
      </TimelineWrapper>
    );
  });

  test('handles onSelectCharacter callback', () => {
    const mockOnSelectCharacter = jest.fn();
    render(
      <TimelineWrapper>
        <Timeline 
          history={mockHistory} 
          currentTime={100} 
          onSelectCharacter={mockOnSelectCharacter}
        />
      </TimelineWrapper>
    );
  });

  test('handles different currentTime values', () => {
    render(
      <TimelineWrapper>
        <Timeline history={mockHistory} currentTime={0} />
      </TimelineWrapper>
    );
    
    render(
      <TimelineWrapper>
        <Timeline history={mockHistory} currentTime={999} />
      </TimelineWrapper>
    );
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <TimelineWrapper>
        <Timeline history={mockHistory} currentTime={100} />
      </TimelineWrapper>
    );
    
    expect(container.querySelector('.timeline-wrapper')).toBeInTheDocument();
  });
});