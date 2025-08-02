import React from 'react';
import './ErrorPopup.css';
const ErrorPopup = ({
  error,
  onClose
}) => {
  if (!error) {
    return null;
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "error-popup"
  }, /*#__PURE__*/React.createElement("div", {
    className: "error-popup-content"
  }, /*#__PURE__*/React.createElement("h3", null, "Error"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Message:")), /*#__PURE__*/React.createElement("pre", null, error.message), error.stack && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Stack Trace:")), /*#__PURE__*/React.createElement("pre", null, error.stack)), /*#__PURE__*/React.createElement("button", {
    onClick: onClose
  }, "Dismiss")));
};
export default ErrorPopup;