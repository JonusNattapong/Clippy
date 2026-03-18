/**
 * Skills System - Main Entry Point
 *
 * This module exports the public API for the Clippy Skills System.
 * Skills are modular plugins that can be dynamically loaded and registered.
 */

export { getSkillRegistry, initSkillRegistry } from "./registry";

export type {
  Skill,
  SkillAction,
  SkillActionMeta,
  SkillContext,
  SkillFactory,
  SkillMeta,
  SkillResult,
  SkillStatus,
  ActionParameters,
  RiskLevel,
} from "./types";
