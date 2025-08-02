import React from "react";
import "./TabNavigation.css";
const TabNavigation = ({
  activeTab,
  onTabChange
}) => {
  return /*#__PURE__*/React.createElement("div", {
    className: "tab-navigation"
  }, /*#__PURE__*/React.createElement("button", {
    className: `tab-button ${activeTab === "characters" ? "active" : ""}`,
    onClick: () => onTabChange("characters")
  }, "Characters"), /*#__PURE__*/React.createElement("button", {
    className: `tab-button ${activeTab === "objects" ? "active" : ""}`,
    onClick: () => onTabChange("objects")
  }, "Objects"), /*#__PURE__*/React.createElement("button", {
    className: `tab-button ${activeTab === "actions" ? "active" : ""}`,
    onClick: () => onTabChange("actions")
  }, "Actions"));
};
export default TabNavigation;