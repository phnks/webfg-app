describe('Action Test Modal and Difficulty Calculations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  function navigateToCharacters() {
    cy.get('[data-cy="menu-toggle"]').click();
    cy.get('[data-cy="nav-characters"]').click();
    cy.get('[data-cy="menu-toggle"]').click();
  }

  function setupCharacterWithActions() {
    navigateToCharacters();
    
    // Click on The Guy character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Ensure character has Hit action
    cy.get('body').then($body => {
      if (!$body.find('[data-cy="character-actions-list"]').text().includes('Hit')) {
        cy.get('[data-cy="add-action-button"]').click();
        cy.contains('[data-cy="action-select-item"]', 'Hit').click();
        cy.get('[data-cy="confirm-add-action"]').click();
      }
    });
  }

  it('should open action test modal', () => {
    setupCharacterWithActions();
    
    // Click test button for Hit action
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Verify modal opened
    cy.get('[data-cy="action-test-modal"]').should('be.visible');
    cy.contains('Test Action: Hit').should('be.visible');
  });

  it('should display action details in test modal', () => {
    setupCharacterWithActions();
    
    // Open test modal for Hit
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Verify action details displayed
    cy.get('[data-cy="action-test-modal"]').within(() => {
      cy.contains('Source: dexterity').should('exist');
      cy.contains('Target: agility').should('exist');
      cy.contains('Type: trigger').should('exist');
      cy.contains('Triggers: Break').should('exist');
    });
  });

  it('should show difficulty calculation formula', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Check formula display
    cy.get('[data-cy="difficulty-formula"]').should('exist');
    cy.contains('Difficulty = Target Attribute - Source Attribute').should('exist');
  });

  it('should calculate difficulty against different targets', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Test against Commoner (agility 1)
    cy.get('[data-cy="target-character-select"]').select('Commoner');
    
    // Difficulty should be: Commoner agility (1) - The Guy dexterity (10) = -9
    cy.get('[data-cy="calculated-difficulty"]').should('contain', '-9');
    cy.get('[data-cy="difficulty-description"]').should('contain', 'Very Easy');
    
    // Test against Anum (agility 100)
    cy.get('[data-cy="target-character-select"]').select('Anum');
    
    // Difficulty should be: Anum agility (100) - The Guy dexterity (10) = 90
    cy.get('[data-cy="calculated-difficulty"]').should('contain', '90');
    cy.get('[data-cy="difficulty-description"]').should('contain', 'Extremely Hard');
  });

  it('should update difficulty when source attribute changes', () => {
    navigateToCharacters();
    
    // Setup The Guy with Aim condition to boost dexterity
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    // Add Aim condition if not present
    cy.get('body').then($body => {
      if (!$body.find('[data-cy="character-conditions-list"]').text().includes('Aim')) {
        cy.get('[data-cy="add-condition-button"]').click();
        cy.contains('[data-cy="condition-select-item"]', 'Aim').click();
        cy.get('[data-cy="confirm-add-condition"]').click();
      }
    });
    
    // Ensure Hit action is present
    cy.get('body').then($body => {
      if (!$body.find('[data-cy="character-actions-list"]').text().includes('Hit')) {
        cy.get('[data-cy="add-action-button"]').click();
        cy.contains('[data-cy="action-select-item"]', 'Hit').click();
        cy.get('[data-cy="confirm-add-action"]').click();
      }
    });
    
    // Open test modal
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Test against The Guy (self)
    cy.get('[data-cy="target-character-select"]').select('The Guy');
    
    // With Aim: dexterity is 13 (10 + 3), agility is 10
    // Difficulty: 10 - 13 = -3
    cy.get('[data-cy="calculated-difficulty"]').should('contain', '-3');
    cy.get('[data-cy="source-attribute-value"]').should('contain', '13');
  });

  it('should show roll requirements', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Select different targets to see roll requirements
    cy.get('[data-cy="target-character-select"]').select('Commoner');
    
    // For very easy difficulty (-9), should show minimum roll needed
    cy.get('[data-cy="roll-requirement"]').should('exist');
    cy.contains('Roll needed: 2+').should('exist'); // Or whatever the system uses
    
    // Select harder target
    cy.get('[data-cy="target-character-select"]').select('Anum');
    
    // For extreme difficulty (90), should show very high roll needed
    cy.contains('Roll needed: 20+').should('exist'); // Or indicate impossible
  });

  it('should simulate action execution', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Select target
    cy.get('[data-cy="target-character-select"]').select('Commoner');
    
    // Click simulate/execute button
    cy.get('[data-cy="execute-test-button"]').click();
    
    // Should show result
    cy.get('[data-cy="test-result"]').should('be.visible');
    cy.get('[data-cy="test-result"]').should('contain', 'Success'); // With -9 difficulty
    
    // For trigger actions, should show chain execution
    cy.contains('Action chain triggered: Hit → Break → Kill').should('exist');
  });

  it('should handle action chains in test modal', () => {
    setupCharacterWithActions();
    
    // Open test modal for Hit (which triggers Break → Kill)
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Should show full action chain
    cy.get('[data-cy="action-chain-display"]').should('exist');
    cy.contains('Hit → Break → Kill').should('exist');
    
    // Select target
    cy.get('[data-cy="target-character-select"]').select('Commoner');
    
    // Should show difficulty for each action in chain
    cy.get('[data-cy="chain-difficulties"]').within(() => {
      cy.contains('Hit: -9').should('exist'); // dex vs agility
      cy.contains('Break:').should('exist'); // strength vs armor
      cy.contains('Kill:').should('exist'); // lethality vs endurance
    });
  });

  it('should test destroy type actions', () => {
    navigateToCharacters();
    
    // Add Kill action directly to character
    cy.contains('[data-cy="character-list-item"]', 'The Guy').click();
    
    cy.get('body').then($body => {
      if (!$body.find('[data-cy="character-actions-list"]').text().includes('Kill')) {
        cy.get('[data-cy="add-action-button"]').click();
        cy.contains('[data-cy="action-select-item"]', 'Kill').click();
        cy.get('[data-cy="confirm-add-action"]').click();
      }
    });
    
    // Open test modal for Kill
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Kill')
      .parent()
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Verify destroy type specifics
    cy.get('[data-cy="action-test-modal"]').within(() => {
      cy.contains('Type: destroy').should('exist');
      cy.contains('Warning: This action will destroy the target').should('exist');
    });
  });

  it('should close test modal', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Close modal
    cy.get('[data-cy="close-test-modal"]').click();
    
    // Verify modal closed
    cy.get('[data-cy="action-test-modal"]').should('not.exist');
  });

  it('should handle edge cases in difficulty calculation', () => {
    navigateToCharacters();
    
    // Create character with negative attributes
    cy.contains('[data-cy="character-list-item"]', 'Commoner').click();
    
    // Add Tower Shield to get negative agility
    cy.get('[data-cy="add-object-button"]').click();
    cy.contains('[data-cy="object-select-item"]', 'Tower Shield').click();
    cy.get('[data-cy="confirm-add-object"]').click();
    
    cy.get('[data-cy="character-stash"]')
      .contains('[data-cy="object-item"]', 'Tower Shield')
      .find('[data-cy="move-to-equipped-button"]')
      .click();
    
    // Add Hit action
    cy.get('[data-cy="add-action-button"]').click();
    cy.contains('[data-cy="action-select-item"]', 'Hit').click();
    cy.get('[data-cy="confirm-add-action"]').click();
    
    // Open test modal
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Test against The Guy
    cy.get('[data-cy="target-character-select"]').select('The Guy');
    
    // Commoner dex (1) vs The Guy agility (10)
    // Difficulty: 10 - 1 = 9
    cy.get('[data-cy="calculated-difficulty"]').should('contain', '9');
    
    // Show that negative source attributes make actions harder
    cy.get('[data-cy="source-attribute-value"]').should('contain', '1');
    cy.get('[data-cy="difficulty-description"]').should('contain', 'Hard');
  });

  it('should update test results dynamically', () => {
    setupCharacterWithActions();
    
    // Open test modal
    cy.get('[data-cy="character-actions-list"]')
      .contains('[data-cy="action-item"]', 'Hit')
      .find('[data-cy="test-action-button"]')
      .click();
    
    // Test against multiple targets without closing modal
    const targets = ['Commoner', 'The Guy', 'Anum'];
    
    targets.forEach(target => {
      cy.get('[data-cy="target-character-select"]').select(target);
      cy.get('[data-cy="execute-test-button"]').click();
      cy.get('[data-cy="test-result"]').should('be.visible');
      
      // Clear result for next test
      cy.get('[data-cy="clear-result-button"]').click();
    });
  });
});