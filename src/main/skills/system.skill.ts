/**
 * System Skill
 *
 * A built-in skill that provides system information and control actions.
 * This serves as an example of how to create a skill.
 */

import { Skill, SkillContext, SkillResult } from "./types";
import os from "node:os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Create the System Skill
 */
export default function createSystemSkill(): Skill {
  return {
    meta: {
      id: "system",
      name: "System Control",
      version: "1.0.0",
      description: "Provides system information and basic control capabilities",
      author: "Clippy Team",
      categories: ["system", "utility"],
      keywords: ["system", "info", "cpu", "memory", "process"],
      enabledByDefault: true,
    },

    actions: {
      get_info: {
        meta: {
          name: "get_info",
          description:
            "Get system information including CPU, memory, and OS details",
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
          riskLevel: "low",
        },
        execute: async (): Promise<SkillResult> => {
          const cpus = os.cpus();
          const totalMem = os.totalmem();
          const freeMem = os.freemem();
          const usedMem = totalMem - freeMem;

          const info = [
            `💻 System Information`,
            `─────────────────────`,
            `OS: ${os.platform()} ${os.release()}`,
            `Hostname: ${os.hostname()}`,
            `CPU: ${cpus[0]?.model || "Unknown"}`,
            `CPU Cores: ${cpus.length}`,
            `RAM: ${(usedMem / 1024 / 1024 / 1024).toFixed(1)} GB / ${(
              totalMem /
              1024 /
              1024 /
              1024
            ).toFixed(1)} GB (${((usedMem / totalMem) * 100).toFixed(1)}%)`,
            `Home: ${os.homedir()}`,
            `Temp: ${os.tmpdir()}`,
          ];

          return { success: true, output: info.join("\n") };
        },
      },

      list_processes: {
        meta: {
          name: "list_processes",
          description: "List running processes on the system",
          parameters: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description:
                  "Maximum number of processes to list (default: 20)",
              },
            },
            required: [],
          },
          riskLevel: "low",
        },
        execute: async (args): Promise<SkillResult> => {
          const limit = Number(args.limit) || 20;
          const isWindows = process.platform === "win32";
          const shellBinary = isWindows ? "powershell.exe" : "pwsh";
          const command = `Get-Process | Select-Object -First ${limit} Name, Id, CPU`;

          try {
            const { stdout } = await execFileAsync(
              shellBinary,
              ["-NoProfile", "-NonInteractive", "-Command", command],
              { windowsHide: true, timeout: 10000 },
            );
            return { success: true, output: stdout.trim() };
          } catch (error) {
            return { success: false, error: String(error) };
          }
        },
      },

      get_env: {
        meta: {
          name: "get_env",
          description: "Get an environment variable value",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the environment variable",
              },
            },
            required: ["name"],
          },
          riskLevel: "low",
        },
        execute: async (args): Promise<SkillResult> => {
          const name = String(args.name || "");
          if (!name) {
            return {
              success: false,
              error: "Environment variable name is required",
            };
          }
          const value = process.env[name];
          if (value === undefined) {
            return {
              success: true,
              output: `Environment variable "${name}" is not set`,
            };
          }
          return { success: true, output: `${name}=${value}` };
        },
      },

      get_uptime: {
        meta: {
          name: "get_uptime",
          description: "Get system uptime",
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
          riskLevel: "low",
        },
        execute: async (): Promise<SkillResult> => {
          const uptimeSeconds = os.uptime();
          const days = Math.floor(uptimeSeconds / 86400);
          const hours = Math.floor((uptimeSeconds % 86400) / 3600);
          const minutes = Math.floor((uptimeSeconds % 3600) / 60);

          const parts: string[] = [];
          if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
          if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
          if (minutes > 0)
            parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

          return {
            success: true,
            output: `System uptime: ${parts.join(", ")}`,
          };
        },
      },
    },

    init: async (context: SkillContext) => {
      context.log("System skill initialized", "info");
    },

    destroy: async (context: SkillContext) => {
      context.log("System skill destroyed", "info");
    },
  };
}
