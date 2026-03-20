---
name: system-monitor
description: Monitor system resources including CPU, memory, disk, and network. Get real-time stats and top processes.
location: ~/.clippy/skills/system-monitor
version: 1.0.0
author: Clippy
categories: utilities, system
keywords: monitor, cpu, memory, ram, disk, system, stats
enabledByDefault: true
---

# System Monitor Skill

Monitor your system resources in real-time.

## Usage

Use the following commands in chat:

- `/monitor` — Show CPU, RAM, Disk stats
- `/monitor --detailed` — Show detailed stats including network
- `/top [n]` — Top processes by CPU usage
- `/topmem [n]` — Top processes by memory usage
- `/disk` — Check disk space

## Actions

### get_system_stats

Get current system resource usage (CPU, memory, disk).

```json
{
  "properties": {
    "detailed": {
      "type": "boolean",
      "description": "Show detailed information including network interfaces (default: false)"
    }
  },
  "required": []
}
```

Risk level: low

### get_top_processes

List top processes by CPU or memory usage.

```json
{
  "properties": {
    "sort_by": {
      "type": "string",
      "description": "Sort by: cpu or memory (default: cpu)"
    },
    "limit": {
      "type": "number",
      "description": "Number of processes to show (default: 10)"
    }
  },
  "required": []
}
```

Risk level: low

### check_disk_space

Check disk space usage for all drives.

```json
{
  "properties": {},
  "required": []
}
```

Risk level: low

## Examples

```
/monitor
/monitor --detailed
/top 5
/topmem 10
/disk
```
