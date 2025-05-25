import React from "react";
import { FEATURE_FLAGS } from "../../../config/features";
import ActionTest from "./ActionTest";
import ActionTestBackend from "./ActionTestBackend";

/**
 * Wrapper component that switches between frontend and backend implementations
 * based on feature flags
 */
const ActionTestWrapper = (props) => {
  if (FEATURE_FLAGS.USE_BACKEND_ACTION_TEST) {
    return <ActionTestBackend {...props} />;
  }
  
  return <ActionTest {...props} />;
};

export default ActionTestWrapper;