import React from 'react';
import './Timeline.css';

const Timeline = ({ currentTime, characterTimelines, history, onSelectCharacter }) => {
  const timelineScale = 100; // pixels per second
  const maxTime = Math.max(
    currentTime + 5, // Always show at least 5 seconds ahead
    ...characterTimelines.flatMap(timeline => 
      timeline.actions.map(action => action.endTime)
    ).filter(Boolean)
  );
  
  // Sort events by time
  const sortedHistory = [...history].sort((a, b) => a.time - b.time);
  
  const formatTime = (time) => {
    return time.toFixed(1) + 's';
  };
  
  return (
    <div className="timeline-wrapper">
      <div className="timeline-ruler">
        {Array.from({ length: Math.ceil(maxTime) + 1 }).map((_, i) => (
          <div 
            key={i} 
            className="timeline-marker"
            style={{ left: `${i * timelineScale}px` }}
          >
            <span className="time-label">{i}s</span>
          </div>
        ))}
        <div 
          className="timeline-current-time"
          style={{ left: `${currentTime * timelineScale}px` }}
        />
      </div>
      
      <div className="timeline-characters">
        {characterTimelines.map(timeline => (
          <div key={timeline.characterId} className="character-timeline">
            <div 
              className="character-label"
              onClick={() => onSelectCharacter(timeline.characterId)}
            >
              {timeline.name}
            </div>
            <div className="character-actions">
              <div 
                className="character-start-indicator"
                style={{ left: `${timeline.startTime * timelineScale}px` }}
                title={`${timeline.name} starts at ${formatTime(timeline.startTime)}`}
              />
              {timeline.actions.map((action, index) => (
                <div 
                  key={index}
                  className="action-bar"
                  style={{
                    left: `${action.startTime * timelineScale}px`,
                    width: `${(action.endTime - action.startTime) * timelineScale}px`
                  }}
                  title={`${action.name || 'Action'}: ${formatTime(action.startTime)} - ${formatTime(action.endTime)}`}
                >
                  <span className="action-name">{action.name || 'Action'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="timeline-history">
        <h3>Event History</h3>
        <ul className="history-list">
          {sortedHistory.map((event, index) => (
            <li key={index} className={`event-item event-${event.type.toLowerCase()}`}>
              <span className="event-time">{formatTime(event.time)}</span>
              <span className="event-description">{event.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Timeline; 