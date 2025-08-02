describe('Home Page', () => {
  it('should display the welcome message', () => {
    cy.visit('/');
    cy.contains('h1', 'Welcome to WEBFG GM App').should('be.visible');
  });
});
