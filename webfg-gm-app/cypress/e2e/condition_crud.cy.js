describe('Condition CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  const testConditions = [
    {
      name: 'Grapple',
      description: 'Being held or restrained by an opponent',
      conditionType: 'hinder',
      stackable: false,
      attributeModifiers: [
        { attribute: 'agility', value: -5 }
      ]
    },
    {
      name: 'Aim',
      description: 'Taking careful aim to improve accuracy',
      conditionType: 'help',
      stackable: false,
      attributeModifiers: [
        { attribute: 'dexterity', value: 3 }
      ]
    },
    {
      name: 'Exhausted',
      description: 'Severe fatigue affecting multiple attributes',
      conditionType: 'hinder',
      stackable: true,
      attributeModifiers: [
        { attribute: 'endurance', value: -8 },
        { attribute: 'strength', value: -4 },
        { attribute: 'agility', value: -2 }
      ]
    },
    {
      name: 'Blessed',
      description: 'Divine favor enhancing abilities',
      conditionType: 'help',
      stackable: false,
      attributeModifiers: [
        { attribute: 'faith', value: 10 },
        { attribute: 'will', value: 5 }
      ]
    }
  ];

  function createCondition(condition) {
    cy.clickCreateButton();
    cy.fillConditionForm(condition);
    cy.contains('button', 'Create Condition').click({force: true});
    cy.waitForGraphQL();
    
    // Verify redirect
    cy.url().should('include', '/conditions/');
    cy.url().should('not.contain', '/conditions/new');
  }

  it('should create test conditions', () => {
    cy.navigateToConditions();
    
    testConditions.forEach((condition) => {
      createCondition(condition);
      
      // Verify condition details
      cy.contains('h1', condition.name).should('be.visible');
      cy.contains(condition.description).should('be.visible');
      cy.contains(`Type: ${condition.conditionType}`).should('be.visible');
      
      // Verify attribute modifiers
      condition.attributeModifiers.forEach(modifier => {
        cy.contains(`${modifier.attribute}: ${modifier.value > 0 ? '+' : ''}${modifier.value}`).should('be.visible');
      });
      
      // Go back to condition list
      cy.navigateToConditions();
    });
  });

  it('should list all created conditions', () => {
    cy.navigateToConditions();
    
    // Verify all test conditions appear in list
    testConditions.forEach((condition) => {
      cy.contains('.condition-card', condition.name).should('exist');
      cy.contains('.condition-card', condition.name).within(() => {
        cy.contains(condition.description).should('be.visible');
        // Verify type indicator
        if (condition.conditionType === 'help') {
          cy.get('.help-indicator').should('exist');
        } else {
          cy.get('.hinder-indicator').should('exist');
        }
      });
    });
  });

  it('should view condition details', () => {
    cy.navigateToConditions();
    
    // Click on Grapple condition
    cy.contains('.condition-card', 'Grapple').click();
    
    // Verify we're on the detail page
    cy.url().should('match', /\/conditions\/[a-zA-Z0-9-]+$/);
    cy.contains('h1', 'Grapple').should('be.visible');
    cy.contains('Being held or restrained by an opponent').should('be.visible');
    cy.contains('Type: hinder').should('be.visible');
    cy.contains('agility: -5').should('be.visible');
  });

  it('should update condition details', () => {
    cy.navigateToConditions();
    
    // Navigate to Aim condition
    cy.contains('.condition-card', 'Aim').click();
    
    // Click edit button
    cy.clickEditButton();
    
    // Update description and value
    const updatedDescription = 'Taking extra careful aim for maximum accuracy - Updated';
    cy.get('textarea[name="description"]').clear().type(updatedDescription);
    cy.get('input[name="dexterity"]').clear().type('5');
    
    // Save changes
    cy.contains('button', 'Update Condition').click({force: true});
    cy.waitForGraphQL();
    
    // Verify update
    cy.contains(updatedDescription).should('be.visible');
    cy.contains('dexterity: +5').should('be.visible');
  });

  it('should delete a condition', () => {
    cy.navigateToConditions();
    
    // Create a condition to delete
    cy.clickCreateButton();
    cy.fillConditionForm({
      name: 'Condition To Delete',
      description: 'This will be deleted',
      conditionType: 'hinder',
      stackable: false,
      attributeModifiers: [{ attribute: 'strength', value: -2 }]
    });
    cy.contains('button', 'Create Condition').click({force: true});
    cy.waitForGraphQL();
    
    // Click delete button
    cy.clickDeleteButton();
    
    // Confirm deletion in any dialog
    cy.on('window:confirm', () => true);
    cy.waitForGraphQL();
    
    // Verify we're back on the list page
    cy.url().should('include', '/conditions');
    cy.url().should('not.match', /\/conditions\/[a-zA-Z0-9-]+$/);
    
    // Verify condition is deleted
    cy.contains('.condition-card', 'Condition To Delete').should('not.exist');
  });

  it('should handle form validation', () => {
    cy.navigateToConditions();
    cy.clickCreateButton();
    
    // Try to submit empty form
    cy.contains('button', 'Create Condition').click({force: true});
    
    // Check for validation errors
    cy.contains('Name is required').should('be.visible');
    
    // Fill only name and try again
    cy.get('input[name="name"]').type('Test Condition');
    cy.contains('button', 'Create Condition').click({force: true});
    
    // Should still have errors for required fields
    cy.contains('Description is required').should('be.visible');
  });

  it('should show stackable toggle', () => {
    cy.navigateToConditions();
    cy.clickCreateButton();
    
    // Check stackable toggle exists
    cy.get('input[name="stackable"]').should('exist');
    
    // Toggle stackable
    cy.get('input[name="stackable"][value="true"]').check();
    cy.get('input[name="stackable"][value="true"]').should('be.checked');
    
    // Toggle non-stackable
    cy.get('input[name="stackable"][value="false"]').check();
    cy.get('input[name="stackable"][value="false"]').should('be.checked');
  });

  it('should handle multiple attribute modifiers', () => {
    cy.navigateToConditions();
    
    // View Exhausted condition (has multiple modifiers)
    cy.contains('.condition-card', 'Exhausted').click();
    
    // Verify all modifiers are shown
    cy.contains('endurance: -8').should('be.visible');
    cy.contains('strength: -4').should('be.visible');
    cy.contains('agility: -2').should('be.visible');
  });

  it('should display help and hinder indicators correctly', () => {
    cy.navigateToConditions();
    
    // Check help conditions have positive styling
    cy.contains('.condition-card', 'Aim').within(() => {
      cy.get('.help-indicator').should('have.css', 'color').and('match', /green|rgb\(0,.*128.*\)/i);
    });
    
    cy.contains('.condition-card', 'Blessed').within(() => {
      cy.get('.help-indicator').should('exist');
    });
    
    // Check hinder conditions have negative styling
    cy.contains('.condition-card', 'Grapple').within(() => {
      cy.get('.hinder-indicator').should('have.css', 'color').and('match', /red|rgb\(.*255.*,.*0.*\)/i);
    });
    
    cy.contains('.condition-card', 'Exhausted').within(() => {
      cy.get('.hinder-indicator').should('exist');
    });
  });

  it('should show conditions used by characters', () => {
    cy.navigateToConditions();
    
    // First, add condition to a character
    cy.navigateToCharacters();
    cy.contains('.character-card', 'The Guy').click();
    cy.contains('button', 'Add Condition').click();
    cy.contains('Aim').click();
    cy.contains('button', 'Add').click();
    
    // Go back to conditions
    cy.navigateToConditions();
    cy.contains('.condition-card', 'Aim').click();
    
    // Check if it shows which characters use this condition
    cy.get('body').then($body => {
      if ($body.find('.used-by-section').length > 0) {
        cy.get('.used-by-section').should('contain', 'The Guy');
      }
    });
  });

  after(() => {
    // Clean up: Delete test conditions if they exist
    cy.navigateToConditions();
    
    const conditionsToDelete = testConditions.map(c => c.name);
    
    conditionsToDelete.forEach(conditionName => {
      cy.get('body').then($body => {
        if ($body.text().includes(conditionName)) {
          cy.contains('.condition-card', conditionName).click();
          cy.clickDeleteButton();
          cy.on('window:confirm', () => true);
          cy.waitForGraphQL();
          cy.navigateToConditions();
        }
      });
    });
  });
});