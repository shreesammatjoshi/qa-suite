/**
 * formSpecs.js
 *
 * Declares each form the AI test generator should cover. To point this
 * suite at a NEW frontend, you do not write new generation code — you add
 * a new entry here describing that form's fields and rules in plain
 * language, and the generic engine (aiCaseEngine.js) does the rest.
 *
 * Each field needs:
 *   - name        internal key, matches what you'll read in the case object
 *   - testId      the data-testid on the <input> (or checkbox)
 *   - errorTestId the data-testid on the element that shows this field's error
 *   - kind        'text' | 'checkbox'
 *   - rules       plain-English description of the validation rule(s) for
 *                 this field, INCLUDING the exact error string(s) the UI
 *                 shows. Be as precise as the real code, since the LLM only
 *                 knows what you tell it here.
 */

module.exports = [
  {
    key: 'signup',
    label: 'Sign up form',
    url: '/signup',
    submitTestId: 'signup-submit-btn',
    fields: [
      {
        name: 'fullName',
        testId: 'signup-name-input',
        errorTestId: 'signup-name-error',
        kind: 'text',
        rules:
          'Required after trimming whitespace, error "Full name is required". ' +
          'If present but shorter than 2 characters when trimmed, error "Full name is too short".',
      },
      {
        name: 'email',
        testId: 'signup-email-input',
        errorTestId: 'signup-email-error',
        kind: 'text',
        rules:
          'Required, error "Email is required". The value is trimmed of leading/trailing ' +
          'whitespace before either check runs — a value that is only whitespace-padded but ' +
          'otherwise valid will NOT show an error. If the trimmed value does not match ' +
          'local@domain.tld shape (regex /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/), error "Enter a valid email address".',
      },
      {
        name: 'password',
        testId: 'signup-password-input',
        errorTestId: 'signup-password-error',
        kind: 'text',
        rules:
          'Required, error "Password is required". If present but does not match ' +
          '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$/ (needs lowercase, uppercase, a digit, ' +
          'at least 8 chars total), error "Password needs 8+ chars, upper, lower and a number".',
      },
      {
        name: 'confirmPassword',
        testId: 'signup-confirm-input',
        errorTestId: 'signup-confirm-error',
        kind: 'text',
        rules:
          'Required, error "Please confirm your password". If present but does not exactly ' +
          'equal the password field, error "Passwords do not match".',
      },
      {
        name: 'agreeTerms',
        testId: 'signup-terms-checkbox',
        errorTestId: 'signup-terms-error',
        kind: 'checkbox',
        rules: 'Must be checked (true), otherwise error "You must accept the terms".',
      },
    ],
    fallbackCases: [
      {
        label: 'fallback: empty full name',
        fullName: '',
        email: 'fallback.user@example.com',
        password: 'Fallback1pw',
        confirmPassword: 'Fallback1pw',
        agreeTerms: true,
        expectedErrors: { fullName: 'Full name is required' },
      },
      {
        label: 'fallback: password missing a number',
        fullName: 'Fallback Person',
        email: 'fallback2@example.com',
        password: 'NoDigitsHere',
        confirmPassword: 'NoDigitsHere',
        agreeTerms: true,
        expectedErrors: { password: 'Password needs 8+ chars, upper, lower and a number' },
      },
    ],
  },
  {
    key: 'signin',
    label: 'Sign in form (negative/edge cases only)',
    url: '/signin',
    submitTestId: 'signin-submit-btn',
    // Note: no valid-login case is generated here on purpose — see README.
    negativeOnly: true,
    fields: [
      {
        name: 'email',
        testId: 'signin-email-input',
        errorTestId: 'signin-email-error',
        kind: 'text',
        rules:
          'Required, error "Email is required". The value is trimmed of leading/trailing ' +
          'whitespace before either check runs — a value that is only whitespace-padded but ' +
          'otherwise valid will NOT show an error. If the trimmed value does not match ' +
          '/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, error "Enter a valid email address".',
      },
      {
        name: 'password',
        testId: 'signin-password-input',
        errorTestId: 'signin-password-error',
        kind: 'text',
        rules:
          'Required, error "Password is required". If present but shorter than 8 ' +
          'characters, error "Password must be at least 8 characters".',
      },
    ],
    fallbackCases: [
      {
        label: 'fallback: email missing domain',
        email: 'fallback@',
        password: 'somepassword123',
        expectedErrors: { email: 'Enter a valid email address' },
      },
    ],
  },
]
