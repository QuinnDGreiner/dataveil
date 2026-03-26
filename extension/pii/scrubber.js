/**
 * Dataveil — Client-side PII Scrubber
 * Runs entirely in the browser extension. No data sent to any server.
 */

const PII_PATTERNS = [
  { id: "ssn",           label: "SSN",           pattern: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g,                                             placeholder: "[SSN REDACTED]" },
  { id: "credit_card",   label: "Credit Card",   pattern: /\b(?:\d[ -]?){13,16}\b/g,                                                       placeholder: "[CREDIT CARD REDACTED]" },
  { id: "email",         label: "Email",         pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,                       placeholder: "[EMAIL REDACTED]" },
  { id: "phone",         label: "Phone",         pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,                    placeholder: "[PHONE REDACTED]" },
  { id: "dob",           label: "Date of Birth", pattern: /\b(?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g,  placeholder: "[DOB REDACTED]" },
  { id: "passport",      label: "Passport/ID",   pattern: /\b[A-Z]{1,2}\d{6,9}\b/g,                                                       placeholder: "[ID REDACTED]" },
  { id: "ip_address",    label: "IP Address",    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,                                                  placeholder: "[IP REDACTED]" },
  { id: "street_address",label: "Address",       pattern: /\b\d{1,5}\s(?:[A-Za-z]+\s){1,4}(?:St|Ave|Blvd|Rd|Dr|Ln|Ct|Way|Pl|Terr?|Cir)\.?\b/gi, placeholder: "[ADDRESS REDACTED]" },
];

/**
 * Scrub PII from text.
 * @param {string} text
 * @param {string[]} enabledCategories - built-in category IDs to enforce
 * @param {Array<{id,label,pattern,placeholder}>} customRules - user-defined regex rules
 * @param {string[]} keywords - plain words/phrases to always redact (case-insensitive)
 * @returns {{ cleaned: string, redactions: {id, label, count}[] }}
 */
function scrubPII(text, enabledCategories = PII_PATTERNS.map((p) => p.id), customRules = [], keywords = []) {
  let cleaned = text;
  const redactions = [];

  // Built-in patterns
  for (const pii of PII_PATTERNS) {
    if (!enabledCategories.includes(pii.id)) continue;
    pii.pattern.lastIndex = 0;
    const matches = cleaned.match(pii.pattern);
    if (matches?.length) {
      redactions.push({ id: pii.id, label: pii.label, count: matches.length });
      cleaned = cleaned.replace(pii.pattern, pii.placeholder);
    }
    pii.pattern.lastIndex = 0;
  }

  // Custom user-defined rules
  for (const rule of customRules) {
    try {
      const regex = new RegExp(rule.pattern, "g");
      const matches = cleaned.match(regex);
      if (matches?.length) {
        redactions.push({ id: rule.id, label: rule.label, count: matches.length });
        cleaned = cleaned.replace(regex, rule.placeholder || `[${rule.label.toUpperCase()} REDACTED]`);
      }
    } catch {
      // Skip invalid regex
    }
  }

  // Protected keywords (plain text, case-insensitive whole-word match)
  for (const keyword of keywords) {
    if (!keyword || !keyword.trim()) continue;
    try {
      const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      const matches = cleaned.match(regex);
      if (matches?.length) {
        redactions.push({ id: `kw_${keyword}`, label: keyword, count: matches.length });
        cleaned = cleaned.replace(regex, "[REDACTED]");
      }
    } catch {
      // Skip
    }
  }

  return { cleaned, redactions };
}

/**
 * Build a metadata-only log entry (no raw text).
 */
function buildLogEntry(service, redactions) {
  return {
    timestamp: new Date().toISOString(),
    service,
    totalRedactions: redactions.reduce((sum, r) => sum + r.count, 0),
    categories: redactions.map((r) => ({ id: r.id, count: r.count })),
  };
}

if (typeof module !== "undefined") {
  module.exports = { scrubPII, buildLogEntry, PII_PATTERNS };
}
