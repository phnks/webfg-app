import React from 'react';

const MobileNumberInput = ({ value, onChange, ...props }) => {
  const handleFocus = (e) => {
    // Select all text when focused, making it easy to replace on mobile
    e.target.select();
  };

  const handleClick = (e) => {
    // Also select on click for better mobile experience
    e.target.select();
  };

  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={onChange}
      onFocus={handleFocus}
      onClick={handleClick}
      {...props}
    />
  );
};

export default MobileNumberInput;