import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription, useApolloClient } from '@apollo/client';
import { 
  GET_ENCOUNTER,
  LIST_CHARACTERS,
  UPDATE_ENCOUNTER,
  ADD_CHARACTER_TO_ENCOUNTER,
  ADD_ACTION_TO_TIMELINE,
  ADVANCE_ENCOUNTER_TIME,
  UPDATE_CHARACTER_POSITION,
  ON_ENCOUNTER_TIMELINE_CHANGED,
  ON_ENCOUNTER_VTT_CHANGED,
  UPDATE_GRID_SIZE,
  ON_GRID_SIZE_CHANGED,
  ON_UPDATE_ENCOUNTER,
  ON_ENCOUNTER_CHARACTER_CHANGED
} from '../../graphql/operations';
import VirtualTableTop from './VirtualTableTop';
import Timeline from './Timeline';
import CharacterActionSelector from './CharacterActionSelector';
import { FaArrowLeft, FaPlay, FaPause, FaUserPlus, FaClock } from 'react-icons/fa';
import './EncounterDetail.css';

const EncounterDetail = () => {
  const { encounterId } = useParams();
  const navigate = useNavigate();
  const [timeInput, setTimeInput] = useState('');
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const client = useApolloClient();
  
  // Queries
  const { loading, error, data, refetch } = useQuery(GET_ENCOUNTER, {
    variables: { encounterId },
    fetchPolicy: 'network-only'
  });
  
  const { data: charactersData } = useQuery(LIST_CHARACTERS);
  
  // Mutations
  const [advanceEncounterTime] = useMutation(ADVANCE_ENCOUNTER_TIME);
  const [addCharacterToEncounter] = useMutation(ADD_CHARACTER_TO_ENCOUNTER);
  const [addActionToTimeline] = useMutation(ADD_ACTION_TO_TIMELINE);
  const [updateCharacterPosition] = useMutation(UPDATE_CHARACTER_POSITION);
  const [updateGridSize] = useMutation(UPDATE_GRID_SIZE);
  
  // Subscriptions
  useSubscription(ON_ENCOUNTER_TIMELINE_CHANGED, {
    variables: { encounterId },
    onData: ({ data }) => {
      if (data?.data?.onEncounterTimelineChanged) {
        const updatedEncounter = data.data.onEncounterTimelineChanged;
        client.cache.updateQuery(
          {
            query: GET_ENCOUNTER,
            variables: { encounterId }
          },
          () => ({
            getEncounter: updatedEncounter
          })
        );
      }
    }
  });
  
  useSubscription(ON_ENCOUNTER_VTT_CHANGED, {
    variables: { encounterId },
    onData: () => refetch()
  });
  
  useSubscription(ON_GRID_SIZE_CHANGED, {
    variables: { encounterId },
    onData: () => refetch()
  });
  
  useSubscription(ON_ENCOUNTER_CHARACTER_CHANGED, {
    variables: { encounterId },
    onData: ({ data }) => {
      if (data?.data?.onEncounterCharacterChanged) {
        const updatedEncounter = data.data.onEncounterCharacterChanged;
        client.cache.updateQuery(
          {
            query: GET_ENCOUNTER,
            variables: { encounterId }
          },
          () => ({
            getEncounter: updatedEncounter
          })
        );
      }
    }
  });
  
  // Get character by ID helper
  const getCharacterById = (characterId) => {
    if (!charactersData || !charactersData.listCharacters) return null;
    return charactersData.listCharacters.find(c => c.characterId === characterId);
  };
  
  const handleAdvanceTime = async () => {
    const newTime = parseFloat(timeInput);
    if (isNaN(newTime)) return;
    
    try {
      await advanceEncounterTime({
        variables: {
          encounterId,
          newTime
        }
      });
      setTimeInput('');
    } catch (err) {
      console.error('Error advancing time:', err);
    }
  };
  
  const handleAddCharacter = async (characterId, startTime = 0) => {
    try {
      // Calculate character position based on agility
      const character = getCharacterById(characterId);
      const agility = character?.attributes?.agility || 0;
      const calculatedStartTime = agility / 10; // Convert agility to seconds
      
      // Find an empty position on the grid (simple algorithm)
      const positions = data?.getEncounter?.characterPositions || [];
      const occupiedPositions = new Set();
      
      positions.forEach(pos => {
        occupiedPositions.add(`${pos.x},${pos.y}`);
      });
      
      let x = 0, y = 0;
      while (occupiedPositions.has(`${x},${y}`)) {
        x = (x + 1) % 10;
        if (x === 0) y++;
      }
      
      await addCharacterToEncounter({
        variables: {
          encounterId,
          characterId,
          startTime: startTime || calculatedStartTime,
          x,
          y
        }
      });
      
      setShowAddCharacterModal(false);
    } catch (err) {
      console.error('Error adding character:', err);
    }
  };
  
  const handleAddAction = async (characterId, actionId, actionName) => {
    try {
      const character = getCharacterById(characterId);
      const startTime = data.getEncounter.currentTime;
      
      // Add to history with full snapshot
      const historyEvent = {
        time: startTime,
        type: 'ACTION_STARTED',
        characterId,
        actionId,
        actionName,
        stats: {
          hitPoints: character.hitPoints,
          fatigue: character.fatigue,
          surges: character.surges,
          exhaustion: character.exhaustion
        },
        conditions: character.conditions || []
      };

      await addActionToTimeline({
        variables: {
          encounterId,
          characterId,
          actionId,
          startTime,
          historyEvent
        }
      });
    } catch (error) {
      console.error('Error adding action:', error);
    }
  };
  
  const handleMoveCharacter = async (characterId, x, y) => {
    try {
      await updateCharacterPosition({
        variables: {
          encounterId,
          characterId,
          x,
          y
        }
      });
    } catch (err) {
      console.error('Error moving character:', err);
    }
  };
  
  const handleGridSizeUpdate = async (rows, columns) => {
    try {
      await updateGridSize({
        variables: {
          input: {
            encounterId,
            rows,
            columns
          }
        }
      });
    } catch (error) {
      console.error('Failed to update grid size:', error);
    }
  };
  
  if (loading) return <p>Loading encounter...</p>;
  if (error) return <p>Error loading encounter: {error.message}</p>;
  
  const encounter = data?.getEncounter;
  if (!encounter) return <p>Encounter not found</p>;
  
  const characters = charactersData?.listCharacters || [];
  const availableCharacters = characters.filter(character => {
    const characterPositions = encounter.characterPositions || [];
    return !characterPositions.some(pos => pos.characterId === character.characterId);
  });
  
  return (
    <div className="encounter-detail-container">
      <div className="encounter-header">
        <button className="back-btn" onClick={() => navigate('/encounters')}>
          <FaArrowLeft /> Back to Encounters
        </button>
        <h1>{encounter.name}</h1>
        <div className="time-controls">
          <span className="current-time">Current Time: {encounter.currentTime}s</span>
          <div className="time-input-group">
            <input 
              type="number" 
              step="0.1"
              value={timeInput} 
              onChange={(e) => setTimeInput(e.target.value)}
              placeholder="Time (seconds)"
            />
            <button onClick={handleAdvanceTime}>
              <FaClock /> Set Time
            </button>
          </div>
        </div>
      </div>
      
      <div className="encounter-layout">
        <div className="vtt-container">
          <div className="vtt-header">
            <h2>Virtual Tabletop</h2>
            <button 
              className="add-character-btn"
              onClick={() => setShowAddCharacterModal(true)}
            >
              <FaUserPlus /> Add Character
            </button>
          </div>
          <VirtualTableTop 
            characters={encounter.characterPositions.map(pos => ({
              ...pos,
              name: getCharacterById(pos.characterId)?.name || 'Unknown',
              race: getCharacterById(pos.characterId)?.race || 'HUMAN'
            }))}
            gridElements={encounter.gridElements || []}
            history={encounter.history || []}
            currentTime={encounter.currentTime}
            onMoveCharacter={handleMoveCharacter}
            onSelectCharacter={setSelectedCharacter}
            gridRows={encounter.gridRows || 20}
            gridColumns={encounter.gridColumns || 20}
            onUpdateGridSize={handleGridSizeUpdate}
          />
        </div>
        
        <div className="timeline-container">
          <Timeline 
            currentTime={encounter.currentTime}
            characterTimelines={encounter.characterTimelines.map(timeline => {
              const character = getCharacterById(timeline.characterId);
              return {
                ...timeline,
                name: character?.name || 'Unknown',
                actions: timeline.actions.map(action => ({
                  ...action,
                  name: `Action ${action.actionId}`
                }))
              };
            })}
            history={encounter.history || []}
            onSelectCharacter={setSelectedCharacter}
          />
        </div>
      </div>
      
      {selectedCharacter && (
        <div className="character-action-panel">
          <h3>Select an action for {getCharacterById(selectedCharacter)?.name || selectedCharacter}</h3>
          <CharacterActionSelector 
            characterId={selectedCharacter}
            onSelectAction={(action) => handleAddAction(selectedCharacter, action.actionId, action.name)}
            onClose={() => setSelectedCharacter(null)}
          />
        </div>
      )}
      
      {showAddCharacterModal && (
        <div className="modal-overlay">
          <div className="add-character-modal">
            <h2>Add Character to Encounter</h2>
            <div className="available-characters-list">
              {availableCharacters.length === 0 ? (
                <p>No available characters to add.</p>
              ) : (
                availableCharacters.map(character => (
                  <div key={character.characterId} className="character-item">
                    <span>{character.name} ({character.race})</span>
                    <div className="character-add-controls">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Start Time"
                        className="start-time-input"
                      />
                      <button onClick={() => handleAddCharacter(character.characterId)}>
                        Add
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              className="close-modal-btn"
              onClick={() => setShowAddCharacterModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EncounterDetail; 