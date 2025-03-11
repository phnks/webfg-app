import { gql } from "@apollo/client";

// CHARACTER QUERIES
export const LIST_CHARACTERS = gql`
  query ListCharacters {
    listCharacters {
      characterId
      name
      race
    }
  }
`;

export const GET_CHARACTER = gql`
  query GetCharacter($characterId: ID!) {
    getCharacter(characterId: $characterId) {
      characterId
      name
      race
      attributes {
        strength {
          base
          current
          max
        }
        agility {
          base
          current
          max
        }
        dexterity {
          base
          current
          max
        }
        endurance {
          base
          current
          max
        }
        intelligence {
          base
          current
          max
        }
        charisma {
          base
          current
          max
        }
        perception {
          base
          current
          max
        }
        resolve {
          base
          current
          max
        }
      }
      skills {
        combat {
          striking
          grappling
          dodging
          parrying
          blocking
          feinting
          disarming
          countering
        }
        weapons {
          swords
          daggers
        }
        physical {
          weightlifting
          sprinting
          throwing
        }
        technical {
          ambits
          spindling
          spindleHandling
        }
        intrapersonal {
          emotionRegulation
        }
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
      physical {
        height
        bodyFatPercentage
        weight
        size {
          width
          length
          height
        }
        adjacency
      }
      conditions
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

export const GET_ACTION = gql`
  query GetAction($actionId: ID!) {
    getAction(actionId: $actionId) {
      actionId
      name
      type
      timing {
        duration
        timeUnit
        initiative {
          duration
          timeUnit
          type
        }
      }
      effects {
        start {
          type
          amount
          cancelable
          range
          resource
          speed
          targetType
        }
        during {
          type
          amount
          cancelable
          range
          resource
          speed
          targetType
        }
        end {
          type
          amount
          cancelable
          range
          resource
          speed
          targetType
        }
      }
    }
  }
`;

// CHARACTER MUTATIONS
export const CREATE_CHARACTER = gql`
  mutation CreateCharacter(
    $name: String!
    $race: Race!
    $attributes: AttributesInput
    $skills: SkillsInput
    $stats: StatsInput
    $physical: PhysicalInput
  ) {
    createCharacter(
      name: $name
      race: $race
      attributes: $attributes
      skills: $skills
      stats: $stats
      physical: $physical
    ) {
      characterId
      name
      race
    }
  }
`;

export const UPDATE_CHARACTER = gql`
  mutation UpdateCharacter(
    $characterId: ID!
    $name: String
    $race: Race
    $attributes: AttributesInput
    $skills: SkillsInput
    $stats: StatsInput
    $physical: PhysicalInput
  ) {
    updateCharacter(
      characterId: $characterId
      name: $name
      race: $race
      attributes: $attributes
      skills: $skills
      stats: $stats
      physical: $physical
    ) {
      characterId
      name
      race
    }
  }
`;

export const DELETE_CHARACTER = gql`
  mutation DeleteCharacter($characterId: ID!) {
    deleteCharacter(characterId: $characterId) {
      characterId
      name
    }
  }
`;

// OBJECT MUTATIONS
export const CREATE_OBJECT = gql`
  mutation CreateObject($input: ObjectInput!) {
    createObject(input: $input) {
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

export const UPDATE_OBJECT = gql`
  mutation UpdateObject($objectId: ID!, $input: ObjectInput!) {
    updateObject(objectId: $objectId, input: $input) {
      objectId
      name
      type
      fit
      weight
    }
  }
`;

export const DELETE_OBJECT = gql`
  mutation DeleteObject($objectId: ID!) {
    deleteObject(objectId: $objectId) {
      objectId
      name
    }
  }
`;

// ACTION MUTATIONS
export const CREATE_ACTION = gql`
  mutation CreateAction($input: ActionInput!) {
    createAction(input: $input) {
      actionId
      name
      type
      timing {
        duration
        timeUnit
        initiative {
          duration
          timeUnit
          type
        }
      }
      effects {
        start {
          type
          amount
          cancelable
          range
          resource
          speed
          targetType
        }
        during {
          type
          amount
          cancelable
          range
          resource
          speed
          targetType
        }
        end {
          type
          amount
          cancelable
          range
          resource
          speed
          targetType
        }
      }
    }
  }
`;

export const UPDATE_ACTION = gql`
  mutation UpdateAction($actionId: ID!, $input: ActionInput!) {
    updateAction(actionId: $actionId, input: $input) {
      actionId
      name
    }
  }
`;

export const DELETE_ACTION = gql`
  mutation DeleteAction($actionId: ID!) {
    deleteAction(actionId: $actionId) {
      actionId
      name
    }
  }
`;

// SUBSCRIPTIONS
export const ON_CREATE_CHARACTER = gql`
  subscription OnCreateCharacter {
    onCreateCharacter {
      characterId
      name
      race
    }
  }
`;

export const ON_UPDATE_CHARACTER = gql`
  subscription OnUpdateCharacter {
    onUpdateCharacter {
      characterId
      name
      race
    }
  }
`;

export const ON_DELETE_CHARACTER = gql`
  subscription OnDeleteCharacter {
    onDeleteCharacter {
      characterId
      name
    }
  }
`;

export const ON_CREATE_OBJECT = gql`
  subscription OnCreateObject {
    onCreateObject {
      objectId
      name
      type
    }
  }
`;

export const ON_UPDATE_OBJECT = gql`
  subscription OnUpdateObject {
    onUpdateObject {
      objectId
      name
    }
  }
`;

export const ON_DELETE_OBJECT = gql`
  subscription OnDeleteObject {
    onDeleteObject {
      objectId
      name
    }
  }
`;

export const ON_CREATE_ACTION = gql`
  subscription OnCreateAction {
    onCreateAction {
      actionId
      name
    }
  }
`;

export const ON_UPDATE_ACTION = gql`
  subscription OnUpdateAction {
    onUpdateAction {
      actionId
      name
    }
  }
`;

export const ON_DELETE_ACTION = gql`
  subscription OnDeleteAction {
    onDeleteAction {
      actionId
      name
    }
  }
`;

// DEFAULT VALUES
export const defaultAttributeValue = {
  base: 10,
  current: 10,
  max: 10
};

export const defaultAttributes = {
  strength: {...defaultAttributeValue},
  agility: {...defaultAttributeValue},
  dexterity: {...defaultAttributeValue},
  endurance: {...defaultAttributeValue},
  intelligence: {...defaultAttributeValue},
  charisma: {...defaultAttributeValue},
  perception: {...defaultAttributeValue},
  resolve: {...defaultAttributeValue}
};

export const defaultCombatSkills = {
  striking: 0,
  grappling: 0,
  dodging: 0,
  parrying: 0,
  blocking: 0,
  feinting: 0,
  disarming: 0,
  countering: 0
};

export const defaultWeaponSkills = {
  swords: 0,
  daggers: 0
};

export const defaultPhysicalSkills = {
  weightlifting: 0,
  sprinting: 0,
  throwing: 0
};

export const defaultTechnicalSkills = {
  ambits: 0,
  spindling: 0,
  spindleHandling: 0
};

export const defaultIntrapersonalSkills = {
  emotionRegulation: 0
};

export const defaultSkills = {
  combat: defaultCombatSkills,
  weapons: defaultWeaponSkills,
  physical: defaultPhysicalSkills,
  technical: defaultTechnicalSkills,
  intrapersonal: defaultIntrapersonalSkills
};

export const defaultStatValue = {
  current: 10,
  max: 10
};

export const defaultStats = {
  hitPoints: {...defaultStatValue},
  fatigue: {...defaultStatValue},
  exhaustion: {...defaultStatValue},
  surges: {...defaultStatValue}
};

export const defaultSize = {
  width: 1.0,
  length: 1.0,
  height: 1.0
};

export const defaultPhysical = {
  height: 180.0,
  bodyFatPercentage: 20.0,
  weight: 80.0,
  size: defaultSize,
  adjacency: 5.0
};

export const defaultEquipment = {
  head: null,
  torso: null,
  legs: null,
  arms: null,
  leftHand: null,
  rightHand: null
};

export const defaultObjectForm = {
  name: "",
  type: "MISCELLANEOUS",
  fit: "ONE_HAND",
  weight: 1.0,
  noise: 0
};

export const defaultActionForm = {
  name: "",
  description: "",
  requiredStats: "",
  effects: ""
};

// Add these new mutations to your operations.js file

export const ADD_ACTION_TO_CHARACTER = gql`
  mutation AddActionToCharacter($characterId: ID!, $actionId: ID!) {
    addActionToCharacter(characterId: $characterId, actionId: $actionId) {
      characterId
      name
      actionIds
      actions {
        actionId
        name
        description
      }
    }
  }
`;

export const ADD_OBJECT_TO_INVENTORY = gql`
  mutation AddObjectToInventory($characterId: ID!, $objectId: ID!) {
    addObjectToInventory(characterId: $characterId, objectId: $objectId) {
      characterId
      name
      inventoryIds
      inventory {
        objectId
        name
        type
      }
    }
  }
`;
