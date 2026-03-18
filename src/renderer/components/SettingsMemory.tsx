import { useCallback, useEffect, useState } from "react";
import { clippyApi } from "../clippyApi";
import {
  Memory,
  MemoryCategory,
  MemoryMaintenanceReport,
  MemoryStats,
} from "../../types/interfaces";
import { useTranslation } from "../contexts/SharedStateContext";

export const SettingsMemory: React.FC = () => {
  const t = useTranslation();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    MemoryCategory | "all"
  >("all");
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [maintenanceReport, setMaintenanceReport] =
    useState<MemoryMaintenanceReport | null>(null);

  const CATEGORY_LABELS: Record<MemoryCategory, string> = {
    fact: t.fact,
    preference: t.preference,
    event: t.event,
    relationship: t.relationship,
  };

  const CATEGORY_COLORS: Record<MemoryCategory, string> = {
    fact: "#4a90d9",
    preference: "#5cb85c",
    event: "#f0ad4e",
    relationship: "#d9534f",
  };

  // Form states
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<MemoryCategory>("fact");
  const [formImportance, setFormImportance] = useState(5);

  const loadData = useCallback(async () => {
    try {
      const [allMemories, currentStats] = await Promise.all([
        clippyApi.getAllMemories(),
        clippyApi.getMemoryStats(),
      ]);
      setMemories(allMemories);
      setStats(currentStats);
    } catch (error) {
      console.error("Error loading memories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMemories = memories.filter((memory) => {
    const matchesSearch = memory.content
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || memory.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const memoryConflicts = findMemoryConflicts(memories);

  const handleCreate = async () => {
    if (!formContent.trim()) return;

    try {
      await clippyApi.createMemory(
        formContent.trim(),
        formCategory,
        formImportance,
      );
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error creating memory:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingMemory || !formContent.trim()) return;

    try {
      await clippyApi.updateMemory(editingMemory.id, {
        content: formContent.trim(),
        category: formCategory,
        importance: formImportance,
      });
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error updating memory:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirm_delete_chat)) return; // Shared key or could add specific one

    try {
      await clippyApi.deleteMemory(id);
      loadData();
    } catch (error) {
      console.error("Error deleting memory:", error);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(t.confirm_delete_all)) return;

    try {
      await clippyApi.deleteAllMemories();
      loadData();
    } catch (error) {
      console.error("Error deleting all memories:", error);
    }
  };

  const handleRunMaintenance = async () => {
    try {
      const report = await clippyApi.runMemoryMaintenance();
      setMaintenanceReport(report);
      await loadData();
    } catch (error) {
      console.error("Error running maintenance:", error);
    }
  };

  const handleKeepNewestConflict = async (group: MemoryConflictGroup) => {
    const [newest, ...older] = group.memories;
    try {
      for (const memory of older) {
        await clippyApi.deleteMemory(memory.id);
      }
      if (newest.retention !== "long_term") {
        await clippyApi.updateMemory(newest.id, { retention: "long_term" });
      }
      await loadData();
    } catch (error) {
      console.error("Error resolving conflict:", error);
    }
  };

  const startEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setFormContent(memory.content);
    setFormCategory(memory.category);
    setFormImportance(memory.importance);
    setIsCreating(false);
  };

  const startCreate = () => {
    setEditingMemory(null);
    setFormContent("");
    setFormCategory("fact");
    setFormImportance(5);
    setIsCreating(true);
  };

  const resetForm = () => {
    setEditingMemory(null);
    setIsCreating(false);
    setFormContent("");
    setFormCategory("fact");
    setFormImportance(5);
  };

  const getRelationshipLevel = (bond: number): string => {
    if (bond >= 80) return t.best_friends;
    if (bond >= 60) return t.close_friends;
    if (bond >= 40) return t.friends;
    if (bond >= 20) return t.acquaintances;
    return t.strangers;
  };

  const getMood = (happiness: number): string => {
    if (happiness >= 80) return t.ecstatic;
    if (happiness >= 60) return t.happy;
    if (happiness >= 40) return t.content_mood;
    if (happiness >= 20) return t.neutral;
    return t.sad;
  };

  const getPrimaryMood = (mood: MemoryStats["mood"]["primary"]): string => {
    switch (mood) {
      case "playful":
        return t.mood_playful;
      case "supportive":
        return t.mood_supportive;
      case "excited":
        return t.mood_excited;
      case "focused":
        return t.mood_focused;
      case "concerned":
        return t.mood_concerned;
      case "calm":
      default:
        return t.mood_calm;
    }
  };

  const getResponseStyle = (
    style: MemoryStats["mood"]["responseStyle"],
  ): string => {
    switch (style) {
      case "gentle":
        return t.response_gentle;
      case "energetic":
        return t.response_energetic;
      case "balanced":
      default:
        return t.response_balanced;
    }
  };

  const getUserTone = (tone: MemoryStats["mood"]["userTone"]): string => {
    switch (tone) {
      case "positive":
        return t.tone_positive;
      case "affectionate":
        return t.tone_affectionate;
      case "curious":
        return t.tone_curious;
      case "distressed":
        return t.tone_distressed;
      case "frustrated":
        return t.tone_frustrated;
      case "neutral":
      default:
        return t.tone_neutral;
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-page-intro">
          <h3>{t.memory}</h3>
          <p>{t.saving.replace("...", "")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page-intro">
        <h3>{t.memory}</h3>
        <p>{t.memory_description}</p>
      </div>

      {/* Stats Section */}
      {stats && (
        <fieldset style={{ marginBottom: "20px" }}>
          <legend>{t.relationship_stats}</legend>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ marginBottom: "8px" }}>
                <strong>{t.bond_level}:</strong>{" "}
                {getRelationshipLevel(stats.bondLevel)} ({stats.bondLevel}/100)
              </div>
              <div
                style={{
                  width: "100%",
                  height: "20px",
                  backgroundColor: "#e0e0e0",
                  border: "2px solid #808080",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${stats.bondLevel}%`,
                    height: "100%",
                    backgroundColor: "#4a90d9",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ marginBottom: "8px" }}>
                <strong>{t.happiness}:</strong> {getMood(stats.happiness)} (
                {stats.happiness}/100)
              </div>
              <div
                style={{
                  width: "100%",
                  height: "20px",
                  backgroundColor: "#e0e0e0",
                  border: "2px solid #808080",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${stats.happiness}%`,
                    height: "100%",
                    backgroundColor: "#5cb85c",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
            <div>
              <strong>{t.current_mood}:</strong>{" "}
              {getPrimaryMood(stats.mood.primary)} ({stats.mood.intensity}/100)
            </div>
            <div>
              <strong>{t.response_style}:</strong>{" "}
              {getResponseStyle(stats.mood.responseStyle)} |{" "}
              <strong>{t.user_tone}:</strong> {getUserTone(stats.mood.userTone)}{" "}
              | <strong>{t.social_battery}:</strong> {stats.mood.socialBattery}
              /100
            </div>
            <div>{stats.mood.summary}</div>
            {t.total_interactions}: {stats.totalInteractions} |{" "}
            {t.last_interaction}:{" "}
            {stats.lastInteractionAt
              ? new Date(stats.lastInteractionAt).toLocaleString()
              : t.never}
          </div>
        </fieldset>
      )}

      {/* Search and Filter */}
      <fieldset style={{ marginBottom: "20px" }}>
        <legend>{t.memory_review}</legend>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button type="button" onClick={handleRunMaintenance}>
            {t.run_cleanup_now}
          </button>
          {maintenanceReport && (
            <span style={{ fontSize: "12px", color: "#666" }}>
              removed {maintenanceReport.removed}, merged{" "}
              {maintenanceReport.merged}, summarized{" "}
              {maintenanceReport.summarized}
            </span>
          )}
        </div>
      </fieldset>

      {memoryConflicts.length > 0 && (
        <fieldset style={{ marginBottom: "20px" }}>
          <legend>
            {t.potential_conflicts} ({memoryConflicts.length})
          </legend>
          <div style={{ display: "grid", gap: "10px" }}>
            {memoryConflicts.map((group) => (
              <div
                key={group.key}
                style={{
                  border: "1px solid #d0c7a1",
                  borderRadius: "8px",
                  padding: "10px",
                  background: "rgba(255,255,255,0.5)",
                }}
              >
                <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                  <strong>Key:</strong> {group.key}
                </div>
                <div
                  style={{ display: "grid", gap: "6px", marginBottom: "10px" }}
                >
                  {group.memories.map((memory, index) => (
                    <div key={memory.id} style={{ fontSize: "12px" }}>
                      <strong>{index === 0 ? "Newest" : "Older"}:</strong>{" "}
                      {memory.content}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleKeepNewestConflict(group)}
                  >
                    {t.keep_newest}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(group.memories[0])}
                  >
                    {t.review_manually}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset style={{ marginBottom: "20px" }}>
        <legend>{t.search_filter}</legend>
        <div className="field-row" style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder={t.search_memories}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <div className="field-row">
          <label>{t.category}:</label>
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as MemoryCategory | "all")
            }
          >
            <option value="all">{t.all_categories}</option>
            {(Object.keys(CATEGORY_LABELS) as MemoryCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* Add Memory Button */}
      <div style={{ marginBottom: "15px" }}>
        <button type="button" onClick={startCreate} disabled={isCreating}>
          + {t.add_memory}
        </button>
        <button
          type="button"
          onClick={handleDeleteAll}
          style={{ marginLeft: "10px", color: "#d9534f" }}
          disabled={memories.length === 0}
        >
          {t.delete_all}
        </button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingMemory) && (
        <fieldset style={{ marginBottom: "20px", backgroundColor: "#f5f5f5" }}>
          <legend>{editingMemory ? t.edit_memory : t.add_new_memory}</legend>
          <div className="field-row-stacked" style={{ marginBottom: "10px" }}>
            <label>{t.content}:</label>
            <textarea
              rows={3}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder={t.type_message}
              style={{ resize: "vertical" }}
            />
          </div>
          <div className="field-row" style={{ marginBottom: "10px" }}>
            <label>{t.category}:</label>
            <select
              value={formCategory}
              onChange={(e) =>
                setFormCategory(e.target.value as MemoryCategory)
              }
            >
              {(Object.keys(CATEGORY_LABELS) as MemoryCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <div className="field-row" style={{ marginBottom: "10px" }}>
            <label>{t.importance} (1-10):</label>
            <input
              type="number"
              min={1}
              max={10}
              value={formImportance}
              onChange={(e) => setFormImportance(parseInt(e.target.value) || 5)}
              style={{ width: "60px" }}
            />
          </div>
          <div className="field-row">
            <button
              type="button"
              onClick={editingMemory ? handleUpdate : handleCreate}
            >
              {editingMemory ? t.update : t.create}
            </button>
            <button
              type="button"
              onClick={resetForm}
              style={{ marginLeft: "10px" }}
            >
              {t.cancel}
            </button>
          </div>
        </fieldset>
      )}

      {/* Memories List */}
      <fieldset>
        <legend>
          {t.memories} ({filteredMemories.length})
        </legend>
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "2px solid #808080",
            backgroundColor: "white",
          }}
        >
          {filteredMemories.length === 0 ? (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#666" }}
            >
              {searchQuery || selectedCategory !== "all"
                ? t.no_memories_found
                : t.no_memories_yet}
            </div>
          ) : (
            filteredMemories.map((memory) => (
              <div
                key={memory.id}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #ddd",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: CATEGORY_COLORS[memory.category],
                    marginTop: "6px",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                    {memory.content}
                  </div>
                  <div style={{ fontSize: "11px", color: "#666" }}>
                    <span
                      style={{
                        color: CATEGORY_COLORS[memory.category],
                        fontWeight: "bold",
                      }}
                    >
                      {CATEGORY_LABELS[memory.category]}
                    </span>{" "}
                    • {t.importance_label}: {memory.importance}/10 •{" "}
                    {t.memory_retention}:{" "}
                    {memory.retention === "short_term"
                      ? t.retention_short_term
                      : t.retention_long_term}{" "}
                    • {new Date(memory.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    type="button"
                    onClick={() => startEdit(memory)}
                    style={{ fontSize: "11px", padding: "2px 8px" }}
                  >
                    {t.edit_memory.split(" ")[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(memory.id)}
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      color: "#d9534f",
                    }}
                  >
                    {t.delete_selected.split(" ")[0]}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </fieldset>
    </div>
  );
};

type MemoryConflictGroup = {
  key: string;
  memories: Memory[];
};

function findMemoryConflicts(memories: Memory[]): MemoryConflictGroup[] {
  const byKey = new Map<string, Memory[]>();

  for (const memory of memories) {
    if (!memory.key || memory.retention === "short_term") {
      continue;
    }

    const grouped = byKey.get(memory.key) || [];
    grouped.push(memory);
    byKey.set(memory.key, grouped);
  }

  return Array.from(byKey.entries())
    .map(([key, items]) => ({
      key,
      memories: items.sort((a, b) => b.updatedAt - a.updatedAt),
    }))
    .filter(({ memories: items }) => {
      if (items.length < 2) {
        return false;
      }

      const normalized = new Set(
        items.map((memory) => memory.content.toLowerCase().trim()),
      );
      return normalized.size > 1;
    });
}
