describe('Simple Action CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to actions page', () => {
    cy.navigateToActions();
    cy.url().should('include', '/actions');
    cy.contains('h1', 'Actions').should('be.visible');
  });

  it('should show action creation form', () => {
    cy.navigateToActions();
    cy.clickCreateButton();
    
    // Should navigate to action creation page
    cy.url().should('include', '/actions/new');
    cy.contains('h1', 'Create Action').should('be.visible');
    
    // Should show all required form fields
    cy.get('input[name="name"]').should('be.visible');
    cy.get('textarea[name="description"]').should('be.visible');
    cy.get('select[name="actionCategory"]').should('be.visible');
    cy.get('select[name="sourceAttribute"]').should('be.visible');
    cy.get('select[name="targetAttribute"]').should('be.visible');
    cy.get('select[name="targetType"]').should('be.visible');
    cy.get('select[name="effectType"]').should('be.visible');
    cy.contains('button', 'Create').should('be.visible');
  });

  it('should create a simple action', () => {
    cy.navigateToActions();
    cy.clickCreateButton();
    
    // Fill the form with a simple action
    cy.fillActionForm({
      name: 'Simple Test Action',
      description: 'A simple test action for automated testing',
      source: 'DEXTERITY',
      target: 'AGILITY',
      type: 'DESTROY'
    });
    
    // Submit the form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect to action detail page
    cy.url().should('include', '/actions/');
    cy.url().should('not.contain', '/actions/new');
    cy.contains('h1', 'Simple Test Action').should('be.visible');
    cy.contains('A simple test action for automated testing').should('be.visible');
  });

  it('should list actions including the created one', () => {
    cy.navigateToActions();
    
    // Should show at least one action (the one we created or existing ones)
    cy.get('div').should('contain', 'Test Action').or('contain', 'Kill');
  });

  it('should handle form validation errors', () => {
    cy.navigateToActions();
    cy.clickCreateButton();
    
    // Try to submit empty form
    cy.contains('button', 'Create').click({force: true});
    
    // Should stay on the same page (not redirect)
    cy.url().should('include', '/actions/new');
    
    // Fill only name and try again
    cy.get('input[name="name"]').type('Test Action Name Only');
    cy.contains('button', 'Create').click({force: true});
    
    // Should still stay on the form (likely validation error)
    cy.url().should('include', '/actions/new');
  });

  after(() => {
    // Clean up: Delete the test action we created
    cy.navigateToActions();
    
    // Check if Simple Test Action exists and delete it
    cy.get('body').then($body => {
      if ($body.text().includes('Simple Test Action')) {
        // Find and click on the Simple Test Action
        cy.contains('Simple Test Action').click();
        
        // Delete the action
        cy.contains('button', 'Delete').click();
        cy.waitForGraphQL();
        
        // Should redirect back to actions list
        cy.url().should('include', '/actions');
        cy.url().should('not.match', /\/actions\/[a-zA-Z0-9-]+$/);
      }
    });
  });
});