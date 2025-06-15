describe('Condition CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  const testConditions = [
    {
      name: 'Grapple',
      description: 'Being held or restrained by an opponent',
      type: 'hinder',
      attribute: 'agility',
      value: 5
    },
    {
      name: 'Aim',
      description: 'Taking careful aim to improve accuracy',
      type: 'help',
      attribute: 'dexterity',
      value: 3
    },
    {
      name: 'Exhausted',
      description: 'Severe fatigue affecting multiple attributes',
      type: 'hinder',
      attribute: 'endurance',
      value: 8
    },
    {
      name: 'Blessed',
      description: 'Divine favor enhancing abilities',
      type: 'help',
      attribute: 'faith',
      value: 10
    }
  ];

  function navigateToConditions() {
    cy.get('[data-cy="menu-toggle"]').click();
    cy.get('[data-cy="nav-conditions"]').click();
    cy.get('[data-cy="menu-toggle"]').click();
  }

  function createCondition(condition) {
    cy.get('[data-cy="create-condition-button"]').click();
    
    // Fill basic info
    cy.get('input[name="name"]').clear().type(condition.name);
    cy.get('textarea[name="description"]').clear().type(condition.description);
    
    // Select type
    cy.get('select[name="type"]').select(condition.type);
    
    // Select attribute
    cy.get('select[name="attribute"]').select(condition.attribute);
    
    // Fill value
    cy.get('input[name="value"]').clear().type(condition.value.toString());
    
    // Submit form
    cy.contains('button', 'Create Condition').click({force: true});
    
    // Verify redirect
    cy.url().should('include', '/conditions/');
    cy.url().should('not.contain', '/conditions/new');
  }

  it('should create test conditions', () => {
    navigateToConditions();
    
    testConditions.forEach((condition) => {
      createCondition(condition);
      
      // Verify condition details
      cy.contains('h1', condition.name).should('be.visible');
      cy.contains(condition.description).should('be.visible');
      cy.contains(`Type: ${condition.type}`).should('be.visible');
      cy.contains(`Attribute: ${condition.attribute}`).should('be.visible');
      cy.contains(`Value: ${condition.value}`).should('be.visible');
      
      // Go back to condition list
      navigateToConditions();
    });
  });

  it('should list all created conditions', () => {
    navigateToConditions();
    
    // Verify all test conditions appear in list
    testConditions.forEach((condition) => {
      cy.contains('[data-cy="condition-list-item"]', condition.name).should('exist');
      // Verify type indicator
      if (condition.type === 'help') {
        cy.contains('[data-cy="condition-list-item"]', condition.name)
          .find('[data-cy="help-indicator"]')
          .should('exist');
      } else {
        cy.contains('[data-cy="condition-list-item"]', condition.name)
          .find('[data-cy="hinder-indicator"]')
          .should('exist');
      }
    });
  });

  it('should view condition details', () => {
    navigateToConditions();
    
    // Click on Grapple
    cy.contains('[data-cy="condition-list-item"]', 'Grapple').click();
    
    // Verify we're on the condition view page
    cy.url().should('include', '/conditions/');
    cy.contains('h1', 'Grapple').should('be.visible');
    
    // Verify effect display
    cy.contains('Effect: Hinders agility by 5').should('exist');
    
    // Verify characters affected section
    cy.contains('Characters Affected').should('exist');
  });

  it('should update condition details', () => {
    navigateToConditions();
    
    // Click on Aim
    cy.contains('[data-cy="condition-list-item"]', 'Aim').click();
    
    // Click edit button
    cy.get('[data-cy="edit-condition-button"]').click();
    
    // Update description and value
    cy.get('textarea[name="description"]').clear().type('Focused aim for improved precision');
    cy.get('input[name="value"]').clear().type('5');
    
    // Save changes
    cy.contains('button', 'Update Condition').click({force: true});
    
    // Verify updates
    cy.contains('Focused aim for improved precision').should('be.visible');
    cy.contains('Effect: Helps dexterity by 5').should('exist');
  });

  it('should delete a condition', () => {
    navigateToConditions();
    
    // Create a condition to delete
    cy.get('[data-cy="create-condition-button"]').click();
    cy.get('input[name="name"]').type('Condition To Delete');
    cy.get('textarea[name="description"]').type('This will be deleted');
    cy.get('select[name="type"]').select('hinder');
    cy.get('select[name="attribute"]').select('strength');
    cy.get('input[name="value"]').type('3');
    cy.contains('button', 'Create Condition').click({force: true});
    
    // Wait for redirect
    cy.url().should('include', '/conditions/');
    
    // Click delete button
    cy.get('[data-cy="delete-condition-button"]').click();
    
    // Confirm deletion
    cy.get('[data-cy="confirm-delete-button"]').click();
    
    // Verify redirect to condition list
    cy.url().should('equal', `${Cypress.config().baseUrl}/conditions`);
    
    // Verify condition is not in list
    cy.contains('[data-cy="condition-list-item"]', 'Condition To Delete').should('not.exist');
  });

  it('should handle form validation', () => {
    navigateToConditions();
    cy.get('[data-cy="create-condition-button"]').click();
    
    // Try to submit without required fields
    cy.contains('button', 'Create Condition').click({force: true});
    
    // Should show validation errors
    cy.contains('Name is required').should('be.visible');
    cy.contains('Type is required').should('be.visible');
    cy.contains('Attribute is required').should('be.visible');
    cy.contains('Value is required').should('be.visible');
    
    // Fill name but invalid value
    cy.get('input[name="name"]').type('Invalid Condition');
    cy.get('select[name="type"]').select('help');
    cy.get('select[name="attribute"]').select('strength');
    cy.get('input[name="value"]').type('0');
    cy.contains('button', 'Create Condition').click({force: true});
    
    // Should show value validation error
    cy.contains('Value must be greater than 0').should('be.visible');
  });

  it('should filter conditions by type', () => {
    navigateToConditions();
    
    // Check if filter controls exist
    cy.get('[data-cy="type-filter"]').should('exist');
    
    // Filter by HELP type
    cy.get('[data-cy="type-filter"]').select('help');
    
    // Verify only help conditions are shown
    cy.contains('[data-cy="condition-list-item"]', 'Aim').should('be.visible');
    cy.contains('[data-cy="condition-list-item"]', 'Blessed').should('be.visible');
    cy.contains('[data-cy="condition-list-item"]', 'Grapple').should('not.exist');
    cy.contains('[data-cy="condition-list-item"]', 'Exhausted').should('not.exist');
    
    // Filter by HINDER type
    cy.get('[data-cy="type-filter"]').select('hinder');
    
    // Verify only hinder conditions are shown
    cy.contains('[data-cy="condition-list-item"]', 'Grapple').should('be.visible');
    cy.contains('[data-cy="condition-list-item"]', 'Exhausted').should('be.visible');
    cy.contains('[data-cy="condition-list-item"]', 'Aim').should('not.exist');
    cy.contains('[data-cy="condition-list-item"]', 'Blessed').should('not.exist');
    
    // Clear filter
    cy.get('[data-cy="type-filter"]').select('ALL');
    
    // Verify all conditions are shown again
    cy.contains('[data-cy="condition-list-item"]', 'Grapple').should('be.visible');
    cy.contains('[data-cy="condition-list-item"]', 'Aim').should('be.visible');
  });
});