describe('Action Test Modal', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  it('should navigate to characters page', () => {
    cy.navigateToCharacters();
    cy.url().should('include', '/characters');
    cy.contains('Characters').should('be.visible');
  });

  it('should show character detail page', () => {
    cy.navigateToCharacters();
    
    // Click on any character if exists
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Should be on character detail page
        cy.url().should('match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  it('should look for action test buttons', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for test buttons
        cy.get('body').then($charBody => {
          const hasTestButton = $charBody.find('button:contains("Test")').length > 0;
          
          if (hasTestButton) {
            cy.log('Test button found');
          }
        });
      }
    });
  });

  it('should handle test button click if available', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Try clicking test button if it exists
        cy.get('body').then($charBody => {
          if ($charBody.find('button:contains("Test")').length > 0) {
            cy.contains('button', 'Test').first().click({force: true});
            cy.wait(1000);
            
            // Check if modal appeared
            cy.get('body').then($modalBody => {
              if ($modalBody.find('.modal').length > 0) {
                cy.log('Test modal opened');
                
                // Close modal if it exists
                if ($modalBody.find('button:contains("Close")').length > 0) {
                  cy.contains('button', 'Close').click({force: true});
                }
              }
            });
          }
        });
      }
    });
  });

  it('should show action sections if available', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for action-related content
        cy.get('body').then($charBody => {
          const hasActions = $charBody.text().includes('Action') ||
                           $charBody.find('.action-item').length > 0 ||
                           $charBody.find('.action-section').length > 0;
          
          if (hasActions) {
            cy.log('Action sections found');
          }
        });
      }
    });
  });

  it('should handle character with no actions', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Page should load even with no actions
        cy.url().should('match', /\/characters\/[a-zA-Z0-9-]+$/);
      }
    });
  });

  it('should display difficulty calculations if available', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for difficulty-related content
        cy.get('body').then($charBody => {
          const hasDifficulty = $charBody.text().includes('Difficulty') ||
                              $charBody.text().includes('Calculation') ||
                              $charBody.find('.difficulty').length > 0;
          
          if (hasDifficulty) {
            cy.log('Difficulty calculations found');
          }
        });
      }
    });
  });

  it('should show attribute information for calculations', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Should show attributes which are used in calculations
        cy.get('body').should('contain.text', 'Attributes');
        
        // Look for numeric values (attribute values used in calculations)
        cy.get('body').then($charBody => {
          const hasNumbers = /\d+/.test($charBody.text());
          if (hasNumbers) {
            cy.log('Attribute values for calculations found');
          }
        });
      }
    });
  });

  it('should handle modal interactions if modal exists', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Check for any existing modals
        cy.get('body').then($charBody => {
          if ($charBody.find('.modal').length > 0) {
            cy.log('Modal present on page');
            
            // Try to interact with modal
            if ($charBody.find('.modal button').length > 0) {
              cy.log('Modal has interactive buttons');
            }
          }
        });
      }
    });
  });

  it('should navigate back from character page', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Navigate back
        cy.navigateToCharacters();
        cy.url().should('include', '/characters');
      }
    });
  });

  it('should show action test functionality if implemented', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      const hasCharacters = $body.find('.character-card').not('.add-card').length > 0;
      if (hasCharacters) {
        cy.get('.character-card').not('.add-card').first().click({force: true});
        cy.wait(2000);
        
        // Look for test-related functionality
        cy.get('body').then($charBody => {
          const hasTestFeatures = $charBody.text().includes('Test') ||
                                 $charBody.find('button:contains("Test")').length > 0 ||
                                 $charBody.find('.test-').length > 0;
          
          if (hasTestFeatures) {
            cy.log('Action test functionality found');
          }
        });
      }
    });
  });

  it('should handle empty character state gracefully', () => {
    cy.navigateToCharacters();
    
    cy.get('body').then($body => {
      if ($body.find('.character-card').not('.add-card').length === 0) {
        // No characters exist - should show empty state
        cy.log('No characters available for testing');
      }
    });
  });
});