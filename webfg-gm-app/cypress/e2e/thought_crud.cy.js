describe('Thought CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to thoughts page', () => {
    cy.navigateToThoughts();
    cy.url().should('include', '/thoughts');
    cy.contains('Thoughts').should('be.visible');
  });

  it('should show create thought form', () => {
    cy.navigateToThoughts();
    cy.clickCreateButton();
    
    // Should navigate to thought creation page
    cy.url().should('include', '/thoughts/new');
    
    // Wait for page to fully load and check for form presence
    cy.get('body').should('contain.text', 'Create');
    
    // Should show form fields
    cy.get('input[name="name"]').should('be.visible');
    cy.get('textarea[name="description"]').should('be.visible');
    
    // Should have submit button
    cy.contains('button', 'Create Thought').should('exist');
  });

  it('should create a simple thought with basic info only', () => {
    cy.navigateToThoughts();
    cy.clickCreateButton();
    
    // Fill basic thought info
    cy.fillBasicThoughtInfo({
      name: 'Test Thought',
      description: 'This is a test thought description'
    });
    
    // Submit form and wait for navigation
    cy.contains('button', 'Create Thought').click({force: true});
    
    // Wait for GraphQL mutation and navigation
    cy.wait(3000);
    
    // Should redirect to thought detail page - be more flexible with URL matching
    cy.url({timeout: 15000}).should('match', /\/thoughts\/[a-zA-Z0-9-]+$/);
    
    // Wait for loading to complete - check that we're not in loading state
    cy.get('body').should('not.contain', 'Loading thought...');
    
    // Wait for data to load and error states to clear
    cy.get('body').should('not.contain', 'Error loading thought');
    cy.get('body').should('not.contain', 'Thought not found');
    
    // Now look for the h1 element with the thought name
    cy.get('h1', {timeout: 10000}).should('contain', 'Test Thought');
    
    // Also verify the description is shown
    cy.get('body').should('contain', 'This is a test thought description');
  });

  it('should list thoughts if any exist', () => {
    cy.navigateToThoughts();
    
    // Check if there are thoughts or empty state
    cy.get('body').then($body => {
      // Check for thoughts in both table view (tr elements) and grid view (.thought-card)
      const hasTableThoughts = $body.find('tbody tr').length > 0;
      const hasGridThoughts = $body.find('.thought-card').length > 0;
      
      if (hasTableThoughts || hasGridThoughts) {
        // Verify at least one thought exists
        if (hasTableThoughts) {
          cy.get('tbody tr').should('have.length.greaterThan', 0);
        } else {
          cy.get('.thought-card').should('have.length.greaterThan', 0);
        }
      } else {
        cy.contains('No thoughts found').should('be.visible');
      }
    });
  });

  it('should show thought details when clicking on a thought', () => {
    cy.navigateToThoughts();
    
    // Only run this test if thoughts exist
    cy.get('body').then($body => {
      if ($body.find('.thought-card').not('.add-card').length > 0) {
        cy.get('.thought-card').not('.add-card').first().click({force: true});
        cy.url().should('match', /\/thoughts\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  it('should handle navigation back to thought list', () => {
    cy.navigateToThoughts();
    cy.clickCreateButton();
    
    // Wait for form to load
    cy.wait(2000);
    
    // Navigate back using browser
    cy.go('back');
    cy.wait(2000);
    
    cy.url().should('include', '/thoughts');
    cy.url().should('not.contain', '/new');
  });
});