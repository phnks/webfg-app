import React from "react";
import "./TabNavigation.css";

const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-navigation">
      <button
        className={`tab-button ${activeTab === "characters" ? "active" : ""}`}
        onClick={() => onTabChange("characters")}
      >
        Characters
      </button>
      <button
        className={`tab-button ${activeTab === "objects" ? "active" : ""}`}
        onClick={() => onTabChange("objects")}
      >
        Objects
      </button>
      <button
        className={`tab-button ${activeTab === "actions" ? "active" : ""}`}
        onClick={() => onTabChange("actions")}
      >
        Actions
      </button>
    </div>
  );
};

export default TabNavigation; 