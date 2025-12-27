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

const projectKey = "the-long-rest";

async function deleteProject() {
  const url = `${sonarHostUrl}/api/projects/delete`;
  const params = new URLSearchParams({
    project: projectKey,
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sonarToken}`,
      },
    });

    if (response.status === 204 || response.status === 200) {
      console.log(`✅ Project "${projectKey}" deleted successfully!`);
      return true;
    } else if (response.status === 404) {
      console.log(`ℹ️  Project "${projectKey}" does not exist.`);
      return true;
    } else {
      const text = await response.text();
      console.error(`❌ Failed to delete project (status ${response.status}): ${text}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error deleting project:", error.message);
    return false;
  }
}

deleteProject().then((success) => {
  if (success) {
    console.log("\n✅ Project deleted. You can now create a new one in SonarQube UI.");
    console.log("   Or run: npm run sonar:create");
  }
  process.exit(success ? 0 : 1);
});




