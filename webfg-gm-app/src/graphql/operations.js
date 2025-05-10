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
      objectId name objectCategory width length height weight penetration deflection impact absorption
      hitPoints { current max }
      damageMin damageMax damageType isLimb noise duration handling capacity falloff partsIds
      usage { actionId usageType }
    }
  }
`;

export const GET_OBJECT = gql`
  query GetObject($objectId: ID!) {
    getObject(objectId: $objectId) {
      objectId name objectCategory width length height weight penetration deflection impact absorption
      hitPoints { current max }
      damageMin damageMax damageType isLimb noise duration handling capacity falloff partsIds
      parts { objectId name }
      usage { actionId usageType }
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
    listActions { actionId name description }
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
      actionId name actionCategory initDurationId defaultInitDuration durationId defaultDuration fatigueCost difficultyClassId guaranteedFormulaId units description
      initDuration { formulaId formulaValue }
      duration { formulaId formulaValue }
      difficultyClass { formulaId formulaValue }
      guaranteedFormula { formulaId formulaValue }
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

export const GET_FORMULA = gql`
  query GetFormula($formulaId: ID!) {
    getFormula(formulaId: $formulaId) {
      formulaId
      formulaValue
    }
  }
`;

// CHARACTER MUTATIONS
export const CREATE_CHARACTER = gql`
  mutation CreateCharacter(
    $name: String!
    $attributeData: [CharacterAttributeInput!]
    $skillData: [CharacterSkillInput!]
    $stats: StatsInput
    $valueData: [StoredValueDataInput!]
    $bodyId: ID
    $conditions: [String]
    $inventoryIds: [ID] 
    $equipmentIds: [ID] 
    $actionIds: [ID]
  ) {
    createCharacter(
      name: $name, attributeData: $attributeData, skillData: $skillData, stats: $stats, valueData: $valueData, bodyId: $bodyId, conditions: $conditions, inventoryIds: $inventoryIds, equipmentIds: $equipmentIds, actionIds: $actionIds
    ) { 
      characterId
      name
      attributeData { attributeId attributeValue }
      skillData { skillId skillValue }
      stats { hitPoints { current max } fatigue { current max } exhaustion { current max } surges { current max } }
      valueData { valueId }
      bodyId
      conditions { traitId name }
      actionIds
      # inventory and equipment fields removed
    }
  }
`;

export const UPDATE_CHARACTER = gql`
  mutation UpdateCharacter($characterId: ID!, $input: UpdateCharacterInput!) {
    updateCharacter(characterId: $characterId, input: $input) { 
      characterId
      name
      attributeData { attributeId attributeValue }
      attributes { attributeId attributeValue attributeName }
      skillData { skillId skillValue }
      skills { skillId skillValue skillName skillCategory }
      stats { hitPoints { current max } fatigue { current max } exhaustion { current max } surges { current max } }
      valueData { valueId }
      values { valueId valueName }
      bodyId
      body { objectId name objectCategory }
      conditions { traitId name }
      actionIds
      # inventory and equipment fields removed
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
      objectId name objectCategory width length height weight penetration deflection impact absorption
      hitPoints { current max }
      damageMin damageMax damageType isLimb noise duration handling capacity falloff partsIds
      parts { objectId name }
      usage { actionId usageType }
    }
  }
`;
export const UPDATE_OBJECT = gql`
  mutation UpdateObject($objectId: ID!, $input: ObjectInput!) {
    updateObject(objectId: $objectId, input: $input) {
      objectId name objectCategory width length height weight penetration deflection impact absorption
      hitPoints { current max }
      damageMin damageMax damageType isLimb noise duration handling capacity falloff partsIds
      parts { objectId name }
      usage { actionId usageType }
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
      characterId name actionIds
      actions { actionId name }
    }
  }
`;
export const REMOVE_ACTION_FROM_CHARACTER = gql`
  mutation RemoveActionFromCharacter($characterId: ID!, $actionId: ID!) {
    removeActionFromCharacter(characterId: $characterId, actionId: $actionId) {
      characterId name actionIds
    }
  }
`;

// FORMULA MUTATIONS
export const CREATE_FORMULA = gql`
  mutation CreateFormula($input: FormulaInput!) { createFormula(input: $input) { formulaId formulaValue } }
`;
export const UPDATE_FORMULA = gql`
  mutation UpdateFormula($formulaId: ID!, $input: FormulaInput!) { updateFormula(formulaId: $formulaId, input: $input) { formulaId formulaValue } }
`;
export const DELETE_FORMULA = gql`
  mutation DeleteFormula($formulaId: ID!) { deleteFormula(formulaId: $formulaId) { formulaId formulaValue } }
`;

// ENCOUNTER QUERIES
export const GET_ENCOUNTER = gql`
  query GetEncounter($encounterId: ID!) {
    getEncounter(encounterId: $encounterId) {
      encounterId
      name
      description
      currentTime
      gridRows
      gridColumns
      characterPositions { characterId x y }
      objectPositions { objectId x y }
      terrainElements { terrainId type startX startY length color }
      gridElements { id type coordinates { x y } color }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
      createdAt
    }
  }
`;
export const LIST_ENCOUNTERS = gql`
  query ListEncounters($filter: EncounterFilterInput) {
    listEncounters(filter: $filter) {
      encounterId
      name
      description
      currentTime
      createdAt
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
      currentTime
      createdAt
    }
  }
`;
export const UPDATE_ENCOUNTER = gql`
  mutation UpdateEncounter($encounterId: ID!, $input: EncounterInput!) {
    updateEncounter(encounterId: $encounterId, input: $input) {
      encounterId name description
    }
  }
`;
export const DELETE_ENCOUNTER = gql`
  mutation DeleteEncounter($encounterId: ID!) {
    deleteEncounter(encounterId: $encounterId) { encounterId }
  }
`;
export const UPDATE_GRID_SIZE = gql`
  mutation UpdateGridSize($input: UpdateGridSizeInput!) {
    updateGridSize(input: $input) {
      encounterId name description currentTime gridRows gridColumns
      characterPositions { characterId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const ADD_CHARACTER_TO_ENCOUNTER = gql`
  mutation AddCharacterToEncounter($encounterId: ID!, $characterId: ID!, $startTime: Float, $x: Int, $y: Int) {
    addCharacterToEncounter(encounterId: $encounterId, characterId: $characterId, startTime: $startTime, x: $x, y: $y) {
      encounterId name description currentTime gridRows gridColumns
      characterPositions { characterId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const REMOVE_CHARACTER_FROM_ENCOUNTER = gql`
  mutation RemoveCharacterFromEncounter($encounterId: ID!, $characterId: ID!) {
    removeCharacterFromEncounter(encounterId: $encounterId, characterId: $characterId) {
      encounterId name description currentTime gridRows gridColumns
      characterPositions { characterId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const ADD_ACTION_TO_TIMELINE = gql`
  mutation AddActionToTimeline($encounterId: ID!, $characterId: ID!, $actionId: ID!, $startTime: Float!) {
    addActionToTimeline(encounterId: $encounterId, characterId: $characterId, actionId: $actionId, startTime: $startTime) {
      encounterId name description currentTime gridRows gridColumns
      characterPositions { characterId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const ADVANCE_ENCOUNTER_TIME = gql`
  mutation AdvanceEncounterTime($encounterId: ID!, $newTime: Float!) {
    advanceEncounterTime(encounterId: $encounterId, newTime: $newTime) {
      encounterId name description currentTime gridRows gridColumns
      characterPositions { characterId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const UPDATE_CHARACTER_POSITION = gql`
  mutation UpdateCharacterPosition($encounterId: ID!, $characterId: ID!, $x: Int!, $y: Int!) {
    updateCharacterPosition(encounterId: $encounterId, characterId: $characterId, x: $x, y: $y) {
      encounterId
      characterPositions { characterId x y }
    }
  }
`;
export const ADD_GRID_ELEMENT = gql`
  mutation AddGridElement($encounterId: ID!, $element: GridElementInput!) {
    addGridElement(encounterId: $encounterId, element: $element) {
      encounterId
      gridElements { id type coordinates { x y } color }
    }
  }
`;
export const REMOVE_GRID_ELEMENT = gql`
  mutation RemoveGridElement($encounterId: ID!, $elementId: ID!) {
    removeGridElement(encounterId: $encounterId, elementId: $elementId) {
      encounterId
      gridElements { id type coordinates { x y } color }
    }
  }
`;
export const ADD_OBJECT_TO_ENCOUNTER_VTT = gql`
  mutation AddObjectToEncounterVTT($encounterId: ID!, $objectId: ID!, $x: Int!, $y: Int!) {
    addObjectToEncounterVTT(encounterId: $encounterId, objectId: $objectId, x: $x, y: $y) {
      encounterId objectPositions { objectId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const UPDATE_OBJECT_POSITION = gql`
  mutation UpdateObjectPosition($encounterId: ID!, $objectId: ID!, $x: Int!, $y: Int!) {
    updateObjectPosition(encounterId: $encounterId, objectId: $objectId, x: $x, y: $y) {
      encounterId objectPositions { objectId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const REMOVE_OBJECT_FROM_ENCOUNTER_VTT = gql`
  mutation RemoveObjectFromEncounterVTT($encounterId: ID!, $objectId: ID!) {
    removeObjectFromEncounterVTT(encounterId: $encounterId, objectId: $objectId) {
      encounterId objectPositions { objectId x y }
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
      objectId name objectCategory width length height weight penetration deflection impact absorption
      hitPoints { current max }
      damageMin damageMax damageType isLimb noise duration handling capacity falloff partsIds
      usage { actionId usageType }
    }
  }
`;
export const ON_UPDATE_OBJECT = gql`
  subscription OnUpdateObject {
    onUpdateObject {
      objectId name objectCategory width length height weight penetration deflection impact absorption
      hitPoints { current max }
      damageMin damageMax damageType isLimb noise duration handling capacity falloff partsIds
      usage { actionId usageType }
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
  subscription OnCreateEncounter {
    onCreateEncounter {
      encounterId name description currentTime createdAt
    }
  }
`;
export const ON_UPDATE_ENCOUNTER = gql`
  subscription OnUpdateEncounter {
    onUpdateEncounter {
      encounterId name description currentTime gridRows gridColumns
      characterPositions { characterId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const ON_DELETE_ENCOUNTER = gql`
  subscription OnDeleteEncounter {
    onDeleteEncounter { encounterId }
  }
`;
export const ON_ENCOUNTER_TIMELINE_CHANGED = gql`
  subscription OnEncounterTimelineChanged($encounterId: ID!) {
    onEncounterTimelineChanged(encounterId: $encounterId) {
      encounterId name description currentTime gridRows gridColumns
      characterPositions { characterId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const ON_ENCOUNTER_VTT_CHANGED = gql`
  subscription OnEncounterVttChanged($encounterId: ID!) {
    onEncounterVttChanged(encounterId: $encounterId) {
      encounterId
      characterPositions { characterId x y }
      gridElements { id type coordinates { x y } color }
      objectPositions { objectId x y }
      terrainElements { terrainId type startX startY length color }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;
export const ON_GRID_SIZE_CHANGED = gql`
  subscription OnGridSizeChanged($encounterId: ID!) {
    onGridSizeChanged(encounterId: $encounterId) {
      encounterId gridRows gridColumns
    }
  }
`;
export const ON_ENCOUNTER_CHARACTER_CHANGED = gql`
  subscription OnEncounterCharacterChanged($encounterId: ID!) {
    onEncounterCharacterChanged(encounterId: $encounterId) {
      encounterId name description currentTime gridRows gridColumns
      characterPositions { characterId x y }
      history { time type characterId actionId actionName description x y stats { hitPoints fatigue surges exhaustion } conditions }
    }
  }
`;

// DEFAULT VALUES
export const defaultAttributeValue = { base: 10, current: 10, max: 10 };
export const defaultAttributes = { strength: {...defaultAttributeValue}, agility: {...defaultAttributeValue}, dexterity: {...defaultAttributeValue}, endurance: {...defaultAttributeValue}, intelligence: {...defaultAttributeValue}, charisma: {...defaultAttributeValue}, perception: {...defaultAttributeValue}, resolve: {...defaultAttributeValue} };
export const defaultStatValue = { current: 10, max: 10 };
export const defaultStats = { hitPoints: {...defaultStatValue}, fatigue: {...defaultStatValue}, exhaustion: {...defaultStatValue}, surges: {...defaultStatValue} };
export const defaultObjectForm = { name: "", objectCategory: "ITEM", width: 0.1, length: 0.1, height: 0.1, weight: 0.1, penetration: 0, deflection: 0, impact: 0, absorption: 0, hitPoints: { current: 1, max: 1 }, damageMin: 0, damageMax: 0, damageType: "KINETIC", isLimb: false, noise: 0, duration: 0, handling: 0, capacity: 0, falloff: 0, partsIds: [], usage: [] };
export const defaultActionForm = { name: "", actionCategory: "MOVE", initDurationId: "", defaultInitDuration: 0.0, durationId: "", defaultDuration: 0.0, fatigueCost: 0, difficultyClassId: "", guaranteedFormulaId: "", units: null, description: "", actionTargets: [], actionSources: [], actionEffects: [] };
export const defaultCharacterForm = {
  name: "",
  attributeData: [], 
  skillData: [], 
  stats: {
    hitPoints: { current: '10', max: '10' },
    fatigue: { current: '10', max: '10' },
    exhaustion: { current: '10', max: '10' },
    surges: { current: '10', max: '10' }
  },
  valueData: [],
  bodyId: null,
  conditions: [],
  inventoryIds: [],
  equipmentIds: [],
  actionIds: []
};
