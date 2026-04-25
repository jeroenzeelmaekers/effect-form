import { X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useId, useRef, useState } from "react";

import {
  FILTER_FIELD_PREFIXES,
  queryToSegments,
  serializeTokens,
  tokenize,
} from "@/domains/user/filter";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";

const BASE_SUGGESTIONS: Array<{ label: string; hint: string }> = [
  ...FILTER_FIELD_PREFIXES.map((p) => ({ label: p, hint: "field filter" })),
  { label: "AND", hint: "both must match" },
  { label: "OR", hint: "either must match" },
];

function fuzzyScore(candidate: string, query: string): number {
  if (!query) return 0;
  const c = candidate.toLowerCase();
  const q = query.toLowerCase();

  let ci = 0;
  let qi = 0;
  let score = 0;
  let consecutive = 0;

  while (ci < c.length && qi < q.length) {
    if (c[ci] === q[qi]) {
      consecutive++;
      score += consecutive * 2;
      qi++;
    } else {
      consecutive = 0;
    }
    ci++;
  }

  return qi < q.length ? -1 : score;
}

function getFuzzySuggestions(
  input: string,
): Array<{ label: string; hint: string }> {
  if (!input.trim()) return [];
  return BASE_SUGGESTIONS.map((s) => ({
    ...s,
    score: fuzzyScore(s.label, input),
  }))
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(({ label, hint }) => ({ label, hint }));
}

function HighlightedLabel({ label, query }: { label: string; query: string }) {
  const q = query.toLowerCase();
  const l = label.toLowerCase();

  const matched = new Set<number>();
  let qi = 0;
  for (let i = 0; i < l.length && qi < q.length; i++) {
    if (l[i] === q[qi]) {
      matched.add(i);
      qi++;
    }
  }

  return (
    <span>
      {label.split("").map((ch, i) =>
        matched.has(i) ? (
          <mark
            key={i}
            className="text-foreground bg-transparent font-semibold">
            {ch}
          </mark>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </span>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className="border-border h-5 gap-0.5 rounded-sm border px-1.5 py-0 font-mono text-[0.65rem]">
      <span>{label}</span>
      <button
        type="button"
        aria-label={`Remove filter ${label}`}
        onClick={onRemove}
        className="ml-0.5 cursor-pointer rounded-full p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-current focus-visible:outline-none">
        <X className="size-2.5" />
      </button>
    </Badge>
  );
}

function OperatorLabel({ op }: { op: "AND" | "OR" }) {
  return (
    <span className="text-muted-foreground px-0.5 font-mono text-[0.6rem] font-semibold tracking-wider uppercase select-none">
      {op}
    </span>
  );
}

/**
 * Token-based combobox filter input for the user list.
 *
 * Tokenizes the user's input into typed filter chips (field filters such as
 * `name:john`, free-text terms, and boolean operators `AND` / `OR`). The
 * composed filter string is persisted to the `filter` URL query parameter via
 * `nuqs` so that filter state survives navigation.
 *
 * Keyboard interactions:
 * - `Space` / `Enter` — commit the current input as a token
 * - `Backspace` (empty input) — remove the last token
 * - `ArrowDown` / `ArrowUp` — navigate the autocomplete suggestion list
 * - `Tab` / `Enter` (suggestion focused) — accept the highlighted suggestion
 * - `Escape` (suggestion open) — dismiss suggestions
 * - `Escape` (no suggestions, filter active) — clear all tokens
 */
export function UserFilter() {
  const [filterQuery, setFilterQuery] = useQueryState(
    "filter",
    parseAsString.withDefault(""),
  );

  const segments = queryToSegments(filterQuery);

  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputValueRef = useRef(inputValue);
  const listboxId = useId();

  const suggestions = getFuzzySuggestions(inputValue);
  const isOpen = inputValue.trim().length > 0 && suggestions.length > 0;

  useEffect(() => {
    setActiveIndex(-1);
    inputValueRef.current = inputValue;
  }, [inputValue]);

  function commitToken(raw: string) {
    const token = raw.trim();
    if (!token) return;

    const newTokens = tokenize(token);
    if (newTokens.length === 0) return;

    const merged = [...segments];
    for (const t of newTokens) {
      const last = merged[merged.length - 1];
      // Skip if we'd place two operators in a row
      if (t.kind === "op" && last?.kind === "op") continue;
      merged.push(t);
    }

    void setFilterQuery(serializeTokens(merged) || null);
    setInputValue("");
  }

  function removeSegment(index: number) {
    let next = segments.filter((_, i) => i !== index);

    next = next.filter((t, i) => {
      if (t.kind !== "op") return true;
      const prev = next[i - 1];
      const after = next[i + 1];
      if (!prev || !after) return false; // leading or trailing op
      if (prev.kind === "op") return false; // double op
      return true;
    });

    void setFilterQuery(next.length > 0 ? serializeTokens(next) : null);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        return;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        if (activeIndex >= 0) {
          e.preventDefault();
          const selected = suggestions[activeIndex];
          if (selected.label.endsWith(":")) {
            setInputValue(selected.label);
          } else {
            commitToken(selected.label);
          }
          return;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setInputValue("");
        return;
      }
    }

    if (e.key === "Escape" && hasFilter) {
      e.preventDefault();
      clearAll();
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commitToken(inputValue);
      return;
    }

    if (e.key === "Backspace" && inputValue === "" && segments.length > 0) {
      removeSegment(segments.length - 1);
    }
  }

  function clearAll() {
    void setFilterQuery(null);
    setInputValue("");
    inputRef.current?.focus();
  }

  const hasFilter = segments.length > 0 || inputValue.length > 0;

  return (
    <div role="group" aria-label="Filter users" className="relative w-full">
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "bg-input/20 dark:bg-input/30 border-input focus-within:border-ring focus-within:ring-ring/30",
          "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-md border px-2 py-1 text-sm transition-colors",
          "cursor-text focus-within:ring-2",
        )}>
        {/* Segments: chips and operator labels */}
        {segments.map((seg, i) =>
          seg.kind === "op" ? (
            <OperatorLabel key={i} op={seg.op} />
          ) : (
            <FilterChip
              key={i}
              label={
                seg.kind === "field" ? `${seg.field}:${seg.value}` : seg.value
              }
              onRemove={() => removeSegment(i)}
            />
          ),
        )}

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setTimeout(() => commitToken(inputValueRef.current), 150);
          }}
          placeholder={
            segments.length === 0
              ? "Filter users… e.g. name:john OR email:*@gmail.com"
              : ""
          }
          aria-label="Filter query input"
          className="placeholder:text-muted-foreground min-w-32 flex-1 bg-transparent text-xs outline-none"
        />

        {hasFilter && (
          <button
            type="button"
            aria-label="Clear all filters"
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
            className="text-muted-foreground hover:text-foreground ml-auto cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-current focus-visible:outline-none">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <ul
        id={listboxId}
        role="listbox"
        aria-label="Filter suggestions"
        hidden={!isOpen}
        className="bg-popover border-border absolute top-full left-0 z-50 mt-1 w-full min-w-48 overflow-hidden rounded-md border shadow-md">
        {suggestions.map((s, i) => (
          <li
            key={s.label}
            id={`${listboxId}-option-${i}`}
            role="option"
            aria-selected={i === activeIndex}
            onMouseDown={(e) => {
              e.preventDefault();
              if (s.label.endsWith(":")) {
                setInputValue(s.label);
                inputRef.current?.focus();
              } else {
                commitToken(s.label);
              }
            }}
            onMouseEnter={() => setActiveIndex(i)}
            className={cn(
              "text-muted-foreground flex cursor-pointer items-center justify-between gap-4 px-3 py-1.5 font-mono text-xs transition-colors",
              i === activeIndex && "bg-accent text-accent-foreground",
            )}>
            <HighlightedLabel label={s.label} query={inputValue} />
            <span className="text-muted-foreground/60 font-sans text-[0.6rem]">
              {s.hint}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
