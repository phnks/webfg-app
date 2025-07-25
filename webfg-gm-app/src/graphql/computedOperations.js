import { gql } from "@apollo/client";

// COMPUTED FIELD FRAGMENTS
export const GROUPED_ATTRIBUTES_FRAGMENT = gql`
  fragment GroupedAttributesFields on GroupedAttributes {
    speed
    weight
    size
    lethality
    complexity
    armour
    endurance
    strength
    dexterity
    agility
    obscurity
    charisma
    intelligence
    resolve
    morale
    seeing
    hearing
    light
    noise
  }
`;

export const READY_GROUPED_ATTRIBUTES_FRAGMENT = gql`
  fragment ReadyGroupedAttributesFields on ReadyGroupedAttributes {
    speed
    weight
    size
    lethality
    complexity
    armour
    endurance
    strength
    dexterity
    agility
    obscurity
    charisma
    intelligence
    resolve
    morale
    seeing
    hearing
    light
    noise
  }
`;

export const ATTRIBUTE_BREAKDOWN_FRAGMENT = gql`
  fragment AttributeBreakdownFields on AttributeBreakdownStep {
    step
    entityName
    entityType
    attributeValue
    isGrouped
    runningTotal
    formula
  }
`;

// CHARACTER QUERIES WITH COMPUTED FIELDS
export const GET_CHARACTER_WITH_GROUPED = gql`
  ${GROUPED_ATTRIBUTES_FRAGMENT}
  ${READY_GROUPED_ATTRIBUTES_FRAGMENT}
  query GetCharacterWithGrouped($characterId: ID!) {
    getCharacter(characterId: $characterId) {
      characterId
      name
      description
      characterCategory
      will
      fatigue
      mind {
        thoughtId
        affinity
        knowledge
        location
      }
      mindThoughts {
        thoughtId
        name
        description
      }
      
      # Character attributes (no longer have fatigue)
      speed { attribute { attributeValue isGrouped } }
      weight { attribute { attributeValue isGrouped } }
      size { attribute { attributeValue isGrouped } }
      lethality { attribute { attributeValue isGrouped } }
      complexity { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      obscurity { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      seeing { attribute { attributeValue isGrouped } }
      hearing { attribute { attributeValue isGrouped } }
      light { attribute { attributeValue isGrouped } }
      noise { attribute { attributeValue isGrouped } }
      
      # Computed grouped attributes
      groupedAttributes {
        ...GroupedAttributesFields
      }
      
      # Ready grouped attributes (includes equipment + ready objects)
      readyGroupedAttributes {
        ...ReadyGroupedAttributesFields
      }
      
      special
      actionIds
      actions { actionId name actionCategory description sourceAttribute targetAttribute targetType effectType objectUsage }
      targetAttributeTotal
      stashIds
      stash { objectId name objectCategory }
      equipmentIds
      equipment { 
        objectId name objectCategory isEquipment isEquipment
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        lethality { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        obscurity { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        seeing { attributeValue isGrouped }
        hearing { attributeValue isGrouped }
        light { attributeValue isGrouped }
        noise { attributeValue isGrouped }
        
        # Equipment can also have grouped attributes
        groupedAttributes {
          ...GroupedAttributesFields
        }
        
        equipment { 
          objectId name objectCategory isEquipment isEquipment
          lethality { attributeValue isGrouped }
          armour { attributeValue isGrouped }
          endurance { attributeValue isGrouped }
          strength { attributeValue isGrouped }
          dexterity { attributeValue isGrouped }
          agility { attributeValue isGrouped }
          obscurity { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
        }
      }
      readyIds
      ready { 
        objectId name objectCategory isEquipment isEquipment
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        lethality { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        obscurity { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        seeing { attributeValue isGrouped }
        hearing { attributeValue isGrouped }
        light { attributeValue isGrouped }
        noise { attributeValue isGrouped }
      }
      
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

// Get attribute breakdown for a character
export const GET_CHARACTER_ATTRIBUTE_BREAKDOWN = gql`
  ${ATTRIBUTE_BREAKDOWN_FRAGMENT}
  query GetCharacterAttributeBreakdown($characterId: ID!, $attributeName: String!) {
    getCharacter(characterId: $characterId) {
      characterId
      name
      attributeBreakdown(attributeName: $attributeName) {
        ...AttributeBreakdownFields
      }
    }
  }
`;

// OBJECT QUERIES WITH COMPUTED FIELDS
export const GET_OBJECT_WITH_GROUPED = gql`
  ${GROUPED_ATTRIBUTES_FRAGMENT}
  query GetObjectWithGrouped($objectId: ID!) {
    getObject(objectId: $objectId) {
      objectId
      name
      description
      objectCategory
      isEquipment
      
      # Object attributes
      speed { attributeValue isGrouped }
      weight { attributeValue isGrouped }
      size { attributeValue isGrouped }
      lethality { attributeValue isGrouped }
      complexity { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      obscurity { attributeValue isGrouped }
      seeing { attributeValue isGrouped }
      hearing { attributeValue isGrouped }
      light { attributeValue isGrouped }
      noise { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
      
      # Computed grouped attributes
      groupedAttributes {
        ...GroupedAttributesFields
      }
      
      special
      equipmentIds
      equipment { 
        objectId name objectCategory isEquipment
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        lethality { attributeValue isGrouped }
        complexity { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        obscurity { attributeValue isGrouped }
        seeing { attributeValue isGrouped }
        hearing { attributeValue isGrouped }
        light { attributeValue isGrouped }
        noise { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        
        # Equipment can also have grouped attributes
        groupedAttributes {
          ...GroupedAttributesFields
        }
      }
    }
  }
`;

// Get attribute breakdown for an object
export const GET_OBJECT_ATTRIBUTE_BREAKDOWN = gql`
  ${ATTRIBUTE_BREAKDOWN_FRAGMENT}
  query GetObjectAttributeBreakdown($objectId: ID!, $attributeName: String!) {
    getObject(objectId: $objectId) {
      objectId
      name
      attributeBreakdown(attributeName: $attributeName) {
        ...AttributeBreakdownFields
      }
    }
  }
`;

// ACTION TEST CALCULATION
export const CALCULATE_ACTION_TEST = gql`
  query CalculateActionTest($input: ActionTestInput!) {
    calculateActionTest(input: $input) {
      difficulty
      sourceValue
      targetValue
      sourceCount
      targetCount
      successPercentage
      sourceDice
      targetDice
      adjustedSourceDice
      adjustedTargetDice
      sourceFatigue
      targetFatigue
      finalSourceDice
      finalTargetDice
      dicePoolExceeded
      sourceFatigueDetails {
        characterId
        characterName
        fatigue
      }
      targetFatigueDetails {
        characterId
        characterName
        fatigue
      }
      # New dice system fields
      sourceModifier
      targetModifier
      sourceDiceDisplay
      targetDiceDisplay
      sourceRange {
        min
        max
      }
      targetRange {
        min
        max
      }
      guaranteedSuccess
      guaranteedFailure
      partialSuccess
    }
  }
`;

// LIST CHARACTERS WITH GROUPED ATTRIBUTES
export const LIST_CHARACTERS_WITH_GROUPED = gql`
  ${GROUPED_ATTRIBUTES_FRAGMENT}
  query ListCharactersWithGrouped {
    listCharacters {
      characterId
      name
      fatigue
      speed { attribute { attributeValue isGrouped } }
      weight { attribute { attributeValue isGrouped } }
      size { attribute { attributeValue isGrouped } }
      lethality { attribute { attributeValue isGrouped } }
      complexity { attribute { attributeValue isGrouped } }
      armour { attribute { attributeValue isGrouped } }
      endurance { attribute { attributeValue isGrouped } }
      strength { attribute { attributeValue isGrouped } }
      dexterity { attribute { attributeValue isGrouped } }
      agility { attribute { attributeValue isGrouped } }
      obscurity { attribute { attributeValue isGrouped } }
      charisma { attribute { attributeValue isGrouped } }
      intelligence { attribute { attributeValue isGrouped } }
      resolve { attribute { attributeValue isGrouped } }
      morale { attribute { attributeValue isGrouped } }
      seeing { attribute { attributeValue isGrouped } }
      hearing { attribute { attributeValue isGrouped } }
      light { attribute { attributeValue isGrouped } }
      noise { attribute { attributeValue isGrouped } }
      
      # Computed grouped attributes
      groupedAttributes {
        ...GroupedAttributesFields
      }
      
      equipment { 
        objectId name objectCategory isEquipment
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        lethality { attributeValue isGrouped }
        armour { attributeValue isGrouped }
        endurance { attributeValue isGrouped }
        strength { attributeValue isGrouped }
        dexterity { attributeValue isGrouped }
        agility { attributeValue isGrouped }
        obscurity { attributeValue isGrouped }
        charisma { attributeValue isGrouped }
        intelligence { attributeValue isGrouped }
        resolve { attributeValue isGrouped }
        morale { attributeValue isGrouped }
        
        groupedAttributes {
          ...GroupedAttributesFields
        }
        
        equipment { 
          objectId name objectCategory isEquipment isEquipment
          lethality { attributeValue isGrouped }
          armour { attributeValue isGrouped }
          endurance { attributeValue isGrouped }
          strength { attributeValue isGrouped }
          dexterity { attributeValue isGrouped }
          agility { attributeValue isGrouped }
          obscurity { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
        }
      }
      actionIds
      actions { actionId name actionCategory description sourceAttribute targetAttribute targetType effectType objectUsage }
      targetAttributeTotal
      
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

// LIST OBJECTS WITH GROUPED ATTRIBUTES
export const LIST_OBJECTS_WITH_GROUPED = gql`
  ${GROUPED_ATTRIBUTES_FRAGMENT}
  query ListObjectsWithGrouped {
    listObjects {
      objectId
      name
      description
      objectCategory
      
      # Object attributes
      speed { attributeValue isGrouped }
      weight { attributeValue isGrouped }
      size { attributeValue isGrouped }
      lethality { attributeValue isGrouped }
      armour { attributeValue isGrouped }
      endurance { attributeValue isGrouped }
      strength { attributeValue isGrouped }
      dexterity { attributeValue isGrouped }
      agility { attributeValue isGrouped }
      obscurity { attributeValue isGrouped }
      charisma { attributeValue isGrouped }
      intelligence { attributeValue isGrouped }
      resolve { attributeValue isGrouped }
      morale { attributeValue isGrouped }
      
      # Computed grouped attributes
      groupedAttributes {
        ...GroupedAttributesFields
      }
    }
  }
`;