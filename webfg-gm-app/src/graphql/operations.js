import { gql } from "@apollo/client";

// CHARACTER QUERIES
export const LIST_CHARACTERS = gql`
  query ListCharacters {
    listCharacters {
      characterId
      name
      description
      characterConditions {
        conditionId
        amount
      }
      conditions {
        conditionId
        name
        description
        conditionCategory
        conditionType
        conditionTarget
        amount
      }
      speed { attribute { attributeValue isGrouped } }
      weight { attribute { attributeValue isGrouped } }
      size { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      lethality { attribute { attributeValue isGrouped } }
      penetration { attribute { attributeValue isGrouped } }
      complexity { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      obscurity { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      seeing { attribute { attributeValue isGrouped } }
      hearing { attribute { attributeValue isGrouped } }
      light { attribute { attributeValue isGrouped } }
      noise { attribute { attributeValue isGrouped } }
      equipment { 
        objectId name objectCategory isEquipment
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        obscurity { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        seeing { attributeValue isGrouped }
        hearing { attributeValue isGrouped }
        light { attributeValue isGrouped }
        noise { attributeValue isGrouped }
        equipment { 
          objectId name objectCategory isEquipment
          speed { attributeValue isGrouped }
          weight { attributeValue isGrouped }
          size { attributeValue isGrouped }
          armour { attributeValue isGrouped }
          endurance { attributeValue isGrouped }
          lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
          penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
          complexity { attributeValue isGrouped }
          strength { attributeValue isGrouped }
          dexterity { attributeValue isGrouped }
          agility { attributeValue isGrouped }
          obscurity { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
        }
      }
      actionIds
      actions { actionId name actionCategory description sourceAttribute targetAttribute targetType effectType objectUsage triggeredActionId triggeredAction { actionId name sourceAttribute targetAttribute targetType effectType objectUsage } }
      targetAttributeTotal
    }
  }
`;

export const GET_CHARACTER = gql`
  query GetCharacter($characterId: ID!) {
    getCharacter(characterId: $characterId) {
      characterId
      name
      description
      characterCategory
      race
      raceOverride
      will
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
      
      # Conditions
      characterConditions {
        conditionId
        amount
      }
      conditions {
        conditionId
        name
        description
        conditionCategory
        conditionType
        conditionTarget
        amount
      }
      
      # Character attributes (no longer have fatigue)
      speed { attribute { attributeValue isGrouped } }
      weight { attribute { attributeValue isGrouped } }
      size { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      lethality { attribute { attributeValue isGrouped } }
      penetration { attribute { attributeValue isGrouped } }
      complexity { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      obscurity { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      seeing { attribute { attributeValue isGrouped } }
      hearing { attribute { attributeValue isGrouped } }
      light { attribute { attributeValue isGrouped } }
      noise { attribute { attributeValue isGrouped } }
      
      special
      actionIds
      actions { actionId name actionCategory description sourceAttribute targetAttribute targetType effectType objectUsage triggeredActionId triggeredAction { actionId name sourceAttribute targetAttribute targetType effectType objectUsage } }
      stashIds
      stash { objectId name objectCategory isEquipment }
      equipmentIds
      equipment { 
        objectId name objectCategory isEquipment
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        obscurity { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        seeing { attributeValue isGrouped }
        hearing { attributeValue isGrouped }
        light { attributeValue isGrouped }
        noise { attributeValue isGrouped }
        equipment { 
          objectId name objectCategory isEquipment
          speed { attributeValue isGrouped }
          weight { attributeValue isGrouped }
          size { attributeValue isGrouped }
          armour { attributeValue isGrouped }
          endurance { attributeValue isGrouped }
          lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
          penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
          complexity { attributeValue isGrouped }
          strength { attributeValue isGrouped }
          dexterity { attributeValue isGrouped }
          agility { attributeValue isGrouped }
          obscurity { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
        }
      }
      readyIds
      ready { 
        objectId name objectCategory isEquipment
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        obscurity { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        seeing { attributeValue isGrouped }
        hearing { attributeValue isGrouped }
        light { attributeValue isGrouped }
        noise { attributeValue isGrouped }
      }
      targetAttributeTotal
    }
  }
`;

// OBJECT QUERIES
export const LIST_OBJECTS = gql`
  query ListObjects {
    listObjects {
      objectId
      name
      description
      objectCategory
      isEquipment
      speed { attributeValue isGrouped }
      weight { attributeValue isGrouped }
      size { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
      complexity { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      obscurity { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      seeing { attributeValue isGrouped }
      hearing { attributeValue isGrouped }
      light { attributeValue isGrouped }
      noise { attributeValue isGrouped }
      special
      equipmentIds
      equipment { 
        objectId name objectCategory isEquipment
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        obscurity { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        seeing { attributeValue isGrouped }
        hearing { attributeValue isGrouped }
        light { attributeValue isGrouped }
        noise { attributeValue isGrouped }
      }
    }
  }
`;

export const GET_OBJECT = gql`
  query GetObject($objectId: ID!) {
    getObject(objectId: $objectId) {
      objectId
      name
      description
      objectCategory
      speed { attributeValue isGrouped }
      weight { attributeValue isGrouped }
      size { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
      complexity { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      obscurity { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      seeing { attributeValue isGrouped }
      hearing { attributeValue isGrouped }
      light { attributeValue isGrouped }
      noise { attributeValue isGrouped }
      special
      equipmentIds
      equipment { 
        objectId
        name
        objectCategory
        equipmentIds
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        obscurity { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        seeing { attributeValue isGrouped }
        hearing { attributeValue isGrouped }
        light { attributeValue isGrouped }
        noise { attributeValue isGrouped }
      }
    }
  }
`;


// ACTION QUERIES
export const LIST_ACTIONS = gql`
  query ListActions {
    listActions {
      actionId
      name
      actionCategory
      sourceAttribute
      targetAttribute
      description
      targetType
      effectType
      triggeredActionId
      objectUsage
      formula
      triggeredAction {
        actionId
        name
        sourceAttribute
        targetAttribute
        targetType
        effectType
        triggeredActionId
        objectUsage
      }
    }
  }
`;

export const GET_ACTION = gql`
  query GetAction($actionId: ID!) {
    getAction(actionId: $actionId) {
      actionId
      name
      actionCategory
      sourceAttribute
      targetAttribute
      description
      targetType
      effectType
      triggeredActionId
      objectUsage
      formula
      triggeredAction {
        actionId
        name
        sourceAttribute
        targetAttribute
        targetType
        effectType
        triggeredActionId
        objectUsage
      }
    }
  }
`;

export const GET_ACTIONS = gql`
  query GetActions($actionIds: [ID!]!) {
    getActions(actionIds: $actionIds) {
      actionId
      name
      actionCategory
      sourceAttribute
      targetAttribute
      description
      targetType
      effectType
      objectUsage
      formula
    }
  }
`;


// ENCOUNTER QUERIES
export const LIST_ENCOUNTERS = gql`
  query ListEncounters {
    listEncounters { 
      encounterId 
      name 
      description
      round
      initiative
      createdAt 
    }
  }
`;

export const GET_ENCOUNTER = gql`
  query GetEncounter($encounterId: ID!) {
    getEncounter(encounterId: $encounterId) {
      encounterId 
      name 
      description
      round
      initiative
      eventsCurrent {
        round
        events {
          initiative
          type
          character {
            characterId
            name
          }
          action {
            actionId
            name
          }
          description
        }
      }
      eventsHistory {
        round
        events {
          initiative
          type
          character {
            characterId
            name
          }
          action {
            actionId
            name
          }
          description
        }
      }
      createdAt
    }
  }
`;

// CHARACTER MUTATIONS
export const CREATE_CHARACTER = gql`
  mutation CreateCharacter($input: CharacterInput!) {
    createCharacter(input: $input) {
      characterId
      name
      description
      characterCategory
      race
      raceOverride
      will
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
      
      # Character attributes (no longer have fatigue)
      speed { attribute { attributeValue isGrouped } }
      weight { attribute { attributeValue isGrouped } }
      size { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      lethality { attribute { attributeValue isGrouped } }
      penetration { attribute { attributeValue isGrouped } }
      complexity { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      obscurity { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      seeing { attribute { attributeValue isGrouped } }
      hearing { attribute { attributeValue isGrouped } }
      light { attribute { attributeValue isGrouped } }
      noise { attribute { attributeValue isGrouped } }
      
      special
      actionIds
      stashIds
      equipmentIds
      readyIds
      targetAttributeTotal
    }
  }
`;

export const UPDATE_CHARACTER = gql`
  mutation UpdateCharacter($characterId: ID!, $input: CharacterInput!) {
    updateCharacter(characterId: $characterId, input: $input) {
      characterId
      name
      description
      characterCategory
      race
      raceOverride
      will
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
      
      # Character attributes (no longer have fatigue)
      speed { attribute { attributeValue isGrouped } }
      weight { attribute { attributeValue isGrouped } }
      size { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      lethality { attribute { attributeValue isGrouped } }
      penetration { attribute { attributeValue isGrouped } }
      complexity { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      obscurity { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      seeing { attribute { attributeValue isGrouped } }
      hearing { attribute { attributeValue isGrouped } }
      light { attribute { attributeValue isGrouped } }
      noise { attribute { attributeValue isGrouped } }
      
      special
      actionIds
      stashIds
      equipmentIds
      readyIds
      targetAttributeTotal
    }
  }
`;

export const DELETE_CHARACTER = gql`
  mutation DeleteCharacter($characterId: ID!) {
    deleteCharacter(characterId: $characterId) { characterId name }
  }
`;

// OBJECT MUTATIONS
export const CREATE_OBJECT = gql`
  mutation CreateObject($input: ObjectInput!) {
    createObject(input: $input) {
      objectId
      name
      description
      objectCategory
      speed { attributeValue isGrouped }
      weight { attributeValue isGrouped }
      size { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
      complexity { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      obscurity { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      seeing { attributeValue isGrouped }
      hearing { attributeValue isGrouped }
      light { attributeValue isGrouped }
      noise { attributeValue isGrouped }
      special
      equipmentIds
      equipment { objectId name }
    }
  }
`;
export const UPDATE_OBJECT = gql`
  mutation UpdateObject($objectId: ID!, $input: ObjectInput!) {
    updateObject(objectId: $objectId, input: $input) {
      objectId
      name
      description
      objectCategory
      speed { attributeValue isGrouped }
      weight { attributeValue isGrouped }
      size { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
      complexity { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      obscurity { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      seeing { attributeValue isGrouped }
      hearing { attributeValue isGrouped }
      light { attributeValue isGrouped }
      noise { attributeValue isGrouped }
      special
      equipmentIds
      equipment { objectId name }
    }
  }
`;
export const DELETE_OBJECT = gql`
  mutation DeleteObject($objectId: ID!) {
    deleteObject(objectId: $objectId) { objectId name }
  }
`;

// ACTION MUTATIONS
export const CREATE_ACTION = gql`
  mutation CreateAction($input: ActionInput!) {
    createAction(input: $input) {
      actionId name actionCategory sourceAttribute targetAttribute description
      targetType
      effectType
      objectUsage
      formula
    }
  }
`;
export const UPDATE_ACTION = gql`
  mutation UpdateAction($actionId: ID!, $input: ActionInput!) {
    updateAction(actionId: $actionId, input: $input) {
      actionId name actionCategory sourceAttribute targetAttribute description
      targetType
      effectType
      objectUsage
      formula
    }
  }
`;
export const DELETE_ACTION = gql`
  mutation DeleteAction($actionId: ID!) {
    deleteAction(actionId: $actionId) { actionId name }
  }
`;

// CHARACTER-OBJECT RELATIONSHIP MUTATIONS
export const ADD_OBJECT_TO_STASH = gql`
  mutation AddObjectToStash($characterId: ID!, $objectId: ID!) {
    addObjectToStash(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
      stashIds
      stash {
        objectId
        name
        objectCategory
      }
    }
  }
`;

export const REMOVE_OBJECT_FROM_STASH = gql`
  mutation RemoveObjectFromStash($characterId: ID!, $objectId: ID!) {
    removeObjectFromStash(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
      stashIds
      stash {
        objectId
        name
        objectCategory
      } 
    }
  }
`;

export const MOVE_OBJECT_TO_EQUIPMENT = gql`
  mutation MoveObjectToEquipment($characterId: ID!, $objectId: ID!) {
    moveObjectToEquipment(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
      stashIds
      stash {
        objectId
        name
        objectCategory
      }
      equipmentIds
      equipment {
        objectId
        name
        objectCategory
      }
    }
  }
`;

export const MOVE_OBJECT_TO_READY = gql`
  mutation MoveObjectToReady($characterId: ID!, $objectId: ID!) {
    moveObjectToReady(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
      equipmentIds
      equipment {
        objectId
        name
        objectCategory
      }
      readyIds
      ready {
        objectId
        name
        objectCategory
      }
    }
  }
`;

export const MOVE_OBJECT_FROM_READY_TO_EQUIPMENT = gql`
  mutation MoveObjectFromReadyToEquipment($characterId: ID!, $objectId: ID!) {
    moveObjectFromReadyToEquipment(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
      equipmentIds
      equipment {
        objectId
        name
        objectCategory
      }
      readyIds
      ready {
        objectId
        name
        objectCategory
      }
    }
  }
`;

export const MOVE_OBJECT_FROM_EQUIPMENT_TO_STASH = gql`
  mutation MoveObjectFromEquipmentToStash($characterId: ID!, $objectId: ID!) {
    moveObjectFromEquipmentToStash(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
      stashIds
      stash {
        objectId
        name
        objectCategory
      }
      equipmentIds
      equipment {
        objectId
        name
        objectCategory
      }
    }
  }
`;

// CHARACTER-ACTION RELATIONSHIP MUTATIONS
export const ADD_ACTION_TO_CHARACTER = gql`
  mutation AddActionToCharacter($characterId: ID!, $actionId: ID!) {
    addActionToCharacter(characterId: $characterId, actionId: $actionId) {
      characterId name actionIds actions { actionId name }
    }
  }
`;
export const REMOVE_ACTION_FROM_CHARACTER = gql`
  mutation RemoveActionFromCharacter($characterId: ID!, $actionId: ID!) {
    removeActionFromCharacter(characterId: $characterId, actionId: $actionId) {
      characterId name actionIds actions { actionId name }
    }
  }
`;


// ENCOUNTER MUTATIONS
export const CREATE_ENCOUNTER = gql`
  mutation CreateEncounter($input: EncounterInput!) {
    createEncounter(input: $input) { 
      encounterId 
      name 
      description
      round
      initiative
      createdAt
    }
  }
`;
export const UPDATE_ENCOUNTER = gql`
  mutation UpdateEncounter($encounterId: ID!, $input: EncounterInput!) {
    updateEncounter(encounterId: $encounterId, input: $input) { 
      encounterId 
      name 
      description
      round
      initiative
    }
  }
`;
export const DELETE_ENCOUNTER = gql`
  mutation DeleteEncounter($encounterId: ID!) {
    deleteEncounter(encounterId: $encounterId) { encounterId name }
  }
`;

// CHARACTER-ENCOUNTER RELATIONSHIP MUTATIONS
export const ADD_CHARACTER_TO_ENCOUNTER = gql`
  mutation AddCharacterToEncounter($encounterId: ID!, $characterId: ID!, $initiative: Int!) {
    addCharacterToEncounter(encounterId: $encounterId, characterId: $characterId, initiative: $initiative) {
      encounterId 
      name 
      round
      initiative
      eventsCurrent {
        round
        events {
          initiative
          type
          character {
            characterId
            name
          }
          description
        }
      }
    }
  }
`;
export const REMOVE_CHARACTER_FROM_ENCOUNTER = gql`
  mutation RemoveCharacterFromEncounter($encounterId: ID!, $characterId: ID!, $initiative: Int!) {
    removeCharacterFromEncounter(encounterId: $encounterId, characterId: $characterId, initiative: $initiative) {
      encounterId 
      name 
      round
      initiative 
      eventsCurrent {
        round
        events {
          initiative
          type
          character {
            characterId
            name
          }
          description
        }
      }
    }
  }
`;

// New Encounter Mutations
export const ADD_EVENT_TO_ENCOUNTER = gql`
  mutation AddEventToEncounter($encounterId: ID!, $input: EncounterEventInput!) {
    addEventToEncounter(encounterId: $encounterId, input: $input) {
      encounterId
      name
      round
      initiative
      eventsCurrent {
        round
        events {
          initiative
          type
          character {
            characterId
            name
          }
          action {
            actionId
            name
          }
          description
        }
      }
    }
  }
`;
export const ADVANCE_ROUND = gql`
  mutation AdvanceRound($encounterId: ID!) {
    advanceRound(encounterId: $encounterId) {
      encounterId
      round
      initiative
      eventsCurrent
    }
  }
`;

export const ADVANCE_INITIATIVE = gql`
  mutation AdvanceInitiative($encounterId: ID!) {
    advanceInitiative(encounterId: $encounterId) {
      encounterId
      round
      initiative
    }
  }
`;

export const ARCHIVE_CURRENT_EVENTS = gql`
  mutation ArchiveCurrentEvents($encounterId: ID!, $round: Int!, $events: [EncounterEventInput]!) {
    archiveCurrentEvents(encounterId: $encounterId, round: $round, events: $events) {
      encounterId
      round
      initiative
      eventsCurrent
      eventsHistory {
        round
        events {
          initiative
          type
          character {
            characterId
            name
          }
          action {
            actionId
            name
          }
          description
        }
      }
    }
  }
`;


// ENCOUNTER SUBSCRIPTIONS
export const ON_ENCOUNTER_EVENTS_CHANGED = gql`
  subscription OnEncounterEventsChanged($encounterId: ID!) {
    onEncounterEventsChanged(encounterId: $encounterId) {
      encounterId
      round
      initiative
      eventsCurrent {
        round
        events {
          initiative
          type
          character {
            characterId
            name
          }
          action {
            actionId
            name
          }
          description
        }
      }
    }
  }
`;

export const ON_ENCOUNTER_ROUND_CHANGED = gql`
  subscription OnEncounterRoundChanged($encounterId: ID!) {
    onEncounterRoundChanged(encounterId: $encounterId) {
      encounterId
      round
      initiative
    }
  }
`;

// CHARACTER SUBSCRIPTIONS
export const ON_CREATE_CHARACTER = gql`
  subscription OnCreateCharacter {
    onCreateCharacter {
      characterId
      name
      description
      characterCategory
      will
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
      equipmentIds
    }
  }
`;
export const ON_UPDATE_CHARACTER = gql`
  subscription OnUpdateCharacter {
    onUpdateCharacter {
      characterId
      name
      description
      characterCategory
      will
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
      
      # Character attributes (no longer have fatigue)
      speed { attribute { attributeValue isGrouped } }
      weight { attribute { attributeValue isGrouped } }
      size { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      lethality { attribute { attributeValue isGrouped } }
      penetration { attribute { attributeValue isGrouped } }
      complexity { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      obscurity { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      seeing { attribute { attributeValue isGrouped } }
      hearing { attribute { attributeValue isGrouped } }
      light { attribute { attributeValue isGrouped } }
      noise { attribute { attributeValue isGrouped } }
      
      special
      actionIds
      equipmentIds
    }
  }
`;
export const ON_DELETE_CHARACTER = gql`
  subscription OnDeleteCharacter { onDeleteCharacter { characterId name } }
`;
export const ON_CREATE_OBJECT = gql`
  subscription OnCreateObject {
    onCreateObject {
      objectId
      name
      description
      objectCategory
      speed { attributeValue isGrouped }
      weight { attributeValue isGrouped }
      size { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
      complexity { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      obscurity { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      seeing { attributeValue isGrouped }
      hearing { attributeValue isGrouped }
      light { attributeValue isGrouped }
      noise { attributeValue isGrouped }
      special
      equipmentIds
    }
  }
`;
export const ON_UPDATE_OBJECT = gql`
  subscription OnUpdateObject {
    onUpdateObject {
      objectId
      name
      description
      objectCategory
      speed { attributeValue isGrouped }
      weight { attributeValue isGrouped }
      size { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
      complexity { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      obscurity { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      seeing { attributeValue isGrouped }
      hearing { attributeValue isGrouped }
      light { attributeValue isGrouped }
      noise { attributeValue isGrouped }
      special
      equipmentIds
    }
  }
`;
export const ON_DELETE_OBJECT = gql`
  subscription OnDeleteObject { onDeleteObject { objectId name } }
`;
export const ON_CREATE_ACTION = gql`
  subscription OnCreateAction { onCreateAction { actionId name } }
`;
export const ON_UPDATE_ACTION = gql`
  subscription OnUpdateAction { 
    onUpdateAction { 
      actionId name actionCategory sourceAttribute targetAttribute description
      targetType
      effectType
      objectUsage
      formula
    } 
  }
`;
export const ON_DELETE_ACTION = gql`
  subscription OnDeleteAction { onDeleteAction { actionId name } }
`;
export const ON_CREATE_ENCOUNTER = gql`
  subscription OnCreateEncounter { onCreateEncounter { encounterId name } }
`;
export const ON_UPDATE_ENCOUNTER = gql`
  subscription OnUpdateEncounter { onUpdateEncounter { encounterId name time characters { characterId name } } }
`;
export const ON_DELETE_ENCOUNTER = gql`
  subscription OnDeleteEncounter { onDeleteEncounter { encounterId name } }
`;

// Condition Operations
export const CREATE_CONDITION = gql`
  mutation CreateCondition($input: ConditionInput!) {
    createCondition(input: $input) {
      conditionId
      name
      description
      conditionCategory
      conditionType
      conditionTarget
    }
  }
`;

export const UPDATE_CONDITION = gql`
  mutation UpdateCondition($conditionId: ID!, $input: ConditionInput!) {
    updateCondition(conditionId: $conditionId, input: $input) {
      conditionId
      name
      description
      conditionCategory
      conditionType
      conditionTarget
    }
  }
`;

export const DELETE_CONDITION = gql`
  mutation DeleteCondition($conditionId: ID!) {
    deleteCondition(conditionId: $conditionId) {
      conditionId
      name
    }
  }
`;

export const LIST_CONDITIONS = gql`
  query ListConditions($filter: ConditionFilterInput) {
    listConditions(filter: $filter) {
      conditionId
      name
      description
      conditionCategory
      conditionType
      conditionTarget
    }
  }
`;

export const GET_CONDITION = gql`
  query GetCondition($conditionId: ID!) {
    getCondition(conditionId: $conditionId) {
      conditionId
      name
      description
      conditionCategory
      conditionType
      conditionTarget
    }
  }
`;

export const GET_CONDITIONS = gql`
  query GetConditions($conditionIds: [ID!]!) {
    getConditions(conditionIds: $conditionIds) {
      conditionId
      name
      description
      conditionCategory
      conditionType
      conditionTarget
    }
  }
`;

export const ADD_CONDITION_TO_CHARACTER = gql`
  mutation AddConditionToCharacter($characterId: ID!, $conditionId: ID!, $amount: Int) {
    addConditionToCharacter(characterId: $characterId, conditionId: $conditionId, amount: $amount) {
      characterId
      name
      characterConditions {
        conditionId
        amount
      }
      conditions {
        conditionId
        name
        description
        conditionCategory
        conditionType
        conditionTarget
        amount
      }
    }
  }
`;

export const REMOVE_CONDITION_FROM_CHARACTER = gql`
  mutation RemoveConditionFromCharacter($characterId: ID!, $conditionId: ID!) {
    removeConditionFromCharacter(characterId: $characterId, conditionId: $conditionId) {
      characterId
      name
      characterConditions {
        conditionId
        amount
      }
      conditions {
        conditionId
        name
      }
    }
  }
`;

// Condition Subscriptions
export const ON_CREATE_CONDITION = gql`
  subscription OnCreateCondition { 
    onCreateCondition { 
      conditionId 
      name 
      conditionType 
      conditionTarget 
    } 
  }
`;

export const ON_UPDATE_CONDITION = gql`
  subscription OnUpdateCondition { 
    onUpdateCondition { 
      conditionId 
      name 
      description 
      conditionCategory 
      conditionType 
      conditionTarget 
    } 
  }
`;

export const ON_DELETE_CONDITION = gql`
  subscription OnDeleteCondition { 
    onDeleteCondition { 
      conditionId 
      name 
    } 
  }
`;

export const UPDATE_CONDITION_AMOUNT = gql`
  mutation UpdateConditionAmount($characterId: ID!, $conditionId: ID!, $amount: Int!) {
    updateConditionAmount(characterId: $characterId, conditionId: $conditionId, amount: $amount) {
      characterId
      name
      characterConditions {
        conditionId
        amount
      }
      conditions {
        conditionId
        name
        description
        conditionCategory
        conditionType
        conditionTarget
        amount
      }
    }
  }
`;


// ENHANCED QUERIES WITH SEARCH, FILTERING, SORTING, AND PAGINATION

export const LIST_CHARACTERS_ENHANCED = gql`
  query ListCharactersEnhanced($filter: EnhancedCharacterFilterInput) {
    listCharactersEnhanced(filter: $filter) {
      items {
        characterId
        name
        description
        characterCategory
        will
          characterConditions {
          conditionId
          amount
        }
        conditions {
          conditionId
          name
          description
          conditionCategory
          conditionType
          conditionTarget
          amount
        }
        speed { attribute { attributeValue isGrouped } }
        weight { attribute { attributeValue isGrouped } }
        size { attribute { attributeValue isGrouped } }
        armour { attribute { attributeValue isGrouped } }
        endurance { attribute { attributeValue isGrouped } }
        lethality { attribute { attributeValue isGrouped } }
      penetration { attribute { attributeValue isGrouped } }
        strength { attribute { attributeValue isGrouped } }
        dexterity { attribute { attributeValue isGrouped } }
        agility { attribute { attributeValue isGrouped } }
        obscurity { attribute { attributeValue isGrouped } }
        resolve { attribute { attributeValue isGrouped } }
        morale { attribute { attributeValue isGrouped } }
        intelligence { attribute { attributeValue isGrouped } }
        charisma { attribute { attributeValue isGrouped } }
        equipment { 
          objectId name objectCategory isEquipment
          speed { attributeValue isGrouped }
          weight { attributeValue isGrouped }
          size { attributeValue isGrouped }
          armour { attributeValue isGrouped }
          endurance { attributeValue isGrouped }
          lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
          penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
          complexity { attributeValue isGrouped }
          strength { attributeValue isGrouped }
          dexterity { attributeValue isGrouped }
          agility { attributeValue isGrouped }
          obscurity { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
          equipment { objectId name objectCategory }
        }
        ready { 
          objectId name objectCategory isEquipment
          speed { attributeValue isGrouped }
          weight { attributeValue isGrouped }
          size { attributeValue isGrouped }
          armour { attributeValue isGrouped }
          endurance { attributeValue isGrouped }
          lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
          penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
          complexity { attributeValue isGrouped }
          strength { attributeValue isGrouped }
          dexterity { attributeValue isGrouped }
          agility { attributeValue isGrouped }
          obscurity { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
          equipment { objectId name objectCategory }
        }
        stash { 
          objectId name objectCategory isEquipment
          speed { attributeValue isGrouped }
          weight { attributeValue isGrouped }
          size { attributeValue isGrouped }
          armour { attributeValue isGrouped }
          endurance { attributeValue isGrouped }
          lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
          penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
          complexity { attributeValue isGrouped }
          strength { attributeValue isGrouped }
          dexterity { attributeValue isGrouped }
          agility { attributeValue isGrouped }
          obscurity { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
          equipment { objectId name objectCategory }
        }
        actions { actionId name actionCategory sourceAttribute targetAttribute targetType effectType description objectUsage }
      }
      nextCursor
      hasNextPage
      totalCount
    }
  }
`;

export const LIST_OBJECTS_ENHANCED = gql`
  query ListObjectsEnhanced($filter: EnhancedObjectFilterInput) {
    listObjectsEnhanced(filter: $filter) {
      items {
        objectId
        name
        description
        objectCategory
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        obscurity { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        seeing { attributeValue isGrouped }
        hearing { attributeValue isGrouped }
        light { attributeValue isGrouped }
        noise { attributeValue isGrouped }
        special
        equipment { 
          objectId name objectCategory isEquipment
          speed { attributeValue isGrouped }
          weight { attributeValue isGrouped }
          size { attributeValue isGrouped }
          armour { attributeValue isGrouped }
          endurance { attributeValue isGrouped }
          lethality { attributeValue isGrouped }
      penetration { attributeValue isGrouped }
          penetration { attributeValue isGrouped }
        penetration { attributeValue isGrouped }
          complexity { attributeValue isGrouped }
          strength { attributeValue isGrouped }
          dexterity { attributeValue isGrouped }
          agility { attributeValue isGrouped }
          obscurity { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
        }
      }
      nextCursor
      hasNextPage
      totalCount
    }
  }
`;

export const LIST_ACTIONS_ENHANCED = gql`
  query ListActionsEnhanced($filter: EnhancedActionFilterInput) {
    listActionsEnhanced(filter: $filter) {
      items {
        actionId
        name
        actionCategory
        sourceAttribute
        targetAttribute
        targetType
        effectType
        description
        objectUsage
        triggeredAction {
          actionId
          name
          actionCategory
          sourceAttribute
          targetAttribute
          targetType
          effectType
          description
          objectUsage
        }
      }
      nextCursor
      hasNextPage
      totalCount
    }
  }
`;

export const LIST_CONDITIONS_ENHANCED = gql`
  query ListConditionsEnhanced($filter: EnhancedConditionFilterInput) {
    listConditionsEnhanced(filter: $filter) {
      items {
        conditionId
        name
        description
        conditionCategory
        conditionType
        conditionTarget
      }
      nextCursor
      hasNextPage
      totalCount
    }
  }
`;

// THOUGHT QUERIES
export const LIST_THOUGHTS = gql`
  query ListThoughts {
    listThoughts {
      thoughtId
      name
      description
    }
  }
`;

export const GET_THOUGHT = gql`
  query GetThought($thoughtId: ID!) {
    getThought(thoughtId: $thoughtId) {
      thoughtId
      name
      description
    }
  }
`;

export const LIST_THOUGHTS_ENHANCED = gql`
  query ListThoughtsEnhanced($filter: EnhancedThoughtFilterInput) {
    listThoughtsEnhanced(filter: $filter) {
      items {
        thoughtId
        name
        description
      }
      nextCursor
      hasNextPage
      totalCount
    }
  }
`;

// THOUGHT MUTATIONS
export const CREATE_THOUGHT = gql`
  mutation CreateThought($input: ThoughtInput!) {
    createThought(input: $input) {
      thoughtId
      name
      description
    }
  }
`;

export const UPDATE_THOUGHT = gql`
  mutation UpdateThought($thoughtId: ID!, $input: ThoughtInput!) {
    updateThought(thoughtId: $thoughtId, input: $input) {
      thoughtId
      name
      description
    }
  }
`;

export const DELETE_THOUGHT = gql`
  mutation DeleteThought($thoughtId: ID!) {
    deleteThought(thoughtId: $thoughtId) {
      thoughtId
      name
      description
    }
  }
`;

// THOUGHT SUBSCRIPTIONS
export const ON_CREATE_THOUGHT = gql`
  subscription OnCreateThought {
    onCreateThought {
      thoughtId
      name
      description
    }
  }
`;

export const ON_UPDATE_THOUGHT = gql`
  subscription OnUpdateThought {
    onUpdateThought {
      thoughtId
      name
      description
    }
  }
`;

export const ON_DELETE_THOUGHT = gql`
  subscription OnDeleteThought {
    onDeleteThought {
      thoughtId
      name
      description
    }
  }
`;

// CHARACTER-THOUGHT MIND MUTATIONS
export const ADD_THOUGHT_TO_CHARACTER_MIND = gql`
  mutation AddThoughtToCharacterMind($characterId: ID!, $thoughtId: ID!) {
    addThoughtToCharacterMind(characterId: $characterId, thoughtId: $thoughtId) {
      characterId
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
    }
  }
`;

export const REMOVE_THOUGHT_FROM_CHARACTER_MIND = gql`
  mutation RemoveThoughtFromCharacterMind($characterId: ID!, $thoughtId: ID!) {
    removeThoughtFromCharacterMind(characterId: $characterId, thoughtId: $thoughtId) {
      characterId
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
    }
  }
`;

export const MOVE_THOUGHT_TO_SUBCONSCIOUS = gql`
  mutation MoveThoughtToSubconscious($characterId: ID!, $thoughtId: ID!) {
    moveThoughtToSubconscious(characterId: $characterId, thoughtId: $thoughtId) {
      characterId
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
    }
  }
`;

export const MOVE_THOUGHT_TO_CONSCIOUS = gql`
  mutation MoveThoughtToConscious($characterId: ID!, $thoughtId: ID!) {
    moveThoughtToConscious(characterId: $characterId, thoughtId: $thoughtId) {
      characterId
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
    }
  }
`;

export const MOVE_THOUGHT_TO_MEMORY = gql`
  mutation MoveThoughtToMemory($characterId: ID!, $thoughtId: ID!) {
    moveThoughtToMemory(characterId: $characterId, thoughtId: $thoughtId) {
      characterId
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
    }
  }
`;

export const UPDATE_THOUGHT_AFFINITY_KNOWLEDGE = gql`
  mutation UpdateThoughtAffinityKnowledge($characterId: ID!, $thoughtId: ID!, $affinity: Int!, $knowledge: Int!) {
    updateThoughtAffinityKnowledge(characterId: $characterId, thoughtId: $thoughtId, affinity: $affinity, knowledge: $knowledge) {
      characterId
      mind { thoughtId affinity knowledge location }
      mindThoughts { thoughtId name description }
    }
  }
`;

// Inventory quantity mutations
export const UPDATE_INVENTORY_QUANTITY = gql`
  mutation UpdateInventoryQuantity($characterId: ID!, $objectId: ID!, $quantity: Int!, $location: InventoryLocation!) {
    updateInventoryQuantity(characterId: $characterId, objectId: $objectId, quantity: $quantity, location: $location) {
      characterId
      inventoryItems { objectId quantity inventoryLocation }
      stash { objectId name objectCategory }
      equipment { objectId name objectCategory }
      ready { objectId name objectCategory }
    }
  }
`;

export const MOVE_INVENTORY_ITEM = gql`
  mutation MoveInventoryItem($characterId: ID!, $objectId: ID!, $quantity: Int!, $fromLocation: InventoryLocation!, $toLocation: InventoryLocation!) {
    moveInventoryItem(characterId: $characterId, objectId: $objectId, quantity: $quantity, fromLocation: $fromLocation, toLocation: $toLocation) {
      characterId
      inventoryItems { objectId quantity inventoryLocation }
      stash { objectId name objectCategory }
      equipment { objectId name objectCategory }
      ready { objectId name objectCategory }
    }
  }
`;
