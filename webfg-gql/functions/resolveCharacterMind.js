exports.handler = async (event) => {
  try {
    const character = event.source;
    
    // Return the mind array directly (already contains MindThought objects)
    return character.mind || [];
  } catch (error) {
    console.error('Error resolving character mind:', error);
    throw error;
  }
};