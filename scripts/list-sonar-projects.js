#!/usr/bin/env node

/**
 * List SonarQube Projects
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

// List projects
async function listProjects() {
  const url = `${sonarHostUrl}/api/projects/search`;
  const params = new URLSearchParams({
    ps: "100",
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
      console.error(`❌ Failed to list projects (status ${response.status}): ${text}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error listing projects:", error.message);
    return null;
  }
}

listProjects().then((data) => {
  if (!data) {
    process.exit(1);
  }

  const projects = data.components || [];
  
  console.log(`\n📋 Found ${projects.length} project(s) in SonarQube:\n`);
  
  projects.forEach((project) => {
    console.log(`  Key: ${project.key}`);
    console.log(`  Name: ${project.name}`);
    console.log(`  Visibility: ${project.visibility || "N/A"}`);
    console.log("");
  });

  const ourProject = projects.find(p => p.key === "the-long-rest" || p.key.includes("long-rest"));
  if (ourProject) {
    console.log(`✅ Found project: ${ourProject.key}`);
    if (ourProject.key !== "the-long-rest") {
      console.log(`⚠️  Project key mismatch! Expected "the-long-rest" but found "${ourProject.key}"`);
      console.log(`   Update sonar-project.properties with: sonar.projectKey=${ourProject.key}`);
    }
  } else {
    console.log("❌ Project 'the-long-rest' not found in the list");
  }
});




