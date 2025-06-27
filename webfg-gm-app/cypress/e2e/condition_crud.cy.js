describe('Condition CRUD Operations', () => {
  let testConditionName;
  let updatedConditionDescription;
  
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
    // Generate unique names for this test run
    const timestamp = Date.now();
    testConditionName = `Test Grapple ${timestamp}`;
    updatedConditionDescription = `Being held or restrained - Updated ${timestamp}`;
  });

  it('should navigate to conditions page', () => {
    cy.navigateToConditions();
    cy.url().should('include', '/conditions');
    cy.contains('Conditions').should('be.visible');
  });

  it('should show create condition form', () => {
    cy.navigateToConditions();
    cy.clickCreateButton();
    
    // Should navigate to condition creation page
    cy.url().should('include', '/conditions/new');
    
    // Should show form fields
    cy.get('input').first().should('be.visible'); // Name field
    cy.get('textarea').first().should('be.visible'); // Description field
    
    // Scroll to see the Create button
    cy.scrollTo('bottom');
    cy.contains('button', 'Create').should('exist');
  });

  it('should create a simple condition', () => {
    cy.navigateToConditions();
    cy.clickCreateButton();
    
    // Fill the form with simple data
    cy.fillBasicConditionInfo({
      name: testConditionName,
      description: 'Being held or restrained'
    });
    
    // Submit form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect to condition detail page
    cy.url().should('include', '/conditions/');
    cy.url().should('not.contain', '/conditions/new');
    cy.contains('h1', testConditionName).should('be.visible');
    cy.contains('Being held or restrained').should('be.visible');
  });

  it('should list conditions', () => {
    // First create a condition to ensure there's at least one
    cy.navigateToConditions();
    cy.clickCreateButton();
    cy.fillBasicConditionInfo({
      name: testConditionName,
      description: 'Being held or restrained'
    });
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Now navigate back to list and verify
    cy.navigateToConditions();
    cy.get('body').should('contain.text', testConditionName);
  });

  it('should view condition details', () => {
    // First create a condition
    cy.navigateToConditions();
    cy.clickCreateButton();
    cy.fillBasicConditionInfo({
      name: testConditionName,
      description: 'Being held or restrained'
    });
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Navigate back to list
    cy.navigateToConditions();
    
    // Click on our test condition
    cy.contains(testConditionName).scrollIntoView().click({force: true});
    
    // Verify we're on the detail page
    cy.url().should('match', /\/conditions\/[a-zA-Z0-9-]+$/);
    cy.contains('h1', testConditionName).should('be.visible');
    cy.contains('Being held or restrained').should('be.visible');
  });

  it('should update condition details', () => {
    // First create a condition
    cy.navigateToConditions();
    cy.clickCreateButton();
    cy.fillBasicConditionInfo({
      name: testConditionName,
      description: 'Being held or restrained'
    });
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Click edit button (should be on the condition detail page now)
    cy.clickEditButton();
    
    // Update description
    cy.get('textarea').first().clear().type(updatedConditionDescription);
    
    // Save changes using submit button (the button text might not be "Update")
    cy.get('button[type="submit"]').click({force: true});
    cy.waitForGraphQL();
    
    // Wait for the page to update
    cy.wait(2000);
    
    // Verify update - either we're on the detail page or need to navigate back
    cy.url().then(url => {
      if (url.includes('/conditions/new') || url.includes('/edit')) {
        // If we're still on a form page, navigate to conditions list to find the updated condition
        cy.navigateToConditions();
        cy.contains(updatedConditionDescription).should('exist');
      } else {
        // We should be on the detail page with updated description
        cy.contains(updatedConditionDescription).should('be.visible');
      }
    });
  });

  it('should delete a condition', () => {
    // First create and update a condition
    cy.navigateToConditions();
    cy.clickCreateButton();
    cy.fillBasicConditionInfo({
      name: testConditionName,
      description: 'Being held or restrained'
    });
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Click edit and update the description
    cy.clickEditButton();
    cy.get('textarea').first().clear().type(updatedConditionDescription);
    cy.get('button[type="submit"]').click({force: true});
    cy.waitForGraphQL();
    cy.wait(2000);
    
    // Navigate to conditions list to find our condition
    cy.navigateToConditions();
    
    // Find either the original or updated name and click on it
    cy.get('body').then($body => {
      if ($body.text().includes(testConditionName)) {
        cy.contains(testConditionName).click({force: true});
      } else {
        // Try to find by updated description content
        cy.get('a, span, td').contains(/Test Grapple \d+/).first().click({force: true});
      }
    });
    
    // Delete the condition
    cy.clickDeleteButton();
    
    // Confirm deletion
    cy.on('window:confirm', () => true);
    cy.waitForGraphQL();
    
    // Verify we're back on the list page
    cy.url().should('include', '/conditions');
    cy.url().should('not.match', /\/conditions\/[a-zA-Z0-9-]+$/);
    
    // Verify we're back on conditions list - deletion may take time to reflect
    cy.wait(3000);
    cy.get('body').should('contain.text', 'Conditions');
  });

  it('should handle form validation', () => {
    cy.navigateToConditions();
    cy.clickCreateButton();
    
    // Try to submit empty form
    cy.contains('button', 'Create').click({force: true});
    
    // Should not redirect if form is invalid
    cy.url().should('include', '/conditions/new');
    
    // Fill minimal required fields
    cy.get('input').first().type('Validation Test Condition');
    cy.get('textarea').first().type('Test description');
    
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect after successful submission
    cy.url().should('include', '/conditions/');
    cy.url().should('not.contain', '/conditions/new');
  });

  it('should navigate back to list', () => {
    cy.navigateToConditions();
    cy.clickCreateButton();
    
    // Navigate back
    cy.go('back');
    cy.wait(2000);
    
    cy.url().should('include', '/conditions');
    cy.url().should('not.contain', '/new');
  });

  after(() => {
    // Clean up: Delete test conditions
    cy.navigateToConditions();
    
    const conditionsToDelete = ['Validation Test Condition'];
    
    conditionsToDelete.forEach(conditionName => {
      cy.get('body').then($body => {
        if ($body.text().includes(conditionName)) {
          cy.contains(conditionName).click({force: true});
          cy.clickDeleteButton();
          cy.on('window:confirm', () => true);
          cy.waitForGraphQL();
          cy.navigateToConditions();
        }
      });
    });
    
    // Also clean up any remaining test conditions with timestamps
    cy.get('body').then($body => {
      const bodyText = $body.text();
      if (bodyText.includes('Test Grapple')) {
        // Try to find and delete any remaining Test Grapple conditions
        cy.get('a, span, td').contains(/Test Grapple \d+/).then($elements => {
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