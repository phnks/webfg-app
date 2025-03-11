import React from 'react';

const Home = () => {
  return (
    <div className="home-container">
      <h1>Welcome to WEBFG GM App</h1>
      <p>A comprehensive tool for game masters to manage characters, objects, and actions.</p>
      
      <div className="features-grid">
        <div className="feature-card">
          <h3>Characters</h3>
          <p>Create and manage characters with detailed attributes, skills, and equipment.</p>
        </div>
        
        <div className="feature-card">
          <h3>Objects</h3>
          <p>Track items, weapons, armor, and other objects in your game world.</p>
        </div>
        
        <div className="feature-card">
          <h3>Actions</h3>
          <p>Define actions with timing, effects, and other properties for your game mechanics.</p>
        </div>
      </div>
      
      <div className="getting-started">
        <h2>Getting Started</h2>
        <p>Use the navigation menu to switch between characters, objects, and actions.</p>
        <p>Click the "+" button to create new items in each section.</p>
      </div>
    </div>
  );
};

export default Home; 