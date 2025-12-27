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
  console.error("Error reading .env.local file:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// Try different possible project keys
const possibleKeys = ["the-long-rest", "the_long_rest", "thelongrest"];

async function checkProject(key) {
  try {
    const response = await fetch(`${sonarHostUrl}/api/components/show?component=${key}`, {
      headers: {
        Authorization: `Bearer ${sonarToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found project: ${data.component.key}`);
      console.log(`   Name: ${data.component.name}`);
      return data.component.key;
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  for (const key of possibleKeys) {
    const projectKey = await checkProject(key);
    if (projectKey) {
      console.log(`\n📝 Using project key: ${projectKey}`);
      if (projectKey !== "the-long-rest") {
        console.log(`⚠️  Update sonar-project.properties with: sonar.projectKey=${projectKey}`);
      }
      return;
    }
  }
  console.log("❌ Could not find project with any of the expected keys");
}

main();




