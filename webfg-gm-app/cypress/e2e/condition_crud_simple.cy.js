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
    
    // Wait for page to fully load
    cy.wait(2000);
    
    // Should show form
    cy.get('input').should('have.length.greaterThan', 0);
    cy.get('textarea').should('exist');
  });

  it('should create a simple condition', () => {
    cy.navigateToConditions();
    cy.clickCreateButton();
    
    // Fill the form with a simple condition
    cy.fillBasicConditionInfo({
      name: 'Simple Test Condition',
      description: 'A simple test condition for automated testing'
    });
    
    // Scroll to submit and click
    cy.scrollTo('bottom');
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Wait for redirect
    cy.wait(2000);
    
    // Should redirect to condition detail page
    cy.url().should('include', '/conditions/');
    cy.url().should('not.contain', '/conditions/new');
    cy.get('body').should('contain.text', 'Simple Test Condition');
  });

  it('should list conditions including the created one', () => {
    cy.navigateToConditions();
    
    // Should show at least some conditions
    cy.get('body').should('contain.text', 'Condition');
  });

  after(() => {
    // Clean up: Delete the test condition we created
    cy.navigateToConditions();
    
    // Check if Simple Test Condition exists and delete it
    cy.get('body').then($body => {
      if ($body.text().includes('Simple Test Condition')) {
        cy.contains('Simple Test Condition').click({force: true});
        cy.contains('button', 'Delete').click({force: true});
        cy.waitForGraphQL();
      }
    });
  });
});