import React, { useState } from 'react';
import ErrorPopup from '../common/ErrorPopup';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { GET_ENCOUNTER, LIST_CHARACTERS, UPDATE_ENCOUNTER, DELETE_ENCOUNTER, ADD_CHARACTER_TO_ENCOUNTER, REMOVE_CHARACTER_FROM_ENCOUNTER, ADD_EVENT_TO_ENCOUNTER, ADVANCE_ROUND, ADVANCE_INITIATIVE, ARCHIVE_CURRENT_EVENTS, ON_ENCOUNTER_EVENTS_CHANGED, ON_ENCOUNTER_ROUND_CHANGED } from '../../graphql/operations';
import { FaArrowLeft, FaUserPlus, FaDiceD20, FaStepForward, FaArchive } from 'react-icons/fa';
import './EncounterDetail.css';
const EncounterDetail = () => {
  const {
    encounterId
  } = useParams();
  const navigate = useNavigate();
  const {
    addRecentlyViewed
  } = useRecentlyViewed();
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
  const {
    loading,
    error,
    data
  } = useQuery(GET_ENCOUNTER, {
    variables: {
      encounterId
    },
    fetchPolicy: 'network-only',
    onCompleted: data => {
      if (data && data.getEncounter) {
        // Add to recently viewed
        addRecentlyViewed({
          id: data.getEncounter.encounterId,
          name: data.getEncounter.name,
          type: 'encounter'
        });
      }
    }
  });
  const {
    data: charactersData
  } = useQuery(LIST_CHARACTERS);

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
    variables: {
      encounterId
    }
  });
  useSubscription(ON_ENCOUNTER_ROUND_CHANGED, {
    variables: {
      encounterId
    }
  });

  // Event handlers
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this encounter?')) {
      try {
        await deleteEncounter({
          variables: {
            encounterId
          }
        });
        navigate('/encounters');
      } catch (err) {
        console.error('Error deleting encounter:', err);
        setMutationError({
          message: err.message,
          stack: err.stack
        });
      }
    }
  };
  const handleAdvanceRound = async () => {
    try {
      await advanceRound({
        variables: {
          encounterId
        }
      });
    } catch (err) {
      console.error('Error advancing round:', err);
      setMutationError({
        message: err.message,
        stack: err.stack
      });
    }
  };
  const handleAdvanceInitiative = async () => {
    try {
      await advanceInitiative({
        variables: {
          encounterId
        }
      });
    } catch (err) {
      console.error('Error advancing initiative:', err);
      setMutationError({
        message: err.message,
        stack: err.stack
      });
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
      setMutationError({
        message: err.message,
        stack: err.stack
      });
    }
  };
  const handleRemoveCharacter = async characterId => {
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
        setMutationError({
          message: err.message,
          stack: err.stack
        });
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
      setMutationError({
        message: err.message,
        stack: err.stack
      });
    }
  };
  const handleArchiveEvents = async () => {
    if (!data || !data.getEncounter || !data.getEncounter.eventsCurrent) return;
    try {
      const currentEvents = data.getEncounter.eventsCurrent.flatMap(eventLog => eventLog.events.map(event => ({
        initiative: event.initiative,
        type: event.type,
        characterId: event.character?.characterId,
        actionId: event.action?.actionId,
        description: event.description
      })));
      await archiveCurrentEvents({
        variables: {
          encounterId,
          round: data.getEncounter.round,
          events: currentEvents
        }
      });
    } catch (err) {
      console.error('Error archiving events:', err);
      setMutationError({
        message: err.message,
        stack: err.stack
      });
    }
  };

  // Render loading/error states
  if (loading) return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading encounter...");
  if (error) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Error: ", error.message);
  if (!data || !data.getEncounter) return /*#__PURE__*/React.createElement("div", {
    className: "error"
  }, "Encounter not found");
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
  return /*#__PURE__*/React.createElement("div", {
    className: "encounter-detail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "encounter-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-left"
  }, /*#__PURE__*/React.createElement("button", {
    className: "back-button",
    onClick: () => navigate('/encounters')
  }, /*#__PURE__*/React.createElement(FaArrowLeft, null), " Back"), /*#__PURE__*/React.createElement("h1", null, encounter.name)), /*#__PURE__*/React.createElement("div", {
    className: "header-right"
  }, /*#__PURE__*/React.createElement("button", {
    className: "delete-button",
    onClick: handleDelete
  }, "Delete Encounter"))), /*#__PURE__*/React.createElement("div", {
    className: "encounter-description"
  }, encounter.description || 'No description provided'), /*#__PURE__*/React.createElement("div", {
    className: "encounter-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "round-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "round-display"
  }, /*#__PURE__*/React.createElement("h3", null, "Round: ", encounter.round), /*#__PURE__*/React.createElement("h3", null, "Initiative: ", encounter.initiative)), /*#__PURE__*/React.createElement("div", {
    className: "round-controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "control-button",
    onClick: handleAdvanceInitiative
  }, /*#__PURE__*/React.createElement(FaStepForward, null), " Advance Initiative"), /*#__PURE__*/React.createElement("button", {
    className: "control-button",
    onClick: handleAdvanceRound
  }, /*#__PURE__*/React.createElement(FaDiceD20, null), " Next Round"), /*#__PURE__*/React.createElement("button", {
    className: "control-button",
    onClick: handleArchiveEvents
  }, /*#__PURE__*/React.createElement(FaArchive, null), " Archive Events"))), /*#__PURE__*/React.createElement("div", {
    className: "character-controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "control-button",
    onClick: () => setShowAddCharacterModal(true)
  }, /*#__PURE__*/React.createElement(FaUserPlus, null), " Add Character"), /*#__PURE__*/React.createElement("button", {
    className: "control-button",
    onClick: () => {
      setEventData({
        ...eventData,
        initiative: encounter.initiative
      });
      setShowAddEventModal(true);
    }
  }, "Add Event"))), /*#__PURE__*/React.createElement("div", {
    className: "encounter-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "encounter-section"
  }, /*#__PURE__*/React.createElement("h2", null, "Current Events"), encounter.eventsCurrent && encounter.eventsCurrent.length > 0 ? encounter.eventsCurrent.map((eventLog, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "event-log"
  }, /*#__PURE__*/React.createElement("h3", null, "Round ", eventLog.round), /*#__PURE__*/React.createElement("ul", {
    className: "events-list"
  }, eventLog.events.map((event, eventIndex) => /*#__PURE__*/React.createElement("li", {
    key: eventIndex,
    className: "event-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "event-initiative"
  }, event.initiative), /*#__PURE__*/React.createElement("div", {
    className: "event-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "event-type"
  }, event.type), event.character && /*#__PURE__*/React.createElement("div", {
    className: "event-character"
  }, event.character.name), event.action && /*#__PURE__*/React.createElement("div", {
    className: "event-action"
  }, event.action.name), event.description && /*#__PURE__*/React.createElement("div", {
    className: "event-description"
  }, event.description))))))) : /*#__PURE__*/React.createElement("p", null, "No current events")), /*#__PURE__*/React.createElement("div", {
    className: "encounter-section"
  }, /*#__PURE__*/React.createElement("h2", null, "Event History"), encounter.eventsHistory && encounter.eventsHistory.length > 0 ? encounter.eventsHistory.map((eventLog, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "event-log history"
  }, /*#__PURE__*/React.createElement("h3", null, "Round ", eventLog.round), /*#__PURE__*/React.createElement("ul", {
    className: "events-list"
  }, eventLog.events.map((event, eventIndex) => /*#__PURE__*/React.createElement("li", {
    key: eventIndex,
    className: "event-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "event-initiative"
  }, event.initiative), /*#__PURE__*/React.createElement("div", {
    className: "event-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "event-type"
  }, event.type), event.character && /*#__PURE__*/React.createElement("div", {
    className: "event-character"
  }, event.character.name), event.action && /*#__PURE__*/React.createElement("div", {
    className: "event-action"
  }, event.action.name), event.description && /*#__PURE__*/React.createElement("div", {
    className: "event-description"
  }, event.description))))))) : /*#__PURE__*/React.createElement("p", null, "No event history"))), showAddCharacterModal && /*#__PURE__*/React.createElement("div", {
    className: "modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("h2", null, "Add Character to Encounter"), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Character:"), /*#__PURE__*/React.createElement("select", {
    value: selectedCharacterId,
    onChange: e => setSelectedCharacterId(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select a character"), charactersData && charactersData.listCharacters ? charactersData.listCharacters.filter(char => !charactersInEvents.has(char.characterId)).map(char => /*#__PURE__*/React.createElement("option", {
    key: char.characterId,
    value: char.characterId
  }, char.name)) : [])), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Initiative:"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: selectedInitiative,
    onChange: e => setSelectedInitiative(parseInt(e.target.value, 10)),
    min: "1"
  })), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddCharacterModal(false)
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleAddCharacter,
    disabled: !selectedCharacterId
  }, "Add")))), showAddEventModal && /*#__PURE__*/React.createElement("div", {
    className: "modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("h2", null, "Add Event"), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Initiative:"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: eventData.initiative,
    onChange: e => setEventData({
      ...eventData,
      initiative: parseInt(e.target.value, 10)
    }),
    min: "1"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Event Type:"), /*#__PURE__*/React.createElement("select", {
    value: eventData.type,
    onChange: e => setEventData({
      ...eventData,
      type: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "ACTION"
  }, "ACTION"), /*#__PURE__*/React.createElement("option", {
    value: "CHARACTER_ADDED"
  }, "CHARACTER_ADDED"), /*#__PURE__*/React.createElement("option", {
    value: "CHARACTER_REMOVED"
  }, "CHARACTER_REMOVED"), /*#__PURE__*/React.createElement("option", {
    value: "OBJECT_ADDED"
  }, "OBJECT_ADDED"), /*#__PURE__*/React.createElement("option", {
    value: "OBJECT_REMOVED"
  }, "OBJECT_REMOVED"), /*#__PURE__*/React.createElement("option", {
    value: "ENCOUNTER_STARTED"
  }, "ENCOUNTER_STARTED"), /*#__PURE__*/React.createElement("option", {
    value: "ENCOUNTER_ENDED"
  }, "ENCOUNTER_ENDED"), /*#__PURE__*/React.createElement("option", {
    value: "ROUND_ADVANCED"
  }, "ROUND_ADVANCED"), /*#__PURE__*/React.createElement("option", {
    value: "INITIATIVE_ADVANCED"
  }, "INITIATIVE_ADVANCED"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Character:"), /*#__PURE__*/React.createElement("select", {
    value: eventData.characterId,
    onChange: e => setEventData({
      ...eventData,
      characterId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select a character"), charactersData && charactersData.listCharacters ? charactersData.listCharacters.map(char => /*#__PURE__*/React.createElement("option", {
    key: char.characterId,
    value: char.characterId
  }, char.name)) : [])), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Description:"), /*#__PURE__*/React.createElement("textarea", {
    value: eventData.description,
    onChange: e => setEventData({
      ...eventData,
      description: e.target.value
    }),
    rows: "3"
  })), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAddEventModal(false)
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleAddEvent,
    disabled: !eventData.characterId || !eventData.type
  }, "Add Event")))), /*#__PURE__*/React.createElement(ErrorPopup, {
    error: mutationError,
    onClose: () => setMutationError(null)
  }));
};
export default EncounterDetail;