import React from 'react';
import './CharacterSummary.css';
const CharacterSummary = ({
  characters,
  history,
  currentTime,
  onSelectCharacter
}) => {
  // Build character state at current time by applying events
  const getCharacterStateAtTime = characterId => {
    // Get all events for this character up to current time
    const relevantEvents = history
    // Add a check to ensure event exists before accessing properties
    .filter(event => event && event.characterId === characterId && event.time <= currentTime).sort((a, b) => a.time - b.time);
    if (relevantEvents.length === 0) return null; // No relevant events found for this character

    // Build character state
    const state = {
      characterId,
      currentAction: null,
      lastPosition: {
        x: 0,
        y: 0
      },
      lastEvent: null,
      stats: relevantEvents[0].stats || {
        hitPoints: 0,
        surges: 0,
        exhaustion: 0
      },
      conditions: []
    };

    // Apply all events to build current state
    for (const event of relevantEvents) {
      state.lastEvent = event;
      if (event.x !== undefined && event.y !== undefined) {
        state.lastPosition = {
          x: event.x,
          y: event.y
        };
      }
      if (event.stats) {
        state.stats = {
          ...state.stats,
          ...event.stats
        };
      }
      if (event.conditions) {
        state.conditions = [...event.conditions];
      }

      // Handle action tracking
      if (event.type === 'ACTION_STARTED') {
        state.currentAction = {
          name: event.actionName || 'Unknown Action',
          startTime: event.time,
          endTime: event.endTime || event.time + 1 // Default 1 second if no end time
        };
      } else if (event.type === 'ACTION_COMPLETED') {
        // Only clear current action if it matches the completed one
        if (state.currentAction && state.currentAction.name === (event.actionName || 'Unknown Action')) {
          state.currentAction = null;
        }
      }
    }
    return state;
  };

  // Get current states for all characters
  const characterStates = characters.map(char => {
    const state = getCharacterStateAtTime(char.characterId);
    return {
      ...char,
      state
    };
  }).filter(char => char.state !== null);
  return /*#__PURE__*/React.createElement("div", {
    className: "character-summary-panel"
  }, /*#__PURE__*/React.createElement("h3", null, "Character Summary"), /*#__PURE__*/React.createElement("div", {
    className: "character-summary-list"
  }, characterStates.map(char => /*#__PURE__*/React.createElement("div", {
    key: char.characterId,
    className: "character-summary-card",
    onClick: () => onSelectCharacter(char.characterId),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "character-header"
  }, /*#__PURE__*/React.createElement("h4", null, char.name)), /*#__PURE__*/React.createElement("div", {
    className: "character-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "HP:"), /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, char.state?.stats?.hitPoints || 0)), /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "Surges:"), /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, char.state?.stats?.surges || 0)), /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "Exhaustion:"), /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, char.state?.stats?.exhaustion || 0))), char.state?.conditions?.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "character-conditions"
  }, /*#__PURE__*/React.createElement("h5", null, "Conditions"), /*#__PURE__*/React.createElement("div", {
    className: "condition-list"
  }, char.state.conditions.map((condition, idx) => /*#__PURE__*/React.createElement("span", {
    key: idx,
    className: "condition-tag"
  }, condition)))), /*#__PURE__*/React.createElement("div", {
    className: "character-status"
  }, /*#__PURE__*/React.createElement("h5", null, "Status"), char.state?.currentAction ? /*#__PURE__*/React.createElement("div", {
    className: "current-action"
  }, "Performing ", /*#__PURE__*/React.createElement("strong", null, char.state.currentAction.name), /*#__PURE__*/React.createElement("div", {
    className: "action-progress"
  }, /*#__PURE__*/React.createElement("div", {
    className: "progress-bar",
    style: {
      width: `${Math.min(100, Math.max(0, (currentTime - char.state.currentAction.startTime) / (char.state.currentAction.endTime - char.state.currentAction.startTime) * 100))}%`
    }
  }))) : char.state?.lastEvent?.type === 'CHARACTER_MOVED' ? /*#__PURE__*/React.createElement("div", null, "Moved to (", char.state.lastPosition.x * 5, "', ", char.state.lastPosition.y * 5, "')") : char.state?.lastEvent?.type === 'CHARACTER_ADDED' ?
  /*#__PURE__*/
  // Use correct event type
  React.createElement("div", null, "Added to encounter") // Adjusted text
  : char.state?.lastEvent?.type === 'ACTION_COMPLETED' ? /*#__PURE__*/React.createElement("div", null, "Finished ", char.state.lastEvent.actionName || 'an action') : /*#__PURE__*/React.createElement("div", null, "Standing by"))))));
};
export default CharacterSummary;