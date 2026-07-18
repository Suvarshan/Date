(function () {
  // Dual mode:
  // 1) Same-origin API when frontend+backend run together.
  // 2) Explicit backend URL for split deploys (e.g., Netlify + Render).
  var explicitProductionApiBaseUrl = '';

  var isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  // Priority:
  // window.API_BASE_URL override > local same-origin > explicit production backend.
  var apiBaseUrl =
    window.API_BASE_URL ||
    (isLocal ? '' : explicitProductionApiBaseUrl);

  window.API_BASE_URL = apiBaseUrl;
  window.withApiBase = function (path) {
    if (!apiBaseUrl) return path;
    var base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    var suffix = path.startsWith('/') ? path : '/' + path;
    return base + suffix;
  };
})();
