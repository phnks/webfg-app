import React, { useState, useEffect } from 'react';
import ErrorPopup from '../common/ErrorPopup';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription, useApolloClient } from '@apollo/client';
import {
  GET_ENCOUNTER,
  LIST_CHARACTERS,
  LIST_OBJECTS,
  UPDATE_ENCOUNTER,
  ADD_CHARACTER_TO_ENCOUNTER,
  ADD_ACTION_TO_TIMELINE,
  ADVANCE_ENCOUNTER_TIME,
  UPDATE_CHARACTER_POSITION,
  UPDATE_GRID_SIZE,
  ADD_OBJECT_TO_ENCOUNTER_VTT,
  UPDATE_OBJECT_POSITION,
  REMOVE_OBJECT_FROM_ENCOUNTER_VTT,
  ADD_TERRAIN_TO_ENCOUNTER,
  UPDATE_TERRAIN_POSITION,
  REMOVE_TERRAIN_FROM_ENCOUNTER,
  ON_ENCOUNTER_TIMELINE_CHANGED,
  ON_ENCOUNTER_VTT_CHANGED,
  ON_GRID_SIZE_CHANGED,
  ON_ENCOUNTER_CHARACTER_CHANGED
} from '../../graphql/operations';
import VirtualTableTop from './VirtualTableTop';
import Timeline from './Timeline';
import CharacterActionSelector from './CharacterActionSelector';
import { FaArrowLeft, FaPlay, FaPause, FaUserPlus, FaClock, FaBoxOpen, FaMountain, FaTrash } from 'react-icons/fa';
import './EncounterDetail.css';

const EncounterDetail = () => {
  const { encounterId } = useParams();
  const navigate = useNavigate();
  const [mutationError, setMutationError] = useState(null);
  const [timeInput, setTimeInput] = useState('');
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [showAddObjectModal, setShowAddObjectModal] = useState(false);
  const [showAddTerrainPanel, setShowAddTerrainPanel] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [terrainType, setTerrainType] = useState('VERTICAL_LINE');
  const [terrainLengthFeet, setTerrainLengthFeet] = useState(5);
  const client = useApolloClient();

  // Queries
  const { loading, error, data, refetch } = useQuery(GET_ENCOUNTER, {
    variables: { encounterId },
    fetchPolicy: 'network-only'
  });

  const { data: charactersData } = useQuery(LIST_CHARACTERS);
  const { data: objectsData } = useQuery(LIST_OBJECTS);

  // Mutations
  const [advanceEncounterTime] = useMutation(ADVANCE_ENCOUNTER_TIME);
  const [addCharacterToEncounter] = useMutation(ADD_CHARACTER_TO_ENCOUNTER);
  const [addActionToTimeline] = useMutation(ADD_ACTION_TO_TIMELINE);
  const [updateCharacterPosition] = useMutation(UPDATE_CHARACTER_POSITION);
  const [updateGridSize] = useMutation(UPDATE_GRID_SIZE);
  const [addObjectToVTT] = useMutation(ADD_OBJECT_TO_ENCOUNTER_VTT);
  const [updateObjectPosition] = useMutation(UPDATE_OBJECT_POSITION);
  const [removeObjectFromVTT] = useMutation(REMOVE_OBJECT_FROM_ENCOUNTER_VTT);
  const [addTerrainToEncounter] = useMutation(ADD_TERRAIN_TO_ENCOUNTER);
  const [updateTerrainPosition] = useMutation(UPDATE_TERRAIN_POSITION);
  const [removeTerrainFromEncounter] = useMutation(REMOVE_TERRAIN_FROM_ENCOUNTER);

  // Subscriptions
  useSubscription(ON_ENCOUNTER_TIMELINE_CHANGED, {
    variables: { encounterId },
    onData: ({ data }) => {
      if (data?.data?.onEncounterTimelineChanged) {
        const updatedEncounter = data.data.onEncounterTimelineChanged;
        client.cache.updateQuery(
          {
            query: GET_ENCOUNTER,
            variables: { encounterId },
          },
          (existingData) => {
            if (!existingData?.getEncounter) return existingData;
            return {
              getEncounter: {
                ...existingData.getEncounter,
                ...updatedEncounter
              }
            };
          }
        );
      }
    }
  });

  useSubscription(ON_ENCOUNTER_VTT_CHANGED, {
    variables: { encounterId },
    onData: ({ data }) => {
      console.log('VTT subscription data:', data?.data?.onEncounterVttChanged);
      if (data?.data?.onEncounterVttChanged) {
        const updatedEncounter = data.data.onEncounterVttChanged;
        console.log('Updating cache with:', updatedEncounter);
        client.cache.updateQuery(
          {
            query: GET_ENCOUNTER,
            variables: { encounterId }
          },
          (existingData) => {
            if (!existingData?.getEncounter) return existingData;

            // Create a copy of the existing encounter data to modify
            const newEncounterData = { ...existingData.getEncounter };

            // Update fields individually if they exist and are not null in the subscription payload
            if (updatedEncounter.characterPositions !== undefined && updatedEncounter.characterPositions !== null) {
              newEncounterData.characterPositions = updatedEncounter.characterPositions;
            }
            if (updatedEncounter.objectPositions !== undefined && updatedEncounter.objectPositions !== null) {
              newEncounterData.objectPositions = updatedEncounter.objectPositions;
            }
            if (updatedEncounter.terrainElements !== undefined && updatedEncounter.terrainElements !== null) {
              newEncounterData.terrainElements = updatedEncounter.terrainElements;
            }
            if (updatedEncounter.gridElements !== undefined && updatedEncounter.gridElements !== null) {
              newEncounterData.gridElements = updatedEncounter.gridElements;
            }
            // Crucially, update history if it's present in the payload, replacing the old one
            // Assumes the backend sends the complete updated history array on VTT changes.
            if (updatedEncounter.history !== undefined && updatedEncounter.history !== null) {
              newEncounterData.history = updatedEncounter.history;
            }

            return {
              getEncounter: newEncounterData
            };
          }
        );
      }
    }
  });

  useSubscription(ON_GRID_SIZE_CHANGED, {
    variables: { encounterId },
    onData: ({ data }) => {
      if (data?.data?.onGridSizeChanged) {
        const updatedEncounter = data.data.onGridSizeChanged;
        client.cache.updateQuery(
          {
            query: GET_ENCOUNTER,
            variables: { encounterId }
          },
          (existingData) => {
            if (!existingData?.getEncounter) return existingData;
            return {
              getEncounter: {
                ...existingData.getEncounter,
                gridRows: updatedEncounter.gridRows,
                gridColumns: updatedEncounter.gridColumns
              }
            };
          }
        );
      }
    }
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
          (existingData) => {
            if (!existingData?.getEncounter) return existingData;
            return {
              getEncounter: {
                ...existingData.getEncounter,
                ...updatedEncounter
              }
            };
          }
        );
      }
    }
  });

  // Get character by ID helper
  const getCharacterById = (characterId) => {
    if (!charactersData || !charactersData.listCharacters) return null;
    return charactersData.listCharacters.find(c => c.characterId === characterId);
  };

  const getObjectById = (objectId) => {
    const object = objectsData?.listObjects?.find(obj => obj.objectId === objectId);
    console.log('Getting object by id:', objectId, 'Found:', object);
    return object;
  };

  const handleAdvanceTime = async () => {
    const newTime = parseFloat(timeInput);
    if (isNaN(newTime)) return;

    try {
      const result = await advanceEncounterTime({
        variables: {
          encounterId,
          newTime
        }
      });
      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
      setTimeInput('');
    } catch (err) {
      // This catch block will handle network errors or unexpected JavaScript errors
      console.error("Error advancing time:", err);
      let errorMessage = "An unexpected error occurred while advancing time.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        // GraphQL errors might have a stack trace on individual errors or the main error object
        // For simplicity, we'll use the main error object's stack for now, or indicate if none
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
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

      const result = await addCharacterToEncounter({
        variables: {
          encounterId,
          characterId,
          startTime: startTime || calculatedStartTime,
          x,
          y
        }
      });
      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }

      setShowAddCharacterModal(false);
    } catch (err) {
      console.error("Error adding character:", err);
      let errorMessage = "An unexpected error occurred while adding character.";
      let errorStack = err.stack || "No stack trace available.";
      // The catch block already handles setting the error state for display
      // No need for an additional if (err.graphQLErrors) check here, as the thrown error
      // from the try block or other JS errors will be caught.
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
         errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
         errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
         console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
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

      const result = await addActionToTimeline({
        variables: {
          encounterId,
          characterId,
          actionId,
          startTime,
          historyEvent
        }
      });

      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
    } catch (err) {
      // This catch block will handle network errors or unexpected JavaScript errors
      console.error("Error adding action:", err);
      let errorMessage = "An unexpected error occurred while adding action.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
    }
  };

  const handleMoveCharacter = async (characterId, x, y) => {
    try {
      const result = await updateCharacterPosition({
        variables: {
          encounterId,
          characterId,
          x,
          y
        }
      });

      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
    } catch (err) {
      // This catch block will handle network errors or unexpected JavaScript errors
      console.error("Error moving character:", err);
      let errorMessage = "An unexpected error occurred while moving character.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
    }
  };

  const handleGridSizeUpdate = async (rows, columns) => {
    try {
      const result = await updateGridSize({
        variables: {
          input: {
            encounterId,
            rows,
            columns
          }
        }
      });

      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
    } catch (err) {
      // This catch block will handle network errors or unexpected JavaScript errors
      console.error("Failed to update grid size:", err);
      let errorMessage = "An unexpected error occurred while updating grid size.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
    }
  };

  const handleAddObject = async (objectId) => {
    if (!encounterId || !objectId) {
      console.error("Missing encounterId or objectId for adding object.");
      return;
    }

    // Check if object already exists in the encounter
    const objectExists = data?.getEncounter?.objectPositions?.some(
      pos => pos.objectId === objectId
    );

    if (objectExists) {
      alert("This object is already in the encounter!");
      return;
    }

    try {
      const result = await addObjectToVTT({
        variables: {
          encounterId,
          objectId,
          x: 0,
          y: 0
        }
      });
      console.log(`Added object ${objectId} to encounter ${encounterId}`);

      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
      setShowAddObjectModal(false);
    } catch (err) {
      // This catch block will handle network errors or unexpected JavaScript errors
      console.error("Error adding object to VTT:", err);
      let errorMessage = "An unexpected error occurred while adding object.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
    }
  };

  const handleMoveObject = async (objectId, x, y) => {
    try {
      const result = await updateObjectPosition({
        variables: { encounterId, objectId, x, y }
      });

      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
    } catch (err) {
      // This catch block will handle network errors or unexpected JavaScript errors
      console.error("Error moving object:", err);
      let errorMessage = "An unexpected error occurred while moving object.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
    }
  };

  const handleDeleteObject = async (objectId) => {
    if (!window.confirm("Are you sure you want to remove this object from the encounter?")) return;
    try {
      const result = await removeObjectFromVTT({
        variables: { encounterId, objectId }
      });

      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
    } catch (err) {
      // This catch block will handle network errors or unexpected JavaScript errors
      console.error("Error removing object:", err);
      let errorMessage = "An unexpected error occurred while removing object.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
    }
  };

  const handleAddTerrain = async () => {
    try {
      const lengthInUnits = Math.max(1, Math.round(terrainLengthFeet / 5)); // Ensure at least 1 unit
      // Simple placement at (0, 0) for now
      let startX = 0, startY = 0;
      // TODO: Allow user to click on grid to place?
      const result = await addTerrainToEncounter({
        variables: {
          encounterId,
          input: {
            type: terrainType,
            startX,
            startY,
            length: lengthInUnits,
            color: '#8B4513' // Example color (brown)
          }
        }
      });

      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
      setShowAddTerrainPanel(false);
    } catch (err) {
      // This catch block will handle network errors or unexpected JavaScript errors
      console.error("Error adding terrain:", err);
      let errorMessage = "An unexpected error occurred while adding terrain.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
    }
  };

  const handleMoveTerrain = async (terrainId, startX, startY) => {
    try {
      const result = await updateTerrainPosition({
        variables: {
          encounterId,
          input: { terrainId, startX, startY }
        }
      });

      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
    } catch (err) {
      // This catch block will handle network errors or unexpected JavaScript errors
      console.error("Error moving terrain:", err);
      let errorMessage = "An unexpected error occurred while moving terrain.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
    }
  };

  const handleDeleteTerrain = async (terrainId) => {
    if (!window.confirm("Are you sure you want to remove this terrain element?")) return;
    try {
      const result = await removeTerrainFromEncounter({
        variables: { encounterId, terrainId }
      });

      // Check for null data or errors (including null values for all keys in data)
      if (!result.data || (result.errors && result.errors.length > 0) || (result.data && Object.values(result.data).every(value => value === null))) {
          throw new Error(result.errors ? result.errors.map(e => e.message).join("\n") : "Mutation returned null data.");
      }
    } catch (err) {
      // This catch block will handle network errors or unexpected JavaScript errors
      console.error("Error removing terrain:", err);
      let errorMessage = "An unexpected error occurred while removing terrain.";
      let errorStack = err.stack || "No stack trace available.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\n");
        errorStack = err.stack || err.graphQLErrors.map(e => e.extensions?.exception?.stacktrace || e.stack).filter(Boolean).join('\n\n') || "No stack trace available.";
        console.error("GraphQL Errors:", err.graphQLErrors);
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
        errorStack = err.networkError.stack || "No network error stack trace available.";
        console.error("Network Error:", err.networkError);
      } else {
          errorMessage = err.message;
      }
      setMutationError({ message: errorMessage, stack: errorStack });
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
            <div className="vtt-controls">
              <button
                className="add-character-btn"
                onClick={() => setShowAddCharacterModal(true)}
              >
                <FaUserPlus /> Add Character
              </button>
              <button
                className="add-object-btn"
                onClick={() => setShowAddObjectModal(true)}
              >
                <FaBoxOpen /> Add Object
              </button>
              <button
                className="add-terrain-btn"
                onClick={() => setShowAddTerrainPanel(true)}
              >
                <FaMountain /> Add Terrain
              </button>
            </div>
          </div>
          <VirtualTableTop
            characters={encounter.characterPositions.map(pos => ({
              ...pos,
              name: getCharacterById(pos.characterId)?.name || 'Unknown',
              race: getCharacterById(pos.characterId)?.race || 'HUMAN'
            }))}
            objects={encounter.objectPositions?.map(pos => ({
              ...pos,
              name: getObjectById(pos.objectId)?.name || 'Unknown Object'
            })) || []}
            terrain={encounter.terrainElements || []}
            gridElements={encounter.gridElements || []}
            history={encounter.history || []}
            currentTime={encounter.currentTime}
            onMoveCharacter={handleMoveCharacter}
            onSelectCharacter={setSelectedCharacter}
            onMoveObject={handleMoveObject}
            onDeleteObject={handleDeleteObject}
            onMoveTerrain={handleMoveTerrain}
            onDeleteTerrain={handleDeleteTerrain}
            gridRows={encounter.gridRows || 20}
            gridColumns={encounter.gridColumns || 20}
            onUpdateGridSize={handleGridSizeUpdate}
          />
        </div>

        <div className="timeline-container">
          <Timeline
            currentTime={encounter.currentTime}
            // characterTimelines prop removed - relying solely on history
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

      {showAddObjectModal && (
        <div className="modal-overlay">
          <div className="add-object-modal">
            <h2>Add Object to Encounter</h2>
            {!objectsData?.listObjects || objectsData.listObjects.length === 0 ? (
              <p>No available objects defined globally.</p>
            ) : (
              <ul>
                {objectsData.listObjects
                  .filter(obj => !data?.getEncounter?.objectPositions?.some(pos => pos.objectId === obj.objectId))
                  .map((obj) => (
                    <li key={obj.objectId}>
                      {obj.name}
                      <button onClick={() => handleAddObject(obj.objectId)}>Add</button>
                    </li>
                  ))}
              </ul>
            )}
            <button onClick={() => setShowAddObjectModal(false)}>Close</button>
          </div>

        </div>
      )}

      {showAddTerrainPanel && (
        <div className="modal-overlay">
          <div className="add-terrain-panel">
            <h2>Add Terrain</h2>
            <div className="terrain-form">
              <label>
                Type:
                <select value={terrainType} onChange={(e) => setTerrainType(e.target.value)}>
                  <option value="VERTICAL_LINE">Vertical Line</option>
                  <option value="HORIZONTAL_LINE">Horizontal Line</option>
                  <option value="DIAGONAL_LINE">Diagonal Line</option>
                </select>
              </label>
              <label>
                Length (ft):
                <input
                  type="number"
                  value={terrainLengthFeet}
                  onChange={(e) => setTerrainLengthFeet(Number(e.target.value))}
                  min="5"
                  step="5"
                />
                <span>({Math.max(1, Math.round(terrainLengthFeet / 5))} squares)</span>
              </label>
              <button onClick={handleAddTerrain}>Add Terrain</button>
            </div>
            <button
              className="close-modal-btn"
              onClick={() => setShowAddTerrainPanel(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <ErrorPopup error={mutationError} onClose={() => setMutationError(null)} />
    </div>
  );
};

export default EncounterDetail;
