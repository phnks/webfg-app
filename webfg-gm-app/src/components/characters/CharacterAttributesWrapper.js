import React from "react";
import { FEATURE_FLAGS } from "../../config/features";
import CharacterAttributes from "./CharacterAttributes";
import CharacterAttributesBackend from "./CharacterAttributesBackend";

/**
 * Wrapper component that switches between frontend and backend implementations
 * based on feature flags
 */
const CharacterAttributesWrapper = (props) => {
  if (FEATURE_FLAGS.USE_BACKEND_GROUPED_ATTRIBUTES) {
    return <CharacterAttributesBackend {...props} />;
  }
  
  return <CharacterAttributes {...props} />;
};

export default CharacterAttributesWrapper;