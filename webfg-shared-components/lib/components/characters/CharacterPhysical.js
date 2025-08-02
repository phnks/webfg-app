import React from "react";
import "./CharacterPhysical.css";
const CharacterPhysical = ({
  physical
}) => {
  if (!physical) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "section character-physical"
  }, /*#__PURE__*/React.createElement("h3", null, "Physical Attributes"), /*#__PURE__*/React.createElement("div", {
    className: "physical-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "physical-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Height"), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, physical.height, " cm")), /*#__PURE__*/React.createElement("div", {
    className: "physical-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Body Fat"), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, physical.bodyFatPercentage, "%")), /*#__PURE__*/React.createElement("div", {
    className: "physical-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Width"), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, physical.width)), /*#__PURE__*/React.createElement("div", {
    className: "physical-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Length"), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, physical.length)), /*#__PURE__*/React.createElement("div", {
    className: "physical-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Depth/Height (Physical)"), " ", /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, physical.height), " "), /*#__PURE__*/React.createElement("div", {
    className: "physical-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Adjacency"), /*#__PURE__*/React.createElement("div", {
    className: "stat-value"
  }, physical.adjacency))));
};
export default CharacterPhysical;