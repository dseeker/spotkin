describe('App Initialization', () => {
  it('should load the main page successfully', () => {
    cy.visit('/');
    cy.get('h1').should('contain', 'SpotKin'); // Assuming your app has an h1 with 'SpotKin'
  });
});