/**
 * Unit tests for the PII scrubber engine.
 * Run with: node --test scrubber.test.js  (Node 18+)
 */

const { scrubPII, buildLogEntry } = require("./scrubber");
const assert = require("node:assert/strict");
const { test } = require("node:test");

test("scrubs SSN in dashes format", () => {
  const { cleaned, redactions } = scrubPII("My SSN is 123-45-6789 please help.");
  assert.ok(!cleaned.includes("123-45-6789"));
  assert.ok(cleaned.includes("[SSN REDACTED]"));
  assert.equal(redactions.find((r) => r.id === "ssn")?.count, 1);
});

test("scrubs email address", () => {
  const { cleaned, redactions } = scrubPII("Contact me at john.doe@example.com for details.");
  assert.ok(!cleaned.includes("john.doe@example.com"));
  assert.ok(cleaned.includes("[EMAIL REDACTED]"));
  assert.equal(redactions.find((r) => r.id === "email")?.count, 1);
});

test("scrubs US phone number", () => {
  const { cleaned, redactions } = scrubPII("Call me at (555) 867-5309 anytime.");
  assert.ok(!cleaned.includes("867-5309"));
  assert.ok(cleaned.includes("[PHONE REDACTED]"));
  assert.equal(redactions.find((r) => r.id === "phone")?.count, 1);
});

test("scrubs credit card number", () => {
  const { cleaned, redactions } = scrubPII("My card is 4111 1111 1111 1111 expires next year.");
  assert.ok(!cleaned.includes("4111"));
  assert.ok(cleaned.includes("[CREDIT CARD REDACTED]"));
  assert.equal(redactions.find((r) => r.id === "credit_card")?.count, 1);
});

test("scrubs date of birth", () => {
  const { cleaned, redactions } = scrubPII("I was born on 03/15/1985.");
  assert.ok(!cleaned.includes("03/15/1985"));
  assert.ok(cleaned.includes("[DOB REDACTED]"));
  assert.equal(redactions.find((r) => r.id === "dob")?.count, 1);
});

test("scrubs IP address", () => {
  const { cleaned, redactions } = scrubPII("My home IP is 192.168.1.100");
  assert.ok(!cleaned.includes("192.168.1.100"));
  assert.ok(cleaned.includes("[IP REDACTED]"));
  assert.equal(redactions.find((r) => r.id === "ip_address")?.count, 1);
});

test("scrubs multiple PII types in one prompt", () => {
  const text = "Hi, I'm Jane Smith. Email: jane@test.com, SSN: 987-65-4321, phone: 212-555-0100";
  const { cleaned, redactions } = scrubPII(text);
  assert.ok(!cleaned.includes("jane@test.com"));
  assert.ok(!cleaned.includes("987-65-4321"));
  assert.ok(!cleaned.includes("212-555-0100"));
  assert.ok(redactions.length >= 3);
});

test("respects disabled categories", () => {
  const { cleaned, redactions } = scrubPII(
    "Email me at test@example.com",
    ["ssn", "phone"] // email NOT in enabled list
  );
  assert.ok(cleaned.includes("test@example.com")); // not redacted
  assert.equal(redactions.length, 0);
});

test("clean text with no PII passes through unchanged", () => {
  const text = "What is the capital of France?";
  const { cleaned, redactions } = scrubPII(text);
  assert.equal(cleaned, text);
  assert.equal(redactions.length, 0);
});

test("buildLogEntry produces metadata without raw text", () => {
  const redactions = [{ id: "email", label: "Email", count: 2 }];
  const entry = buildLogEntry("ChatGPT", redactions);
  assert.equal(entry.service, "ChatGPT");
  assert.equal(entry.totalRedactions, 2);
  assert.ok(!JSON.stringify(entry).includes("@")); // no raw email
  assert.ok(entry.timestamp);
});
