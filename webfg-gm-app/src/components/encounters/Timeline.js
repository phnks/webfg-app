import React from 'react';
import './Timeline.css';

const Timeline = ({ currentTime, characterTimelines, history, onSelectCharacter }) => {
  // Sort events by time
  const sortedHistory = [...history].sort((a, b) => a.time - b.time);
  
  const formatTime = (time) => {
    return time.toFixed(1) + 's';
  };
  
  // Combine character actions with history events
  const timelineEvents = [
    // Add character start events
    ...characterTimelines.map(timeline => ({
      time: timeline.startTime,
      type: 'character_joined',
      description: `${timeline.name} joined the encounter`,
      characterId: timeline.characterId
    })),
    
    // Add character actions
    ...characterTimelines.flatMap(timeline =>
      timeline.actions.map(action => ({
        time: action.startTime,
        type: 'action_started',
        description: `${timeline.name} started ${action.name || 'action'}`,
        characterId: timeline.characterId,
        action
      }))
    ),
    
    // Add existing history events
    ...history
  ].sort((a, b) => a.time - b.time);

  return (
    <div className="timeline-wrapper">
      <div className="timeline-events">
        {timelineEvents.map((event, index) => (
          <div 
            key={index} 
            className={`timeline-event event-${event.type.toLowerCase()}`}
            style={{
              borderLeft: event.time <= currentTime ? '3px solid #F44336' : '3px solid #ddd'
            }}
          >
            <div className="event-time">{formatTime(event.time)}</div>
            <div 
              className="event-content"
              onClick={() => event.characterId && onSelectCharacter(event.characterId)}
            >
              <div className="event-description">{event.description}</div>
              {event.action && (
                <div className="event-action-duration">
                  Duration: {formatTime(event.action.endTime - event.action.startTime)}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Current time indicator */}
        <div 
          className="current-time-indicator"
          style={{ top: `${currentTime * 40}px` }}
        >
          <div className="time-marker"></div>
          <div className="current-time">{formatTime(currentTime)}</div>
        </div>
      </div>
    </div>
  );
};

export default Timeline; 