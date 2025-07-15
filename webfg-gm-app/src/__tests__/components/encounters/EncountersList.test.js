import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import EncountersList from '../../../components/encounters/EncountersList';
import { LIST_ENCOUNTERS } from '../../../graphql/operations';

const mockEncountersData = {
  request: {
    query: LIST_ENCOUNTERS
  },
  result: {
    data: {
      listEncounters: [
        {
          encounterId: '1',
          name: 'Forest Ambush',
          description: 'A dangerous encounter in the woods',
          round: 3,
          currentTime: 150,
          initiative: 12
        },
        {
          encounterId: '2',
          name: 'Cave Exploration',
          description: 'Exploring a mysterious cave',
          round: 1,
          currentTime: 30,
          initiative: 8
        }
      ]
    }
  }
};

const EncountersListWrapper = ({ children, mocks = [mockEncountersData] }) => (
  <BrowserRouter>
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
);

describe('EncountersList Component', () => {
  test('renders without crashing', () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );
  });

  test('displays loading state initially', () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );
    
    expect(screen.getByText('Loading encounters...')).toBeInTheDocument();
  });

  test('displays encounters after loading', async () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Forest Ambush')).toBeInTheDocument();
      expect(screen.getByText('Cave Exploration')).toBeInTheDocument();
    });
  });

  test('displays encounter details', async () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('A dangerous encounter in the woods')).toBeInTheDocument();
      expect(screen.getByText('Exploring a mysterious cave')).toBeInTheDocument();
    });
  });

  test('displays encounter rounds', async () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Round: 3')).toBeInTheDocument();
      expect(screen.getByText('Round: 1')).toBeInTheDocument();
    });
  });

  test('displays encounter time', async () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Time: 150s')).toBeInTheDocument();
      expect(screen.getByText('Time: 30s')).toBeInTheDocument();
    });
  });

  test('handles empty encounters list', () => {
    const emptyMock = {
      request: {
        query: LIST_ENCOUNTERS
      },
      result: {
        data: {
          listEncounters: []
        }
      }
    };

    render(
      <EncountersListWrapper mocks={[emptyMock]}>
        <EncountersList />
      </EncountersListWrapper>
    );

    expect(screen.getByText('No encounters found')).toBeInTheDocument();
  });

  test('handles query error', () => {
    const errorMock = {
      request: {
        query: LIST_ENCOUNTERS
      },
      error: new Error('Network error')
    };

    render(
      <EncountersListWrapper mocks={[errorMock]}>
        <EncountersList />
      </EncountersListWrapper>
    );

    expect(screen.getByText('Error loading encounters')).toBeInTheDocument();
  });

  test('displays create new encounter button', () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );
    
    expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
  });

  test('applies correct CSS classes', async () => {
    const { container } = render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );
    
    expect(container.querySelector('.encounters-list')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(container.querySelector('.encounter-item')).toBeInTheDocument();
    });
  });

  test('displays encounter cards', async () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      const encounterCards = screen.getAllByRole('article');
      expect(encounterCards).toHaveLength(2);
    });
  });

  test('handles encounter click navigation', async () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      const encounterLink = screen.getByText('Forest Ambush').closest('a');
      expect(encounterLink).toHaveAttribute('href', '/encounters/1');
    });
  });

  test('displays encounter initiative', async () => {
    render(
      <EncountersListWrapper>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Initiative: 12')).toBeInTheDocument();
      expect(screen.getByText('Initiative: 8')).toBeInTheDocument();
    });
  });

  test('handles missing encounter properties', async () => {
    const incompleteEncounterMock = {
      request: {
        query: LIST_ENCOUNTERS
      },
      result: {
        data: {
          listEncounters: [
            {
              encounterId: '1',
              name: 'Incomplete Encounter'
              // Missing other properties
            }
          ]
        }
      }
    };

    render(
      <EncountersListWrapper mocks={[incompleteEncounterMock]}>
        <EncountersList />
      </EncountersListWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Incomplete Encounter')).toBeInTheDocument();
    });
  });
});