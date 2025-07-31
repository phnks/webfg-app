import React from 'react';

const MobileNumberInput = ({ value, onChange, min, max, step, ...props }) => {
  const handleFocus = (e) => {
    // Select all text when focused, making it easy to replace on mobile
    e.target.select();
  };

  const handleClick = (e) => {
    // Also select on click for better mobile experience
    e.target.select();
  };

  const handleKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter, period, minus
    if ([8, 9, 27, 13, 46, 110, 190, 189, 109].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow empty value, negative sign at start, or valid numbers
    if (inputValue === '' || inputValue === '-' || !isNaN(inputValue)) {
      onChange(e);
    }
  };

  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onClick={handleClick}
      inputMode="numeric"
      pattern="-?[0-9]*\.?[0-9]*"
      {...props}
    />
  );
};

export default MobileNumberInput;