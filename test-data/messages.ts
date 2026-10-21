/**
 * Saucedemo expected UI messages.
 * Central place for all texts that tests assert on.
*/
export const LOGIN_ERRORS = {
    lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
    invalidCredentials: 'Epic sadface: Username and password do not match any user in this service',
    usernameRequired: 'Epic sadface: Username is required',
    passwordRequired: 'Epic sadface: Password is required',
    notLoggedIn: "Epic sadface: You can only access '/inventory.html' when you are logged in.",
} as const;