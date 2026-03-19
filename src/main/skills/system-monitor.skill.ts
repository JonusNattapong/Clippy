/**
 * System Monitor Skill - Real-time system resource monitoring
 *
 * Provides CPU, memory, disk, and network monitoring.
 * Uses Node.js os module for system information.
 */

import os from "node:os";
import fs from "node:fs";
import path from "node:path";

import type { Skill, SkillContext, SkillResult } from "./types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "0m";
}

function getCpuUsage(): number {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  }

  return Math.round(((totalTick - totalIdle) / totalTick) * 100);
}

function getDiskUsage(drivePath: string): {
  total: number;
  free: number;
  used: number;
  percent: number;
} | null {
  try {
    if (process.platform === "win32") {
      // Windows: use PowerShell to get disk info
      const { execSync } = require("node:child_process");
      const driveLetter = path.parse(drivePath).root.replace("\\", "");
      const result = execSync(
        `powershell -Command "Get-PSDrive -Name '${driveLetter.replace(":","")}' | Select-Object Used,Free | ConvertTo-Json"`,
        { encoding: "utf8", timeout: 5000 },
      );
      const data = JSON.parse(result);
      const total = (data.Used || 0) + (data.Free || 0);
      const used = data.Used || 0;
      const free = data.Free || 0;
      return {
        total,
        free,
        used,
        percent: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    } else {
      // Unix: use statvfs via a simple check
      const stats = fs.statfsSync(drivePath);
      const total = stats.blocks * stats.bsize;
      const free = stats.bfree * stats.bsize;
      const used = total - free;
      return {
        total,
        free,
        used,
        percent: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    }
  } catch {
    return null;
  }
}

function getMemoryBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}

function getStatusEmoji(percent: number): string {
  if (percent < 50) return "🟢";
  if (percent < 80) return "🟡";
  return "🔴";
}

export function createSystemMonitorSkill(): Skill {
  let monitoringInterval: ReturnType<typeof setInterval> | null = null;

  return {
    meta: {
      id: "system-monitor",
      name: "System Monitor",
      version: "1.0.0",
      description:
        "Monitor system resources including CPU, memory, disk, and network. Get real-time stats and alerts.",
      author: "Clippy",
      categories: ["utilities", "system"],
      keywords: ["monitor", "cpu", "memory", "ram", "disk", "system", "stats"],
      enabledByDefault: true,
    },

    actions: {
      get_system_stats: {
        meta: {
          name: "get_system_stats",
          description:
            'Get current system resource usage (CPU, memory, disk). Example: "system stats", "how much RAM am I using?"',
          parameters: {
            type: "object",
            properties: {
              detailed: {
                type: "boolean",
                description: "Show detailed information (default: false)",
              },
            },
            required: [],
          },
          riskLevel: "low",
        },
        execute: async (
          args: Record<string, unknown>,
          _context: SkillContext,
        ): Promise<SkillResult> => {
          try {
            const detailed = args.detailed === true;

            // CPU
            const cpuUsage = getCpuUsage();
            const cpus = os.cpus();
            const cpuModel = cpus[0]?.model || "Unknown";
            const cpuCores = cpus.length;

            // Memory
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memPercent = Math.round((usedMem / totalMem) * 100);

            // Disk (user home directory)
            const homeDir = os.homedir();
            const diskInfo = getDiskUsage(homeDir);

            // Uptime
            const uptime = os.uptime();

            const lines: string[] = [
              `📊 System Resource Monitor`,
              `━━━━━━━━━━━━━━━━━━━━━━━━`,
              ``,
              `${getStatusEmoji(cpuUsage)} CPU Usage: ${cpuUsage}%`,
              `${getMemoryBar(cpuUsage, 15)}`,
              `   Model: ${cpuModel}`,
              `   Cores: ${cpuCores}`,
              ``,
              `${getStatusEmoji(memPercent)} Memory: ${formatBytes(usedMem)} / ${formatBytes(totalMem)} (${memPercent}%)`,
              `${getMemoryBar(memPercent, 15)}`,
              `   Free: ${formatBytes(freeMem)}`,
            ];

            if (diskInfo) {
              lines.push(
                ``,
                `${getStatusEmoji(diskInfo.percent)} Disk (${homeDir}):`,
                `   Used: ${formatBytes(diskInfo.used)} / ${formatBytes(diskInfo.total)} (${diskInfo.percent}%)`,
                `   Free: ${formatBytes(diskInfo.free)}`,
              );
            }

            lines.push(
              ``,
              `⏱️ System Uptime: ${formatUptime(uptime)}`,
              `🖥️ Platform: ${os.platform()} ${os.release()}`,
              `🏠 Hostname: ${os.hostname()}`,
            );

            if (detailed) {
              const networkInterfaces = os.networkInterfaces();
              lines.push(``, `🌐 Network Interfaces:`);
              for (const [name, interfaces] of Object.entries(
                networkInterfaces,
              )) {
                if (interfaces) {
                  for (const iface of interfaces) {
                    if (iface.family === "IPv4" && !iface.internal) {
                      lines.push(`   ${name}: ${iface.address}`);
                    }
                  }
                }
              }

              const loadAvg = os.loadavg();
              lines.push(
                ``,
                `📈 Load Average: ${loadAvg.map((l) => l.toFixed(2)).join(", ")}`,
              );
            }

            return {
              success: true,
              output: lines.join("\n"),
              data: {
                cpuUsage,
                memoryTotal: totalMem,
                memoryUsed: usedMem,
                memoryFree: freeMem,
                memoryPercent: memPercent,
                diskInfo,
                uptime,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to get system stats: ${error}`,
            };
          }
        },
      },

      get_top_processes: {
        meta: {
          name: "get_top_processes",
          description:
            'List top processes by CPU or memory usage. Example: "what\'s using the most CPU?", "top processes"',
          parameters: {
            type: "object",
            properties: {
              sort_by: {
                type: "string",
                description: "Sort by: cpu or memory (default: cpu)",
              },
              limit: {
                type: "number",
                description: "Number of processes to show (default: 10)",
              },
            },
            required: [],
          },
          riskLevel: "low",
        },
        execute: async (
          args: Record<string, unknown>,
          _context: SkillContext,
        ): Promise<SkillResult> => {
          try {
            const sortBy = String(args.sort_by || "cpu").toLowerCase();
            const limit = Math.min(50, Math.max(1, Number(args.limit) || 10));

            if (process.platform === "win32") {
              const { execFile } = require("node:child_process");
              const { promisify } = require("node:util");
              const execFileAsync = promisify(execFile);

              const sortField =
                sortBy === "memory"
                  ? "WorkingSet64"
                  : "CPU";
              const command = `Get-Process | Sort-Object -Property ${sortField} -Descending | Select-Object -First ${limit} Name, Id, CPU, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet64/1MB,1)}} | ConvertTo-Json`;

              const { stdout } = await execFileAsync(
                "powershell.exe",
                ["-NoProfile", "-NonInteractive", "-Command", command],
                { timeout: 10000 },
              );

              const processes = JSON.parse(stdout);
              const procArray = Array.isArray(processes)
                ? processes
                : [processes];

              const lines = [
                `📋 Top ${limit} Processes (by ${sortBy})`,
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                "",
              ];

              for (const proc of procArray) {
                const mem = proc["Memory(MB)"] || 0;
                const cpu = proc.CPU ? proc.CPU.toFixed(1) : "0.0";
                lines.push(
                  `• ${proc.Name} (PID: ${proc.Id}) - CPU: ${cpu}s, RAM: ${mem} MB`,
                );
              }

              return { success: true, output: lines.join("\n") };
            } else {
              const { execFile } = require("node:child_process");
              const { promisify } = require("node:util");
              const execFileAsync = promisify(execFile);

              // Use a cross-platform approach: ps aux and sort in Node
              const { stdout } = await execFileAsync(
                "ps",
                ["aux"],
                { timeout: 10000 },
              );

              const lines = [
                `📋 Top ${limit} Processes (by ${sortBy})`,
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                "",
              ];

              // Parse ps aux output and sort manually for cross-platform compatibility
              const processLines = stdout.trim().split("\n").slice(1); // skip header
              const processes = processLines
                .map((line) => {
                  const parts = line.trim().split(/\s+/);
                  if (parts.length < 11) return null;
                  return {
                    user: parts[0],
                    pid: parts[1],
                    cpu: parseFloat(parts[2]) || 0,
                    mem: parseFloat(parts[3]) || 0,
                    command: parts.slice(10).join(" ").slice(0, 50),
                  };
                })
                .filter(Boolean)
                .sort((a, b) =>
                  sortBy === "memory" ? b!.mem - a!.mem : b!.cpu - a!.cpu,
                )
                .slice(0, limit);

              for (const proc of processes) {
                lines.push(
                  `• ${proc!.command} (PID: ${proc!.pid}) - CPU: ${proc!.cpu}%, RAM: ${proc!.mem}%`,
                );
              }

              return { success: true, output: lines.join("\n") };
            }
          } catch (error) {
            return {
              success: false,
              error: `Failed to get processes: ${error}`,
            };
          }
        },
      },

      check_disk_space: {
        meta: {
          name: "check_disk_space",
          description:
            'Check disk space usage for all drives. Example: "disk space", "how much storage do I have?"',
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
          riskLevel: "low",
        },
        execute: async (
          _args: Record<string, unknown>,
          _context: SkillContext,
        ): Promise<SkillResult> => {
          try {
            if (process.platform === "win32") {
              const { execFile } = require("node:child_process");
              const { promisify } = require("node:util");
              const execFileAsync = promisify(execFile);

              const { stdout } = await execFileAsync(
                "powershell.exe",
                [
                  "-NoProfile",
                  "-NonInteractive",
                  "-Command",
                  "Get-PSDrive -PSProvider FileSystem | Select-Object Name, Used, Free, @{Name='Total';Expression={$_.Used+$_.Free}} | ConvertTo-Json",
                ],
                { timeout: 10000 },
              );

              const drives = JSON.parse(stdout);
              const driveArray = Array.isArray(drives) ? drives : [drives];

              const lines = [
                `💾 Disk Space Report`,
                `━━━━━━━━━━━━━━━━━━━━`,
                "",
              ];

              for (const drive of driveArray) {
                const total = drive.Total || 0;
                const used = drive.Used || 0;
                const free = drive.Free || 0;
                const percent = total > 0 ? Math.round((used / total) * 100) : 0;

                lines.push(
                  `${getStatusEmoji(percent)} Drive ${drive.Name}:`,
                  `   Used: ${formatBytes(used)} / ${formatBytes(total)} (${percent}%)`,
                  `   Free: ${formatBytes(free)}`,
                  `${getMemoryBar(percent, 15)}`,
                  "",
                );
              }

              return { success: true, output: lines.join("\n") };
            } else {
              const { execSync } = require("node:child_process");
              const output = execSync("df -h", {
                encoding: "utf8",
                timeout: 5000,
              });

              const lines = [
                `💾 Disk Space Report`,
                `━━━━━━━━━━━━━━━━━━━━`,
                "",
                output.trim(),
              ];

              return { success: true, output: lines.join("\n") };
            }
          } catch (error) {
            return {
              success: false,
              error: `Failed to check disk space: ${error}`,
            };
          }
        },
      },
    },

    async init(_context: SkillContext) {
      console.log("[System Monitor Skill] Initialized");
    },

    async destroy(_context: SkillContext) {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
      }
    },
  };
}