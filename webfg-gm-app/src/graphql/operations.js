import { gql } from "@apollo/client";

// CHARACTER QUERIES
export const LIST_CHARACTERS = gql`
  query ListCharacters {
    listCharacters {
      characterId
      name
    }
  }
`;

export const GET_CHARACTER = gql`
  query GetCharacter($characterId: ID!) {
    getCharacter(characterId: $characterId) {
      characterId
      name
      attributeData { attributeId attributeValue }
      attributes { attributeId attributeValue attributeName }
      skillData { skillId skillValue }
      skills { skillId skillValue skillName skillCategory }
      stats {
        hitPoints { current max }
        fatigue { current max }
        exhaustion { current max }
        surges { current max }
      }
      valueData { valueId }
      values { valueId valueName }
      bodyId
      body { objectId name objectCategory } 
      conditions { traitId name }
      traits { traitId name }
      actionIds
      actions { actionId name description }
      # inventory and equipment fields removed from Character type response
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
      lethality { attributeValue attributeType }
      armour { attributeValue attributeType }
      endurance { attributeValue attributeType }
      strength { attributeValue attributeType }
      dexterity { attributeValue attributeType }
      agility { attributeValue attributeType }
      perception { attributeValue attributeType }
      charisma { attributeValue attributeType }
      intelligence { attributeValue attributeType }
      resolve { attributeValue attributeType }
      morale { attributeValue attributeType }
      special
      equipmentIds
    }
  }
`;

export const GET_OBJECT = gql`
  query GetObject($objectId: ID!) {
    getObject(objectId: $objectId) {
      objectId
      name
      objectCategory
      lethality { attributeValue attributeType }
      armour { attributeValue attributeType }
      endurance { attributeValue attributeType }
      strength { attributeValue attributeType }
      dexterity { attributeValue attributeType }
      agility { attributeValue attributeType }
      perception { attributeValue attributeType }
      charisma { attributeValue attributeType }
      intelligence { attributeValue attributeType }
      resolve { attributeValue attributeType }
      morale { attributeValue attributeType }
      special
      equipmentIds
      equipment { 
        objectId
        name
        objectCategory
        equipmentIds
      }
    }
  }
`;

// SKILL QUERIES
export const LIST_SKILLS = gql`
  query ListSkills {
    listSkills { skillId skillName skillCategory }
  }
`;

// ATTRIBUTE QUERIES
export const LIST_ATTRIBUTES = gql`
  query ListAttributes {
    listAttributes { attributeId attributeName }
  }
`;

// ACTION QUERIES
export const LIST_ACTIONS = gql`
  query ListActions {
    listActions {
      actionId
      name
      actionCategory
      initDurationId
      defaultInitDuration
      durationId
      defaultDuration
      fatigueCost
      difficultyClassId
      guaranteedFormulaId
      units 
      description
      actionTargets { targetType quantity sequenceId }
      actionSources { sourceType quantity sequenceId }
      actionEffects { effectType quantity sequenceId }
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
      defaultInitDuration
      durationId
      defaultDuration
      fatigueCost
      difficultyClassId
      guaranteedFormulaId
      units
      description
      actionTargets { targetType quantity sequenceId }
      actionSources { sourceType quantity sequenceId }
      actionEffects { effectType quantity sequenceId }
    }
  }
`;

export const GET_ACTIONS = gql`
  query GetActions($actionIds: [ID!]!) {
    getActions(actionIds: $actionIds) {
      actionId
      name
      actionCategory
      initDurationId
      defaultInitDuration
      durationId
      defaultDuration
      fatigueCost
      difficultyClassId
      guaranteedFormulaId
      units
      description
      actionTargets { targetType quantity sequenceId }
      actionSources { sourceType quantity sequenceId }
      actionEffects { effectType quantity sequenceId }
    }
  }
`;

// FORMULA QUERIES
export const LIST_FORMULAS = gql`
  query ListFormulas {
    listFormulas {
      formulaId
      formulaValue
    }
  }
`;

// ENCOUNTER QUERIES
export const LIST_ENCOUNTERS = gql`
  query ListEncounters {
    listEncounters { encounterId name characters { characterId name } }
  }
`;

export const GET_ENCOUNTER = gql`
  query GetEncounter($encounterId: ID!) {
    getEncounter(encounterId: $encounterId) {
      encounterId name time height width 
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
      initiativeOrder { characterId readyAt }
      characters { characterId name stats { hitPoints { current max } fatigue { current max } exhaustion { current max } surges { current max } } x y }
      objects { objectId name x y }
      terrainElements { terrainId type startX startY length color }
    }
  }
`;

// CHARACTER MUTATIONS
export const CREATE_CHARACTER = gql`
  mutation CreateCharacter($name: String!, $attributeData: [CharacterAttributeInput!], $skillData: [CharacterSkillInput!], $stats: StatsInput, $valueData: [StoredValueDataInput!], $conditions: [String], $bodyId: ID, $inventoryIds: [ID], $equipmentIds: [ID], $actionIds: [ID]) {
    createCharacter(name: $name, attributeData: $attributeData, skillData: $skillData, stats: $stats, valueData: $valueData, conditions: $conditions, bodyId: $bodyId, inventoryIds: $inventoryIds, equipmentIds: $equipmentIds, actionIds: $actionIds) {
      characterId
      name
      attributeData { attributeId attributeValue }
      skillData { skillId skillValue }
      stats { hitPoints { current max } fatigue { current max } exhaustion { current max } surges { current max } }
      valueData { valueId }
      bodyId
      actionIds
      conditions { traitId name }
    }
  }
`;

export const UPDATE_CHARACTER = gql`
  mutation UpdateCharacter($characterId: ID!, $name: String, $attributeData: [CharacterAttributeInput!], $skillData: [CharacterSkillInput!], $stats: StatsInput, $valueData: [StoredValueDataInput!], $conditions: [String], $bodyId: ID, $inventoryIds: [ID], $equipmentIds: [ID], $actionIds: [ID]) {
    updateCharacter(characterId: $characterId, name: $name, attributeData: $attributeData, skillData: $skillData, stats: $stats, valueData: $valueData, conditions: $conditions, bodyId: $bodyId, inventoryIds: $inventoryIds, equipmentIds: $equipmentIds, actionIds: $actionIds) {
      characterId
      name
      attributeData { attributeId attributeValue }
      skillData { skillId skillValue }
      stats { hitPoints { current max } fatigue { current max } exhaustion { current max } surges { current max } }
      valueData { valueId }
      conditions { traitId name }
      bodyId
      body { objectId name objectCategory }
      conditions { traitId name }
      traits { traitId name } 
      actionIds
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
      lethality { attributeValue attributeType }
      armour { attributeValue attributeType }
      endurance { attributeValue attributeType }
      strength { attributeValue attributeType }
      dexterity { attributeValue attributeType }
      agility { attributeValue attributeType }
      perception { attributeValue attributeType }
      charisma { attributeValue attributeType }
      intelligence { attributeValue attributeType }
      resolve { attributeValue attributeType }
      morale { attributeValue attributeType }
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
      lethality { attributeValue attributeType }
      armour { attributeValue attributeType }
      endurance { attributeValue attributeType }
      strength { attributeValue attributeType }
      dexterity { attributeValue attributeType }
      agility { attributeValue attributeType }
      perception { attributeValue attributeType }
      charisma { attributeValue attributeType }
      intelligence { attributeValue attributeType }
      resolve { attributeValue attributeType }
      morale { attributeValue attributeType }
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
      actionId name actionCategory initDurationId defaultInitDuration durationId defaultDuration fatigueCost difficultyClassId guaranteedFormulaId units description
      actionTargets { targetType quantity sequenceId }
      actionSources { sourceType quantity sequenceId }
      actionEffects { effectType quantity sequenceId }
    }
  }
`;
export const UPDATE_ACTION = gql`
  mutation UpdateAction($actionId: ID!, $input: ActionInput!) {
    updateAction(actionId: $actionId, input: $input) {
      actionId name actionCategory initDurationId defaultInitDuration durationId defaultDuration fatigueCost difficultyClassId guaranteedFormulaId units description
      actionTargets { targetType quantity sequenceId }
      actionSources { sourceType quantity sequenceId }
      actionEffects { effectType quantity sequenceId }
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
      # inventory no longer on Character type directly
    }
  }
`;
export const REMOVE_OBJECT_FROM_INVENTORY = gql`
  mutation RemoveObjectFromInventory($characterId: ID!, $objectId: ID!) {
    removeObjectFromInventory(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
    }
  }
`;
export const ADD_OBJECT_TO_EQUIPMENT = gql`
  mutation AddObjectToEquipment($characterId: ID!, $objectId: ID!) {
    addObjectToEquipment(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
      # equipment no longer on Character type directly
    }
  }
`;
export const REMOVE_OBJECT_FROM_EQUIPMENT = gql`
  mutation RemoveObjectFromEquipment($characterId: ID!, $objectId: ID!) {
    removeObjectFromEquipment(characterId: $characterId, objectId: $objectId) {
      characterId 
      name 
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

// FORMULA MUTATIONS
export const CREATE_FORMULA = gql`
  mutation CreateFormula($input: FormulaInput!) {
    createFormula(input: $input) {
      formulaId
      formulaValue
    }
  }
`;

// ENCOUNTER MUTATIONS
export const CREATE_ENCOUNTER = gql`
  mutation CreateEncounter($input: EncounterInput!) {
    createEncounter(input: $input) { encounterId name time height width characters { characterId name } }
  }
`;
export const UPDATE_ENCOUNTER = gql`
  mutation UpdateEncounter($encounterId: ID!, $input: EncounterInput!) {
    updateEncounter(encounterId: $encounterId, input: $input) { encounterId name time height width characters { characterId name } }
  }
`;
export const DELETE_ENCOUNTER = gql`
  mutation DeleteEncounter($encounterId: ID!) {
    deleteEncounter(encounterId: $encounterId) { encounterId name }
  }
`;

// CHARACTER-ENCOUNTER RELATIONSHIP MUTATIONS
export const ADD_CHARACTER_TO_ENCOUNTER = gql`
  mutation AddCharacterToEncounter($encounterId: ID!, $characterId: ID!, $startTime: Float, $x: Int, $y: Int) {
    addCharacterToEncounter(encounterId: $encounterId, characterId: $characterId, startTime: $startTime, x: $x, y: $y) {
      encounterId name time characters { characterId name x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const REMOVE_CHARACTER_FROM_ENCOUNTER = gql`
  mutation RemoveCharacterFromEncounter($encounterId: ID!, $characterId: ID!) {
    removeCharacterFromEncounter(encounterId: $encounterId, characterId: $characterId) {
      encounterId name time characters { characterId name } }
  }
`;

// TIMELINE AND VTT MUTATIONS
export const ADD_ACTION_TO_TIMELINE = gql`
  mutation AddActionToTimeline($encounterId: ID!, $characterId: ID!, $actionId: ID!, $startTime: Float!) {
    addActionToTimeline(encounterId: $encounterId, characterId: $characterId, actionId: $actionId, startTime: $startTime) {
      encounterId time initiativeOrder { characterId readyAt }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const ADVANCE_ENCOUNTER_TIME = gql`
  mutation AdvanceEncounterTime($encounterId: ID!, $newTime: Float!) {
    advanceEncounterTime(encounterId: $encounterId, newTime: $newTime) {
      encounterId time
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const UPDATE_CHARACTER_POSITION = gql`
  mutation UpdateCharacterPosition($encounterId: ID!, $characterId: ID!, $x: Int!, $y: Int!) {
    updateCharacterPosition(encounterId: $encounterId, characterId: $characterId, x: $x, y: $y) {
      encounterId characters { characterId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;

// OBJECT VTT MUTATIONS
export const ADD_OBJECT_TO_ENCOUNTER_VTT = gql`
  mutation AddObjectToEncounterVTT($encounterId: ID!, $objectId: ID!, $x: Int!, $y: Int!) {
    addObjectToEncounterVTT(encounterId: $encounterId, objectId: $objectId, x: $x, y: $y) {
      encounterId objects { objectId name x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const UPDATE_OBJECT_POSITION = gql`
  mutation UpdateObjectPosition($encounterId: ID!, $objectId: ID!, $x: Int!, $y: Int!) {
    updateObjectPosition(encounterId: $encounterId, objectId: $objectId, x: $x, y: $y) {
      encounterId objects { objectId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const REMOVE_OBJECT_FROM_ENCOUNTER_VTT = gql`
  mutation RemoveObjectFromEncounterVTT($encounterId: ID!, $objectId: ID!) {
    removeObjectFromEncounterVTT(encounterId: $encounterId, objectId: $objectId) {
      encounterId objects { objectId name x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const ADD_TERRAIN_TO_ENCOUNTER = gql`
  mutation AddTerrainToEncounter($encounterId: ID!, $input: TerrainElementInput!) {
    addTerrainToEncounter(encounterId: $encounterId, input: $input) {
      encounterId terrainElements { terrainId type startX startY length color }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const UPDATE_TERRAIN_POSITION = gql`
  mutation UpdateTerrainPosition($encounterId: ID!, $input: UpdateTerrainPositionInput!) {
    updateTerrainPosition(encounterId: $encounterId, input: $input) {
      encounterId terrainElements { terrainId type startX startY length color }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const REMOVE_TERRAIN_FROM_ENCOUNTER = gql`
  mutation RemoveTerrainFromEncounter($encounterId: ID!, $terrainId: ID!) {
    removeTerrainFromEncounter(encounterId: $encounterId, terrainId: $terrainId) {
      encounterId terrainElements { terrainId type startX startY length color }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;

// SUBSCRIPTIONS
export const ON_CREATE_CHARACTER = gql`
  subscription OnCreateCharacter {
    onCreateCharacter {
      characterId name
      valueData { valueId }
      bodyId
      # inventoryIds # Removed from response
      # equipmentIds # Removed from response
    }
  }
`;
export const ON_UPDATE_CHARACTER = gql`
  subscription OnUpdateCharacter {
    onUpdateCharacter {
      characterId name
      attributeData { attributeId attributeValue }
      skillData { skillId skillValue }
      stats { hitPoints { current max } fatigue { current max } exhaustion { current max } surges { current max } }
      valueData { valueId }
      bodyId
      conditions { traitId name }
      # inventoryIds # Removed from response
      # equipmentIds # Removed from response
      actionIds
      # inventory and equipment fields removed
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
      lethality { attributeValue attributeType }
      armour { attributeValue attributeType }
      endurance { attributeValue attributeType }
      strength { attributeValue attributeType }
      dexterity { attributeValue attributeType }
      agility { attributeValue attributeType }
      perception { attributeValue attributeType }
      charisma { attributeValue attributeType }
      intelligence { attributeValue attributeType }
      resolve { attributeValue attributeType }
      morale { attributeValue attributeType }
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
      lethality { attributeValue attributeType }
      armour { attributeValue attributeType }
      endurance { attributeValue attributeType }
      strength { attributeValue attributeType }
      dexterity { attributeValue attributeType }
      agility { attributeValue attributeType }
      perception { attributeValue attributeType }
      charisma { attributeValue attributeType }
      intelligence { attributeValue attributeType }
      resolve { attributeValue attributeType }
      morale { attributeValue attributeType }
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
      actionId name actionCategory initDurationId defaultInitDuration durationId defaultDuration fatigueCost difficultyClassId guaranteedFormulaId units description
      actionTargets { targetType quantity sequenceId }
      actionSources { sourceType quantity sequenceId }
      actionEffects { effectType quantity sequenceId }
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
export const ON_ENCOUNTER_TIMELINE_CHANGED = gql`
  subscription OnEncounterTimelineChanged($encounterId: ID!) {
    onEncounterTimelineChanged(encounterId: $encounterId) {
      encounterId time initiativeOrder { characterId readyAt }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const ON_ENCOUNTER_VTT_CHANGED = gql`
  subscription OnEncounterVttChanged($encounterId: ID!) {
    onEncounterVttChanged(encounterId: $encounterId) {
      encounterId height width characters { characterId x y } objects { objectId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const ON_ENCOUNTER_CHARACTER_CHANGED = gql`
  subscription OnEncounterCharacterChanged($encounterId: ID!) {
    onEncounterCharacterChanged(encounterId: $encounterId) {
      encounterId time characters { characterId name }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;

// GRID MUTATIONS
export const UPDATE_GRID_SIZE = gql`
  mutation UpdateGridSize($input: UpdateGridSizeInput!) {
    updateGridSize(input: $input) {
      encounterId
      width
      height
    }
  }
`;

// GRID SUBSCRIPTIONS
export const ON_GRID_SIZE_CHANGED = gql`
  subscription OnGridSizeChanged($encounterId: ID!) {
    onGridSizeChanged(encounterId: $encounterId) {
      encounterId
      width
      height
    }
  }
`;