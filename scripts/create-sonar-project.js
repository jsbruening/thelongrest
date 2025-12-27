#!/usr/bin/env node

/**
 * Create SonarQube Project via API
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
const projectName = "The Long Rest";

// Create project via SonarQube API
async function createProject() {
  const url = `${sonarHostUrl}/api/projects/create`;
  const params = new URLSearchParams({
    project: projectKey,
    name: projectName,
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sonarToken}`,
      },
    });

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Project "${projectName}" created successfully!`);
      return true;
    } else if (response.status === 400) {
      const text = await response.text();
      if (text.includes("already exists")) {
        console.log(`ℹ️  Project "${projectName}" already exists.`);
        return true;
      } else {
        console.error(`❌ Failed to create project: ${text}`);
        return false;
      }
    } else if (response.status === 403) {
      console.error("❌ Permission denied. Your token may not have permission to create projects.");
      console.error("   Please create the project manually in SonarQube UI or grant your token 'Create Projects' permission.");
      return false;
    } else {
      const text = await response.text();
      console.error(`❌ Failed to create project (status ${response.status}): ${text}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error creating project:", error.message);
    return false;
  }
}

createProject().then((success) => {
  process.exit(success ? 0 : 1);
});




