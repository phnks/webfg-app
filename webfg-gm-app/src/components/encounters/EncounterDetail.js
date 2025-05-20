import React, { useState } from 'react';
import ErrorPopup from '../common/ErrorPopup';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_ENCOUNTER,
  LIST_CHARACTERS,
  UPDATE_ENCOUNTER,
  DELETE_ENCOUNTER,
  ADD_CHARACTER_TO_ENCOUNTER,
  REMOVE_CHARACTER_FROM_ENCOUNTER,
  ADD_EVENT_TO_ENCOUNTER,
  ADVANCE_ROUND,
  ADVANCE_INITIATIVE,
  ARCHIVE_CURRENT_EVENTS,
  ON_ENCOUNTER_EVENTS_CHANGED,
  ON_ENCOUNTER_ROUND_CHANGED
} from '../../graphql/operations';
import { FaArrowLeft, FaUserPlus, FaDiceD20, FaStepForward, FaArchive } from 'react-icons/fa';
import './EncounterDetail.css';

const EncounterDetail = () => {
  const { encounterId } = useParams();
  const navigate = useNavigate();
  const [mutationError, setMutationError] = useState(null);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [selectedInitiative, setSelectedInitiative] = useState(1);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventData, setEventData] = useState({
    initiative: 1,
    type: 'ACTION',
    characterId: '',
    actionId: '',
    description: ''
  });

  // Queries
  const { loading, error, data } = useQuery(GET_ENCOUNTER, {
    variables: { encounterId },
    fetchPolicy: 'network-only'
  });

  const { data: charactersData } = useQuery(LIST_CHARACTERS);

  // Mutations
  const [updateEncounter] = useMutation(UPDATE_ENCOUNTER);
  const [deleteEncounter] = useMutation(DELETE_ENCOUNTER);
  const [addCharacterToEncounter] = useMutation(ADD_CHARACTER_TO_ENCOUNTER);
  const [removeCharacterFromEncounter] = useMutation(REMOVE_CHARACTER_FROM_ENCOUNTER);
  const [addEventToEncounter] = useMutation(ADD_EVENT_TO_ENCOUNTER);
  const [advanceRound] = useMutation(ADVANCE_ROUND);
  const [advanceInitiative] = useMutation(ADVANCE_INITIATIVE);
  const [archiveCurrentEvents] = useMutation(ARCHIVE_CURRENT_EVENTS);

  // Subscriptions
  useSubscription(ON_ENCOUNTER_EVENTS_CHANGED, {
    variables: { encounterId }
  });

  useSubscription(ON_ENCOUNTER_ROUND_CHANGED, {
    variables: { encounterId }
  });

  // Event handlers
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this encounter?')) {
      try {
        await deleteEncounter({
          variables: { encounterId }
        });
        navigate('/encounters');
      } catch (err) {
        console.error('Error deleting encounter:', err);
        setMutationError({ message: err.message, stack: err.stack });
      }
    }
  };

  const handleAdvanceRound = async () => {
    try {
      await advanceRound({
        variables: { encounterId }
      });
    } catch (err) {
      console.error('Error advancing round:', err);
      setMutationError({ message: err.message, stack: err.stack });
    }
  };

  const handleAdvanceInitiative = async () => {
    try {
      await advanceInitiative({
        variables: { encounterId }
      });
    } catch (err) {
      console.error('Error advancing initiative:', err);
      setMutationError({ message: err.message, stack: err.stack });
    }
  };

  const handleAddCharacter = async () => {
    if (!selectedCharacterId) return;

    try {
      await addCharacterToEncounter({
        variables: {
          encounterId,
          characterId: selectedCharacterId,
          initiative: selectedInitiative
        }
      });
      setShowAddCharacterModal(false);
      setSelectedCharacterId('');
      setSelectedInitiative(1);
    } catch (err) {
      console.error('Error adding character to encounter:', err);
      setMutationError({ message: err.message, stack: err.stack });
    }
  };

  const handleRemoveCharacter = async (characterId) => {
    if (window.confirm('Are you sure you want to remove this character from the encounter?')) {
      try {
        await removeCharacterFromEncounter({
          variables: {
            encounterId,
            characterId,
            initiative: data.getEncounter.initiative
          }
        });
      } catch (err) {
        console.error('Error removing character from encounter:', err);
        setMutationError({ message: err.message, stack: err.stack });
      }
    }
  };

  const handleAddEvent = async () => {
    if (!eventData.characterId || !eventData.type) return;

    try {
      await addEventToEncounter({
        variables: {
          encounterId,
          input: eventData
        }
      });
      setShowAddEventModal(false);
      setEventData({
        initiative: data.getEncounter.initiative,
        type: 'ACTION',
        characterId: '',
        actionId: '',
        description: ''
      });
    } catch (err) {
      console.error('Error adding event to encounter:', err);
      setMutationError({ message: err.message, stack: err.stack });
    }
  };

  const handleArchiveEvents = async () => {
    if (!data || !data.getEncounter || !data.getEncounter.eventsCurrent) return;
    
    try {
      const currentEvents = data.getEncounter.eventsCurrent.flatMap(
        eventLog => eventLog.events.map(event => ({
          initiative: event.initiative,
          type: event.type,
          characterId: event.character?.characterId,
          actionId: event.action?.actionId,
          description: event.description
        }))
      );
      
      await archiveCurrentEvents({
        variables: {
          encounterId,
          round: data.getEncounter.round,
          events: currentEvents
        }
      });
    } catch (err) {
      console.error('Error archiving events:', err);
      setMutationError({ message: err.message, stack: err.stack });
    }
  };

  // Render loading/error states
  if (loading) return <div className="loading">Loading encounter...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (!data || !data.getEncounter) return <div className="error">Encounter not found</div>;

  const encounter = data.getEncounter;
  
  // Extract characters from events
  const charactersInEvents = new Set();
  if (encounter.eventsCurrent) {
    encounter.eventsCurrent.forEach(eventLog => {
      eventLog.events.forEach(event => {
        if (event.character && event.character.characterId) {
          charactersInEvents.add(event.character.characterId);
        }
      });
    });
  }

  return (
    <div className="encounter-detail">
      <div className="encounter-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/encounters')}>
            <FaArrowLeft /> Back
          </button>
          <h1>{encounter.name}</h1>
        </div>
        <div className="header-right">
          <button className="delete-button" onClick={handleDelete}>
            Delete Encounter
          </button>
        </div>
      </div>

      <div className="encounter-description">
        {encounter.description || 'No description provided'}
      </div>

      <div className="encounter-controls">
        <div className="round-info">
          <div className="round-display">
            <h3>Round: {encounter.round}</h3>
            <h3>Initiative: {encounter.initiative}</h3>
          </div>
          <div className="round-controls">
            <button className="control-button" onClick={handleAdvanceInitiative}>
              <FaStepForward /> Advance Initiative
            </button>
            <button className="control-button" onClick={handleAdvanceRound}>
              <FaDiceD20 /> Next Round
            </button>
            <button className="control-button" onClick={handleArchiveEvents}>
              <FaArchive /> Archive Events
            </button>
          </div>
        </div>
        <div className="character-controls">
          <button className="control-button" onClick={() => setShowAddCharacterModal(true)}>
            <FaUserPlus /> Add Character
          </button>
          <button className="control-button" onClick={() => {
            setEventData({
              ...eventData,
              initiative: encounter.initiative
            });
            setShowAddEventModal(true);
          }}>
            Add Event
          </button>
        </div>
      </div>

      <div className="encounter-content">
        <div className="encounter-section">
          <h2>Current Events</h2>
          {encounter.eventsCurrent && encounter.eventsCurrent.length > 0 ? (
            encounter.eventsCurrent.map((eventLog, index) => (
              <div key={index} className="event-log">
                <h3>Round {eventLog.round}</h3>
                <ul className="events-list">
                  {eventLog.events.map((event, eventIndex) => (
                    <li key={eventIndex} className="event-item">
                      <div className="event-initiative">{event.initiative}</div>
                      <div className="event-content">
                        <div className="event-type">{event.type}</div>
                        {event.character && (
                          <div className="event-character">{event.character.name}</div>
                        )}
                        {event.action && (
                          <div className="event-action">{event.action.name}</div>
                        )}
                        {event.description && (
                          <div className="event-description">{event.description}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p>No current events</p>
          )}
        </div>

        <div className="encounter-section">
          <h2>Event History</h2>
          {encounter.eventsHistory && encounter.eventsHistory.length > 0 ? (
            encounter.eventsHistory.map((eventLog, index) => (
              <div key={index} className="event-log history">
                <h3>Round {eventLog.round}</h3>
                <ul className="events-list">
                  {eventLog.events.map((event, eventIndex) => (
                    <li key={eventIndex} className="event-item">
                      <div className="event-initiative">{event.initiative}</div>
                      <div className="event-content">
                        <div className="event-type">{event.type}</div>
                        {event.character && (
                          <div className="event-character">{event.character.name}</div>
                        )}
                        {event.action && (
                          <div className="event-action">{event.action.name}</div>
                        )}
                        {event.description && (
                          <div className="event-description">{event.description}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p>No event history</p>
          )}
        </div>
      </div>

      {/* Add Character Modal */}
      {showAddCharacterModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Character to Encounter</h2>
            <div className="form-group">
              <label>Character:</label>
              <select 
                value={selectedCharacterId} 
                onChange={(e) => setSelectedCharacterId(e.target.value)}
              >
                <option value="">Select a character</option>
                {charactersData && charactersData.listCharacters ? 
                  charactersData.listCharacters
                    .filter(char => !charactersInEvents.has(char.characterId))
                    .map(char => (
                      <option key={char.characterId} value={char.characterId}>
                        {char.name}
                      </option>
                    )) : []
                }
              </select>
            </div>
            <div className="form-group">
              <label>Initiative:</label>
              <input 
                type="number" 
                value={selectedInitiative}
                onChange={(e) => setSelectedInitiative(parseInt(e.target.value, 10))}
                min="1"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddCharacterModal(false)}>Cancel</button>
              <button 
                onClick={handleAddCharacter}
                disabled={!selectedCharacterId}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Event</h2>
            <div className="form-group">
              <label>Initiative:</label>
              <input 
                type="number" 
                value={eventData.initiative}
                onChange={(e) => setEventData({...eventData, initiative: parseInt(e.target.value, 10)})}
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Event Type:</label>
              <select 
                value={eventData.type} 
                onChange={(e) => setEventData({...eventData, type: e.target.value})}
              >
                <option value="ACTION">ACTION</option>
                <option value="CHARACTER_ADDED">CHARACTER_ADDED</option>
                <option value="CHARACTER_REMOVED">CHARACTER_REMOVED</option>
                <option value="OBJECT_ADDED">OBJECT_ADDED</option>
                <option value="OBJECT_REMOVED">OBJECT_REMOVED</option>
                <option value="ENCOUNTER_STARTED">ENCOUNTER_STARTED</option>
                <option value="ENCOUNTER_ENDED">ENCOUNTER_ENDED</option>
                <option value="ROUND_ADVANCED">ROUND_ADVANCED</option>
                <option value="INITIATIVE_ADVANCED">INITIATIVE_ADVANCED</option>
              </select>
            </div>
            <div className="form-group">
              <label>Character:</label>
              <select 
                value={eventData.characterId} 
                onChange={(e) => setEventData({...eventData, characterId: e.target.value})}
              >
                <option value="">Select a character</option>
                {charactersData && charactersData.listCharacters ? 
                  charactersData.listCharacters
                    .map(char => (
                      <option key={char.characterId} value={char.characterId}>
                        {char.name}
                      </option>
                    )) : []
                }
              </select>
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea 
                value={eventData.description}
                onChange={(e) => setEventData({...eventData, description: e.target.value})}
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddEventModal(false)}>Cancel</button>
              <button 
                onClick={handleAddEvent}
                disabled={!eventData.characterId || !eventData.type}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      <ErrorPopup error={mutationError} onClose={() => setMutationError(null)} />
    </div>
  );
};

export default EncounterDetail;