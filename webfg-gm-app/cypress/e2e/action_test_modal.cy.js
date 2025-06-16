describe('Action Test Modal and Difficulty Calculations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  function navigateToCharacters() {
    cy.get('.nav-toggle').click();
    cy.get('a[href="/characters"]').click();
    cy.get('.nav-toggle').click();
  }

  function setupCharacterWithActions() {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('.character-card', 'The Guy').click();
    
    // Ensure character has Hit action
    cy.get('body').then($body => {
      if (!$body.text().includes('Hit')) {
        cy.contains('button', 'Add Action').click();
        cy.contains('Hit').click();
        cy.contains('button', 'Add').click();
      }
    });
  }

  it('should open action test modal', () => {
    setupCharacterWithActions();
    
    // Click test button for Hit action
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Verify modal opened
    cy.get('.modal').should('be.visible');
    cy.contains('Test Action: Hit').should('be.visible');
  });

  it('should display action details in test modal', () => {
    setupCharacterWithActions();
    
    // Open test modal for Hit
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Verify action details displayed
    cy.get('.modal').within(() => {
      cy.contains('Source: dexterity').should('exist');
      cy.contains('Target: agility').should('exist');
      cy.contains('Type: trigger').should('exist');
      cy.contains('Triggers: Break').should('exist');
    });
  });

  it('should show difficulty calculation formula', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Check formula display
    cy.get('.difficulty-formula').should('exist');
    cy.contains('Difficulty = Target Attribute - Source Attribute').should('exist');
  });

  it('should calculate difficulty against different targets', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Test against Commoner (agility 1)
    cy.get('select').contains('option', 'Commoner').parent().select('Commoner');
    
    // Difficulty should be: Commoner agility (1) - The Guy dexterity (10) = -9
    cy.contains('Difficulty: -9').should('exist');
    cy.contains('Very Easy').should('exist');
    
    // Test against Anum (agility 100)
    cy.get('select').contains('option', 'Anum').parent().select('Anum');
    
    // Difficulty should be: Anum agility (100) - The Guy dexterity (10) = 90
    cy.contains('Difficulty: 90').should('exist');
    cy.contains('Extremely Hard').should('exist');
  });

  it('should update difficulty when source attribute changes', () => {
    navigateToCharacters();
    
    // Setup The Guy with Aim condition to boost dexterity
    cy.contains('.character-card', 'The Guy').click();
    
    // Add Aim condition if not present
    cy.get('body').then($body => {
      if (!$body.text().includes('Aim')) {
        cy.contains('button', 'Add Condition').click();
        cy.contains('Aim').click();
        cy.contains('button', 'Add').click();
      }
    });
    
    // Ensure Hit action is present
    cy.get('body').then($body => {
      if (!$body.text().includes('Hit')) {
        cy.contains('button', 'Add Action').click();
        cy.contains('Hit').click();
        cy.contains('button', 'Add').click();
      }
    });
    
    // Open test modal
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Test against The Guy (self)
    cy.get('select').contains('option', 'The Guy').parent().select('The Guy');
    
    // With Aim: dexterity is 13 (10 + 3), agility is 10
    // Difficulty: 10 - 13 = -3
    cy.contains('Difficulty: -3').should('exist');
    cy.contains('Source: 13').should('exist');
  });

  it('should show roll requirements', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Select different targets to see roll requirements
    cy.get('select').contains('option', 'Commoner').parent().select('Commoner');
    
    // For very easy difficulty (-9), should show minimum roll needed
    cy.contains('Roll needed').should('exist');
    cy.contains('2+').should('exist'); // Or whatever the system uses
    
    // Select harder target
    cy.get('select').contains('option', 'Anum').parent().select('Anum');
    
    // For extreme difficulty (90), should show very high roll needed
    cy.contains('20+').should('exist'); // Or indicate impossible
  });

  it('should simulate action execution', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Select target
    cy.get('select').contains('option', 'Commoner').parent().select('Commoner');
    
    // Click simulate/execute button
    cy.contains('button', 'Execute').click();
    
    // Should show result
    cy.contains('Success').should('be.visible');
    
    // For trigger actions, should show chain execution
    cy.contains('Hit → Break → Kill').should('exist');
  });

  it('should handle action chains in test modal', () => {
    setupCharacterWithActions();
    
    // Open test modal for Hit (which triggers Break → Kill)
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Should show full action chain
    cy.contains('Hit → Break → Kill').should('exist');
    
    // Select target
    cy.get('select').contains('option', 'Commoner').parent().select('Commoner');
    
    // Should show difficulty for each action in chain
    cy.contains('Hit: -9').should('exist'); // dex vs agility
    cy.contains('Break:').should('exist'); // strength vs armor
    cy.contains('Kill:').should('exist'); // lethality vs endurance
  });

  it('should test destroy type actions', () => {
    navigateToCharacters();
    
    // Add Kill action directly to character
    cy.contains('.character-card', 'The Guy').click();
    
    cy.get('body').then($body => {
      if (!$body.text().includes('Kill')) {
        cy.contains('button', 'Add Action').click();
        cy.contains('Kill').click();
        cy.contains('button', 'Add').click();
      }
    });
    
    // Open test modal for Kill
    cy.contains('.action-item', 'Kill')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Verify destroy type specifics
    cy.get('.modal').within(() => {
      cy.contains('Type: destroy').should('exist');
      cy.contains('Warning: This action will destroy the target').should('exist');
    });
  });

  it('should close test modal', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Close modal
    cy.get('.modal button.close').click();
    
    // Verify modal closed
    cy.get('.modal').should('not.exist');
  });

  it('should handle edge cases in difficulty calculation', () => {
    navigateToCharacters();
    
    // Create character with negative attributes
    cy.contains('.character-card', 'Commoner').click();
    
    // Add Tower Shield to get negative agility
    cy.contains('button', 'Add Object').click();
    cy.contains('Tower Shield').click();
    cy.contains('button', 'Add').click();
    
    cy.contains('.object-item', 'Tower Shield')
      .parent()
      .find('button:contains("Equip")')
      .click();
    
    // Add Hit action
    cy.contains('button', 'Add Action').click();
    cy.contains('Hit').click();
    cy.contains('button', 'Add').click();
    
    // Open test modal
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Test against The Guy
    cy.get('select').contains('option', 'The Guy').parent().select('The Guy');
    
    // Commoner dex (1) vs The Guy agility (10)
    // Difficulty: 10 - 1 = 9
    cy.contains('Difficulty: 9').should('exist');
    
    // Show that negative source attributes make actions harder
    cy.contains('Source: 1').should('exist');
    cy.contains('Hard').should('exist');
  });

  it('should update test results dynamically', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.contains('.action-item', 'Hit')
      .parent()
      .find('button:contains("Test")')
      .click();
    
    // Test against multiple targets without closing modal
    const targets = ['Commoner', 'The Guy', 'Anum'];
    
    targets.forEach(target => {
      cy.get('select').contains('option', target).parent().select(target);
      cy.contains('button', 'Execute').click();
      cy.contains('Result').should('be.visible');
      
      // Clear result for next test
      cy.contains('button', 'Clear').click();
    });
  });
});