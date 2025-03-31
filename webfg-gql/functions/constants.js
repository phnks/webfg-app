// Defines the types of events that can be recorded in the encounter history timeline.
const TimelineEventType = {
  // Character Events
  CHARACTER_ADDED: 'CHARACTER_ADDED',
  CHARACTER_MOVED: 'CHARACTER_MOVED',
  CHARACTER_REMOVED: 'CHARACTER_REMOVED', // Added for completeness
  CHARACTER_ACTION: 'CHARACTER_ACTION',   // Added for completeness

  // Object Events
  OBJECT_ADDED: 'OBJECT_ADDED',
  OBJECT_MOVED: 'OBJECT_MOVED',
  OBJECT_REMOVED: 'OBJECT_REMOVED',

  // Terrain Events
  TERRAIN_ADDED: 'TERRAIN_ADDED',
  TERRAIN_MOVED: 'TERRAIN_MOVED',     // Note: Moving terrain might be complex depending on type
  TERRAIN_REMOVED: 'TERRAIN_REMOVED',

  // Grid Events
  GRID_RESIZED: 'GRID_RESIZED',       // Added for completeness

  // General Encounter Events
  ENCOUNTER_STARTED: 'ENCOUNTER_STARTED',
  ENCOUNTER_ENDED: 'ENCOUNTER_ENDED',
  ROUND_ADVANCED: 'ROUND_ADVANCED',
};

// Export the enum so it can be required by other modules (Lambda functions)
module.exports = {
  TimelineEventType,
}; 