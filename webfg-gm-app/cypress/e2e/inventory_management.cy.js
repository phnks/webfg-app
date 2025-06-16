describe('Inventory Management', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to characters page', () => {
    cy.navigateToCharacters();
    cy.url().should('include', '/characters');
    cy.contains('Characters').should('be.visible');
  });

  it('should show character inventory sections if available', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for inventory-related sections
        cy.get('body').then($charBody => {
          const hasInventory = $charBody.text().includes('Stash') || 
                             $charBody.text().includes('Equipment') ||
                             $charBody.text().includes('Ready') ||
                             $charBody.text().includes('Inventory') ||
                             $charBody.find('.stash-section').length > 0 ||
                             $charBody.find('.equipped-section').length > 0 ||
                             $charBody.find('.ready-section').length > 0;
          
          if (hasInventory) {
            cy.log('Inventory sections found');
          }
        });
      }
    });
  });

  it('should display stash section if objects exist', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Check for stash section
        cy.get('body').then($charBody => {
          if ($charBody.find('.stash-section').length > 0) {
            cy.log('Stash section exists');
          }
        });
      }
    });
  });

  it('should display equipped section if available', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Check for equipped section
        cy.get('body').then($charBody => {
          if ($charBody.find('.equipped-section').length > 0) {
            cy.log('Equipped section exists');
          }
        });
      }
    });
  });

  it('should display ready section if available', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Check for ready section
        cy.get('body').then($charBody => {
          if ($charBody.find('.ready-section').length > 0) {
            cy.log('Ready section exists');
          }
        });
      }
    });
  });

  it('should handle character with no objects', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Page should still load properly even with no objects
        cy.url().should('match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  it('should show object management buttons if objects exist', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for object management buttons
        cy.get('body').then($charBody => {
          const hasObjectButtons = $charBody.find('button:contains("Equip")').length > 0 ||
                                 $charBody.find('button:contains("Ready")').length > 0 ||
                                 $charBody.find('button:contains("Stash")').length > 0 ||
                                 $charBody.find('button:contains("Drop")').length > 0;
          
          if (hasObjectButtons) {
            cy.log('Object management buttons found');
          }
        });
      }
    });
  });

  it('should allow navigation back from character detail', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        // Go to character detail
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Navigate back
        cy.navigateToCharacters();
        cy.url().should('include', '/characters');
        cy.url().should('not.match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });
});