const { calculateGroupedAttributes, calculateObjectGroupedAttributes } = require('../utils/attributeGrouping');

exports.handler = async (event) => {
  console.log("Received event for resolveGroupedAttributes:", JSON.stringify(event, null, 2));

  // Source contains the parent Character or Object
  const entity = event.source;
  const typeName = event.info.parentTypeName; // 'Character' or 'Object'

  if (!entity) {
    console.log("No entity found, returning empty grouped attributes.");
    return {
      lethality: null,
      armour: null,
      endurance: null,
      strength: null,
      dexterity: null,
      agility: null,
      perception: null,
      charisma: null,
      intelligence: null,
      resolve: null,
      morale: null
    };
  }

  try {
    let groupedAttributes;
    
    if (typeName === 'Character') {
      groupedAttributes = calculateGroupedAttributes(entity);
    } else if (typeName === 'Object') {
      groupedAttributes = calculateObjectGroupedAttributes(entity);
    } else {
      throw new Error(`Unknown entity type: ${typeName}`);
    }

    // Ensure all fields are present even if null
    const result = {
      lethality: groupedAttributes.lethality || null,
      armour: groupedAttributes.armour || null,
      endurance: groupedAttributes.endurance || null,
      strength: groupedAttributes.strength || null,
      dexterity: groupedAttributes.dexterity || null,
      agility: groupedAttributes.agility || null,
      perception: groupedAttributes.perception || null,
      charisma: groupedAttributes.charisma || null,
      intelligence: groupedAttributes.intelligence || null,
      resolve: groupedAttributes.resolve || null,
      morale: groupedAttributes.morale || null
    };

    console.log("Calculated grouped attributes:", JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error("Error calculating grouped attributes:", error);
    throw new Error(`Failed to calculate grouped attributes: ${error.message}`);
  }
};