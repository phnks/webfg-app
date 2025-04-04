import React from 'react';
import './CharacterSummary.css';

const CharacterSummary = ({ characters, history, currentTime, onSelectCharacter }) => {
  // Build character state at current time by applying events
  const getCharacterStateAtTime = (characterId) => {
    // Get all events for this character up to current time
    const relevantEvents = history
      // Add a check to ensure event exists before accessing properties
      .filter(event => event && event.characterId === characterId && event.time <= currentTime)
      .sort((a, b) => a.time - b.time);

    if (relevantEvents.length === 0) return null; // No relevant events found for this character
    
    // Build character state
    const state = {
      characterId,
      currentAction: null,
      lastPosition: { x: 0, y: 0 },
      lastEvent: null,
      stats: relevantEvents[0].stats || { hitPoints: 0, fatigue: 0, surges: 0, exhaustion: 0 },
      conditions: []
    };
    
    // Apply all events to build current state
    for (const event of relevantEvents) {
      state.lastEvent = event;
      
      if (event.x !== undefined && event.y !== undefined) {
        state.lastPosition = { x: event.x, y: event.y };
      }
      
      if (event.stats) {
        state.stats = { ...state.stats, ...event.stats };
      }
      
      if (event.conditions) {
        state.conditions = [...event.conditions];
      }
      
      // Handle action tracking
      if (event.type === 'ACTION_STARTED') {
        state.currentAction = {
          name: event.actionName || 'Unknown Action',
          startTime: event.time,
          endTime: event.endTime || (event.time + 1) // Default 1 second if no end time
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
  
  return (
    <div className="character-summary-panel">
      <h3>Character Summary</h3>
      <div className="character-summary-list">
        {characterStates.map(char => (
          <div 
            key={char.characterId} 
            className="character-summary-card"
            onClick={() => onSelectCharacter(char.characterId)}
            style={{ cursor: 'pointer' }}
          >
            <div className="character-header">
              <h4>{char.name}</h4>
              {/* Removed race-based token indicator */}
              {/* <div className={`character-token-indicator ${char.race?.toLowerCase()}`}></div> */}
            </div>
            
            <div className="character-stats">
              <div className="stat-item">
                <span className="stat-label">HP:</span>
                <span className="stat-value">{char.state?.stats?.hitPoints || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Fatigue:</span>
                <span className="stat-value">{char.state?.stats?.fatigue || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Surges:</span>
                <span className="stat-value">{char.state?.stats?.surges || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Exhaustion:</span>
                <span className="stat-value">{char.state?.stats?.exhaustion || 0}</span>
              </div>
            </div>
            
            {char.state?.conditions?.length > 0 && (
              <div className="character-conditions">
                <h5>Conditions</h5>
                <div className="condition-list">
                  {char.state.conditions.map((condition, idx) => (
                    <span key={idx} className="condition-tag">{condition}</span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="character-status">
              <h5>Status</h5>
              {char.state?.currentAction ? (
                <div className="current-action">
                  Performing <strong>{char.state.currentAction.name}</strong>
                  <div className="action-progress">
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${Math.min(100, Math.max(0, 
                          ((currentTime - char.state.currentAction.startTime) / 
                          (char.state.currentAction.endTime - char.state.currentAction.startTime)) * 100
                        ))}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ) : char.state?.lastEvent?.type === 'CHARACTER_MOVED' ? (
                <div>Moved to ({char.state.lastPosition.x * 5}', {char.state.lastPosition.y * 5}')</div>
              ) : char.state?.lastEvent?.type === 'CHARACTER_ADDED' ? ( // Use correct event type
                <div>Added to encounter</div> // Adjusted text
              ) : char.state?.lastEvent?.type === 'ACTION_COMPLETED' ? (
                <div>Finished {char.state.lastEvent.actionName || 'an action'}</div>
              ) : (
                <div>Standing by</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterSummary;
