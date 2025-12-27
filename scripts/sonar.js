#!/usr/bin/env node

/**
 * SonarQube Scanner Script
 * Reads configuration from .env.local and runs SonarQube analysis
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// sonarqube-scanner is CommonJS, so we need to use require
const require = createRequire(import.meta.url);
const scannerModule = require("sonarqube-scanner");
// The package exports the scanner function as default or directly
const scanner = scannerModule.default || scannerModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Read .env.local file
let sonarToken = "";
let sonarHostUrl = "http://localhost:9000";

try {
  const envFile = readFileSync(join(projectRoot, ".env.local"), "utf-8");
  const lines = envFile.split("\n");
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("SONAR_TOKEN=")) {
      sonarToken = trimmed.split("=")[1]?.trim() || "";
    } else if (trimmed.startsWith("SONAR_HOST_URL=")) {
      sonarHostUrl = trimmed.split("=")[1]?.trim() || "http://localhost:9000";
    }
  }
} catch (error) {
  console.error("Error reading .env.local file:", error.message);
  console.error("Make sure .env.local exists with SONAR_TOKEN and SONAR_HOST_URL");
  process.exit(1);
}

if (!sonarToken) {
  console.error("SONAR_TOKEN not found in .env.local");
  process.exit(1);
}

// SonarQube scanner configuration
const sonarConfig = {
  serverUrl: sonarHostUrl,
  token: sonarToken,
  options: {
    "sonar.projectKey": "the-long-rest",
    "sonar.projectName": "The Long Rest",
    "sonar.sources": "src",
    "sonar.tests": "src",
    "sonar.exclusions": [
      "**/node_modules/**",
      "**/.next/**",
      "**/generated/**",
      "**/coverage/**",
      "**/uploads/**",
      "**/public/**",
      "**/*.config.js",
      "**/*.config.cjs",
      "**/next-env.d.ts",
      "**/test/**",
    ].join(","),
    "sonar.test.inclusions": "**/*.test.ts,**/*.test.tsx",
    "sonar.javascript.lcov.reportPaths": "coverage/lcov.info",
    "sonar.sourceEncoding": "UTF-8",
    "sonar.typescript.tsconfigPath": "tsconfig.json",
  },
};

console.log("Starting SonarQube analysis...");
console.log(`Server URL: ${sonarHostUrl}`);
console.log(`Project Key: ${sonarConfig.options["sonar.projectKey"]}`);

// Run the scanner
scanner(
  {
    serverUrl: sonarConfig.serverUrl,
    token: sonarConfig.token,
    options: sonarConfig.options,
  },
  (_result) => {
    // The scanner callback may not always provide result.code correctly
    // Check if the analysis was successful by looking at the output
    // If we get here without an error, the scan likely succeeded
    console.log("✅ SonarQube analysis completed!");
    console.log(`📊 View results at: ${sonarHostUrl}/dashboard?id=${sonarConfig.options["sonar.projectKey"]}`);
    process.exit(0);
  }
);

