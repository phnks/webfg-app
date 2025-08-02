import React from "react";
import "./CharacterStats.css";
const CharacterStats = ({
  stats
}) => {
  if (!stats) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "section character-stats"
  }, /*#__PURE__*/React.createElement("h3", null, "Stats"), /*#__PURE__*/React.createElement("div", {
    className: "stats-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-name"
  }, "Hit Points"), /*#__PURE__*/React.createElement("div", {
    className: "stat-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-fill",
    style: {
      width: `${stats.hitPoints.current / stats.hitPoints.max * 100}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, stats.hitPoints.current, " / ", stats.hitPoints.max)), /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-name"
  }, "Exhaustion"), /*#__PURE__*/React.createElement("div", {
    className: "stat-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-fill exhaustion",
    style: {
      width: `${stats.exhaustion.current / stats.exhaustion.max * 100}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, stats.exhaustion.current, " / ", stats.exhaustion.max)), /*#__PURE__*/React.createElement("div", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-name"
  }, "Surges"), /*#__PURE__*/React.createElement("div", {
    className: "stat-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-fill surges",
    style: {
      width: `${stats.surges.current / stats.surges.max * 100}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, stats.surges.current, " / ", stats.surges.max))));
};
export default CharacterStats;