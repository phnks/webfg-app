import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../../components/Home';
describe('Home Component', () => {
  test('renders welcome message', () => {
    render(/*#__PURE__*/React.createElement(Home, null));
    expect(screen.getByText('Welcome to WEBFG GM App')).toBeInTheDocument();
  });
  test('renders description', () => {
    render(/*#__PURE__*/React.createElement(Home, null));
    expect(screen.getByText('A comprehensive tool for game masters to manage characters, objects, and actions.')).toBeInTheDocument();
  });
  test('renders features grid', () => {
    render(/*#__PURE__*/React.createElement(Home, null));
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Create and manage characters with detailed attributes, skills, and equipment.')).toBeInTheDocument();
    expect(screen.getByText('Objects')).toBeInTheDocument();
    expect(screen.getByText('Track items, weapons, armor, and other objects in your game world.')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Define actions with timing, effects, and other properties for your game mechanics.')).toBeInTheDocument();
  });
  test('renders getting started section', () => {
    render(/*#__PURE__*/React.createElement(Home, null));
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Use the navigation menu to switch between characters, objects, and actions.')).toBeInTheDocument();
    expect(screen.getByText('Click the "+" button to create new items in each section.')).toBeInTheDocument();
  });
  test('has correct CSS classes', () => {
    const {
      container
    } = render(/*#__PURE__*/React.createElement(Home, null));
    expect(container.querySelector('.home-container')).toBeInTheDocument();
    expect(container.querySelector('.features-grid')).toBeInTheDocument();
    expect(container.querySelectorAll('.feature-card')).toHaveLength(3);
    expect(container.querySelector('.getting-started')).toBeInTheDocument();
  });
});