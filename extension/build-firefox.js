#!/usr/bin/env node
/**
 * Builds a Firefox-compatible zip for AMO (Mozilla Add-ons) submission.
 * Run: node build-firefox.js
 *
 * Output: dataveil-firefox.zip (in project root)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SRC = path.join(__dirname);
const DIST = path.join(__dirname, "..", "extension-dist-firefox");
const ZIP = path.join(__dirname, "..", "dataveil-firefox.zip");

// Clean previous dist
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

// Files/dirs to copy (exclude build artifacts and this script)
const EXCLUDE = new Set(["build-firefox.js", "node_modules", ".DS_Store"]);

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      if (EXCLUDE.has(child)) continue;
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(SRC, DIST);

// Patch manifest: remove declarativeNetRequest (unused, avoids AMO review warnings)
const manifestPath = path.join(DIST, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.permissions = (manifest.permissions || []).filter(
  (p) => p !== "declarativeNetRequest"
);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Remove previous zip if exists
if (fs.existsSync(ZIP)) fs.rmSync(ZIP);

// Create zip
try {
  execSync(`cd "${DIST}" && zip -r "${ZIP}" .`, { stdio: "inherit" });
  console.log(`\nFirefox extension built: ${ZIP}`);
} catch {
  // Fallback for Windows where zip may not be available
  console.error("zip command failed. Install zip or use 7-Zip:");
  console.error(`  7z a "${ZIP}" "${DIST}\\*"`);
  process.exit(1);
}

// Cleanup dist folder
fs.rmSync(DIST, { recursive: true });
console.log("Done. Submit dataveil-firefox.zip to https://addons.mozilla.org/");
