describe('Condition CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
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
      name: 'Test Grapple',
      description: 'Being held or restrained'
    });
    
    // Submit form
    cy.contains('button', 'Create').click({force: true});
    cy.waitForGraphQL();
    
    // Should redirect to condition detail page
    cy.url().should('include', '/conditions/');
    cy.url().should('not.contain', '/conditions/new');
    cy.contains('h1', 'Test Grapple').should('be.visible');
    cy.contains('Being held or restrained').should('be.visible');
  });

  it('should list conditions', () => {
    cy.navigateToConditions();
    
    // Should show at least one condition (the one we created)
    cy.get('body').should('contain.text', 'Test Grapple');
  });

  it('should view condition details', () => {
    cy.navigateToConditions();
    
    // Click on Test Grapple condition
    cy.contains('Test Grapple').click({force: true});
    
    // Verify we're on the detail page
    cy.url().should('match', /\/conditions\/[a-zA-Z0-9-]+$/);
    cy.contains('h1', 'Test Grapple').should('be.visible');
    cy.contains('Being held or restrained').should('be.visible');
  });

  it('should update condition details', () => {
    cy.navigateToConditions();
    
    // Navigate to Test Grapple condition
    cy.contains('Test Grapple').click({force: true});
    
    // Click edit button
    cy.clickEditButton();
    
    // Update description
    const updatedDescription = 'Being held or restrained - Updated';
    cy.get('textarea').first().clear().type(updatedDescription);
    
    // Save changes
    cy.contains('button', 'Update').click({force: true});
    cy.waitForGraphQL();
    
    // Verify update
    cy.contains(updatedDescription).should('be.visible');
  });

  it('should delete a condition', () => {
    cy.navigateToConditions();
    
    // Navigate to Test Grapple condition
    cy.contains('Test Grapple').click({force: true});
    cy.clickDeleteButton();
    
    // Confirm deletion
    cy.on('window:confirm', () => true);
    cy.waitForGraphQL();
    
    // Verify we're back on the list page
    cy.url().should('include', '/conditions');
    cy.url().should('not.match', /\/conditions\/[a-zA-Z0-9-]+$/);
    
    // Verify condition is deleted
    cy.wait(2000);
    cy.get('body').then($body => {
      const hasTestGrapple = $body.text().includes('Test Grapple');
      expect(hasTestGrapple).to.be.false;
    });
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
    // Clean up: Delete test condition if it exists
    cy.navigateToConditions();
    
    cy.get('body').then($body => {
      if ($body.text().includes('Validation Test Condition')) {
        cy.contains('Validation Test Condition').click({force: true});
        cy.clickDeleteButton();
        cy.on('window:confirm', () => true);
        cy.waitForGraphQL();
      }
    });
  });
});