"use client";

import { CalendarDays, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SiteSearchEntry = {
  title: string;
  summary: string;
  url: string;
  section: string;
  date: string;
  tags: string[];
  search: string;
};

type SiteSearchProps = {
  entries: SiteSearchEntry[];
};

export function SiteSearch({ entries }: SiteSearchProps) {
  const resultsId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const fieldRef = useRef<HTMLLabelElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const tokens = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length === 0) {
      return [];
    }

    return entries
      .filter((entry) => tokens.every((token) => entry.search.includes(token)))
      .slice(0, 8);
  }, [entries, query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const hasQuery = query.trim().length > 0;
  const suggestions = entries.slice(0, 5);
  const visibleEntries = hasQuery ? results : suggestions;
  const showResults = open && entries.length > 0;

  return (
    <label className="site-search" ref={fieldRef}>
      <Search size={18} aria-hidden="true" />
      <span className="sr-only">搜索随笔站内容</span>
      <input
        ref={inputRef}
        type="search"
        placeholder={entries.length > 0 ? "搜索日记、旅行、灵感..." : "当前页暂无搜索索引"}
        autoComplete="off"
        spellCheck={false}
        aria-controls={resultsId}
        aria-expanded={showResults}
        disabled={entries.length === 0}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {query ? (
        <button
          className="site-search__clear"
          type="button"
          aria-label="清空搜索"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
        >
          <X size={15} />
        </button>
      ) : null}
      {showResults ? (
        <div className="site-search__results" id={resultsId} role="listbox">
          <div className="site-search__panel-header">
            <span>{hasQuery ? "搜索结果" : "最近记录"}</span>
            {hasQuery ? <small>{results.length} 条</small> : null}
          </div>
          {visibleEntries.length > 0 ? (
            visibleEntries.map((entry) => (
              <a className="site-search__result" href={entry.url} key={entry.url} role="option">
                <span className="site-search__section">{entry.section}</span>
                <strong>{entry.title}</strong>
                <small>{entry.summary}</small>
                <em>
                  <CalendarDays size={13} />
                  {entry.date}
                  {entry.tags.length > 0 ? ` · ${entry.tags.slice(0, 3).join(" / ")}` : ""}
                </em>
              </a>
            ))
          ) : (
            <p className="site-search__empty">没有匹配的记录。</p>
          )}
        </div>
      ) : null}
    </label>
  );
}
