import { gql } from "@apollo/client";

// CHARACTER QUERIES
export const LIST_CHARACTERS = gql`
  query ListCharacters {
    listCharacters {
      characterId
      name
      lethality { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      perception { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      equipment { 
        objectId name objectCategory
        lethality { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        perception { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        equipment { 
          objectId name objectCategory
          lethality { attributeValue isGrouped }
          armour { attributeValue isGrouped }
          endurance { attributeValue isGrouped }
          strength { attributeValue isGrouped }
          dexterity { attributeValue isGrouped }
          agility { attributeValue isGrouped }
          perception { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
        }
      }
      actionIds
      actions { actionId name actionCategory description sourceAttribute targetAttribute targetType effectType triggeredActionId triggeredAction { actionId name sourceAttribute targetAttribute targetType effectType } }
    }
  }
`;

export const GET_CHARACTER = gql`
  query GetCharacter($characterId: ID!) {
    getCharacter(characterId: $characterId) {
      characterId
      name
      characterCategory
      will
      fatigue
      values { valueName valueType }
      
      # Character attributes (no longer have fatigue)
      lethality { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      perception { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      
      special
      actionIds
      actions { actionId name actionCategory description sourceAttribute targetAttribute targetType effectType triggeredActionId triggeredAction { actionId name sourceAttribute targetAttribute targetType effectType } }
      inventoryIds
      inventory { objectId name objectCategory }
      equipmentIds
      equipment { 
        objectId name objectCategory
        lethality { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        perception { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        equipment { 
          objectId name objectCategory
          lethality { attributeValue isGrouped }
          armour { attributeValue isGrouped }
          endurance { attributeValue isGrouped }
          strength { attributeValue isGrouped }
          dexterity { attributeValue isGrouped }
          agility { attributeValue isGrouped }
          perception { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
        }
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
      objectCategory
      lethality { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      perception { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
      special
      equipmentIds
      equipment { 
        objectId name objectCategory
        lethality { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        perception { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
      }
    }
  }
`;

export const GET_OBJECT = gql`
  query GetObject($objectId: ID!) {
    getObject(objectId: $objectId) {
      objectId
      name
      objectCategory
      lethality { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      perception { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
      special
      equipmentIds
      equipment { 
        objectId
        name
        objectCategory
        equipmentIds
        lethality { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        perception { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
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
      triggeredAction {
        actionId
        name
        sourceAttribute
        targetAttribute
        targetType
        effectType
        triggeredActionId
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
      triggeredAction {
        actionId
        name
        sourceAttribute
        targetAttribute
        targetType
        effectType
        triggeredActionId
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
      characterCategory
      will
      fatigue
      values { valueName valueType }
      
      # Character attributes (no longer have fatigue)
      lethality { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      perception { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      
      special
      actionIds
      inventoryIds
      equipmentIds
    }
  }
`;

export const UPDATE_CHARACTER = gql`
  mutation UpdateCharacter($characterId: ID!, $input: CharacterInput!) {
    updateCharacter(characterId: $characterId, input: $input) {
      characterId
      name
      characterCategory
      will
      fatigue
      values { valueName valueType }
      
      # Character attributes (no longer have fatigue)
      lethality { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      perception { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      
      special
      actionIds
      inventoryIds
      equipmentIds
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
      objectCategory
      lethality { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      perception { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
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
      objectCategory
      lethality { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      perception { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
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
    }
  }
`;
export const UPDATE_ACTION = gql`
  mutation UpdateAction($actionId: ID!, $input: ActionInput!) {
    updateAction(actionId: $actionId, input: $input) {
      actionId name actionCategory sourceAttribute targetAttribute description
      targetType
      effectType
    }
  }
`;
export const DELETE_ACTION = gql`
  mutation DeleteAction($actionId: ID!) {
    deleteAction(actionId: $actionId) { actionId name }
  }
`;

// CHARACTER-OBJECT RELATIONSHIP MUTATIONS
export const ADD_OBJECT_TO_INVENTORY = gql`
  mutation AddObjectToInventory($characterId: ID!, $objectId: ID!) {
    addObjectToInventory(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
      inventoryIds
      inventory {
        objectId
        name
        objectCategory
      }
    }
  }
`;
export const REMOVE_OBJECT_FROM_INVENTORY = gql`
  mutation RemoveObjectFromInventory($characterId: ID!, $objectId: ID!) {
    removeObjectFromInventory(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
      inventoryIds
      inventory {
        objectId
        name
        objectCategory
      } 
    }
  }
`;
export const ADD_OBJECT_TO_EQUIPMENT = gql`
  mutation AddObjectToEquipment($characterId: ID!, $objectId: ID!) {
    addObjectToEquipment(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
      equipmentIds
      equipment {
        objectId
        name
        objectCategory
      }
    }
  }
`;
export const REMOVE_OBJECT_FROM_EQUIPMENT = gql`
  mutation RemoveObjectFromEquipment($characterId: ID!, $objectId: ID!) {
    removeObjectFromEquipment(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
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
      characterCategory
      will
      values { valueName valueType }
      inventoryIds
      equipmentIds
    }
  }
`;
export const ON_UPDATE_CHARACTER = gql`
  subscription OnUpdateCharacter {
    onUpdateCharacter {
      characterId
      name
      characterCategory
      will
      values { valueName valueType }
      
      # Character attributes with fatigue
      lethality { attribute { attributeValue isGrouped } fatigue }
      armour { attribute { attributeValue isGrouped } fatigue }
      endurance { attribute { attributeValue isGrouped } fatigue }
      strength { attribute { attributeValue isGrouped } fatigue }
      dexterity { attribute { attributeValue isGrouped } fatigue }
      agility { attribute { attributeValue isGrouped } fatigue }
      perception { attribute { attributeValue isGrouped } fatigue }
      charisma { attribute { attributeValue isGrouped } fatigue }
      intelligence { attribute { attributeValue isGrouped } fatigue }
      resolve { attribute { attributeValue isGrouped } fatigue }
      morale { attribute { attributeValue isGrouped } fatigue }
      
      special
      actionIds
      inventoryIds
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
      objectCategory
      lethality { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      perception { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
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
      objectCategory
      lethality { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      perception { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
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
      conditionAmount
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
      conditionAmount
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
      conditionAmount
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
      conditionAmount
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
      conditionAmount
    }
  }
`;

export const ADD_CONDITION_TO_CHARACTER = gql`
  mutation AddConditionToCharacter($characterId: ID!, $conditionId: ID!) {
    addConditionToCharacter(characterId: $characterId, conditionId: $conditionId) {
      characterId
      name
      conditionIds
    }
  }
`;

export const REMOVE_CONDITION_FROM_CHARACTER = gql`
  mutation RemoveConditionFromCharacter($characterId: ID!, $conditionId: ID!) {
    removeConditionFromCharacter(characterId: $characterId, conditionId: $conditionId) {
      characterId
      name
      conditionIds
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
      conditionAmount 
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
      conditionAmount 
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

