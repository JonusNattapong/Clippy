/**
 * Skill Registry
 *
 * Central registry for managing skills in the Clippy application.
 * Handles registration, loading, enabling/disabling, and execution of skills.
 */

import { app, dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  Skill,
  SkillAction,
  SkillContext,
  SkillFactory,
  SkillResult,
  SkillStatus,
} from "./types";
import { getStateManager } from "../state";
import { getMainWindow } from "../windows";
import { discoverSkillsFromMarkdown } from "./skill-loader";

/**
 * Internal representation of a registered skill
 */
interface RegisteredSkill {
  skill: Skill;
  enabled: boolean;
  loaded: boolean;
  error?: string;
}

/**
 * Global skill registry instance
 */
class SkillRegistry {
  private skills: Map<string, RegisteredSkill> = new Map();
  private context: SkillContext | null = null;
  private skillsDir: string | null = null;

  /**
   * Initialize the skill registry with Electron app context
   */
  async init(): Promise<void> {
    const state = getStateManager();

    this.context = {
      app,
      userDataPath: app.getPath("userData"),
      homePath: os.homedir(),
      platform: process.platform,
      getSetting: (key: string) => state.store.get(key),
      setSetting: (key: string, value: unknown) => state.store.set(key, value),
      confirm: async (options) => {
        const mainWindow = getMainWindow();
        const dialogOptions = {
          type: "warning" as const,
          buttons: [options.confirmLabel || "Continue", "Cancel"],
          defaultId: 1,
          cancelId: 1,
          noLink: true,
          title: options.title,
          message: options.message,
          detail: options.detail,
        };
        const result = mainWindow
          ? await dialog.showMessageBox(mainWindow, dialogOptions)
          : await dialog.showMessageBox(dialogOptions);
        return result.response === 0;
      },
      log: (message, level = "info") => {
        const prefix = `[Skills]`;
        switch (level) {
          case "error":
            console.error(`${prefix} ${message}`);
            break;
          case "warn":
            console.warn(`${prefix} ${message}`);
            break;
          default:
            console.log(`${prefix} ${message}`);
        }
      },
    };

    // Set up skills directory
    this.skillsDir = path.join(app.getPath("userData"), "skills");
    if (!fs.existsSync(this.skillsDir)) {
      fs.mkdirSync(this.skillsDir, { recursive: true });
    }

    // Load built-in skills
    await this.loadBuiltinSkills();

    // Load user skills from directory
    await this.loadUserSkills();
  }

  /**
   * Get the skills directory path
   */
  getSkillsDir(): string {
    return this.skillsDir || path.join(app.getPath("userData"), "skills");
  }

  /**
   * Register a skill factory
   */
  async register(factory: SkillFactory): Promise<boolean> {
    try {
      const skill = await factory();
      const id = skill.meta.id;

      if (this.skills.has(id)) {
        console.warn(`Skill "${id}" is already registered. Skipping.`);
        return false;
      }

      // Check dependencies
      if (skill.meta.dependencies) {
        for (const depId of skill.meta.dependencies) {
          if (!this.skills.has(depId)) {
            console.error(
              `Skill "${id}" depends on "${depId}" which is not registered.`,
            );
            return false;
          }
        }
      }

      this.skills.set(id, {
        skill,
        enabled: skill.meta.enabledByDefault ?? true,
        loaded: false,
      });

      return true;
    } catch (error) {
      console.error("Failed to register skill:", error);
      return false;
    }
  }

  /**
   * Load and initialize a skill by ID
   */
  async load(skillId: string): Promise<boolean> {
    const registered = this.skills.get(skillId);
    if (!registered) {
      console.error(`Skill "${skillId}" not found.`);
      return false;
    }

    if (registered.loaded) {
      return true;
    }

    try {
      // Call init if defined
      if (registered.skill.init && this.context) {
        await registered.skill.init(this.context);
      }

      registered.loaded = true;
      registered.error = undefined;
      return true;
    } catch (error) {
      registered.error = String(error);
      console.error(`Failed to load skill "${skillId}":`, error);
      return false;
    }
  }

  /**
   * Unload a skill by ID
   */
  async unload(skillId: string): Promise<boolean> {
    const registered = this.skills.get(skillId);
    if (!registered) {
      return false;
    }

    try {
      if (registered.skill.destroy && this.context) {
        await registered.skill.destroy(this.context);
      }

      registered.loaded = false;
      return true;
    } catch (error) {
      console.error(`Failed to unload skill "${skillId}":`, error);
      return false;
    }
  }

  /**
   * Enable a skill
   */
  async enable(skillId: string): Promise<boolean> {
    const registered = this.skills.get(skillId);
    if (!registered) {
      return false;
    }

    registered.enabled = true;
    return this.load(skillId);
  }

  /**
   * Disable a skill
   */
  async disable(skillId: string): Promise<boolean> {
    const registered = this.skills.get(skillId);
    if (!registered) {
      return false;
    }

    registered.enabled = false;
    return this.unload(skillId);
  }

  /**
   * Get all registered skills
   */
  getSkills(): Skill[] {
    return Array.from(this.skills.values()).map((r) => r.skill);
  }

  /**
   * Get skill statuses
   */
  getStatuses(): SkillStatus[] {
    return Array.from(this.skills.entries()).map(([id, r]) => ({
      id,
      enabled: r.enabled,
      loaded: r.loaded,
      error: r.error,
    }));
  }

  /**
   * Get a specific skill by ID
   */
  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId)?.skill;
  }

  /**
   * Check if a skill is enabled
   */
  isEnabled(skillId: string): boolean {
    const registered = this.skills.get(skillId);
    return registered?.enabled ?? false;
  }

  /**
   * Get all actions from all enabled skills
   */
  getAllActions(): Record<string, SkillAction> {
    const actions: Record<string, SkillAction> = {};

    for (const [skillId, registered] of this.skills) {
      if (!registered.enabled || !registered.loaded) continue;

      for (const [actionName, action] of Object.entries(
        registered.skill.actions,
      )) {
        const fullName = `${skillId}.${actionName}`;
        actions[fullName] = action;
      }
    }

    return actions;
  }

  /**
   * Execute a skill action
   */
  async execute(
    skillId: string,
    actionName: string,
    args: Record<string, unknown>,
  ): Promise<SkillResult> {
    const registered = this.skills.get(skillId);

    if (!registered) {
      return { success: false, error: `Skill "${skillId}" not found.` };
    }

    if (!registered.enabled) {
      return { success: false, error: `Skill "${skillId}" is disabled.` };
    }

    if (!registered.loaded) {
      const loaded = await this.load(skillId);
      if (!loaded) {
        return { success: false, error: `Failed to load skill "${skillId}".` };
      }
    }

    const action = registered.skill.actions[actionName];
    if (!action) {
      return {
        success: false,
        error: `Action "${actionName}" not found in skill "${skillId}".`,
      };
    }

    // Check if confirmation is needed
    if (action.shouldConfirm?.(args) && this.context) {
      const confirmed = await this.context.confirm({
        title: "Confirm Action",
        message: `Skill "${registered.skill.meta.name}" wants to perform: ${action.meta.name}`,
        detail: JSON.stringify(args, null, 2),
      });

      if (!confirmed) {
        return { success: false, error: "Action cancelled by user." };
      }
    }

    try {
      return await action.execute(args, this.context!);
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Load built-in skills
   */
  private async loadBuiltinSkills(): Promise<void> {
    // Built-in skills will be imported and registered here
    const builtinSkills = await this.discoverBuiltinSkills();

    for (const factory of builtinSkills) {
      await this.register(factory);
    }
  }

  /**
   * Discover built-in skills from the skills directory
   */
  private async discoverBuiltinSkills(): Promise<SkillFactory[]> {
    const factories: SkillFactory[] = [];

    // Import all .skill.ts files from the skills directory
    const builtinDir = __dirname;

    try {
      const files = await fs.promises.readdir(builtinDir);

      for (const file of files) {
        if (file.endsWith(".skill.ts") || file.endsWith(".skill.js")) {
          try {
            // Use require() for synchronous loading in CommonJS context
            const module = require(path.join(builtinDir, file));
            if (module.default && typeof module.default === "function") {
              factories.push(module.default);
            } else if (
              module.createSkill &&
              typeof module.createSkill === "function"
            ) {
              factories.push(module.createSkill);
            }
          } catch (error) {
            console.warn(`Failed to load built-in skill "${file}":`, error);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to discover built-in skills:", error);
    }

    // Discover SKILL.md files from the project skills/ directory
    const projectSkillsDir = path.join(app.getAppPath(), "skills");
    const markdownSkills = discoverSkillsFromMarkdown(projectSkillsDir);

    for (const skill of markdownSkills) {
      // Wrap the skill in a factory function
      factories.push(() => skill);
    }

    return factories;
  }

  /**
   * Load user skills from the skills directory
   */
  private async loadUserSkills(): Promise<void> {
    if (!this.skillsDir) return;

    try {
      const entries = await fs.promises.readdir(this.skillsDir, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Try loading TypeScript skill first
          const skillPath = path.join(this.skillsDir, entry.name, "index.js");
          if (fs.existsSync(skillPath)) {
            try {
              // Use require() for synchronous loading in CommonJS context
              const module = require(skillPath);
              if (module.default && typeof module.default === "function") {
                await this.register(module.default);
              } else if (
                module.createSkill &&
                typeof module.createSkill === "function"
              ) {
                await this.register(module.createSkill);
              }
              continue;
            } catch (error) {
              console.error(
                `Failed to load user skill "${entry.name}":`,
                error,
              );
            }
          }

          // Try loading SKILL.md format
          const skillMdPath = path.join(this.skillsDir, entry.name, "SKILL.md");
          if (fs.existsSync(skillMdPath)) {
            // Use require() for synchronous loading in CommonJS context
            const { loadSkillFromMarkdown } = require("./skill-loader");
            const skill = loadSkillFromMarkdown(skillMdPath);
            if (skill) {
              await this.register(() => skill);
            }
          }
        }
      }

      // Also check for SKILL.md files directly in the skills directory
      const markdownSkills = discoverSkillsFromMarkdown(this.skillsDir);
      for (const skill of markdownSkills) {
        if (!this.skills.has(skill.meta.id)) {
          await this.register(() => skill);
        }
      }
    } catch (error) {
      // Skills directory might not exist yet
    }
  }
}

// Singleton instance
let registryInstance: SkillRegistry | null = null;

/**
 * Get the global skill registry instance
 */
export function getSkillRegistry(): SkillRegistry {
  if (!registryInstance) {
    registryInstance = new SkillRegistry();
  }
  return registryInstance;
}

/**
 * Initialize the skill registry
 */
export async function initSkillRegistry(): Promise<void> {
  const registry = getSkillRegistry();
  await registry.init();
}

// Re-export types
export * from "./types";
