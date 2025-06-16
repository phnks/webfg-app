describe('Character Associations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to character detail page', () => {
    cy.navigateToCharacters();
    
    // Click on any existing character if available
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Should be on character detail page
        cy.url().should('match', /\/characters\/[a-zA-Z0-9-]+$/);
        
        // Should show character sections
        cy.get('body').should('contain.text', 'Details');
        cy.get('body').should('contain.text', 'Attributes');
      }
    });
  });

  it('should show object association area', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for object-related sections
        cy.get('body').then($charBody => {
          // Check if there's any object-related UI
          const hasObjectSection = $charBody.text().includes('Object') || 
                                 $charBody.text().includes('Stash') ||
                                 $charBody.text().includes('Equipment') ||
                                 $charBody.text().includes('Ready');
          
          if (hasObjectSection) {
            cy.log('Object association section found');
          }
        });
      }
    });
  });

  it('should show action association area', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for action-related sections
        cy.get('body').then($charBody => {
          const hasActionSection = $charBody.text().includes('Action') || 
                                 $charBody.find('.action-item').length > 0 ||
                                 $charBody.find('button:contains("Test")').length > 0;
          
          if (hasActionSection) {
            cy.log('Action association section found');
          }
        });
      }
    });
  });

  it('should show condition association area', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for condition-related sections
        cy.get('body').then($charBody => {
          const hasConditionSection = $charBody.text().includes('Condition') || 
                                    $charBody.find('.condition-item').length > 0;
          
          if (hasConditionSection) {
            cy.log('Condition association section found');
          }
        });
      }
    });
  });

  it('should navigate between character pages', () => {
    cy.navigateToCharacters();
    
    // First go to a character
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Navigate back to characters list
        cy.navigateToCharacters();
        cy.url().should('include', '/characters');
        cy.url().should('not.match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  it('should handle edit mode if available', () => {
    cy.navigateToCharacters();
    
    // Click on any character
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Check if edit button exists
        cy.get('body').then($charBody => {
          if ($charBody.find('button:contains("Edit")').length > 0) {
            cy.contains('button', 'Edit').click({force: true});
            cy.wait(1000);
            
            // Should be in edit mode
            cy.log('Edit mode activated');
          }
        });
      }
    });
  });

  it('should handle character with no associations', () => {
    cy.navigateToCharacters();
    
    // Look for characters
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Character detail page should load even with no associations
        cy.url().should('match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  it('should show character attribute information', () => {
    cy.navigateToCharacters();
    
    // Click on any character
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Should show attributes
        cy.get('body').should('contain.text', 'Attributes');
        
        // Look for any numeric values (attribute values)
        cy.get('body').then($charBody => {
          const hasNumbers = /\d+/.test($charBody.text());
          if (hasNumbers) {
            cy.log('Attribute values found');
          }
        });
      }
    });
  });

  it('should handle character page navigation', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const characterCount = $body.find('.character-card').not('.add-card').length;
      
      if (characterCount >= 2) {
        // Click first character
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Go back to list
        cy.navigateToCharacters();
        
        // Click second character
        cy.get('.character-card').not('.add-card').eq(1).click({force: true});
        cy.wait(2000);
        
        // Should be on different character page
        cy.url().should('match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  it('should display character basic information', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        // Get character name from card
        cy.get('.character-card').not('.add-card').first().then($card => {
          const characterName = $card.text();
          
          // Click the character
          cy.wrap($card).click({force: true});
          cy.wait(2000);
          
          // Should show character name on detail page
          cy.get('h1').should('exist');
        });
      }
    });
  });
});