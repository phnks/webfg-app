function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
const MobileNumberInput = ({
  value,
  onChange,
  ...props
}) => {
  const handleFocus = e => {
    // Select all text when focused, making it easy to replace on mobile
    e.target.select();
  };
  const handleClick = e => {
    // Also select on click for better mobile experience
    e.target.select();
  };
  return /*#__PURE__*/React.createElement("input", _extends({
    type: "number",
    value: value,
    onChange: onChange,
    onFocus: handleFocus,
    onClick: handleClick
  }, props));
};
export default MobileNumberInput;