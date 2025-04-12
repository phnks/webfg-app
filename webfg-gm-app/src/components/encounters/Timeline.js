import React from 'react';
import './Timeline.css';

// Remove characterTimelines prop
const Timeline = ({ currentTime, history, onSelectCharacter }) => {
  const [eventHeights, setEventHeights] = React.useState({});
  const eventRefs = React.useRef({});
  const prevEventsRef = React.useRef(null);

  // Remove characterNameMap logic
  // const characterNameMap = React.useMemo(() => { ... });
  // Format event description - Now relies on backend-provided description
  const getFormattedDescription = (event) => {
    // Use the description from the event directly for most types
    // Potentially enhance specific types like ACTION_STARTED/COMPLETED if needed
    switch (event.type) {
      case 'ACTION_STARTED':
        // Example: Could potentially combine backend description with fetched action name
        // return event.description.replace('started action', `started ${actionName}`);
        // For now, let's assume the backend description is sufficient or adjust later
        return event.description; // Assuming backend provides full description like "Character started ActionName"
      case 'ACTION_COMPLETED':
        return event.description; // Assuming backend provides full description
      // CHARACTER_JOINED, CHARACTER_MOVED, OBJECT_ADDED, OBJECT_MOVED should already have names/scaled coords
      default:
        return event.description; // Use the enriched description from the history event
    }
  };

  // Sort events by time, filtering out any null/undefined entries first
  const timelineEvents = [...history]
    .filter(event => event != null) // Add filter for null/undefined
    .sort((a, b) => a.time - b.time);

  // Only measure heights when events change
  React.useEffect(() => {
    const currentEvents = JSON.stringify(timelineEvents);
    if (currentEvents !== prevEventsRef.current) {
      const heights = {};
      Object.entries(eventRefs.current).forEach(([eventId, ref]) => {
        if (ref) {
          const height = ref.getBoundingClientRect().height;
          heights[eventId] = height + 10; // Add margin
        }
      });
      setEventHeights(heights);
      prevEventsRef.current = currentEvents;
    }
  }, [timelineEvents]);

  const getTimePosition = (time) => {
    const eventsBeforeTime = timelineEvents.filter(event => event.time <= time);
    if (eventsBeforeTime.length === 0) return 0;
    
    let totalHeight = 0;
    for (let i = 0; i < eventsBeforeTime.length; i++) {
      const event = eventsBeforeTime[i];
      const eventId = `${event.time}-${event.type}-${event.characterId || 'system'}-${i}`;
      totalHeight += eventHeights[eventId] || 0;
    }
    return totalHeight;
  };

  return (
    <div className="timeline-wrapper">
      <div className="timeline-events">
        {timelineEvents.map((event, index) => {
          const eventId = `${event.time}-${event.type}-${event.characterId || 'system'}-${index}`;
          return (
            <div 
              key={eventId}
              ref={el => eventRefs.current[eventId] = el}
              className={`timeline-event event-${event.type.toLowerCase()}`}
              style={{
                borderLeft: event.time <= currentTime ? '3px solid #F44336' : '3px solid #ddd'
              }}
            >
              <div className="event-time">{event.time.toFixed(1)}s</div>
              <div 
                className="event-content"
                onClick={() => event.characterId && onSelectCharacter(event.characterId)}
              >
                <div className="event-description">{getFormattedDescription(event)}</div>
                {event.action && (
                  <div className="event-action-duration">
                    Duration: {(event.action.endTime - event.action.startTime).toFixed(1)}s
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div 
          className="current-time-indicator"
          style={{ 
            top: `${getTimePosition(currentTime)}px`,
            position: 'absolute',
            left: '-10px'
          }}
        >
          <div className="time-marker"></div>
          <div className="current-time">{currentTime.toFixed(1)}s</div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
