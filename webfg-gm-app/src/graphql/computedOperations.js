import { gql } from "@apollo/client";

// COMPUTED FIELD FRAGMENTS
export const GROUPED_ATTRIBUTES_FRAGMENT = gql`
  fragment GroupedAttributesFields on GroupedAttributes {
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
    attributeType
    runningTotal
    formula
  }
`;

// CHARACTER QUERIES WITH COMPUTED FIELDS
export const GET_CHARACTER_WITH_GROUPED = gql`
  ${GROUPED_ATTRIBUTES_FRAGMENT}
  query GetCharacterWithGrouped($characterId: ID!) {
    getCharacter(characterId: $characterId) {
      characterId
      name
      characterCategory
      will
      values { valueName valueType }
      
      # Character attributes with fatigue
      lethality { attribute { attributeValue attributeType } fatigue }
      armour { attribute { attributeValue attributeType } fatigue }
      endurance { attribute { attributeValue attributeType } fatigue }
      strength { attribute { attributeValue attributeType } fatigue }
      dexterity { attribute { attributeValue attributeType } fatigue }
      agility { attribute { attributeValue attributeType } fatigue }
      perception { attribute { attributeValue attributeType } fatigue }
      charisma { attribute { attributeValue attributeType } fatigue }
      intelligence { attribute { attributeValue attributeType } fatigue }
      resolve { attribute { attributeValue attributeType } fatigue }
      morale { attribute { attributeValue attributeType } fatigue }
      
      # Computed grouped attributes
      groupedAttributes {
        ...GroupedAttributesFields
      }
      
      special
      actionIds
      actions { actionId name actionCategory description sourceAttribute targetAttribute targetType effectType }
      inventoryIds
      inventory { objectId name objectCategory }
      equipmentIds
      equipment { 
        objectId name objectCategory
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
        
        # Equipment can also have grouped attributes
        groupedAttributes {
          ...GroupedAttributesFields
        }
        
        equipment { 
          objectId name objectCategory
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
        }
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
      objectCategory
      
      # Object attributes
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
      
      # Computed grouped attributes
      groupedAttributes {
        ...GroupedAttributesFields
      }
      
      special
      equipmentIds
      equipment { 
        objectId name objectCategory
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
      lethality { attribute { attributeValue attributeType } fatigue }
      armour { attribute { attributeValue attributeType } fatigue }
      endurance { attribute { attributeValue attributeType } fatigue }
      strength { attribute { attributeValue attributeType } fatigue }
      dexterity { attribute { attributeValue attributeType } fatigue }
      agility { attribute { attributeValue attributeType } fatigue }
      perception { attribute { attributeValue attributeType } fatigue }
      charisma { attribute { attributeValue attributeType } fatigue }
      intelligence { attribute { attributeValue attributeType } fatigue }
      resolve { attribute { attributeValue attributeType } fatigue }
      morale { attribute { attributeValue attributeType } fatigue }
      
      # Computed grouped attributes
      groupedAttributes {
        ...GroupedAttributesFields
      }
      
      equipment { 
        objectId name objectCategory
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
        
        groupedAttributes {
          ...GroupedAttributesFields
        }
        
        equipment { 
          objectId name objectCategory
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
        }
      }
      actionIds
      actions { actionId name actionCategory description sourceAttribute targetAttribute targetType effectType }
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
      objectCategory
      
      # Object attributes
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
      
      # Computed grouped attributes
      groupedAttributes {
        ...GroupedAttributesFields
      }
    }
  }
`;