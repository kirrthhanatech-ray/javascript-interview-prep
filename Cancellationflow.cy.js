
///<reference types="cypress"/>
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

it('login ', function () {

  cy.viewport(1100, 900)
  cy.visit('https://spponlinetest.sppinc.net/Account/Login.aspx');
  cy.get('#LoginUser_UserName').type('cypressTesting');
  cy.get('#LoginUser_Password').type('Test123@');
  cy.get('#LoginUser_LoginButton').click();
  cy.wait(1500)
  cy.visit('https://spponlinetest.sppinc.net/Contract/Summary?contractId=15602513')

})

it('Email Cancellation Form > Submit Cancellation', function () {

  cy.viewport(1100, 900)
  cy.wait(1000)
  cy.get('#quickActionsDropdown').click();
  cy.get('.dropdown-menu > #cancellationRequestFormBtn').should('be.visible').click({ force: true });
  cy.wait(1000)
  // The cancellation date has been moved off the summary modal onto the survey,
  // so the date input should no longer be present here.
  cy.get('#cancellationRequestDate').should('not.exist')
  cy.get('#btnSendCancellationRequest').click()
  cy.contains('Cancellation request email sent successfully.').should('be.visible')
})

it('Email sent successfully', function () {
  // Re-open the modal (the previous send closed it) and confirm a send with no
  // date on the modal succeeds.
  cy.get('#quickActionsDropdown').click();
  cy.get('.dropdown-menu > #cancellationRequestFormBtn').should('be.visible').click({ force: true });
  cy.wait(1000)
  cy.get('#btnSendCancellationRequest').click()
  cy.contains('Cancellation request email sent successfully.').should('be.visible')
  cy.wait(2000)
})

it('Start the email cancellation survey', function () {

    cy.contains('a', 'View Notes').then(($link) => {
    const url = $link.prop('href');
    cy.visit(url);
    cy.url().should('include', '/Contract/Notes?contractID=');
    cy.wait(1000);
    cy.contains('tr', 'Customer Cancellation Request').first().within(() => {
    cy.get('a[href*="/Customer/EmailNotes.aspx?msgid="]').invoke('removeAttr', 'target').click();
    });
    cy.wait(1000)
    cy.get(':nth-child(3) > td > a').click();
    cy.wait(1000)
  })
})

it('Start Odometer validation', function () {
    cy.wait(2000)
    cy.get('#inpOdometer').type('1000')
    cy.get('.btn').click()
    cy.contains('Please enter an odometer value between 25,064 and 1,000,000 miles')
    cy.wait(1000)
    cy.get('#inpOdometer').clear().type('100000000000000')
    cy.get('.btn').click()
    cy.contains('Please enter an odometer value between 25,064 and 1,000,000 miles')
    cy.wait(1000)
    cy.get('#inpOdometer').clear().type('30000')
    cy.wait(1000)
    // Leave a valid odometer set but stay on the confirm page - the cancellation
    // date validation test (next) exercises the date field and then advances.
  })

it('Cancellation date validation', function () {
    cy.wait(1000)
    // TODO(selector): confirm the survey cancellation-date input selector. Best
    // guess is the confirm page's native date input.
    const dateInput = () => cy.get('input[type="date"]').first()
    // TODO(selector): confirm the Continue button on the confirm page (mirrors
    // the odometer test, which uses `.btn`).
    const submit = () => cy.get('.btn').first().click()

    // Empty date is invalid.
    dateInput().clear()
    submit()
    cy.contains('Please enter a valid cancellation date').should('be.visible')
    cy.wait(500)

    // The cancellation date cannot be in the future.
    dateInput().clear().type(getFutureDate(1))
    submit()
    // TODO(message): confirm the exact future-date validation text.
    cy.contains(/cancellation date.*(cannot be in the future|future)/i).should('be.visible')
    cy.wait(500)

    // The earliest allowed date is the contract's purchase date; a date clearly
    // before it must be rejected.
    // TODO(data): use a date just before THIS contract's actual purchase date.
    dateInput().clear().type('1990-01-01')
    submit()
    // TODO(message): confirm the exact "earliest is the purchase date" text.
    cy.contains(/purchase date/i).should('be.visible')
    cy.wait(500)

    // A valid date more than 90 days in the past shows the documentation warning.
    // TODO(data): this date must also be on/after the contract's purchase date.
    dateInput().clear().type(getPastDate(100))
    cy.wait(500)
    cy.contains('The cancellation date selected is 90 days in the past. SPP will be reaching out to obtain additional documentation once your request is submitted').should('be.visible')

    // A valid, recent date clears the warning and lets the flow continue to the
    // reason/product step.
    dateInput().clear().type(getTodaysDate())
    cy.wait(500)
    cy.contains('The cancellation date selected is 90 days in the past.').should('not.exist')
    submit()
    cy.wait(3000)
  })

it('Reason and Product validation', function () {
    cy.wait(1000)
    cy.get('form > .btn').click();
    cy.wait(1000)
    cy.contains('Please select a reason for cancellation').should('be.visible')
    cy.wait(1000)
    cy.contains('At least one product must be selected for cancellation').should('be.visible') 
    cy.wait(1000)
    cy.get('#cancelReason').select('Trade-In / Sold')
    cy.wait(1000)
    cy.contains('label.fw-bold', 'Vehicle Service Contract').closest('.cancel-product-item').find('input[type="checkbox"]').check({ force: true })
    cy.wait(1000)
    cy.get('form > .btn').click()
    cy.wait(1000)
})

it('Signature and date', function () {

  cy.wait(1000)
  cy.contains('CONTINUE').click(); 
  cy.contains('Please sign in the provided field before submitting cancellation request')
  cy.contains('Invalid date')
  cy.wait(1000)
  cy.get('canvas').scrollIntoView().trigger('mousedown', 20, 20).trigger('mousemove', 100, 80).trigger('mousemove', 150, 40).trigger('mouseup', { force: true });
  cy.wait(1000)
  cy.contains('Clear Signature').click();
  cy.wait(1000)
  cy.get('canvas').scrollIntoView().trigger('mousedown', 40, 50).trigger('mousemove', 80, 100).trigger('mousemove', 40, 80).trigger('mouseup', { force: true });
  cy.wait(1000)
  cy.get('.form-control').clear().type(getTodaysDate())  
  cy.wait(1000)
  cy.contains('CONTINUE').click(); 
  cy.wait(1000)
  cy.contains('SUBMIT CANCELLATION').click()
  cy.wait(5000)

});

it('Mail Cancellation Flow', function () {

  cy.visit('https://spponlinetest.sppinc.net/Contract/Summary?contractId=15602513')
  cy.viewport(1100, 900)
  cy.get('#quickActionsDropdown').click();
  cy.get('.dropdown-menu > #cancellationRequestFormBtn').should('be.visible').click({ force: true });
  cy.wait(1000)
  cy.get('#cancellationRequestMailOption').check({ force: true });
  cy.wait(1000)
  cy.get('#productMultiSelectBtn').click()
  cy.wait(1000)
  cy.get('.dropdown-menu.show').contains('VSC').click();
  cy.get('#btnSendCancellationRequest').click()

});


it('Multiple products selection', function () {
  cy.visit('https://spponlinetest.sppinc.net/Contract/Summary?contractId=15681179')
  cy.viewport(1100, 900)
  cy.wait(1000)
  cy.get('#quickActionsDropdown').click();
  cy.get('.dropdown-menu > #cancellationRequestFormBtn').should('be.visible').click({ force: true });
  cy.wait(1000)
  // Date field is no longer on the summary modal - it's collected in the survey.
  cy.get('#btnSendCancellationRequest').click()
  cy.wait(2000)
  cy.contains('a', 'View Notes').then(($link) => {
    const url = $link.prop('href');
    cy.visit(url);
    cy.wait(1000);
    cy.contains('tr', 'Customer Cancellation Request').first().within(() => {
      cy.get('a[href*="/Customer/EmailNotes.aspx?msgid="]').invoke('removeAttr', 'target').click();
    });
    cy.wait(1000)
    cy.get(':nth-child(3) > td > a').click();
    cy.wait(2000)
  })
  cy.get('#inpOdometer').type('50000')
  // The survey confirm page now also requires the cancellation date.
  // TODO(selector): confirm the survey cancellation-date input selector.
  cy.get('input[type="date"]').first().clear().type(getTodaysDate())
  cy.get('.btn').click()
  cy.wait(1000)
  cy.get('form > .btn').click();
  cy.wait(1000)
  cy.get('#cancelReason').select('Trade-In / Sold')
  cy.wait(1000)
  cy.get('.cancel-product-item').each(($product) => {
    cy.wrap($product).find('input[type="checkbox"]').check({ force: true })
  })
  cy.wait(1000)
  cy.get('form > .btn').click()
  cy.wait(1000)
})

function getTodaysDate() {
  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-based
  const day = String(currentDate.getDate()).padStart(2, '0');
  const year = currentDate.getFullYear();
  return `${year}-${month}-${day}`;
}

function getPastDate(daysAgo) {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - daysAgo);
  const month = String(pastDate.getMonth() + 1).padStart(2, '0');
  const day = String(pastDate.getDate()).padStart(2, '0');
  const year = pastDate.getFullYear();
  return `${year}-${month}-${day}`;
}

function getFutureDate(daysAhead) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const month = String(futureDate.getMonth() + 1).padStart(2, '0');
  const day = String(futureDate.getDate()).padStart(2, '0');
  const year = futureDate.getFullYear();
  return `${year}-${month}-${day}`;
}