#!/usr/bin/env node

/**
 * Check SonarQube Token Permissions
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

// Check token permissions
async function checkPermissions() {
  try {
    // Try to get user info
    const userResponse = await fetch(`${sonarHostUrl}/api/authentication/validate`, {
      headers: {
        Authorization: `Bearer ${sonarToken}`,
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log("✅ Token is valid");
      console.log(`   User: ${userData.user?.login || "Unknown"}`);
    } else {
      console.log("⚠️  Could not validate token");
    }

    // Check project access
    const projectKey = "the-long-rest";
    const projectResponse = await fetch(`${sonarHostUrl}/api/components/show?component=${projectKey}`, {
      headers: {
        Authorization: `Bearer ${sonarToken}`,
      },
    });

    if (projectResponse.ok) {
      console.log("✅ Can read project");
    } else {
      console.log("❌ Cannot read project");
    }

    console.log("\n📋 To fix the 'Execute Analysis' permission issue:");
    console.log("   1. Go to http://localhost:9000");
    console.log("   2. Navigate to: Administration → Security → Users");
    console.log("   3. Find your user or the user associated with this token");
    console.log("   4. Go to: Projects → the-long-rest");
    console.log("   5. Grant 'Execute Analysis' permission");
    console.log("\n   OR");
    console.log("   1. Go to: Administration → Security → Permission Templates");
    console.log("   2. Edit the template used by this project");
    console.log("   3. Grant 'Execute Analysis' to the user/group");

  } catch (error) {
    console.error("❌ Error checking permissions:", error.message);
  }
}

checkPermissions();




