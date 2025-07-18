import { gql } from "@apollo/client";

// COMPUTED FIELD FRAGMENTS
export const GROUPED_ATTRIBUTES_FRAGMENT = gql`
  fragment GroupedAttributesFields on GroupedAttributes {
    speed
    weight
    size
    intensity
    lethality
    armour
    endurance
    strength
    dexterity
    agility
    perception
    charisma
    intelligence
    resolve
    morale
  }
`;

export const READY_GROUPED_ATTRIBUTES_FRAGMENT = gql`
  fragment ReadyGroupedAttributesFields on ReadyGroupedAttributes {
    speed
    weight
    size
    intensity
    lethality
    armour
    endurance
    strength
    dexterity
    agility
    perception
    charisma
    intelligence
    resolve
    morale
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
      values { valueName valueType }
      
      # Character attributes (no longer have fatigue)
      speed { attribute { attributeValue isGrouped } }
      weight { attribute { attributeValue isGrouped } }
      size { attribute { attributeValue isGrouped } }
      intensity { attribute { attributeValue isGrouped } }
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
      stashIds
      stash { objectId name objectCategory }
      equipmentIds
      equipment { 
        objectId name objectCategory isEquipment isEquipment
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        intensity { attributeValue isGrouped }
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
          perception { attributeValue isGrouped }
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
        intensity { attributeValue isGrouped }
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
      intensity { attributeValue isGrouped }
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
        intensity { attributeValue isGrouped }
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
      intensity { attribute { attributeValue isGrouped } }
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
      
      # Computed grouped attributes
      groupedAttributes {
        ...GroupedAttributesFields
      }
      
      equipment { 
        objectId name objectCategory isEquipment
        speed { attributeValue isGrouped }
        weight { attributeValue isGrouped }
        size { attributeValue isGrouped }
        intensity { attributeValue isGrouped }
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
          perception { attributeValue isGrouped }
          charisma { attributeValue isGrouped }
          intelligence { attributeValue isGrouped }
          resolve { attributeValue isGrouped }
          morale { attributeValue isGrouped }
        }
      }
      actionIds
      actions { actionId name actionCategory description sourceAttribute targetAttribute targetType effectType objectUsage }
      
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
      intensity { attributeValue isGrouped }
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
      
      # Computed grouped attributes
      groupedAttributes {
        ...GroupedAttributesFields
      }
    }
  }
`;