// Defines the types of events that can be recorded in the encounter history timeline.
const TimelineEventType = {
  // Character Events
  CHARACTER_ADDED: 'CHARACTER_ADDED',
  CHARACTER_MOVED: 'CHARACTER_MOVED',
  CHARACTER_REMOVED: 'CHARACTER_REMOVED',
  // Action Events
  ACTION_STARTED: 'ACTION_STARTED',
  ACTION_COMPLETED: 'ACTION_COMPLETED',
  // Object Events
  OBJECT_ADDED: 'OBJECT_ADDED',
  OBJECT_MOVED: 'OBJECT_MOVED',
  OBJECT_REMOVED: 'OBJECT_REMOVED',
  // Grid Events
  GRID_RESIZED: 'GRID_RESIZED',
  // General Encounter Events
  ENCOUNTER_STARTED: 'ENCOUNTER_STARTED',
  ENCOUNTER_ENDED: 'ENCOUNTER_ENDED',
  ROUND_ADVANCED: 'ROUND_ADVANCED',
};

// Export the enum so it can be required by other modules (Lambda functions)
module.exports = {
  TimelineEventType,
}; 