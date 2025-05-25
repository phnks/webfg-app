const { calculateAttributeBreakdown, calculateObjectAttributeBreakdown } = require('../utils/attributeBreakdown');

exports.handler = async (event) => {
  console.log("Received event for resolveAttributeBreakdown:", JSON.stringify(event, null, 2));

  // Source contains the parent Character or Object
  const entity = event.source;
  const typeName = event.info.parentTypeName; // 'Character' or 'Object'
  const attributeName = event.arguments.attributeName;

  if (!entity) {
    console.log("No entity found, returning empty breakdown.");
    return [];
  }

  if (!attributeName) {
    console.log("No attribute name provided, returning empty breakdown.");
    return [];
  }

  try {
    let breakdown;
    
    if (typeName === 'Character') {
      breakdown = calculateAttributeBreakdown(entity, attributeName);
    } else if (typeName === 'Object') {
      breakdown = calculateObjectAttributeBreakdown(entity, attributeName);
    } else {
      throw new Error(`Unknown entity type: ${typeName}`);
    }

    console.log(`Calculated breakdown for ${attributeName}:`, JSON.stringify(breakdown, null, 2));
    return breakdown;

  } catch (error) {
    console.error("Error calculating attribute breakdown:", error);
    throw new Error(`Failed to calculate attribute breakdown: ${error.message}`);
  }
};