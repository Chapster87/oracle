"use client";

import React, { useState, useMemo } from "react";
import { Search, Tag, Globe, Lock, EyeOff } from "lucide-react";
import clsx from "clsx";
import { WorldLore } from "../../types";
import s from "./KnowledgeBase.module.css";

interface KnowledgeBaseProps {
  entries: WorldLore[];
  isDM: boolean;
}

/**
 * KnowledgeBase directory component for browsing world lore.
 *
 * @param entries - List of lore entries to display.
 * @param isDM - Whether the current user has DM privileges.
 */
export default function KnowledgeBase({ entries, isDM }: KnowledgeBaseProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = entries.reduce(
      (acc, entry) => {
        const cat = entry.category || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(cats).sort((a, b) => a[0].localeCompare(b[0]));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesCategory =
        !selectedCategory ||
        (entry.category || "Uncategorized") === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [entries, searchTerm, selectedCategory]);

  return (
    <div className={s.container}>
      {/* Sidebar Navigation */}
      <aside className={s.sidebar}>
        <div className={s.searchContainer}>
          <Search className={s.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search lore..."
            className={s.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={s.categoryList}>
          <button
            className={clsx(
              s.categoryItem,
              !selectedCategory && s.categoryItemActive,
            )}
            onClick={() => setSelectedCategory(null)}
          >
            <span>All Entries</span>
            <span className={s.count}>{entries.length}</span>
          </button>
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              className={clsx(
                s.categoryItem,
                selectedCategory === cat && s.categoryItemActive,
              )}
              onClick={() => setSelectedCategory(cat)}
            >
              <span>{cat}</span>
              <span className={s.count}>{count}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={s.main}>
        <div className={s.grid}>
          {filteredEntries.map((entry) => (
            <div key={entry.id} className={s.card}>
              <div className={s.cardHeader}>
                <h4 className={s.cardTitle}>{entry.name}</h4>
                <div className={s.badgeContainer}>
                  {entry.visibility === "public" && (
                    <span className={clsx(s.badge, s.publicBadge)}>
                      <Globe size={10} style={{ marginRight: "4px" }} />
                      Public
                    </span>
                  )}
                  {entry.visibility === "private" && (
                    <span className={clsx(s.badge, s.privateBadge)}>
                      <Lock size={10} style={{ marginRight: "4px" }} />
                      Private
                    </span>
                  )}
                  {entry.visibility === "secret" && (
                    <span className={clsx(s.badge, s.secretBadge)}>
                      <EyeOff size={10} style={{ marginRight: "4px" }} />
                      Secret
                    </span>
                  )}
                </div>
              </div>
              <div className={s.cardContent}>
                {entry.content.replace(/[#*`]/g, "").substring(0, 200)}...
              </div>
              {entry.tags && entry.tags.length > 0 && (
                <div className={s.tagList}>
                  {entry.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={s.tag}>
                      <Tag size={10} style={{ marginRight: "2px" }} />
                      {tag}
                    </span>
                  ))}
                  {entry.tags.length > 3 && (
                    <span className={s.tag}>+{entry.tags.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {filteredEntries.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "48px",
              color: "var(--muted-foreground)",
            }}
          >
            No lore entries found matching your criteria.
          </div>
        )}
      </main>
    </div>
  );
}
