/**
 * Test script to demonstrate the condition display fix
 * This simulates the character rendering with a condition applied
 */

// Mock the character data with a condition applied
const mockCharacter = {
  characterId: 'test-char-1',
  name: 'The Guy',
  agility: {
    attribute: {
      attributeValue: 10,
      isGrouped: true
    }
  },
  conditions: [
    {
      conditionId: 'test-cond-1',
      name: 'Grappled',
      description: 'Character is being held and has reduced mobility',
      conditionCategory: 'PHYSICAL',
      conditionType: 'HINDER',
      conditionTarget: 'AGILITY',
      conditionAmount: 5
    }
  ],
  groupedAttributes: {
    agility: 5  // Reduced from 10 due to HINDER condition
  }
};

// Mock functions for debugging how the component will behave
function simulateCharacterAttributeDisplay() {
  const attr = {
    name: 'Agility',
    key: 'agility',
    data: mockCharacter.agility
  };
  
  const originalValue = attr.data.attribute.attributeValue;
  const groupedValue = mockCharacter.groupedAttributes[attr.key];
  const hasConditions = mockCharacter.conditions && mockCharacter.conditions.length > 0;
  
  // Debug output for comparison
  console.log(`[DEBUG] Attribute ${attr.name} (${attr.key}):
  - Original value: ${originalValue} (${typeof originalValue})
  - Grouped value: ${groupedValue} (${typeof groupedValue})
  - Has conditions: ${hasConditions}`);
  
  // Convert values to numbers for accurate comparison and ensure we're comparing numeric values
  const numOriginal = typeof originalValue === 'string' ? parseFloat(originalValue) : Number(originalValue);
  const numGrouped = typeof groupedValue === 'string' ? parseFloat(groupedValue) : Number(groupedValue);
  
  console.log(`  - numOriginal: ${numOriginal} (${typeof numOriginal})
  - numGrouped: ${numGrouped} (${typeof numGrouped})
  - Difference: ${Math.abs(numGrouped - numOriginal)}`);
  
  // Check if any condition targets this specific attribute
  const hasConditionForThisAttribute = hasConditions && mockCharacter.conditions.some(c => 
    c.conditionTarget && c.conditionTarget.toLowerCase() === attr.key.toLowerCase()
  );
  
  console.log(`  - Has condition for this attribute (${attr.key}): ${hasConditionForThisAttribute}`);
  
  const isDifferent = Math.abs(numGrouped - numOriginal) >= 0.01;
  console.log(`  - Values are different: ${isDifferent} (diff: ${Math.abs(numGrouped - numOriginal)})`);
  
  const shouldShowGroupedValue = (groupedValue !== undefined && groupedValue !== null) && 
    (hasConditionForThisAttribute || isDifferent);
  
  console.log(`  - Should show grouped value: ${shouldShowGroupedValue}`);
  
  // Show how the attribute would be displayed
  console.log(`\nDisplay for ${attr.name}: ${originalValue} ${shouldShowGroupedValue ? `→ ${Math.round(numGrouped)}` : ''}`);
  
  // Get style for the grouped value display
  const getStyleDescription = () => {
    const epsilon = 0.001;
    
    if (numGrouped - numOriginal > epsilon) {
      return "GREEN color (HELP condition effect)";
    } else if (numOriginal - numGrouped > epsilon) {
      return "RED color (HINDER condition effect)";
    }
    return "NORMAL color (no change)";
  };
  
  console.log(`Style for grouped value: ${getStyleDescription()}`);
}

// Run the simulation
console.log("===============================================");
console.log("TESTING CONDITION DISPLAY LOGIC");
console.log("===============================================\n");
console.log("Character:", mockCharacter.name);
console.log("Condition applied:", mockCharacter.conditions[0].name);
console.log("Condition effect:", `${mockCharacter.conditions[0].conditionType} on ${mockCharacter.conditions[0].conditionTarget} by ${mockCharacter.conditions[0].conditionAmount}`);
console.log("\n");

simulateCharacterAttributeDisplay();