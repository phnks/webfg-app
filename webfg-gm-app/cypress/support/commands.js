// Navigation helpers
Cypress.Commands.add('navigateToCharacters', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/characters"]').first().click();
  cy.wait(1000);
});

Cypress.Commands.add('navigateToObjects', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/objects"]').first().click();
  cy.wait(1000);
});

Cypress.Commands.add('navigateToActions', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/actions"]').first().click();
  cy.wait(1000);
});

Cypress.Commands.add('navigateToConditions', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/conditions"]').first().click();
  cy.wait(1000);
});

Cypress.Commands.add('navigateToEncounters', () => {
  cy.get('.menu-toggle').click();
  cy.get('a[href="/encounters"]').first().click();
  cy.wait(1000);
});

// Button click helpers
Cypress.Commands.add('clickCreateButton', () => {
  // Try the sidebar + New button first, then fall back to main create button
  cy.get('body').then($body => {
    if ($body.find('.add-btn').length > 0) {
      cy.get('.add-btn').click();
    } else {
      cy.get('.create-button').click();
    }
  });
  cy.wait(500);
});

Cypress.Commands.add('clickSaveButton', () => {
  cy.get('button[type="submit"]').contains('Save').click();
  cy.wait(1000);
});

Cypress.Commands.add('clickEditButton', () => {
  cy.get('button').contains('Edit').click();
  cy.wait(500);
});

Cypress.Commands.add('clickDeleteButton', () => {
  cy.get('button').contains('Delete').click();
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
  cy.get('input[name="name"]').clear().type(object.name);
  cy.get('textarea[name="description"]').clear().type(object.description);
  cy.get('select[name="objectCategory"]').select(object.objectCategory);
});

Cypress.Commands.add('fillActionForm', (action) => {
  cy.get('input[name="name"]').clear().type(action.name);
  cy.get('textarea[name="description"]').clear().type(action.description);
  
  // Map our test data to actual form field names
  if (action.source) {
    cy.get('select[name="sourceAttribute"]').select(action.source);
  }
  if (action.target) {
    cy.get('select[name="targetAttribute"]').select(action.target);
  }
  if (action.type) {
    // Map test 'type' to actual 'effectType'
    cy.get('select[name="effectType"]').select(action.type);
  }
  
  // Handle trigger actions if the form supports them
  if (action.type === 'trigger' && action.triggersAction) {
    cy.get('body').then($body => {
      if ($body.find('select[name="triggersAction"]').length > 0) {
        cy.get('select[name="triggersAction"]').select(action.triggersAction);
      }
    });
  }
});

Cypress.Commands.add('fillBasicConditionInfo', (condition) => {
  cy.get('input').first().clear().type(condition.name); // Name field
  cy.get('textarea').first().clear().type(condition.description); // Description field
});

// Wait for GraphQL operations
Cypress.Commands.add('waitForGraphQL', () => {
  cy.wait(2000); // Give time for GraphQL operations to complete
});

// Submit form helper
Cypress.Commands.add('submitForm', () => {
  cy.get('button[type="submit"]').click();
  cy.waitForGraphQL();
});