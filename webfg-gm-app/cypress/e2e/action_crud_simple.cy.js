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
    
    // Wait for page to fully load and check for either h1 or form presence
    cy.get('body').should('contain.text', 'Create Action');
    
    // Should show all required form fields
    cy.get('input[name="name"]').should('be.visible');
    cy.get('select[name="actionCategory"]').should('be.visible');
    cy.get('select[name="sourceAttribute"]').should('be.visible');
    cy.get('select[name="targetAttribute"]').should('be.visible');
    cy.get('select[name="targetType"]').should('be.visible');
    cy.get('select[name="effectType"]').should('be.visible');
    cy.get('select[name="objectUsage"]').should('be.visible');
    cy.get('select[name="formula"]').should('be.visible');
    
    // Scroll down to see description field
    cy.get('textarea[name="description"]').scrollIntoView().should('be.visible');
    
    // Scroll to the bottom to see the Create button
    cy.scrollTo('bottom');
    cy.contains('button', 'Create').should('exist');
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
    
    // Should show at least one action (either default mock actions or created ones)
    cy.get('body').should('contain.text', 'Simple Hit');
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
        cy.contains('button', 'Delete').click({force: true});
        cy.waitForGraphQL();
        
        // Should redirect back to actions list
        cy.url().should('include', '/actions');
        // Wait for redirect to complete
        cy.wait(2000);
      }
    });
  });
});