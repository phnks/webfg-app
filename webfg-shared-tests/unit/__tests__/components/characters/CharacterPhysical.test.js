import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterPhysical from '../../../components/characters/CharacterPhysical';
describe('CharacterPhysical Component', () => {
  const mockPhysical = {
    height: 180,
    bodyFatPercentage: 15,
    width: 50,
    length: 30,
    adjacency: 'adjacent'
  };
  test('renders without crashing', () => {
    render(/*#__PURE__*/React.createElement(CharacterPhysical, {
      physical: mockPhysical
    }));
  });
  test('displays physical attributes section', () => {
    render(/*#__PURE__*/React.createElement(CharacterPhysical, {
      physical: mockPhysical
    }));
    expect(screen.getByText('Physical Attributes')).toBeInTheDocument();
  });
  test('displays height', () => {
    render(/*#__PURE__*/React.createElement(CharacterPhysical, {
      physical: mockPhysical
    }));
    expect(screen.getByText('Height')).toBeInTheDocument();
    expect(screen.getByText('180 cm')).toBeInTheDocument();
  });
  test('displays body fat percentage', () => {
    render(/*#__PURE__*/React.createElement(CharacterPhysical, {
      physical: mockPhysical
    }));
    expect(screen.getByText('Body Fat')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
  });
  test('displays width', () => {
    render(/*#__PURE__*/React.createElement(CharacterPhysical, {
      physical: mockPhysical
    }));
    expect(screen.getByText('Width')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });
  test('displays length', () => {
    render(/*#__PURE__*/React.createElement(CharacterPhysical, {
      physical: mockPhysical
    }));
    expect(screen.getByText('Length')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });
  test('displays adjacency', () => {
    render(/*#__PURE__*/React.createElement(CharacterPhysical, {
      physical: mockPhysical
    }));
    expect(screen.getByText('Adjacency')).toBeInTheDocument();
    expect(screen.getByText('adjacent')).toBeInTheDocument();
  });
  test('does not render when physical prop is null', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(CharacterPhysical, {
      physical: null
    }));
    expect(container.firstChild).toBeNull();
  });
  test('does not render when physical prop is undefined', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(CharacterPhysical, null));
    expect(container.firstChild).toBeNull();
  });
  test('applies correct CSS classes', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(CharacterPhysical, {
      physical: mockPhysical
    }));
    expect(container.querySelector('.character-physical')).toBeInTheDocument();
    expect(container.querySelector('.physical-stats')).toBeInTheDocument();
    expect(container.querySelector('.physical-stat')).toBeInTheDocument();
  });
  test('handles missing physical properties gracefully', () => {
    const incompletePhysical = {
      height: 180
      // Missing other properties
    };
    render(/*#__PURE__*/React.createElement(CharacterPhysical, {
      physical: incompletePhysical
    }));
    expect(screen.getByText('Physical Attributes')).toBeInTheDocument();
    expect(screen.getByText('180 cm')).toBeInTheDocument();
  });
});