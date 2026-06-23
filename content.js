/**
 * DeUTC — content.js
 *
 * Entry point. Activates on any URL containing "status".
 * All logic lives in detectors.js (what to match) and walker.js (how to walk).
 */

if (window.location.href.includes('status')) {
  DeUTC.processRoot(document.body);
  DeUTC.observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });
}
