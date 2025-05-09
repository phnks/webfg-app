import { gql } from "@apollo/client";

// CHARACTER QUERIES
export const LIST_CHARACTERS = gql`
  query ListCharacters {
    listCharacters {
      characterId
      name
      # race removed
    }
  }
`;

export const GET_CHARACTER = gql`
  query GetCharacter($characterId: ID!) {
    getCharacter(characterId: $characterId) {
      characterId
      name
      # race removed
      attributeData { # Get stored data
        attributeId
        attributeValue
      }
      attributes { # Get resolved data
        attributeId
        attributeValue
        attributeName
      }
      skillData { # Get stored data
        skillId
        skillValue
      }
      skills { # Get resolved data
        skillId
        skillValue
        skillName
        skillCategory
      }
      stats {
        hitPoints {
          current
          max
        }
        fatigue {
          current
          max
        }
        exhaustion {
          current
          max
        }
        surges {
          current
          max
        }
      }
      valueData { # Get stored value data
        valueId
      }
      values { # Get resolved value data
        valueId
        valueName
      }
      bodyId # Get body ID
      body { # Get resolved body object
        objectId
        name
        type
      }
      conditions { # Added sub-selection for Trait fields
        traitId
        name
      }
      inventoryIds
      equipmentIds
      actionIds
      inventory {
        objectId
        name
        type
        fit
        weight
      }
      equipment {
        objectId
        name
        type
        fit
        weight
      }
      actions {
        actionId
        name
        description
      }
    }
  }
`;

// OBJECT QUERIES
export const LIST_OBJECTS = gql`
  query ListObjects {
    listObjects {
      objectId
      name
      type
      fit
      weight
    }
  }
`;

export const GET_OBJECT = gql`
  query GetObject($objectId: ID!) {
    getObject(objectId: $objectId) {
      objectId
      name
      type
      fit
      weight
      noise
      hitPoints {
        max
        current
      }
    }
  }
`;

// SKILL QUERIES (NEW)
export const LIST_SKILLS = gql`
  query ListSkills {
    listSkills { # Assuming this query exists
      skillId
      skillName
      skillCategory
      # description # Optional
    }
  }
`;

// ATTRIBUTE QUERIES (NEW)
export const LIST_ATTRIBUTES = gql`
  query ListAttributes {
    listAttributes { # Assuming this query exists
      attributeId
      attributeName
      # description # Optional
    }
  }
`;

// ACTION QUERIES
export const LIST_ACTIONS = gql`
  query ListActions {
    listActions {
      actionId
      name
      description
    }
  }
`;

export const GET_ACTIONS = gql`
  query GetActions($actionIds: [ID!]!) {
    getActions(actionIds: $actionIds) {
      actionId
      name
    }
  }
`;

export const GET_ACTION = gql`
  query GetAction($actionId: ID!) {
    getAction(actionId: $actionId) {
      actionId
      name
      actionCategory
      initDurationId
      initDuration {
        formulaId
        formulaValue
      }
      defaultInitDuration
      durationId
      duration {
        formulaId
        formulaValue
      }
      defaultDuration
      fatigueCost
      difficultyClassId
      difficultyClass {
        formulaId
        formulaValue
      }
      guaranteedFormulaId
      guaranteedFormula {
        formulaId
        formulaValue
      }
      units
      description
      actionTargets {
        targetType
        quantity
        sequenceId
      }
      actionSources {
        sourceType
        quantity
        sequenceId
      }
      actionEffects {
        effectType
        quantity
        sequenceId
      }
    }
  }
`;

// ENCOUNTER QUERIES (NEW)
export const GET_ENCOUNTER = gql`
  query GetEncounter($encounterId: ID!) {
    getEncounter(encounterId: $encounterId) {
      encounterId
      name
      description
      # Add other relevant fields like characters, objects, state, etc.
    }
  }
`;

export const LIST_ENCOUNTERS = gql`
  query ListEncounters {
    listEncounters {
      encounterId
      name
      description
      # Include other fields like creation date, last updated, etc.
    }
  }
`;

// FORMULA QUERIES (NEW)
export const LIST_FORMULAS = gql`
  query ListFormulas {
    listFormulas {
      formulaId
      formulaValue
      # Include other fields like description, etc.
    }
  }
`;


// MUTATIONS
export const ON_UPDATE_ACTION = gql`
  mutation UpdateAction($actionId: ID!) {
    updateAction(actionId: $actionId) {
      actionId
      name
      description
    }
  }
`;

export const ON_UPDATE_CHARACTER = gql`
  mutation UpdateCharacter($characterId: ID!, $input: UpdateCharacterInput!) {
    updateCharacter(characterId: $characterId, input: $input) {
      characterId
      name
      # Add other fields here as needed based on the new schema
      attributeData {
        attributeId
        attributeValue
      }
      skillData {
        skillId
        skillValue
      }
      stats {
        hitPoints { current max }
        fatigue { current max }
        exhaustion { current max }
        surges { current max }
      }
      valueData { valueId }
      bodyId
      conditions { traitId name }
      inventoryIds
      equipmentIds
      actionIds
    }
  }
`;

export const DELETE_ACTION = gql`
  mutation DeleteAction($actionId: ID!) {
    deleteAction(actionId: $actionId) {
      actionId
    }
  }
`;

export const ADD_ACTION_TO_CHARACTER = gql`
  mutation AddActionToCharacter($characterId: ID!, $actionId: ID!) {
    addActionToCharacter(characterId: $characterId, actionId: $actionId) {
      characterId
      # Possibly return actionIds or the list of actions on the character
    }
  }
`;

export const DELETE_CHARACTER = gql`
  mutation DeleteCharacter($characterId: ID!) {
    deleteCharacter(characterId: $characterId) {
      characterId
    }
  }
`;

export const ON_CREATE_CHARACTER = gql`
  mutation CreateCharacter($input: CreateCharacterInput!) {
    createCharacter(input: $input) {
      characterId
      name
      # Include other fields you might need after creation
    }
  }
`;

export const ON_DELETE_CHARACTER = gql`
  subscription OnDeleteCharacter($characterId: ID!) {
    onDeleteCharacter(characterId: $characterId) {
      characterId
    }
  }
`;

export const ADVANCE_ENCOUNTER_TIME = gql`
  mutation AdvanceEncounterTime($encounterId: ID!, $timeDelta: Int!) {
    advanceEncounterTime(encounterId: $encounterId, timeDelta: $timeDelta) {
      encounterId
      # Include updated encounter fields like current time, etc.
    }
  }
`;

export const ADD_CHARACTER_TO_ENCOUNTER = gql`
  mutation AddCharacterToEncounter($encounterId: ID!, $characterId: ID!) {
    addCharacterToEncounter(encounterId: $encounterId, characterId: $characterId) {
      encounterId
      # Possibly return updated encounter details or character list
    }
  }
`;

export const ADD_ACTION_TO_TIMELINE = gql`
  mutation AddActionToTimeline($encounterId: ID!, $actionId: ID!, $startTime: Int!) {
    addActionToTimeline(encounterId: $encounterId, actionId: $actionId, startTime: $startTime) {
      encounterId
      # Possibly return updated timeline or action details
    }
  }
`;

export const UPDATE_CHARACTER_POSITION = gql`
  mutation UpdateCharacterPosition($characterId: ID!, $position: PositionInput!) {
    updateCharacterPosition(characterId: $characterId, position: $position) {
      characterId
      # Include updated position or other character fields
    }
  }
`;

export const UPDATE_GRID_SIZE = gql`
  mutation UpdateGridSize($encounterId: ID!, $width: Int!, $height: Int!) {
    updateGridSize(encounterId: $encounterId, width: $width, height: $height) {
      encounterId
      # Include updated grid size or other encounter fields
    }
  }
`;

export const ADD_OBJECT_TO_ENCOUNTER_VTT = gql`
  mutation AddObjectToEncounterVTT($encounterId: ID!, $objectId: ID!, $position: PositionInput!) {
    addObjectToEncounterVTT(encounterId: $encounterId, objectId: $objectId, position: $position) {
      encounterId
      # Possibly return updated VTT objects or encounter fields
    }
  }
`;

export const UPDATE_OBJECT_POSITION = gql`
  mutation UpdateObjectPosition($objectId: ID!, $position: PositionInput!) {
    updateObjectPosition(objectId: $objectId, position: $position) {
      objectId
      # Include updated position or other object fields
    }
  }
`;

export const REMOVE_OBJECT_FROM_ENCOUNTER_VTT = gql`
  mutation RemoveObjectFromEncounterVTT($encounterId: ID!, $objectId: ID!) {
    removeObjectFromEncounterVTT(encounterId: $encounterId, objectId: $objectId) {
      encounterId
      # Possibly return updated VTT objects or encounter fields
    }
  }
`;

export const ADD_TERRAIN_TO_ENCOUNTER = gql`
  mutation AddTerrainToEncounter($encounterId: ID!, $terrainData: TerrainInput!) {
    addTerrainToEncounter(encounterId: $encounterId, terrainData: $terrainData) {
      encounterId
      # Possibly return updated encounter terrain or encounter fields
    }
  }
`;

export const UPDATE_TERRAIN_POSITION = gql`
  mutation UpdateTerrainPosition($encounterId: ID!, $terrainId: ID!, $position: PositionInput!) {
    updateTerrainPosition(encounterId: $encounterId, terrainId: $terrainId, position: $position) {
      encounterId
      # Possibly return updated terrain position or encounter fields
    }
  }
`;

export const REMOVE_TERRAIN_FROM_ENCOUNTER = gql`
  mutation RemoveTerrainFromEncounter($encounterId: ID!, $terrainId: ID!) {
    removeTerrainFromEncounter(encounterId: $encounterId, terrainId: $terrainId) {
      encounterId
      # Possibly return updated encounter terrain or encounter fields
    }
  }
`;

export const ON_ENCOUNTER_TIMELINE_CHANGED = gql`
  subscription OnEncounterTimelineChanged($encounterId: ID!) {
    onEncounterTimelineChanged(encounterId: $encounterId) {
      encounterId
      # Include fields related to the timeline change, e.g., actions, current time
    }
  }
`;

export const ON_ENCOUNTER_VTT_CHANGED = gql`
  subscription OnEncounterVTTChanged($encounterId: ID!) {
    onEncounterVTTChanged(encounterId: $encounterId) {
      encounterId
      # Include fields related to VTT changes, e.g., objects, terrain
    }
  }
`;

export const ON_GRID_SIZE_CHANGED = gql`
  subscription OnGridSizeChanged($encounterId: ID!) {
    onGridSizeChanged(encounterId: $encounterId) {
      encounterId
      # Include fields related to grid size change, e.g., width, height
    }
  }
`;

export const ON_ENCOUNTER_CHARACTER_CHANGED = gql`
  subscription OnEncounterCharacterChanged($encounterId: ID!) {
    onEncounterCharacterChanged(encounterId: $encounterId) {
      encounterId
      # Include fields related to character changes within the encounter
    }
  }
`;

export const CREATE_ENCOUNTER = gql`
  mutation CreateEncounter($input: CreateEncounterInput!) {
    createEncounter(input: $input) {
      encounterId
      name
      description
      # Include other fields you might need after creation
    }
  }
`;

export const DELETE_ENCOUNTER = gql`
  mutation DeleteEncounter($encounterId: ID!) {
    deleteEncounter(encounterId: $encounterId) {
      encounterId
    }
  }
`;

export const ON_CREATE_ENCOUNTER = gql`
  subscription OnCreateEncounter {
    onCreateEncounter {
      encounterId
      name
      description
      # Include other fields you might need
    }
  }
`;

export const ON_DELETE_ENCOUNTER = gql`
  subscription OnDeleteEncounter($encounterId: ID!) {
    onDeleteEncounter(encounterId: $encounterId) {
      encounterId
    }
  }
`;

export const ON_UPDATE_ENCOUNTER = gql`
  subscription OnUpdateEncounter($encounterId: ID!) {
    onUpdateEncounter(encounterId: $encounterId) {
      encounterId
      name
      description
      # Include other updated encounter fields
    }
  }
`;

// Non-GraphQL Exports
export const defaultActionForm = {};

export const CREATE_FORMULA = gql`
  mutation CreateFormula($input: CreateFormulaInput!) {
    createFormula(input: $input) {
      formulaId
      formulaValue
      # Include other fields you might need after creation
    }
  }
`;

export const CREATE_ACTION = gql`
  mutation CreateAction($input: CreateActionInput!) {
    createAction(input: $input) {
      actionId
      name
      description
      # Include other fields you might need after creation
    }
  }
`;

export const UPDATE_ACTION = gql`
  mutation UpdateAction($actionId: ID!, $input: UpdateActionInput!) {
    updateAction(actionId: $actionId, input: $input) {
      actionId
      name
      description
      # Include other updated action fields
    }
  }
`;
