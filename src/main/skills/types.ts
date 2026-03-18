/**
 * Skill System Types
 *
 * This module defines the interfaces and types for the Clippy Skills System.
 * Skills are modular plugins that can be dynamically loaded and registered.
 */

import { App } from "electron";

/**
 * Risk levels for skill actions
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * Result returned by skill actions
 */
export interface SkillResult {
  success: boolean;
  output?: string;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * JSON Schema for action parameters
 */
export interface ActionParameters {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
}

/**
 * Metadata for a skill action
 */
export interface SkillActionMeta {
  name: string;
  description: string;
  parameters: ActionParameters;
  riskLevel: RiskLevel;
}

/**
 * Context provided to skill actions during execution
 */
export interface SkillContext {
  /** Electron app instance */
  app: App;
  /** User data path */
  userDataPath: string;
  /** Home directory path */
  homePath: string;
  /** Platform identifier */
  platform: NodeJS.Platform;
  /** Get a setting value */
  getSetting: (key: string) => unknown;
  /** Set a setting value */
  setSetting: (key: string, value: unknown) => void;
  /** Show a confirmation dialog */
  confirm: (options: {
    title: string;
    message: string;
    detail?: string;
    confirmLabel?: string;
  }) => Promise<boolean>;
  /** Log a message */
  log: (message: string, level?: "info" | "warn" | "error") => void;
}

/**
 * A single action within a skill
 */
export interface SkillAction {
  /** Action metadata */
  meta: SkillActionMeta;
  /** Whether this action requires user confirmation */
  shouldConfirm?: (args: Record<string, unknown>) => boolean;
  /** Execute the action */
  execute: (
    args: Record<string, unknown>,
    context: SkillContext,
  ) => Promise<SkillResult>;
}

/**
 * Metadata for a skill
 */
export interface SkillMeta {
  /** Unique identifier for the skill */
  id: string;
  /** Human-readable name */
  name: string;
  /** Version string (semver) */
  version: string;
  /** Description of what the skill does */
  description: string;
  /** Author information */
  author?: string;
  /** Categories this skill belongs to */
  categories?: string[];
  /** Keywords for searching */
  keywords?: string[];
  /** Whether the skill is enabled by default */
  enabledByDefault?: boolean;
  /** Required permissions */
  permissions?: string[];
  /** Dependencies on other skills */
  dependencies?: string[];
}

/**
 * A complete skill definition
 */
export interface Skill {
  /** Skill metadata */
  meta: SkillMeta;
  /** Actions provided by this skill */
  actions: Record<string, SkillAction>;
  /** Initialization function (called when skill is loaded) */
  init?: (context: SkillContext) => Promise<void>;
  /** Cleanup function (called when skill is unloaded) */
  destroy?: (context: SkillContext) => Promise<void>;
  /** Configuration schema for skill settings */
  configSchema?: {
    [key: string]: {
      type: "string" | "number" | "boolean" | "object" | "array";
      default?: unknown;
      description?: string;
    };
  };
}

/**
 * Function to create/register a skill
 */
export type SkillFactory = () => Skill | Promise<Skill>;

/**
 * Status of a loaded skill
 */
export interface SkillStatus {
  id: string;
  enabled: boolean;
  loaded: boolean;
  error?: string;
}
