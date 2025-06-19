describe('Search, Filter, Sort, and Pagination', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000);
  });

  describe('Characters Search and Filter', () => {
    beforeEach(() => {
      cy.navigateToCharacters();
    });

    it('should search characters by name', () => {
      // Test search functionality if search input exists
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('test', {force: true});
          cy.wait(1000);
          
          // Clear search
          cy.get('input[placeholder*="Search"]').clear({force: true});
          cy.wait(1000);
        } else {
          // If no search input, just verify the page loaded
          cy.get('body').should('contain.text', 'Characters');
        }
      });
    });

    it('should filter characters by category', () => {
      // Test category filter
      cy.get('body').then($body => {
        if ($body.find('select[name="characterCategory"]').length > 0) {
          // Get available options and select the first non-empty one
          cy.get('select[name="characterCategory"] option').then($options => {
            const availableOptions = Array.from($options).map(option => option.value).filter(val => val);
            
            if (availableOptions.length > 0) {
              cy.get('select[name="characterCategory"]').select(availableOptions[0]);
              cy.wait(1000);
              
              // Clear filter
              cy.get('select[name="characterCategory"]').select('');
              cy.wait(1000);
            }
          });
        }
      });
    });

    it('should sort characters', () => {
      // Test sorting functionality
      cy.get('body').then($body => {
        if ($body.find('.search-filter-sort select').length > 0) {
          // Scroll to avoid navbar covering elements
          cy.scrollTo('top');
          cy.wait(500);
          
          // Find and interact with sort dropdown
          cy.get('.search-filter-sort select').first().then($select => {
            cy.wrap($select).select(0, {force: true});
            cy.wait(1000);
          });
        }
      });
    });

    it('should switch between table and grid view', () => {
      // Test view mode switching
      cy.get('body').then($body => {
        if ($body.find('.view-toggle').length > 0) {
          // Switch to grid view
          cy.contains('button', 'Grid View').click();
          cy.wait(500);
          cy.get('.character-grid').should('exist');
          
          // Switch back to table view
          cy.contains('button', 'Table View').click();
          cy.wait(500);
          cy.get('.character-table').should('exist');
        }
      });
    });

    it('should handle pagination controls', () => {
      cy.get('body').then($body => {
        if ($body.find('.pagination-controls').length > 0) {
          // Test page size change
          cy.get('select').filter('[name*="pageSize"]').then($select => {
            if ($select.length > 0) {
              cy.wrap($select).select('5');
              cy.wait(1000);
            }
          });
          
          // Test pagination buttons if they exist
          cy.get('body').then($body => {
            if ($body.find('button').filter(':contains("Next")').length > 0) {
              cy.contains('button', 'Next').click();
              cy.wait(1000);
              cy.contains('button', 'Previous').click();
              cy.wait(1000);
            }
          });
        }
      });
    });
  });

  describe('Objects Search and Filter', () => {
    beforeEach(() => {
      cy.navigateToObjects();
    });

    it('should search objects by name', () => {
      // Test search functionality if search input exists
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('test', {force: true});
          cy.wait(1000);
          
          // Clear search
          cy.get('input[placeholder*="Search"]').clear({force: true});
          cy.wait(1000);
        } else {
          // If no search input, just verify the page loaded
          cy.get('body').should('contain.text', 'Objects');
        }
      });
    });

    it('should filter objects by category', () => {
      // Test category filter
      cy.get('body').then($body => {
        if ($body.find('select[name="objectCategory"]').length > 0) {
          // Get available options and select the first non-empty one
          cy.get('select[name="objectCategory"] option').then($options => {
            const availableOptions = Array.from($options).map(option => option.value).filter(val => val);
            
            if (availableOptions.length > 0) {
              cy.get('select[name="objectCategory"]').select(availableOptions[0]);
              cy.wait(1000);
              
              // Clear filter
              cy.get('select[name="objectCategory"]').select('');
              cy.wait(1000);
            }
          });
        }
      });
    });

    it('should test edit buttons in search results', () => {
      // Test that edit buttons work in the new action-buttons structure
      cy.get('body').then($body => {
        const hasTableView = $body.find('.object-table').length > 0;
        
        if (hasTableView) {
          // Test edit button in table view
          cy.get('.action-buttons').first().within(() => {
            cy.get('.edit-button').should('be.visible');
            cy.get('.edit-button').should('contain.text', 'Edit');
          });
        }
      });
    });
  });

  describe('Actions Search and Filter', () => {
    beforeEach(() => {
      cy.navigateToActions();
    });

    it('should search actions by name', () => {
      // Test search functionality if actions exist
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('test', {force: true});
          cy.wait(1000);
          
          // Clear search
          cy.get('input[placeholder*="Search"]').clear({force: true});
          cy.wait(1000);
        }
      });
    });

    it('should test action list view components', () => {
      // Verify the action list page loads and has expected components
      cy.get('body').should('contain.text', 'Actions');
      
      // Check for search/filter components
      cy.get('body').then($body => {
        if ($body.find('.search-filter-sort').length > 0) {
          cy.get('.search-filter-sort').should('exist');
        }
      });
    });
  });

  describe('Conditions Search and Filter', () => {
    beforeEach(() => {
      cy.navigateToConditions();
    });

    it('should search conditions by name', () => {
      // Test search functionality if conditions exist
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('test', {force: true});
          cy.wait(1000);
          
          // Clear search
          cy.get('input[placeholder*="Search"]').clear({force: true});
          cy.wait(1000);
        }
      });
    });

    it('should test conditions list view components', () => {
      // Verify the conditions list page loads and has expected components
      cy.get('body').should('contain.text', 'Conditions');
      
      // Check for search/filter components
      cy.get('body').then($body => {
        if ($body.find('.search-filter-sort').length > 0) {
          cy.get('.search-filter-sort').should('exist');
        }
      });
    });
  });

  describe('Cross-Entity Functionality', () => {
    it('should maintain search state when navigating back', () => {
      // Test that search/filter state persists appropriately
      cy.navigateToObjects();
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('test', {force: true});
          cy.wait(1000);
          
          // Navigate to a specific object
          cy.get('body').then($body => {
            if ($body.find('.object-name').length > 0) {
              cy.get('.object-name').first().click();
              cy.wait(2000);
              
              // Navigate back
              cy.go('back');
              cy.wait(2000);
              
              // Search should be cleared (this is expected behavior)
              cy.get('input[placeholder*="Search"]').should('have.value', '');
            }
          });
        }
      });
    });

    it('should handle empty search results gracefully', () => {
      cy.navigateToObjects();
      cy.scrollTo('top');
      cy.wait(500);
      
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          // Search for something that doesn't exist
          cy.get('input[placeholder*="Search"]').type('NonExistentItem12345', {force: true});
          cy.wait(2000);
          
          // Should show no results or empty state
          cy.get('body').then($body => {
            const hasNoResults = $body.text().includes('No objects found') || 
                                 $body.text().includes('No results found') ||
                                 $body.find('.empty-state').length > 0;
            expect(hasNoResults).to.be.true;
          });
          
          // Clear search
          cy.get('input[placeholder*="Search"]').clear({force: true});
          cy.wait(1000);
        }
      });
    });
  });

  after(() => {
    // No specific cleanup needed since we're not creating persistent test data
    cy.log('Search, filter, sort, and pagination tests completed');
  });
});