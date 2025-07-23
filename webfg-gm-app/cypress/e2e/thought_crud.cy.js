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
    
    // Wait longer for GraphQL mutation to complete
    cy.wait(5000);
    
    // Should redirect to thought detail page - be more flexible with URL matching
    cy.url({timeout: 20000}).should('match', /\/thoughts\/[a-zA-Z0-9-]+$/);
    
    // Log the actual URL for debugging
    cy.url().then(url => {
      cy.log('Current URL: ' + url);
      // Check if URL contains 'undefined' 
      if (url.includes('/thoughts/undefined')) {
        throw new Error('Navigation URL contains undefined thoughtId: ' + url);
      }
    });
    
    // First, wait for the page to finish loading (no loading text should be present)
    cy.get('body').should('not.contain', 'Loading thought...');
    
    // Check for all possible page states - loading, error, or success
    cy.get('body').then($body => {
      const bodyText = $body.text();
      cy.log('Page body text: ' + bodyText);
      
      // Check for specific error conditions
      if ($body.find('.error').length > 0) {
        const errorText = $body.find('.error').text();
        cy.log('Found error on page: ' + errorText);
        throw new Error('Page loaded with error: ' + errorText);
      }
      
      if (bodyText.includes('Thought not found')) {
        throw new Error('Thought not found - GET_THOUGHT query may be failing');
      }
      
      if (bodyText.includes('Loading thought...')) {
        cy.log('Page is still in loading state after 20+ seconds');
        throw new Error('Page stuck in loading state - GraphQL query may be hanging');
      }
      
      // Check if there's any thought-related content at all
      if (!$body.find('.thought-view').length && !$body.find('[class*="thought"]').length) {
        cy.log('No thought-related elements found on page');
        throw new Error('No thought-related elements found - ThoughtView component may not be rendered');
      }
    });
    
    // Now wait for the specific thought content - increased timeout
    cy.get('.thought-view', {timeout: 20000}).should('be.visible');
    cy.get('.thought-title h1', {timeout: 15000}).should('contain', 'Test Thought');
    
    // Verify we're on the detail page by checking for edit/delete buttons
    cy.get('button').contains('Edit').should('be.visible');
    cy.get('button').contains('Delete').should('be.visible');
    
    // Also verify the description is shown
    cy.get('.thought-description').should('contain', 'This is a test thought description');
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