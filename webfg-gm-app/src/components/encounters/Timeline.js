import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_ACTIONS } from '../../graphql/operations';
import './Timeline.css';

const Timeline = ({ currentTime, characterTimelines, history, onSelectCharacter }) => {
  const [eventHeights, setEventHeights] = React.useState({});
  const eventRefs = React.useRef({});
  const prevEventsRef = React.useRef(null);
  const [actionNames, setActionNames] = React.useState({});

  // Create maps for character names and actions
  const characterNameMap = React.useMemo(() => {
    const map = new Map();
    characterTimelines.forEach(timeline => {
      map.set(timeline.characterId, timeline.name);
    });
    return map;
  }, [characterTimelines]);

  // Collect all unique action IDs
  const actionIds = React.useMemo(() => {
    const ids = new Set();
    history.forEach(event => {
      if (event.actionId) {
        ids.add(event.actionId);
      }
    });
    return Array.from(ids);
  }, [history]);

  // Fetch action names
  const { loading, error, data } = useQuery(GET_ACTIONS, {
    variables: { actionIds },
    skip: actionIds.length === 0
  });

  React.useEffect(() => {
    if (data?.getActions) {
      const names = {};
      data.getActions.forEach(action => {
        names[action.actionId] = action.name;
      });
      setActionNames(names);
    }
  }, [data]);

  // Format event description
  const getFormattedDescription = (event) => {
    const characterName = characterNameMap.get(event.characterId) || 'Unknown Character';
    const actionName = actionNames[event.actionId] || 'Unknown Action';

    switch (event.type) {
      case 'CHARACTER_JOINED':
        return `${characterName} joined the encounter`;
      case 'CHARACTER_MOVED':
        return `${characterName} moved to position (${event.x * 5}ft, ${event.y * 5}ft)`;
      case 'ACTION_STARTED':
        return `${characterName} started ${actionName}`;
      case 'ACTION_COMPLETED':
        return `${characterName} completed ${actionName}`;
      default:
        return event.description;
    }
  };

  // Sort events by time
  const timelineEvents = [...history].sort((a, b) => a.time - b.time);

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