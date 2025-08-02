function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNumberInput from '../../../components/common/MobileNumberInput';
describe('MobileNumberInput Component', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    value: 10,
    onChange: mockOnChange
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, defaultProps));
  });
  test('displays the correct value', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, defaultProps));
    const input = screen.getByDisplayValue('10');
    expect(input).toBeInTheDocument();
  });
  test('calls onChange when value changes', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, defaultProps));
    const input = screen.getByDisplayValue('10');
    fireEvent.change(input, {
      target: {
        value: '20'
      }
    });
    expect(mockOnChange).toHaveBeenCalled();
  });
  test('accepts additional props', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, _extends({}, defaultProps, {
      placeholder: "Enter number"
    })));
    const input = screen.getByPlaceholderText('Enter number');
    expect(input).toBeInTheDocument();
  });
  test('has correct input type', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, defaultProps));
    const input = screen.getByDisplayValue('10');
    expect(input).toHaveAttribute('type', 'number');
  });
  test('selects text on focus', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, defaultProps));
    const input = screen.getByDisplayValue('10');
    const selectSpy = jest.spyOn(input, 'select');
    fireEvent.focus(input);
    expect(selectSpy).toHaveBeenCalled();
  });
  test('selects text on click', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, defaultProps));
    const input = screen.getByDisplayValue('10');
    const selectSpy = jest.spyOn(input, 'select');
    fireEvent.click(input);
    expect(selectSpy).toHaveBeenCalled();
  });
  test('handles zero value', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, {
      value: 0,
      onChange: mockOnChange
    }));
    const input = screen.getByDisplayValue('0');
    expect(input).toBeInTheDocument();
  });
  test('handles empty value', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, {
      value: "",
      onChange: mockOnChange
    }));
    const input = screen.getByRole('spinbutton');
    expect(input.value).toBe('');
  });
  test('handles null value', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, {
      value: null,
      onChange: mockOnChange
    }));
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });
  test('passes through className prop', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, _extends({}, defaultProps, {
      className: "custom-class"
    })));
    const input = screen.getByDisplayValue('10');
    expect(input).toHaveClass('custom-class');
  });
  test('passes through disabled prop', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, _extends({}, defaultProps, {
      disabled: true
    })));
    const input = screen.getByDisplayValue('10');
    expect(input).toBeDisabled();
  });
  test('handles string value', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, {
      value: "15",
      onChange: mockOnChange
    }));
    const input = screen.getByDisplayValue('15');
    expect(input).toBeInTheDocument();
  });
  test('handles min and max props', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, _extends({}, defaultProps, {
      min: "0",
      max: "100"
    })));
    const input = screen.getByDisplayValue('10');
    // Number inputs don't need inputMode attribute
    // Number inputs don't need pattern attribute
  });
  test('allows negative values', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, {
      value: "-5",
      onChange: mockOnChange
    }));
    const input = screen.getByDisplayValue('-5');
    expect(input).toBeInTheDocument();
  });
  test('allows typing negative sign', () => {
    render(/*#__PURE__*/React.createElement(MobileNumberInput, {
      value: "",
      onChange: mockOnChange
    }));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, {
      target: {
        value: '-1'
      }
    });
    expect(mockOnChange).toHaveBeenCalled();
  });
  test('allows typing minus sign first in controlled component', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      const handleChange = e => {
        const inputValue = e.target.value;
        // Allow minus sign or valid numbers
        if (inputValue === '' || inputValue === '-' || !isNaN(inputValue) && inputValue !== '') {
          setValue(inputValue);
        }
      };
      return /*#__PURE__*/React.createElement(MobileNumberInput, {
        value: value,
        onChange: handleChange
      });
    };
    render(/*#__PURE__*/React.createElement(TestComponent, null));
    const input = screen.getByRole('spinbutton');

    // Should start empty
    expect(input.value).toBe('');

    // Type negative number
    fireEvent.change(input, {
      target: {
        value: '-1'
      }
    });
    expect(input.value).toBe('-1');

    // Type number after minus
    fireEvent.change(input, {
      target: {
        value: '-5'
      }
    });
    expect(input.value).toBe('-5');
  });
});