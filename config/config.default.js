'use strict';
const path = require('path');

exports.onerror = {
  // 5xx error will redirect to ${errorPageUrl}
  // won't redirect in local env
  errorPageUrl: '',
  // will excute `appErrorFilter` when emit an error in `app`
  // If `appErrorFilter` return false, egg-onerror won't log this error.
  // You can logging in `appErrorFilter` and return false to override the default error logging.
  appErrorFilter: null,
  // default template path
  templatePath: path.join(__dirname, '../lib/onerror_page.mustache'),
  // Set displayErrors to true, to display erros.
  // If it's not set, then use the default isProd logic for it.
  displayErrors: null,
  // Sections you want to show in error page.
  // Default to show all sections.
  displaySections: [ 'CodeFrames', 'Headers', 'Cookies', 'AppInfo' ],
};
