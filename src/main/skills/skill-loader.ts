/**
 * Markdown Skill Loader
 *
 * Loads skills from SKILL.md files with frontmatter metadata.
 * Skills are defined in Markdown with YAML frontmatter.
 *
 * Format:
 * ---
 * name: skill-name
 * description: What this skill does
 * ---
 *
 * Skill content goes here...
 */

import fs from "node:fs";
import path from "node:path";

import type { Skill, SkillAction, SkillContext, SkillResult } from "./types";

interface SkillFrontmatter {
  name: string;
  description: string;
  location?: string;
  version?: string;
  author?: string;
  categories?: string[];
  keywords?: string[];
  enabledByDefault?: boolean;
  riskLevel?: "low" | "medium" | "high";
}

function parseFrontmatter(content: string): {
  frontmatter: SkillFrontmatter | null;
  body: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, body: content };
  }

  const frontmatterLines = match[1].split("\n");
  const body = match[2].trim();

  const frontmatter: Record<string, unknown> = {};

  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key === "categories" || key === "keywords") {
      frontmatter[key] = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (key === "enabledByDefault") {
      frontmatter[key] = value.toLowerCase() === "true";
    } else {
      frontmatter[key] = value;
    }
  }

  return {
    frontmatter: frontmatter as unknown as SkillFrontmatter,
    body,
  };
}

function extractActionsFromMarkdown(body: string): Record<string, SkillAction> {
  const actions: Record<string, SkillAction> = {};

  // Look for ## Actions section
  const actionsMatch = body.match(
    /##\s*Actions?\s*\n([\s\S]*?)(?=\n##|\n---|$)/i,
  );
  if (!actionsMatch) return actions;

  const actionsContent = actionsMatch[1];

  // Parse individual action blocks: ### action_name
  const actionBlocks = actionsContent.split(/(?=^###\s+)/m);

  for (const block of actionBlocks) {
    const nameMatch = block.match(/^###\s+(\S+)/);
    if (!nameMatch) continue;

    const actionName = nameMatch[1].trim();

    // Extract description (first paragraph after the heading)
    const descMatch = block.match(/^###\s+\S+\s*\n+([^#\n]+)/m);
    const description = descMatch ? descMatch[1].trim() : "";

    // Extract parameters from code block
    const paramsMatch = block.match(/```(?:json|yaml)\s*\n([\s\S]*?)```/);
    let parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    } = {
      type: "object",
      properties: {},
      required: [],
    };

    if (paramsMatch) {
      try {
        const parsed = JSON.parse(paramsMatch[1]);
        parameters = {
          type: "object",
          properties: parsed.properties || {},
          required: parsed.required || [],
        };
      } catch {
        // Keep default parameters
      }
    }

    // Extract risk level
    const riskMatch = block.match(/risk[_ ]?level:\s*(low|medium|high)/i);
    const riskLevel =
      (riskMatch?.[1]?.toLowerCase() as "low" | "medium" | "high") || "low";

    actions[actionName] = {
      meta: {
        name: actionName,
        description,
        parameters,
        riskLevel,
      },
      execute: async (
        args: Record<string, unknown>,
        _context: SkillContext,
      ): Promise<SkillResult> => {
        return {
          success: false,
          error: `Action "${actionName}" is defined in SKILL.md but requires a TypeScript implementation. Please create a .skill.ts file for this action.`,
        };
      },
    };
  }

  return actions;
}

export function loadSkillFromMarkdown(filePath: string): Skill | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter?.name) {
      console.warn(
        `[OpenClaw Loader] Skill at ${filePath} has no name in frontmatter`,
      );
      return null;
    }

    const actions = extractActionsFromMarkdown(body);

    // If no actions found, create a placeholder action
    if (Object.keys(actions).length === 0) {
      actions.run = {
        meta: {
          name: "run",
          description: frontmatter.description || "Execute this skill",
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
          riskLevel: "low",
        },
        execute: async (): Promise<SkillResult> => {
          return {
            success: false,
            error: `Skill "${frontmatter.name}" loaded from SKILL.md but has no executable actions. Implement actions in a .skill.ts file.`,
          };
        },
      };
    }

    return {
      meta: {
        id: frontmatter.name,
        name: frontmatter.name,
        version: frontmatter.version || "1.0.0",
        description: frontmatter.description || "",
        author: frontmatter.author,
        categories: frontmatter.categories,
        keywords: frontmatter.keywords,
        enabledByDefault: frontmatter.enabledByDefault ?? true,
      },
      actions,
    };
  } catch (error) {
    console.error(
      `[OpenClaw Loader] Failed to load skill from ${filePath}:`,
      error,
    );
    return null;
  }
}

export function discoverSkillsFromMarkdown(skillsDir: string): Skill[] {
  const skills: Skill[] = [];

  if (!fs.existsSync(skillsDir)) {
    return skills;
  }

  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name === "SKILL.md") {
        const skill = loadSkillFromMarkdown(path.join(skillsDir, entry.name));
        if (skill) skills.push(skill);
      } else if (entry.isDirectory()) {
        const skillMdPath = path.join(skillsDir, entry.name, "SKILL.md");
        if (fs.existsSync(skillMdPath)) {
          const skill = loadSkillFromMarkdown(skillMdPath);
          if (skill) skills.push(skill);
        }
      }
    }
  } catch (error) {
    console.warn("[OpenClaw Loader] Failed to discover skills:", error);
  }

  return skills;
}
