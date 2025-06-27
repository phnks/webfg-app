describe('Simple Condition CRUD Operations', () => {
  let testConditionName;
  
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
    // Generate unique names for this test run
    const timestamp = Date.now();
    testConditionName = `Simple Test Condition ${timestamp}`;
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
      name: testConditionName,
      description: 'A simple test condition for automated testing'
    });
    
    // Submit the form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect to condition detail page
    cy.url().should('include', '/conditions/');
    cy.url().should('not.contain', '/conditions/new');
    cy.contains('h1', testConditionName).should('be.visible');
    cy.contains('A simple test condition for automated testing').should('be.visible');
  });

  it('should list conditions including the created one', () => {
    // First create a condition to ensure there's at least one
    cy.navigateToConditions();
    cy.clickCreateButton();
    cy.fillBasicConditionInfo({
      name: testConditionName,
      description: 'A simple test condition for automated testing'
    });
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Now navigate back to list and verify
    cy.navigateToConditions();
    cy.get('body').should('contain.text', testConditionName);
  });

  after(() => {
    // Clean up: Delete test conditions with timestamps
    cy.navigateToConditions();
    
    cy.get('body').then($body => {
      const bodyText = $body.text();
      if (bodyText.includes('Simple Test Condition')) {
        // Try to find and delete any remaining Simple Test Condition conditions
        cy.get('a, span, td').contains(/Simple Test Condition \d+/).then($elements => {
          if ($elements.length > 0) {
            cy.wrap($elements.first()).click({force: true});
            cy.clickDeleteButton();
            cy.on('window:confirm', () => true);
            cy.waitForGraphQL();
          }
        });
      }
    });
  });
});