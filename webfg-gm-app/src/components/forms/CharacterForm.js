import React, { useState, useEffect } from "react";
import ErrorPopup from '../common/ErrorPopup';
import MobileNumberInput from '../common/MobileNumberInput';
import AttributeGroups, { ATTRIBUTE_GROUPS } from '../common/AttributeGroups';
import { useMutation } from "@apollo/client";
import { useNavigate } from 'react-router-dom';
import { useSelectedCharacter } from "../../context/SelectedCharacterContext";
import {
  CREATE_CHARACTER,
  UPDATE_CHARACTER,
  LIST_CHARACTERS
} from "../../graphql/operations";
import "./Form.css";
import "./CharacterForm.css";

// Helper function to strip __typename fields recursively
const stripTypename = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => stripTypename(item));
  }
  const newObj = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (key !== '__typename') {
      newObj[key] = stripTypename(value);
    }
  });
  return newObj;
};

// Available value names and types based on the new schema

const CHARACTER_CATEGORIES = [
  'HUMAN', 'TREPIDITE', 'MONSTER', 'CARVED', 'ANTHRO',
  'ICER', 'DAXMC', 'QRTIS', 'TYVIR'
];

const CHARACTER_RACES = [
  'HUMAN', 'ANTHRO', 'CARVED', 'TREPIDITE', 'DHYARMA'
];

// Dynamic attributes and their dice types
const DYNAMIC_ATTRIBUTES = {
  speed: { diceType: 'd4', defaultCount: 1 },
  agility: { diceType: 'd6', defaultCount: 1 },
  dexterity: { diceType: 'd8', defaultCount: 1 },
  strength: { diceType: 'd10', defaultCount: 1 },
  charisma: { diceType: 'd12', defaultCount: 1 },
  seeing: { diceType: 'd20', defaultCount: 1 },
  hearing: { diceType: 'd20', defaultCount: 1 },
  intelligence: { diceType: 'd100', defaultCount: 1 }
};

// Life Path Tables for generating character descriptions (Human only)
const LIFE_PATH_TABLES = [
  {
    description: "Their background is",
    options: {
      1: "Anur",
      2: "Zorach", 
      3: "Mobilis",
      4: "Unorien",
      5: "Minos",
      6: "Weyjen",
      7: "Rencardian",
      8: "Shuz",
      9: "Terralonian"
    }
  },
  {
    description: "They are",
    options: {
      1: "shy & secretive",
      2: "rebellious, antisocial & violent",
      3: "arrogant, proud & aloof",
      4: "moody, rash & headstrong",
      5: "picky, fussy & nervous",
      6: "stable & serious",
      7: "silly & fluff-headed",
      8: "sneaky & deceptive",
      9: "intellectual & detached",
      10: "friendly & outgoing"
    }
  },
  {
    description: "They mostly wear",
    options: {
      1: "Generic Chic",
      2: "Leisurewear",
      3: "Urban Flash",
      4: "Businesswear",
      5: "High Fashion",
      6: "Bohemian",
      7: "Bag-Lady Chic",
      8: "Faction Uniform",
      9: "Punk Leathers",
      10: "rags"
    }
  },
  {
    description: "Their hair is usually",
    options: {
      1: "a mohawk",
      2: "long & ratty",
      3: "short & spiked",
      4: "wild & all-over",
      5: "bald",
      6: "striped",
      7: "wild colors",
      8: "neat & short",
      9: "short & curly",
      10: "long & straight"
    }
  },
  {
    description: "They love to stand out with their",
    options: {
      1: "tattoos",
      2: "sunglasses",
      3: "ritual scars",
      4: "gloves",
      5: "nose rings",
      6: "tongue or other piercings",
      7: "styled fingernails",
      8: "boots or heels",
      9: "bracelet(s) or ring(s)",
      10: "glasses"
    }
  },
  {
    description: "They value",
    options: {
      1: "money",
      2: "honor",
      3: "trust",
      4: "honesty",
      5: "knowledge",
      6: "vengeance",
      7: "love",
      8: "power",
      9: "family",
      10: "friendship"
    }
  },
  {
    description: "Most other people they",
    options: {
      1: "stay neutral towards",
      2: "barely notice",
      3: "like",
      4: "hate",
      5: "see as tools",
      6: "see as valuable",
      7: "see as obstacles",
      8: "see as untrustworthy",
      9: "want to kill",
      10: "think are wonderful"
    }
  },
  {
    description: "They greatly value",
    options: {
      1: "their parent",
      2: "their brother/sister",
      3: "their lover",
      4: "their friend(s)",
      5: "themselves",
      6: "their pet",
      7: "their teacher/mentor",
      8: "a public figure",
      9: "a personal hero",
      10: "no one"
    }
  },
  {
    description: "Their most valued possession is a",
    options: {
      1: "weapon",
      2: "tool",
      3: "piece of clothing",
      4: "photograph",
      5: "book/diary",
      6: "recording",
      7: "musical instrument",
      8: "piece of jewelry",
      9: "toy",
      10: "letter"
    }
  },
  {
    description: "Their family are",
    options: {
      1: "merchants",
      2: "very rich inherited wealth",
      3: "engineers or scientists",
      4: "explorers",
      5: "all gang members",
      6: "all military or ex-military",
      7: "homeless",
      8: "thieves & robbers",
      9: "murders",
      10: "mercenaries"
    }
  },
  {
    description: "They grew up",
    options: {
      1: "on the streets alone",
      2: "in a safe rich neighborhood",
      3: "roaming and traveling",
      4: "traveling with merchants selling wares",
      5: "a decaying originally upscale neighborhood",
      6: "in a warzone",
      7: "in a large city",
      8: "in a ruined town",
      9: "at sea",
      10: "in the most elite part of the world (royalty, world leaders, etc)"
    }
  },
  {
    description: "Their family",
    options: {
      1: "lost everything—betrayal",
      2: "lost everything—bad management",
      3: "was exiled/driven out",
      4: "was imprisoned—only one to escape",
      5: "vanished",
      6: "was killed—only survivor",
      7: "became part of a long-term conspiracy",
      8: "was scattered",
      9: "broke apart due to a hereditary feud",
      10: "inherited crushing debt"
    }
  },
  {
    description: "Their best friend is",
    options: {
      1: "an older sibling figure",
      2: "a younger sibling figure",
      3: "a teacher or mentor",
      4: "a partner or coworker",
      5: "a former lover",
      6: "an old enemy",
      7: "a parental figure",
      8: "a childhood friend",
      9: "a street contact",
      10: "a shared-interest pal"
    }
  },
  {
    description: "Their worst enemy is",
    options: {
      1: "an ex-friend",
      2: "an ex-lover",
      3: "an estranged relative",
      4: "a childhood enemy",
      5: "a former employee",
      6: "a boss",
      7: "a partner or coworker",
      8: "a merchant",
      9: "a government official",
      10: "a gang or gang member"
    }
  },
  {
    description: "They are their worst enemy",
    options: {
      1: "because they caused them to lose face/status",
      2: "because they caused them to lose a loved one",
      3: "because they caused them to be publicly humiliated",
      4: "because they accused them of cowardice/flaw",
      5: "because they deserted/betrayed them",
      6: "because they turned them down job/romance",
      7: "because they just do not like each other",
      8: "because they are a romantic rival",
      9: "because they are a business rival",
      10: "because they framed them for a crime"
    }
  },
  {
    description: "Their enemy is",
    options: {
      1: "alone (reluctant)",
      2: "alone",
      3: "alone + their close friend",
      4: "alone + two friends",
      5: "alone + four friends",
      6: "alone + an entire gang",
      7: "alone + local police/lawmen",
      8: "alone + a small faction bigger than a gang",
      9: "alone + an entire nation",
      10: "alone + the entire world"
    }
  },
  {
    description: "When their enemy finds them they will",
    options: {
      1: "avoid you",
      2: "avoid them",
      3: "go into a murderous rage and rip their face off",
      4: "o into a murderous rage and rip their face off",
      5: "back-stab them indirectly",
      6: "back-stab them indirectly",
      7: "inflict many verbal attacks",
      8: "inflict many verbal attacks",
      9: "try to set them up for a crime",
      10: "try to murder or maim them"
    }
  },
  {
    description: "Their previous love affair ended because",
    options: {
      1: "their lover died in an accident",
      2: "their lover vanished",
      3: "it just didn't work out",
      4: "their goal or vendetta split you",
      5: "their lover was kidnapped",
      6: "their lover went insane",
      7: "their lover committed suicide",
      8: "their lover was killed in fight",
      9: "a rival cut you out and took your lover",
      10: "their lover was imprisoned/exiled"
    }
  },
  {
    description: "Their life goal is to",
    options: {
      1: "clear a bad reputation",
      2: "gain power & control",
      3: "escape the streets",
      4: "cause pain & suffering",
      5: "live down your past",
      6: "avenge your misery",
      7: "get what's rightfully yours",
      8: "save someone from your past",
      9: "gain fame & recognition",
      10: "become feared & respected"
    }
  }
];

// Removed ATTRIBUTE_TYPES as we now use a simple boolean isGrouped field

const CharacterForm = ({ character, isEditing = false, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { selectedCharacter } = useSelectedCharacter();

  // State for form data matching the new schema
  const [error, setError] = useState(null);
  
  // Get all attribute names from the new grouping
  const getAllAttributeNames = () => {
    return Object.values(ATTRIBUTE_GROUPS).flat();
  };

  // Create initial form data with all attributes
  const createInitialFormData = () => {
    const initialData = {
      name: "",
      description: "",
      characterCategory: "HUMAN",
      race: "HUMAN",
      raceOverride: false,
      will: 0,  // Default to 0 as requested
      mind: [],
      special: [],
      actionIds: [],
      stashIds: [],
      equipmentIds: [],
      readyIds: [],
      targetAttributeTotal: null  // Will be calculated based on attributes * 10
    };
    
    // Add all attributes with default values of 10
    getAllAttributeNames().forEach(attr => {
      const dynamicInfo = DYNAMIC_ATTRIBUTES[attr];
      initialData[attr] = { 
        attribute: { 
          attributeValue: 10, 
          isGrouped: true,
          diceCount: dynamicInfo ? dynamicInfo.defaultCount : null
        } 
      };
    });
    
    return initialData;
  };

  const [formData, setFormData] = useState(createInitialFormData());
  const [validationError, setValidationError] = useState(null);
  
  // Helper function to determine if race restrictions should apply
  const shouldApplyRaceRestrictions = () => {
    return formData.race === 'HUMAN' && !formData.raceOverride;
  };

  // Helper function to check if an attribute is restricted for humans
  const isRestrictedAttribute = (attributeName) => {
    const restrictedAttributes = ['armour', 'endurance', 'lethality', 'penetration', 'complexity', 'obscurity', 'light'];
    return restrictedAttributes.includes(attributeName);
  };

  // Function to generate random attributes respecting race restrictions
  const generateRandomAttributes = () => {
    const targetTotal = formData.targetAttributeTotal || calculateDefaultTargetTotal();
    const attributeNames = getAllAttributeNames();
    const newAttributes = {};
    
    // First, handle restricted attributes (must be 10 for humans without override)
    let fixedTotal = 0;
    const flexibleAttributes = [];
    
    attributeNames.forEach(attr => {
      if (shouldApplyRaceRestrictions() && isRestrictedAttribute(attr)) {
        // Restricted attributes must be 10
        newAttributes[attr] = 10;
        fixedTotal += 10;
      } else {
        // These attributes can be varied
        flexibleAttributes.push(attr);
      }
    });
    
    // Calculate remaining points to distribute among flexible attributes
    const remainingTotal = targetTotal - fixedTotal;
    const numFlexibleAttrs = flexibleAttributes.length;
    
    if (numFlexibleAttrs === 0) {
      // All attributes are fixed
      attributeNames.forEach(attr => {
        newAttributes[attr] = 10;
      });
    } else {
      // Generate random values for flexible attributes
      let remainingPoints = remainingTotal;
      
      for (let i = 0; i < numFlexibleAttrs - 1; i++) {
        const attr = flexibleAttributes[i];
        const minVal = shouldApplyRaceRestrictions() ? 5 : 1;
        const maxVal = shouldApplyRaceRestrictions() ? 20 : 30;
        
        // Calculate bounds to ensure we can distribute remaining points
        const remainingAttrs = numFlexibleAttrs - i - 1;
        const minForRemaining = remainingAttrs * minVal;
        const maxForRemaining = remainingAttrs * maxVal;
        
        const actualMin = Math.max(minVal, remainingPoints - maxForRemaining);
        const actualMax = Math.min(maxVal, remainingPoints - minForRemaining);
        
        // Generate random value within bounds
        const randomValue = Math.floor(Math.random() * (actualMax - actualMin + 1)) + actualMin;
        newAttributes[attr] = randomValue;
        remainingPoints -= randomValue;
      }
      
      // Set the last flexible attribute to use up remaining points
      const lastAttr = flexibleAttributes[numFlexibleAttrs - 1];
      newAttributes[lastAttr] = remainingPoints;
      
      // Validate the last attribute is within bounds
      const minVal = shouldApplyRaceRestrictions() ? 5 : 1;
      const maxVal = shouldApplyRaceRestrictions() ? 20 : 30;
      
      if (newAttributes[lastAttr] < minVal || newAttributes[lastAttr] > maxVal) {
        // If last attribute is out of bounds, redistribute more evenly
        const avgValue = Math.floor(remainingTotal / numFlexibleAttrs);
        let excess = remainingTotal % numFlexibleAttrs;
        
        flexibleAttributes.forEach(attr => {
          let value = avgValue;
          if (excess > 0) {
            value += 1;
            excess -= 1;
          }
          
          // Clamp to valid range
          value = Math.max(minVal, Math.min(maxVal, value));
          newAttributes[attr] = value;
        });
      }
    }
    
    // Update the form data with new attribute values
    const updatedFormData = { ...formData };
    attributeNames.forEach(attr => {
      updatedFormData[attr] = {
        ...formData[attr],
        attribute: {
          ...formData[attr].attribute,
          attributeValue: newAttributes[attr]
        }
      };
    });
    
    setFormData(updatedFormData);
    
    // Clear any validation errors
    if (validationError) {
      setValidationError(null);
    }
  };

  // Function to generate character description using life path tables
  const generateCharacterDescription = () => {
    // Only works for humans
    if (formData.race !== 'HUMAN') {
      return;
    }

    const descriptionLines = [];
    
    // Go through each life path table
    LIFE_PATH_TABLES.forEach(table => {
      const optionKeys = Object.keys(table.options);
      const maxOption = Math.max(...optionKeys.map(key => parseInt(key)));
      
      // Generate random number from 1 to maxOption
      const randomRoll = Math.floor(Math.random() * maxOption) + 1;
      
      // Get the corresponding text
      const selectedText = table.options[randomRoll];
      
      // Format the line: "Description: selected text"
      const line = `${table.description} ${selectedText}`;
      descriptionLines.push(line);
    });
    
    // Join all lines with newlines
    const generatedDescription = descriptionLines.join('\n');
    
    // Update the form data
    setFormData(prev => ({
      ...prev,
      description: generatedDescription
    }));
    
    // Clear any validation errors
    if (validationError) {
      setValidationError(null);
    }
  };

  // Helper function to get validation error for a specific attribute
  const getAttributeValidationError = (attributeName) => {
    if (!shouldApplyRaceRestrictions()) return null;
    
    const value = formData[attributeName]?.attribute?.attributeValue || 0;
    
    if (isRestrictedAttribute(attributeName) && value !== 10) {
      return `Must be 10 for humans (currently ${value})`;
    } else if (!isRestrictedAttribute(attributeName) && !Number.isInteger(value)) {
      return `Must be a valid integer (currently ${value})`;
    }
    
    return null;
  };
  
  // Calculate the default target total (number of attributes * 10)
  const calculateDefaultTargetTotal = () => {
    return getAllAttributeNames().length * 10;
  };
  
  // Calculate current total of all attribute values
  const calculateCurrentTotal = () => {
    return getAllAttributeNames().reduce((sum, attr) => {
      const value = parseFloat(formData[attr]?.attribute?.attributeValue) || 0;
      return sum + value;
    }, 0);
  };

  // Initialize targetAttributeTotal
  useEffect(() => {
    if (!formData.targetAttributeTotal) {
      setFormData(prev => ({
        ...prev,
        targetAttributeTotal: calculateDefaultTargetTotal()
      }));
    }
  }, [isEditing]);

  // Effect to populate form data when character prop changes (for editing)
  useEffect(() => {
    if (isEditing && character) {
      console.log('DEBUG: Loading character for edit - character.raceOverride:', character.raceOverride, 'type:', typeof character.raceOverride);
      const updatedFormData = {
        name: character.name || "",
        description: character.description || "",
        characterCategory: character.characterCategory || "HUMAN",
        race: character.race || "HUMAN",
        raceOverride: character.raceOverride !== undefined ? character.raceOverride : false,
        will: character.will !== null && character.will !== undefined ? character.will : 0,
        mind: (character.mind || []).map(m => ({ ...m })),
        special: character.special || [],
        actionIds: character.actionIds || [],
        stashIds: character.stashIds || [],
        equipmentIds: character.equipmentIds || [],
        readyIds: character.readyIds || []
      };
      
      // Add all attributes from character or default values
      getAllAttributeNames().forEach(attr => {
        const dynamicInfo = DYNAMIC_ATTRIBUTES[attr];
        console.log(`DEBUG: Loading attribute ${attr}, dynamicInfo:`, dynamicInfo);
        console.log(`DEBUG: Character[${attr}] from DB:`, JSON.stringify(character[attr], null, 2));
        
        if (character[attr]) {
          // Check for both possible structures - character data might come in different formats
          let attributeData;
          if (character[attr].attribute) {
            // Nested format: { attribute: { attributeValue, isGrouped, diceCount } }
            attributeData = character[attr].attribute;
          } else if (character[attr].attributeValue !== undefined) {
            // Flat format: { attributeValue, isGrouped, diceCount }
            attributeData = character[attr];
          } else {
            // Fallback
            attributeData = { attributeValue: 10, isGrouped: true };
          }
          
          const diceCountFromDB = attributeData.diceCount;
          const defaultDiceCount = dynamicInfo ? dynamicInfo.defaultCount : null;
          const finalDiceCount = diceCountFromDB !== undefined ? diceCountFromDB : defaultDiceCount;
          
          console.log(`DEBUG: ${attr} - attributeData:`, attributeData);
          console.log(`DEBUG: ${attr} - diceCountFromDB: ${diceCountFromDB}, defaultDiceCount: ${defaultDiceCount}, finalDiceCount: ${finalDiceCount}`);
          
          updatedFormData[attr] = {
            attribute: {
              attributeValue: attributeData.attributeValue || 10,
              isGrouped: attributeData.isGrouped !== false,
              diceCount: finalDiceCount
            }
          };
        } else {
          updatedFormData[attr] = { 
            attribute: { 
              attributeValue: 10, 
              isGrouped: true,
              diceCount: dynamicInfo ? dynamicInfo.defaultCount : null
            } 
          };
        }
        console.log(`DEBUG: Final updatedFormData[${attr}]:`, updatedFormData[attr]);
      });
      
      // Set targetAttributeTotal from character or calculate default
      updatedFormData.targetAttributeTotal = character.targetAttributeTotal || calculateDefaultTargetTotal();
      
      console.log('DEBUG: Setting form data - updatedFormData.raceOverride:', updatedFormData.raceOverride, 'type:', typeof updatedFormData.raceOverride);
      setFormData(updatedFormData);
    }
  }, [isEditing, character]);


  const [createCharacter] = useMutation(CREATE_CHARACTER, {
    refetchQueries: [{ query: LIST_CHARACTERS }],
    onCompleted: (data) => {
      if (onSuccess) {
        onSuccess(data.createCharacter.characterId);
      } else {
        navigate(`/characters/${data.createCharacter.characterId}`);
      }
    }
  });

  const [updateCharacter] = useMutation(UPDATE_CHARACTER, {
    refetchQueries: [
      {
        query: LIST_CHARACTERS
      }
    ],
    onCompleted: (data) => {
      if (onSuccess) {
        onSuccess(data.updateCharacter.characterId);
      }
    }
  });

  const handleInputChange = (field, value) => {
    const updatedData = {
      ...formData,
      [field]: field === 'will' || field === 'targetAttributeTotal' ? parseInt(value) || 0 : value
    };
    
    // No automatic value clamping - let user see validation errors instead
    
    setFormData(updatedData);
  };

  const handleAttributeChange = (attributeName, field, value) => {
    // Since we no longer have fatigue per attribute, this is simpler
    setFormData(prev => ({
      ...prev,
      [attributeName]: {
        ...prev[attributeName],
        attribute: {
          ...prev[attributeName].attribute,
          [field]: field === 'attributeValue' ? parseFloat(value) || 0 : value
        }
      }
    }));
  };

  const handleNestedAttributeChange = (attributeName, nestedField, value) => {
    console.log(`DEBUG: handleNestedAttributeChange called - ${attributeName}.${nestedField} = ${value}`);
    console.log(`DEBUG: Current formData[${attributeName}] before update:`, formData[attributeName]);
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [attributeName]: {
          ...prev[attributeName],
          attribute: {
            ...prev[attributeName].attribute,
            [nestedField]: nestedField === 'attributeValue' ? parseFloat(value) || 0 : value
          }
        }
      };
      console.log(`DEBUG: Updated formData for ${attributeName}:`, updated[attributeName]);
      console.log(`DEBUG: Specifically, diceCount is now:`, updated[attributeName]?.attribute?.diceCount);
      return updated;
    });
    
    // Clear validation error when user makes changes
    if (validationError) {
      setValidationError(null);
    }
  };


  const [newSpecialAbility, setNewSpecialAbility] = useState('');

  const handleSpecialAdd = () => {
    if (newSpecialAbility.trim()) {
      setFormData(prev => ({
        ...prev,
        special: [...prev.special, newSpecialAbility.trim()]
      }));
      setNewSpecialAbility('');
    }
  };

  const handleSpecialRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      special: prev.special.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationError(null);
    
    // Validate race restrictions
    if (shouldApplyRaceRestrictions()) {
      const violations = [];
      
      getAllAttributeNames().forEach(attr => {
        const value = formData[attr]?.attribute?.attributeValue || 0;
        
        if (isRestrictedAttribute(attr) && value !== 10) {
          violations.push(`${attr} must be 10 for humans (currently ${value})`);
        } else if (!isRestrictedAttribute(attr) && !Number.isInteger(value)) {
          violations.push(`${attr} must be a valid integer (currently ${value})`);
        }
      });
      
      if (violations.length > 0) {
        setValidationError(`Race restrictions violated: ${violations.join(', ')}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    
    // Validate attribute total
    const currentTotal = calculateCurrentTotal();
    const targetTotal = formData.targetAttributeTotal || calculateDefaultTargetTotal();
    
    if (currentTotal < targetTotal) {
      setValidationError(`Insufficient attribute values. Current total: ${currentTotal}, Required: ${targetTotal}`);
      // Scroll to top where the validation message is shown
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (currentTotal > targetTotal) {
      setValidationError(`Too high attribute values. Current total: ${currentTotal}, Maximum: ${targetTotal}`);
      // Scroll to top where the validation message is shown
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      
      // Prepare the input data for mutation
      console.log('DEBUG: formData.raceOverride before submission:', formData.raceOverride, typeof formData.raceOverride);
      const input = {
        name: formData.name,
        description: formData.description || "",
        characterCategory: formData.characterCategory,
        race: formData.race || "HUMAN",
        raceOverride: formData.raceOverride === true,
        will: formData.will !== null && formData.will !== undefined && formData.will !== '' ? parseInt(formData.will) : 0,
        mind: formData.mind,
        special: formData.special,
        actionIds: formData.actionIds,
        stashIds: formData.stashIds,
        equipmentIds: formData.equipmentIds,
        readyIds: formData.readyIds,
        targetAttributeTotal: formData.targetAttributeTotal || calculateDefaultTargetTotal()
      };
      
      console.log('DEBUG: input.raceOverride after preparation:', input.raceOverride, typeof input.raceOverride);
      
      // Add all attributes dynamically
      console.log('DEBUG: formData before submission:', formData);
      console.log('DEBUG: getAllAttributeNames():', getAllAttributeNames());
      
      getAllAttributeNames().forEach(attr => {
        console.log(`DEBUG: Processing attribute ${attr}:`, formData[attr]);
        const rawValue = formData[attr]?.attribute?.attributeValue;
        const parsedValue = parseFloat(rawValue);
        const dynamicInfo = DYNAMIC_ATTRIBUTES[attr];
        const diceCountValue = formData[attr]?.attribute?.diceCount;
        
        console.log(`DEBUG: ${attr} - rawValue: ${rawValue}, diceCountValue: ${diceCountValue}, dynamicInfo:`, dynamicInfo);
        
        input[attr] = {
          attribute: { 
            attributeValue: !isNaN(parsedValue) ? parsedValue : 0,
            isGrouped: formData[attr]?.attribute?.isGrouped !== false,
            diceCount: diceCountValue !== undefined ? diceCountValue : (dynamicInfo ? dynamicInfo.defaultCount : null)
          }
        };
        console.log(`DEBUG: Final input[${attr}] being sent to backend:`, input[attr]);
        console.log(`DEBUG: Specifically, diceCount being sent: ${input[attr].attribute.diceCount}`);
      });
      
      console.log('DEBUG: Final input object:', input);

      const finalInput = stripTypename(input);

      if (isEditing) {
        await updateCharacter({
          variables: {
            characterId: character.characterId,
            input: finalInput
          }
        });
      } else {
        await createCharacter({
          variables: {
            input: finalInput
          }
        });
      }
    } catch (err) {
      console.error("Error saving character:", err);
      let errorMessage = "An unexpected error occurred while saving character.";
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors.map(e => e.message).join("\\n");
      } else if (err.networkError) {
        errorMessage = `Network Error: ${err.networkError.message}`;
      } else {
        errorMessage = err.message;
      }
      setError({ message: errorMessage, stack: err.stack || "No stack trace available." });
    }
  };

  // Render function for individual attributes in the form
  const renderAttributeForForm = (attributeName, attribute, displayName) => {
    const validationError = getAttributeValidationError(attributeName);
    const dynamicInfo = DYNAMIC_ATTRIBUTES[attributeName];
    
    return (
      <div key={attributeName} className="attribute-item">
        <label>{displayName}</label>
        <div className="attribute-controls">
          {dynamicInfo && (
            <div className="dice-input-group">
              <MobileNumberInput
                step="1"
                min="0"
                value={formData[attributeName]?.attribute?.diceCount || 0}
                onChange={(e) => handleNestedAttributeChange(attributeName, 'diceCount', parseInt(e.target.value) || 0)}
                className="dice-count-input"
                style={{ width: '60px' }}
              />
              <span className="dice-type">{dynamicInfo.diceType}</span>
              <span className="plus-sign">+</span>
            </div>
          )}
          <MobileNumberInput
            step="0.1"
            value={formData[attributeName]?.attribute?.attributeValue || 0}
            onChange={(e) => handleNestedAttributeChange(attributeName, 'attributeValue', e.target.value)}
            style={validationError ? {borderColor: '#dc3545'} : {}}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData[attributeName]?.attribute?.isGrouped !== false}
              onChange={(e) => handleNestedAttributeChange(attributeName, 'isGrouped', e.target.checked)}
            />
            Group
          </label>
        </div>
        {validationError && (
          <div style={{fontSize: '0.8em', color: '#dc3545', marginTop: '2px'}}>
            {validationError}
          </div>
        )}
      </div>
    );
  };

  // Check if submit should be disabled based on attribute total validation
  const currentTotal = calculateCurrentTotal();
  const targetTotal = formData.targetAttributeTotal || calculateDefaultTargetTotal();
  
  // Check for race restriction violations
  let hasRaceViolations = false;
  if (shouldApplyRaceRestrictions()) {
    hasRaceViolations = getAllAttributeNames().some(attr => {
      const value = formData[attr]?.attribute?.attributeValue || 0;
      if (isRestrictedAttribute(attr)) {
        return value !== 10;
      } else {
        return !Number.isInteger(value);
      }
    });
  }
  
  const isSubmitDisabled = currentTotal !== targetTotal || hasRaceViolations;

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h2>{isEditing ? "Edit Character" : "Create New Character"}</h2>
          <div className="attribute-total-display">
            <span className={`current-total ${currentTotal < targetTotal ? 'insufficient' : currentTotal > targetTotal ? 'excessive' : 'valid'}`}>
              Total: {currentTotal}
            </span>
            <span className="total-separator">/</span>
            <div className="target-total-input">
              <label>Target:</label>
              <MobileNumberInput
                value={formData.targetAttributeTotal || calculateDefaultTargetTotal()}
                onChange={(e) => handleInputChange('targetAttributeTotal', e.target.value)}
                min="1"
                className="target-input"
              />
              <div className="target-help-text">
                Default: 10 × {getAllAttributeNames().length} = {calculateDefaultTargetTotal()}
              </div>
            </div>
          </div>
        </div>
        
        {validationError && (
          <div className="validation-error">
            {validationError}
          </div>
        )}
        
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.characterCategory}
                onChange={(e) => handleInputChange('characterCategory', e.target.value)}
              >
                {CHARACTER_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Race</label>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <select
                  value={formData.race}
                  onChange={(e) => handleInputChange('race', e.target.value)}
                  style={{flex: 1}}
                >
                  {CHARACTER_RACES.map(race => (
                    <option key={race} value={race}>{race}</option>
                  ))}
                </select>
                <label className="checkbox-label" style={{margin: 0, fontSize: '0.9em'}}>
                  <input
                    type="checkbox"
                    checked={formData.raceOverride}
                    onChange={(e) => handleInputChange('raceOverride', e.target.checked)}
                  />
                  Override race restrictions
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Will</label>
              <MobileNumberInput
                value={formData.will}
                onChange={(e) => handleInputChange('will', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <AttributeGroups
              attributes={formData}
              renderAttribute={renderAttributeForForm}
              title="Attributes"
              defaultExpandedGroups={['BODY', 'SENSES']}
              onGenerateAttributes={generateRandomAttributes}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="description-header">
            <label>Description</label>
            <button
              type="button"
              onClick={generateCharacterDescription}
              className="generate-description-button"
              disabled={formData.race !== 'HUMAN'}
              title={formData.race !== 'HUMAN' ? 'Only available for humans' : 'Generate character backstory using life path tables'}
            >
              Generate Description
            </button>
          </div>
          <div className="form-group full-width">
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter character description or use the Generate Description button for humans..."
              rows="6"
              className="description-textarea"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Special Abilities</h3>
          <div className="form-group">
            {formData.special.length === 0 && <p className="empty-message">No special abilities added.</p>}
            <ul className="parts-list">
              {formData.special.map((ability, index) => (
                <li key={index}>
                  {ability}
                  <button 
                    type="button" 
                    onClick={() => handleSpecialRemove(index)} 
                    className="button-remove"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="special-input-group">
              <input
                type="text"
                value={newSpecialAbility}
                onChange={(e) => setNewSpecialAbility(e.target.value)}
                placeholder="Enter special ability"
                className="special-input"
              />
              <button 
                type="button" 
                onClick={handleSpecialAdd} 
                className="button-add-part"
              >
                Add Ability
              </button>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="button-cancel">
            Cancel
          </button>
          <button 
            type="submit" 
            className="button-submit"
            disabled={isSubmitDisabled}
            title={isSubmitDisabled ? 
              (currentTotal !== targetTotal ? `Attribute total must equal ${targetTotal}` : '') +
              (hasRaceViolations ? (currentTotal !== targetTotal ? ' and ' : '') + 'Race restrictions must be satisfied' : '')
              : ''}
          >
            {isEditing ? "Update Character" : "Create Character"}
          </button>
        </div>
      </form>
      
      <ErrorPopup error={error} onClose={() => setError(null)} />
    </div>
  );
};

export default CharacterForm;