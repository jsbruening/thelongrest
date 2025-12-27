#!/usr/bin/env node

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

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

async function verifyToken() {
  try {
    const response = await fetch(`${sonarHostUrl}/api/authentication/validate`, {
      headers: {
        Authorization: `Bearer ${sonarToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Token is valid");
      console.log(`   User: ${data.user?.login || "Unknown"}`);
      console.log(`   Is Admin: ${data.user?.login === "admin" ? "Yes" : "No"}`);
      return data.user?.login === "admin";
    } else {
      const text = await response.text();
      console.error(`❌ Token validation failed: ${text}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error validating token:", error.message);
    return false;
  }
}

verifyToken().then((isAdmin) => {
  if (!isAdmin) {
    console.log("\n⚠️  Token is not for the admin user.");
    console.log("   Please generate a new token for the 'admin' user in SonarQube.");
  } else {
    console.log("\n✅ Token is for admin user. The issue might be with project permissions.");
  }
  process.exit(isAdmin ? 0 : 1);
});




