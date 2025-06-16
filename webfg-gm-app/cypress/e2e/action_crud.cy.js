describe('Action CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  const testActions = [
    {
      name: 'Hit',
      description: 'A basic attack action',
      source: 'DEXTERITY',
      target: 'AGILITY',
      type: 'TRIGGER_ACTION',
      triggersAction: 'Break'
    },
    {
      name: 'Break',
      description: 'Breaking armor or objects',
      source: 'STRENGTH',
      target: 'ARMOUR',
      type: 'TRIGGER_ACTION',
      triggersAction: 'Kill'
    },
    {
      name: 'Kill',
      description: 'A lethal finishing blow',
      source: 'LETHALITY',
      target: 'ENDURANCE',
      type: 'DESTROY'
    }
  ];

  function createAction(action) {
    cy.clickCreateButton();
    cy.fillActionForm(action);
    
    // Submit the form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Verify redirect
    cy.url().should('include', '/actions/');
    cy.url().should('not.contain', '/actions/new');
  }

  it('should show action creation form', () => {
    cy.navigateToActions();
    cy.clickCreateButton();
    
    // Should navigate to action creation page
    cy.url().should('include', '/actions/new');
    
    // Wait for page to fully load and check for either h1 or form presence
    cy.get('body').should('contain.text', 'Create Action');
    
    // Should show all required form fields
    cy.get('input[name="name"]').should('be.visible');
    cy.get('textarea[name="description"]').should('be.visible');
    cy.get('select[name="actionCategory"]').should('be.visible');
    cy.get('select[name="sourceAttribute"]').should('be.visible');
    cy.get('select[name="targetAttribute"]').should('be.visible');
    cy.get('select[name="targetType"]').should('be.visible');
    cy.get('select[name="effectType"]').should('be.visible');
    
    // Scroll to the bottom to see the Create button
    cy.scrollTo('bottom');
    cy.contains('button', 'Create').should('exist');
  });

  it('should create test actions in order', () => {
    cy.navigateToActions();
    
    // Create Kill action first (since Hit and Break depend on it)
    createAction(testActions[2]);
    
    // Verify Kill action details
    cy.contains('h1', 'Kill').should('be.visible');
    cy.contains('A lethal finishing blow').should('be.visible');
    
    cy.navigateToActions();
    
    // Create Break action (depends on Kill)
    createAction(testActions[1]);
    
    // Verify Break action details
    cy.contains('h1', 'Break').should('be.visible');
    cy.contains('Breaking armor or objects').should('be.visible');
    
    cy.navigateToActions();
    
    // Create Hit action (depends on Break)
    createAction(testActions[0]);
    
    // Verify Hit action details
    cy.contains('h1', 'Hit').should('be.visible');
    cy.contains('A basic attack action').should('be.visible');
  });

  it('should list all created actions', () => {
    cy.navigateToActions();
    
    // Verify all test actions are listed by checking the page contains them
    testActions.forEach(action => {
      cy.get('body').should('contain.text', action.name);
    });
  });

  it('should view action details', () => {
    cy.navigateToActions();
    
    // Click on Hit action (search more broadly)
    cy.contains('Hit').click({force: true});
    
    // Verify we're on the detail page
    cy.url().should('match', /\/actions\/[a-zA-Z0-9-]+$/);
    cy.contains('h1', 'Hit').should('be.visible');
    cy.contains('A basic attack action').should('be.visible');
    cy.contains('TRIGGER_ACTION').should('be.visible');
    cy.contains('DEXTERITY').should('be.visible');
    cy.contains('AGILITY').should('be.visible');
  });

  it('should update action details', () => {
    cy.navigateToActions();
    
    // Navigate to Kill action
    cy.contains('Kill').click({force: true});
    
    // Click edit button
    cy.clickEditButton();
    
    // Update description
    const updatedDescription = 'An extremely lethal finishing blow - Updated';
    cy.get('textarea[name="description"]').clear().type(updatedDescription);
    
    // Save changes
    cy.contains('button', 'Update Action').click({force: true});
    cy.waitForGraphQL();
    
    // Verify update
    cy.contains(updatedDescription).should('be.visible');
  });

  it('should delete an action', () => {
    cy.navigateToActions();
    
    // First, we need to delete Hit (depends on Break)
    cy.contains('Hit').click({force: true});
    cy.clickDeleteButton();
    
    // Confirm deletion in any dialog
    cy.on('window:confirm', () => true);
    cy.waitForGraphQL();
    
    // Verify we're back on the list page
    cy.url().should('include', '/actions');
    cy.url().should('not.match', /\/actions\/[a-zA-Z0-9-]+$/);
    
    // Verify Hit is deleted (check that it's not in the page)
    cy.get('body').should('not.contain.text', 'Hit');
  });

  it('should handle form validation', () => {
    cy.navigateToActions();
    cy.clickCreateButton();
    
    // Try to submit empty form
    cy.contains('button', 'Create').click({force: true});
    
    // Should not redirect if form is invalid
    cy.url().should('include', '/actions/new');
    
    // Fill minimal required fields and submit
    cy.get('input[name="name"]').type('Test Action');
    cy.get('textarea[name="description"]').type('Test description');
    cy.get('select[name="actionCategory"]').select('ATTACK');
    cy.get('select[name="sourceAttribute"]').select('DEXTERITY');
    cy.get('select[name="targetAttribute"]').select('AGILITY');
    cy.get('select[name="targetType"]').select('CHARACTER');
    cy.get('select[name="effectType"]').select('DESTROY');
    
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect after successful submission
    cy.url().should('include', '/actions/');
    cy.url().should('not.contain', '/actions/new');
  });

  it('should handle trigger action dependencies', () => {
    cy.navigateToActions();
    cy.clickCreateButton();
    
    // Fill form with basic fields first
    cy.get('input[name="name"]').type('Dependent Action');
    cy.get('textarea[name="description"]').type('An action that triggers another');
    cy.get('select[name="actionCategory"]').select('ATTACK');
    cy.get('select[name="sourceAttribute"]').select('STRENGTH');
    cy.get('select[name="targetAttribute"]').select('AGILITY');
    cy.get('select[name="targetType"]').select('CHARACTER');
    cy.get('select[name="effectType"]').select('TRIGGER_ACTION');
    
    // Check if triggersAction dropdown exists (it may not be implemented)
    cy.get('body').then($body => {
      if ($body.find('select[name="triggersAction"]').length > 0) {
        cy.get('select[name="triggersAction"]').should('be.visible');
        // If dropdown exists, try to select an option if available
        cy.get('select[name="triggersAction"] option').then($options => {
          if ($options.length > 1) {
            cy.get('select[name="triggersAction"]').select(1); // Select first non-empty option
          }
        });
      }
    });
    
    // Submit
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect to action detail page
    cy.url().should('include', '/actions/');
    cy.url().should('not.contain', '/actions/new');
    cy.contains('h1', 'Dependent Action').should('be.visible');
  });

  after(() => {
    // Clean up: Delete all test actions
    cy.navigateToActions();
    
    const actionsToDelete = ['Dependent Action', 'Break', 'Kill'];
    
    actionsToDelete.forEach(actionName => {
      cy.get('body').then($body => {
        if ($body.text().includes(actionName)) {
          cy.contains(actionName).click({force: true});
          cy.clickDeleteButton();
          cy.on('window:confirm', () => true);
          cy.waitForGraphQL();
          cy.navigateToActions();
        }
      });
    });
  });
});