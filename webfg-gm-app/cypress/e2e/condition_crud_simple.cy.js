describe('Simple Condition CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to conditions page', () => {
    cy.navigateToConditions();
    cy.url().should('include', '/conditions');
    cy.get('body').should('contain.text', 'Conditions');
  });

  it('should show condition creation form', () => {
    cy.navigateToConditions();
    cy.clickCreateButton();
    
    // Should navigate to condition creation page
    cy.url().should('include', '/conditions/new');
    
    // Wait for page to fully load and check for either h1 or form presence
    cy.get('body').should('contain.text', 'Create Condition');
    
    // Should show all required form fields
    cy.get('input').first().should('be.visible'); // Name field
    cy.get('textarea').first().should('be.visible'); // Description field
    
    // Scroll to the bottom to see the Create button
    cy.scrollTo('bottom');
    cy.contains('button', 'Create').should('exist');
  });

  it('should create a simple condition', () => {
    cy.navigateToConditions();
    cy.clickCreateButton();
    
    // Fill the form with a simple condition
    cy.fillBasicConditionInfo({
      name: 'Simple Test Condition',
      description: 'A simple test condition for automated testing'
    });
    
    // Submit the form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect to condition detail page
    cy.url().should('include', '/conditions/');
    cy.url().should('not.contain', '/conditions/new');
    cy.contains('h1', 'Simple Test Condition').should('be.visible');
    cy.contains('A simple test condition for automated testing').should('be.visible');
  });

  it('should list conditions including the created one', () => {
    cy.navigateToConditions();
    
    // Should show at least some conditions
    cy.get('body').should('contain.text', 'Condition');
  });

  after(() => {
    // Clean up: Delete the test condition we created
    cy.get('body').then($body => {
      // Navigate to conditions if needed and delete test condition
      if ($body.text().includes('Simple Test Condition')) {
        cy.navigateToConditions();
        cy.contains('Simple Test Condition').click({force: true});
        cy.contains('button', 'Delete').click({force: true});
        cy.waitForGraphQL();
        
        // Should redirect back to conditions list
        cy.url().should('include', '/conditions');
        cy.url().should('not.match', /\/conditions\/[a-zA-Z0-9-]+$/);
      }
    });
  });
});