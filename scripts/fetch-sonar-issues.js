#!/usr/bin/env node

/**
 * Fetch SonarQube Issues via API
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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
  process.exit(1);
}

if (!sonarToken) {
  console.error("SONAR_TOKEN not found in .env.local");
  process.exit(1);
}

const projectKey = "the-long-rest";

// Fetch issues from SonarQube API
async function fetchIssues() {
  const url = `${sonarHostUrl}/api/issues/search`;
  const params = new URLSearchParams({
    componentKeys: projectKey,
    resolved: "false",
    ps: "500", // Page size
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sonarToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Failed to fetch issues (status ${response.status}): ${text}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error fetching issues:", error.message);
    return null;
  }
}

fetchIssues().then((data) => {
  if (!data) {
    process.exit(1);
  }

  const issues = data.issues || [];
  const total = data.total || 0;

  console.log(`\n📊 Found ${total} issue(s) in SonarQube\n`);

  if (issues.length === 0) {
    console.log("✅ No issues found! All good!");
    process.exit(0);
  }

  // Group by severity and type
  const bySeverity = {};
  const byType = {};

  issues.forEach((issue) => {
    const severity = issue.severity || "UNKNOWN";
    const type = issue.type || "UNKNOWN";
    
    bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    byType[type] = (byType[type] || 0) + 1;
  });

  console.log("Issues by Severity:");
  Object.entries(bySeverity)
    .sort((a, b) => {
      const order = { BLOCKER: 0, CRITICAL: 1, MAJOR: 2, MINOR: 3, INFO: 4 };
      return (order[a[0]] || 99) - (order[b[0]] || 99);
    })
    .forEach(([severity, count]) => {
      console.log(`  ${severity}: ${count}`);
    });

  console.log("\nIssues by Type:");
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log("\n📋 Issue Details:\n");
  
  issues
    .sort((a, b) => {
      const severityOrder = { BLOCKER: 0, CRITICAL: 1, MAJOR: 2, MINOR: 3, INFO: 4 };
      const aOrder = severityOrder[a.severity] || 99;
      const bOrder = severityOrder[b.severity] || 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.line || 0) - (b.line || 0);
    })
    .forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.type}: ${issue.message}`);
      console.log(`   File: ${issue.component.replace(`${projectKey}:`, "")}`);
      if (issue.line) {
        console.log(`   Line: ${issue.line}`);
      }
      if (issue.rule) {
        console.log(`   Rule: ${issue.rule}`);
      }
      console.log("");
    });

  // Return issues as JSON for programmatic use
  return issues;
});




