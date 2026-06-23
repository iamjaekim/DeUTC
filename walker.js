/**
 * DeUTC — walker.js
 *
 * Generic DOM walker and MutationObserver.
 * Reads detectors from DeUTC.DETECTORS (defined in detectors.js).
 *
 * Strategy:
 *   1. scanElements() — uses querySelectorAll to instantly find element-based
 *      matches (e.g. <time datetime="">). Fast and exact.
 *   2. walkNode()     — depth-first DOM walk for text-based regex detectors.
 *      Always recurses into children first to tag the deepest (most specific)
 *      matching element, so the converted time appears right next to the original.
 *   3. MutationObserver — repeats both strategies on any new nodes added by
 *      React/Next.js after the initial page load.
 *
 * Flicker-free: converted times are written to a `data-deutc-time` attribute.
 * CSS `::after` renders the value visually. The DOM tree structure is never
 * modified, so React's virtual DOM is never invalidated.
 */

// Tracks every already-tagged element — O(1) lookup, no memory leaks
DeUTC.processed = new WeakSet();


// ─── Helpers ──────────────────────────────────────────────────────────────────

function tagElement(el, converted, markerClass) {
  el.setAttribute('data-deutc-time', converted);
  el.classList.add(markerClass);
  DeUTC.processed.add(el);
}


// ─── Element-based scan ───────────────────────────────────────────────────────

function scanElements(root) {
  for (const detector of DeUTC.DETECTORS) {
    if (!detector.matchElement) continue;

    // <time> is the only element detector today, but this loop handles any future ones
    const selector = detector.name === 'time-element' ? 'time[datetime]' : '*';
    const candidates = root.querySelectorAll ? root.querySelectorAll(selector) : [];

    for (const el of candidates) {
      if (DeUTC.processed.has(el)) continue;
      if (!detector.matchElement(el)) continue;
      const converted = detector.convert(el);
      if (converted) tagElement(el, converted, detector.markerClass);
    }
  }
}


// ─── Text-based depth-first walk ──────────────────────────────────────────────

function walkNode(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') return;
  if (DeUTC.processed.has(node)) return;

  const text = node.textContent || '';

  for (const detector of DeUTC.DETECTORS) {
    if (!detector.regex) continue; // element detectors handled by scanElements()

    detector.regex.lastIndex = 0;
    if (!detector.regex.test(text)) continue;
    detector.regex.lastIndex = 0;

    // Recurse into children first — we want to tag the deepest matching element
    let handledByChild = false;
    for (const child of node.children) {
      detector.regex.lastIndex = 0;
      if (detector.regex.test(child.textContent || '')) {
        walkNode(child);
        handledByChild = true;
      }
    }
    detector.regex.lastIndex = 0;

    // Tag this node only if no child already matched (i.e. this is the leaf)
    if (!handledByChild && !DeUTC.processed.has(node)) {
      const matches = text.match(detector.regex);
      if (matches) {
        const converted = detector.convert(matches[0]);
        if (converted) tagElement(node, converted, detector.markerClass);
      }
    }
  }
}


// ─── Public API ───────────────────────────────────────────────────────────────

DeUTC.processRoot = function(root) {
  scanElements(root);
  walkNode(root);
};

/**
 * Watch for new elements added by React / Next.js after the initial load.
 * attributes: false  →  we never react to our own setAttribute calls (no loop).
 * characterData: false  →  we don't care about text node edits.
 */
DeUTC.observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        DeUTC.processRoot(node);
      }
    }
  }
});
