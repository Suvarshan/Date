(function () {
  // Default: same-origin API (works when frontend+backend are deployed together).
  // Optional override: set window.API_BASE_URL before this file loads.
  // Example override value: https://date-backend.onrender.com
  var apiBaseUrl = window.API_BASE_URL || '';

  window.API_BASE_URL = apiBaseUrl;
  window.withApiBase = function (path) {
    if (!apiBaseUrl) return path;
    var base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    var suffix = path.startsWith('/') ? path : '/' + path;
    return base + suffix;
  };
})();
