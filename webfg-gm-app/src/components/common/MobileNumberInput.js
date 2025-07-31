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
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    
    // Allow numbers (0-9) from main keyboard and numpad
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      return;
    }
    
    // Allow period/decimal point (46, 110, 190)
    if ([46, 110, 190].indexOf(e.keyCode) !== -1) {
      return;
    }
    
    // Allow minus/dash (189, 109) only at the beginning or when field is empty
    if ([189, 109].indexOf(e.keyCode) !== -1) {
      const currentValue = e.target.value;
      const cursorPosition = e.target.selectionStart;
      
      // Allow minus only if:
      // 1. Field is empty, OR
      // 2. Cursor is at the beginning AND there's no minus already
      if (currentValue === '' || (cursorPosition === 0 && !currentValue.startsWith('-'))) {
        return;
      }
    }
    
    // Block all other keys
    e.preventDefault();
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow empty string
    if (inputValue === '') {
      onChange(e);
      return;
    }
    
    // Allow single minus sign (start of negative number)
    if (inputValue === '-') {
      onChange(e);
      return;
    }
    
    // Allow valid numbers (positive or negative)
    if (!isNaN(inputValue) && inputValue !== '') {
      onChange(e);
      return;
    }
    
    // Block everything else by not calling onChange
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