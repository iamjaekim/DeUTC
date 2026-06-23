/**
 * DeUTC — detectors.js
 *
 * Defines all timestamp detectors. Each detector is a plain object consumed by walker.js.
 *
 * Two detector types:
 *   Element detector  →  { name, markerClass, matchElement(el), convert(el) }
 *                        Matches specific HTML elements (e.g. <time datetime="">).
 *                        Processed with querySelectorAll before the text walk.
 *
 *   Text detector     →  { name, markerClass, regex, convert(matchedString) }
 *                        Matches regex patterns against an element's textContent.
 *                        Processed depth-first to tag the most specific element.
 *
 * To add support for a new platform, just add a new object to DeUTC.DETECTORS below.
 */

const DeUTC = {};

// ─── Shared Formatting ────────────────────────────────────────────────────────

DeUTC.DATE_FORMAT = {
  month: 'short', day: 'numeric',
  hour: '2-digit', minute: '2-digit',
  timeZoneName: 'short',
};

DeUTC.UNIT_SECONDS = {
  second: 1, minute: 60,    hour: 3600,
  day: 86400, week: 604800, month: 2592000, year: 31536000,
};

function fmt(date) {
  return date.toLocaleString(undefined, DeUTC.DATE_FORMAT);
}


// ─── Detectors ────────────────────────────────────────────────────────────────

DeUTC.DETECTORS = [

  /**
   * 1. <time datetime="ISO"> element
   * Platforms: Instatus, Better Stack, incident.io, many custom pages.
   * Most reliable detector — reads the machine-readable `datetime` attribute
   * directly, regardless of what visible text the element shows ("2 hours ago" etc).
   */
  {
    name: 'time-element',
    markerClass: 'utc-converted',
    matchElement(el) {
      return el.tagName === 'TIME' && !!el.getAttribute('datetime');
    },
    convert(el) {
      const date = new Date(el.getAttribute('datetime'));
      return isNaN(date) ? null : fmt(date);
    },
  },

  /**
   * 2. Absolute UTC text timestamp
   * Platforms: Atlassian Statuspage, status.claude.com.
   * Example: "Jun 13, 2026 - 00:50 UTC"
   */
  {
    name: 'utc-absolute',
    markerClass: 'utc-converted',
    regex: /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?(?:,?\s*[-–—]?\s*)\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s+UTC\b/gi,
    convert(text) {
      const clean = text.replace(/\b(?:st|nd|rd|th)\b/i, '').replace(/\s*[-–—]\s*/g, ' ');
      const date = new Date(clean);
      return isNaN(date) ? null : fmt(date);
    },
  },

  /**
   * 3. ISO 8601 text timestamp
   * Platforms: PagerDuty, custom-built pages.
   * Example: "2026-06-13T00:50:00Z"
   */
  {
    name: 'iso-8601',
    markerClass: 'utc-converted',
    regex: /\b\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?\b/g,
    convert(text) {
      const date = new Date(text.trim());
      return isNaN(date) ? null : fmt(date);
    },
  },

  /**
   * 4. "at HH:MM UTC" shorthand
   * Platforms: Freshstatus, UptimeRobot.
   * Example: "Resolved at 14:30 UTC"
   * Note: No date in the text, so we assume today's UTC date.
   *       If the result is more than 1 hour in the future, we assume yesterday.
   */
  {
    name: 'at-time-utc',
    markerClass: 'utc-converted',
    regex: /\bat\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s+UTC\b/gi,
    convert(text) {
      const match = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/i.exec(text);
      if (!match) return null;

      let hours = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const secs = parseInt(match[3] || '0', 10);
      const meridiem = (match[4] || '').toUpperCase();

      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;

      const now = new Date();
      let date = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
        hours, mins, secs
      ));

      // If the computed time is more than 1 hour in the future, it was yesterday
      if (date.getTime() > Date.now() + 3600000) {
        date = new Date(date.getTime() - 86400000);
      }

      return fmt(date);
    },
  },

  /**
   * 5. Relative duration
   * Platforms: incident.io (OpenAI), Instatus, Cachet, many others.
   * Examples: "2 hours ago", "Ongoing for 1 hour", "an hour ago",
   *           "about 2 days ago", "just now"
   */
  {
    name: 'relative-time',
    markerClass: 'rel-converted',
    regex: /\b(?:just\s+now|(?:about\s+)?(?:ongoing\s+for\s+)?(?:an?\s+|\d+\s+)(?:second|minute|hour|day|week|month|year)s?(?:\s+ago)?)\b/gi,
    convert(text) {
      if (/just\s+now/i.test(text)) {
        return 'now — ' + fmt(new Date());
      }

      const match = /(?:an?\s+|(\d+)\s+)(second|minute|hour|day|week|month|year)/i.exec(text);
      if (!match) return null;

      const amount = match[1] ? parseInt(match[1], 10) : 1; // "an hour" → 1
      const unit   = match[2].toLowerCase();
      const date   = new Date(Date.now() - amount * DeUTC.UNIT_SECONDS[unit] * 1000);
      const prefix = /ongoing\s+for/i.test(text) ? 'Started: ~' : '~';

      return prefix + fmt(date);
    },
  },

];
