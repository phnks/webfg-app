describe('Action CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  const testActions = [
    {
      name: 'Hit',
      description: 'A basic attack action',
      source: 'dexterity',
      target: 'agility',
      type: 'trigger',
      triggersAction: 'Break'
    },
    {
      name: 'Break',
      description: 'Breaking armor or objects',
      source: 'strength',
      target: 'armor',
      type: 'trigger',
      triggersAction: 'Kill'
    },
    {
      name: 'Kill',
      description: 'A lethal finishing blow',
      source: 'lethality',
      target: 'endurance',
      type: 'destroy'
    }
  ];

  function navigateToActions() {
    cy.get('[data-cy="menu-toggle"]').click();
    cy.get('[data-cy="nav-actions"]').click();
    cy.get('[data-cy="menu-toggle"]').click();
  }

  function createAction(action) {
    cy.get('[data-cy="create-action-button"]').click();
    
    // Fill basic info
    cy.get('input[name="name"]').clear().type(action.name);
    cy.get('textarea[name="description"]').clear().type(action.description);
    
    // Select source and target attributes
    cy.get('select[name="source"]').select(action.source);
    cy.get('select[name="target"]').select(action.target);
    
    // Select action type
    cy.get('select[name="type"]').select(action.type);
    
    // If trigger action, select the triggered action
    if (action.type === 'trigger' && action.triggersAction) {
      cy.get('select[name="triggersAction"]').select(action.triggersAction);
    }
    
    // Submit form
    cy.contains('button', 'Create Action').click({force: true});
    
    // Verify redirect
    cy.url().should('include', '/actions/');
    cy.url().should('not.contain', '/actions/new');
  }

  it('should create test actions in order', () => {
    navigateToActions();
    
    // Create Kill action first (since Hit and Break depend on it)
    createAction(testActions[2]);
    
    // Verify Kill action details
    cy.contains('h1', 'Kill').should('be.visible');
    cy.contains('A lethal finishing blow').should('be.visible');
    cy.contains('Type: destroy').should('be.visible');
    cy.contains('Source: lethality').should('be.visible');
    cy.contains('Target: endurance').should('be.visible');
    
    navigateToActions();
    
    // Create Break action (depends on Kill)
    createAction(testActions[1]);
    
    // Verify Break action details
    cy.contains('h1', 'Break').should('be.visible');
    cy.contains('Breaking armor or objects').should('be.visible');
    cy.contains('Type: trigger').should('be.visible');
    cy.contains('Triggers: Kill').should('be.visible');
    
    navigateToActions();
    
    // Create Hit action (depends on Break)
    createAction(testActions[0]);
    
    // Verify Hit action details
    cy.contains('h1', 'Hit').should('be.visible');
    cy.contains('A basic attack action').should('be.visible');
    cy.contains('Type: trigger').should('be.visible');
    cy.contains('Triggers: Break').should('be.visible');
  });

  it('should list all created actions', () => {
    navigateToActions();
    
    // Verify all test actions appear in list
    testActions.forEach((action) => {
      cy.contains('[data-cy="action-list-item"]', action.name).should('exist');
    });
  });

  it('should view action details', () => {
    navigateToActions();
    
    // Click on Hit action
    cy.contains('[data-cy="action-list-item"]', 'Hit').click();
    
    // Verify we're on the action view page
    cy.url().should('include', '/actions/');
    cy.contains('h1', 'Hit').should('be.visible');
    
    // Verify action chain is displayed
    cy.contains('Action Chain').should('exist');
    cy.contains('Hit → Break → Kill').should('exist');
  });

  it('should update action details', () => {
    navigateToActions();
    
    // Click on Break action
    cy.contains('[data-cy="action-list-item"]', 'Break').click();
    
    // Click edit button
    cy.get('[data-cy="edit-action-button"]').click();
    
    // Update description
    cy.get('textarea[name="description"]').clear().type('Updated: Breaking through defenses');
    
    // Update source attribute
    cy.get('select[name="source"]').select('vigor');
    
    // Save changes
    cy.contains('button', 'Update Action').click({force: true});
    
    // Verify updates
    cy.contains('Updated: Breaking through defenses').should('be.visible');
    cy.contains('Source: vigor').should('be.visible');
  });

  it('should delete an action', () => {
    navigateToActions();
    
    // Create an action to delete
    cy.get('[data-cy="create-action-button"]').click();
    cy.get('input[name="name"]').type('Action To Delete');
    cy.get('textarea[name="description"]').type('This will be deleted');
    cy.get('select[name="source"]').select('strength');
    cy.get('select[name="target"]').select('agility');
    cy.get('select[name="type"]').select('normal');
    cy.contains('button', 'Create Action').click({force: true});
    
    // Wait for redirect
    cy.url().should('include', '/actions/');
    
    // Click delete button
    cy.get('[data-cy="delete-action-button"]').click();
    
    // Confirm deletion
    cy.get('[data-cy="confirm-delete-button"]').click();
    
    // Verify redirect to action list
    cy.url().should('equal', `${Cypress.config().baseUrl}/actions`);
    
    // Verify action is not in list
    cy.contains('[data-cy="action-list-item"]', 'Action To Delete').should('not.exist');
  });

  it('should handle form validation', () => {
    navigateToActions();
    cy.get('[data-cy="create-action-button"]').click();
    
    // Try to submit without required fields
    cy.contains('button', 'Create Action').click({force: true});
    
    // Should show validation errors
    cy.contains('Name is required').should('be.visible');
    cy.contains('Source attribute is required').should('be.visible');
    cy.contains('Target attribute is required').should('be.visible');
    
    // Fill name but leave other fields empty
    cy.get('input[name="name"]').type('Invalid Action');
    cy.contains('button', 'Create Action').click({force: true});
    
    // Should still show attribute validation errors
    cy.contains('Source attribute is required').should('be.visible');
    cy.contains('Target attribute is required').should('be.visible');
  });

  it('should handle trigger action dependencies', () => {
    navigateToActions();
    cy.get('[data-cy="create-action-button"]').click();
    
    // Fill basic info
    cy.get('input[name="name"]').type('Trigger Test');
    cy.get('textarea[name="description"]').type('Testing trigger dependencies');
    cy.get('select[name="source"]').select('strength');
    cy.get('select[name="target"]').select('agility');
    
    // Select trigger type
    cy.get('select[name="type"]').select('trigger');
    
    // Verify triggered action dropdown appears
    cy.get('select[name="triggersAction"]').should('be.visible');
    
    // Verify available actions in dropdown
    cy.get('select[name="triggersAction"] option').should('have.length.greaterThan', 1);
  });
});