// Navigation helpers
Cypress.Commands.add('navigateToCharacters', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/characters"]').first().click({force: true});
  
  // Longer waits for CI environment
  const isCI = Cypress.env('CI') || Cypress.config('isInteractive') === false;
  const waitTime = isCI ? 4000 : 2000;
  cy.wait(waitTime);
  
  // Ensure menu is closed by clicking somewhere else if it's still open
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click({force: true});
    }
  });
});

Cypress.Commands.add('navigateToObjects', () => {
  // Dismiss any error popups that might be blocking navigation
  cy.get('body').then($body => {
    if ($body.find('.error-popup').length > 0) {
      cy.get('.error-popup').within(() => {
        cy.get('button').contains('Close').click({force: true});
      });
      cy.wait(500);
    }
  });
  
  cy.get('.menu-toggle').click({force: true});
  cy.get('a[href="/objects"]').first().click({force: true});
  
  const isCI = Cypress.env('CI') || Cypress.config('isInteractive') === false;
  const waitTime = isCI ? 4000 : 2000;
  cy.wait(waitTime);
  
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click({force: true});
    }
  });
});

Cypress.Commands.add('navigateToActions', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/actions"]').first().click({force: true});
  
  const isCI = Cypress.env('CI') || Cypress.config('isInteractive') === false;
  const waitTime = isCI ? 4000 : 2000;
  cy.wait(waitTime);
  
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click({force: true});
    }
  });
});

Cypress.Commands.add('navigateToConditions', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/conditions"]').first().click({force: true});
  
  const isCI = Cypress.env('CI') || Cypress.config('isInteractive') === false;
  const waitTime = isCI ? 4000 : 2000;
  cy.wait(waitTime);
  
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click({force: true});
    }
  });
});

Cypress.Commands.add('navigateToEncounters', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/encounters"]').first().click();
  
  const isCI = Cypress.env('CI') || Cypress.config('isInteractive') === false;
  const waitTime = isCI ? 4000 : 2000;
  cy.wait(waitTime);
  
  cy.get('body').then($body => {
    if ($body.find('.menu-toggle[aria-expanded="true"]').length > 0) {
      cy.get('main').click();
    }
  });
});

// Button click helpers
Cypress.Commands.add('clickCreateButton', () => {
  // Check what page we're on and click the appropriate create button
  cy.url().then(url => {
    if (url.includes('/actions')) {
      // On actions page - click either sidebar "+ New" or main "Create New Action"
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else {
          cy.contains('button', 'Create New Action').click();
        }
      });
    } else if (url.includes('/characters')) {
      // On characters page
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else {
          cy.contains('button', 'Create New Character').click();
        }
      });
    } else if (url.includes('/objects')) {
      // On objects page
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else {
          cy.contains('button', 'Create New Object').click();
        }
      });
    } else if (url.includes('/conditions')) {
      // On conditions page
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else {
          cy.contains('button', 'Create New Condition').click();
        }
      });
    } else {
      // Fallback - try to find any create button
      cy.get('body').then($body => {
        if ($body.find('.add-btn').length > 0) {
          cy.get('.add-btn').click();
        } else if ($body.find('button:contains("Create")').length > 0) {
          cy.get('button:contains("Create")').first().click();
        }
      });
    }
  });
  cy.wait(500);
});

Cypress.Commands.add('clickSaveButton', () => {
  cy.get('button[type="submit"]').contains('Save').click();
  cy.wait(1000);
});

Cypress.Commands.add('clickEditButton', () => {
  // Try the new action-buttons structure first, then fallback to old structure
  cy.get('body').then($body => {
    if ($body.find('.action-buttons .edit-button').length > 0) {
      cy.get('.action-buttons .edit-button').first().click({force: true});
    } else {
      cy.get('button').contains('Edit').click({force: true});
    }
  });
  cy.wait(500);
});

Cypress.Commands.add('clickDeleteButton', () => {
  // Dismiss any error popups that might be blocking the delete button
  cy.get('body').then($body => {
    if ($body.find('.error-popup').length > 0) {
      cy.get('.error-popup').within(() => {
        cy.get('button').contains('Close').click({force: true});
      });
      cy.wait(500);
    }
  });
  
  // Try the new action-buttons structure first, then fallback to old structure
  cy.get('body').then($body => {
    if ($body.find('.action-buttons .delete-button').length > 0) {
      cy.get('.action-buttons .delete-button').first().click({force: true});
    } else {
      cy.get('button').contains('Delete').click({force: true});
    }
  });
  cy.wait(500);
});

Cypress.Commands.add('clickCancelButton', () => {
  cy.get('button').contains('Cancel').click();
  cy.wait(500);
});

// Simplified form helpers that work with actual UI
Cypress.Commands.add('fillBasicCharacterInfo', (character) => {
  // Fill only basic fields that have proper selectors
  cy.get('input').first().clear().type(character.name); // Name field
  cy.get('select').first().select(character.category); // Category dropdown
});

Cypress.Commands.add('fillBasicObjectInfo', (object) => {
  // Wait for form to be ready
  cy.get('input[name="name"]').should('be.visible');
  
  cy.get('input[name="name"]').clear().type(object.name);
  
  // Object form doesn't have description field, only name and category
  if (object.objectCategory) {
    cy.get('select[name="objectCategory"]').select(object.objectCategory);
  } else {
    // Default to first available option if not specified
    cy.get('select[name="objectCategory"]').select(0);
  }
  
  // Wait a moment for all form fields to be filled
  const isCI = Cypress.env('CI') || Cypress.config('isInteractive') === false;
  const waitTime = isCI ? 3000 : 1000;
  cy.wait(waitTime);
});

Cypress.Commands.add('fillActionForm', (action) => {
  // Wait for form to be ready and scroll to top to start
  cy.scrollTo('top');
  cy.get('input[name="name"]').should('be.visible');
  
  // Fill name field
  cy.get('input[name="name"]').clear().type(action.name);
  
  // Fill dropdown fields in the middle section
  // Fill required Category field - default to ATTACK if not specified
  if (action.category) {
    cy.get('select[name="actionCategory"]').select(action.category);
  } else {
    cy.get('select[name="actionCategory"]').select('ATTACK');
  }
  
  // Map our test data to actual form field names
  if (action.source) {
    cy.get('select[name="sourceAttribute"]').select(action.source);
  }
  if (action.target) {
    cy.get('select[name="targetAttribute"]').select(action.target);
  }
  
  // Fill required Target Type field - default to CHARACTER if not specified
  if (action.targetType) {
    cy.get('select[name="targetType"]').select(action.targetType);
  } else {
    cy.get('select[name="targetType"]').select('CHARACTER');
  }
  
  if (action.type) {
    // Map test 'type' to actual 'effectType'
    cy.get('select[name="effectType"]').select(action.type);
  }
  
  // Scroll down to make the description field visible and fill it
  cy.get('textarea[name="description"]').scrollIntoView().should('be.visible');
  cy.get('textarea[name="description"]').clear().type(action.description);
  
  // Wait a moment for all form fields to be filled
  const isCI = Cypress.env('CI') || Cypress.config('isInteractive') === false;
  const waitTime = isCI ? 3000 : 1000;
  cy.wait(waitTime);
  
  // Handle trigger actions if the form supports them
  if (action.type === 'TRIGGER_ACTION' && action.triggersAction) {
    cy.get('body').then($body => {
      if ($body.find('select[name="triggersAction"]').length > 0) {
        cy.get('select[name="triggersAction"]').select(action.triggersAction);
      }
    });
  }
});

Cypress.Commands.add('fillBasicConditionInfo', (condition) => {
  // Wait for form to be ready
  cy.get('input[name="name"]').should('be.visible');
  
  // Fill name field (required)
  cy.get('input[name="name"]').clear().type(condition.name);
  
  // Fill description field (optional but commonly provided)
  if (condition.description) {
    cy.get('textarea[name="description"]').clear().type(condition.description);
  }
  
  // Fill category field (required, has default but let's be explicit)
  if (condition.conditionCategory) {
    cy.get('select[name="conditionCategory"]').select(condition.conditionCategory);
  } else {
    // Default to first available option if not specified
    cy.get('select[name="conditionCategory"]').select(0);
  }
  
  // Fill type field (required, has default but let's be explicit)
  if (condition.conditionType) {
    cy.get('select[name="conditionType"]').select(condition.conditionType);
  } else {
    // Default to first available option if not specified
    cy.get('select[name="conditionType"]').select(0);
  }
  
  // Fill target attribute field (required, has default but let's be explicit)
  if (condition.conditionTarget) {
    cy.get('select[name="conditionTarget"]').select(condition.conditionTarget);
  } else {
    // Default to first available option if not specified
    cy.get('select[name="conditionTarget"]').select(0);
  }
  
  // Wait a moment for all form fields to be filled
  const isCI = Cypress.env('CI') || Cypress.config('isInteractive') === false;
  const waitTime = isCI ? 3000 : 1000;
  cy.wait(waitTime);
});

// Wait for GraphQL operations
Cypress.Commands.add('waitForGraphQL', () => {
  // Longer waits for CI environment vs local development
  const isCI = Cypress.env('CI') || Cypress.config('isInteractive') === false;
  const waitTime = isCI ? 8000 : 4000; // Double the wait time in CI
  cy.wait(waitTime);
});

// Submit form helper
Cypress.Commands.add('submitForm', () => {
  cy.get('button[type="submit"]').click();
  cy.waitForGraphQL();
});