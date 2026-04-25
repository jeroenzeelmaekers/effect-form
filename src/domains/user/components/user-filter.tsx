import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import React, { useEffect, useId, useRef, useState } from "react";

import { filterRefAtom } from "@/domains/user/atoms";
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

/**
 * Scores how well `candidate` matches `query` using a fuzzy, consecutive-bonus
 * algorithm.
 *
 * Return values:
 * - `-1`  sentinel: not a match (some query characters were not found in candidate)
 * - `0`   all characters matched but none were consecutive (lowest valid match)
 * - `>0`  matched with consecutive runs; higher = tighter / earlier match
 *
 * A score of `0` is still a valid (low-confidence) match and should be shown
 * in suggestions.
 */
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

/**
 * Renders a suggestion label with fuzzy-matched characters highlighted.
 * Individual `<mark>` elements are hidden from assistive technologies to avoid
 * verbose per-character announcements; the parent `<li role="option">` carries
 * the full accessible label instead.
 */
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
    <span aria-hidden="true">
      {label.split("").map((ch, i) =>
        matched.has(i) ? (
          <mark
            key={i}
            aria-hidden="true"
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

const FilterChip = React.forwardRef<
  HTMLButtonElement,
  {
    label: string;
    selected: boolean;
    onRemove: () => void;
    onSelect: (shift: boolean) => void;
    onEdit: () => void;
    onChipKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  }
>(function FilterChip(
  { label, selected, onRemove, onSelect, onEdit, onChipKeyDown },
  ref,
) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-border h-5 gap-0.5 rounded-sm border px-1.5 py-0 font-mono text-[0.65rem] transition-colors",
        selected && "ring-primary/50 bg-primary/10 ring-2",
      )}>
      <button
        ref={ref}
        type="button"
        aria-label={`Select filter ${label}`}
        aria-pressed={selected}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(e.shiftKey);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        onKeyDown={(e) => {
          // Edit mode shortcuts take priority
          if (e.key === "Enter" || e.key === "F2") {
            e.preventDefault();
            onEdit();
            return;
          }
          onChipKeyDown?.(e);
        }}
        className="focus-visible:ring-primary cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:outline-none">
        {label}
      </button>
      <button
        type="button"
        aria-label={`Remove filter ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 cursor-pointer rounded-full p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-current focus-visible:outline-none">
        <X className="size-2.5" />
      </button>
    </Badge>
  );
});

function EditingChip({
  initialValue,
  originalLabel,
  onCommit,
  onCancel,
}: {
  initialValue: string;
  originalLabel: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const valueRef = useRef(value);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Clear the blur-commit timer if the component unmounts before it fires
  useEffect(() => () => clearTimeout(blurTimerRef.current), []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      onCommit(valueRef.current);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <Badge
      variant="secondary"
      className="border-ring ring-ring/40 h-5 gap-0.5 rounded-sm border px-1.5 py-0 font-mono text-[0.65rem] ring-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          blurTimerRef.current = setTimeout(
            () => onCommit(valueRef.current),
            150,
          );
        }}
        aria-label={`Edit filter: ${originalLabel}`}
        className="min-w-0 bg-transparent outline-none"
        style={{ width: `${Math.max(value.length, 3)}ch` }}
      />
    </Badge>
  );
}

function ParenChip({
  paren,
  onRemove,
}: {
  paren: "(" | ")";
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="outline"
      className="border-border text-muted-foreground h-5 gap-0.5 rounded-sm border px-1.5 py-0 font-mono text-[0.65rem]">
      <span aria-hidden="true">{paren}</span>
      <button
        type="button"
        aria-label={
          paren === "("
            ? "Remove opening parenthesis"
            : "Remove closing parenthesis"
        }
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 cursor-pointer rounded-full p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-current focus-visible:outline-none">
        <X className="size-2.5" />
      </button>
    </Badge>
  );
}

function OperatorLabel({ op }: { op: "AND" | "OR" }) {
  return (
    <span
      aria-label={op === "AND" ? "and" : "or"}
      className="text-muted-foreground px-0.5 font-mono text-[0.6rem] font-semibold tracking-wider uppercase select-none">
      <span aria-hidden="true">{op}</span>
    </span>
  );
}

function WrapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Wrap selection in parentheses"
      onMouseDown={(e) => {
        // prevent the filter bar from losing focus / clearing selection
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "border-primary/50 text-primary hover:bg-primary/10 bg-popover",
        "absolute -top-7 left-1/2 z-10 -translate-x-1/2",
        "flex items-center gap-0.5 rounded border px-1.5 py-0.5",
        "cursor-pointer font-mono text-[0.65rem] transition-colors",
        "whitespace-nowrap shadow-sm",
      )}>
      ( ) wrap
    </button>
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
 * - `ArrowLeft` / `ArrowRight` (empty input) — move keyboard focus through chips
 * - `Shift+ArrowLeft` / `Shift+ArrowRight` (chip focused) — extend chip selection range
 * - `Enter` / `F2` (chip focused) — enter edit mode for that chip
 * - `Ctrl+G` / `Cmd+G` (selection active) — wrap selection in parentheses
 */
export function UserFilter() {
  const [filterQuery, setFilterQuery] = useQueryState(
    "filter",
    parseAsString.withDefault(""),
  );

  // Sync AI-driven filter updates (from CommandService show_users tool) into nuqs.
  // filterRefAtom streams every value written to FilterRef by the AI service.
  // When the value differs from what is already in the URL we push it through
  // the nuqs setter so the URL and UserList stay in sync.
  const aiFilterResult = useAtomValue(filterRefAtom);
  const aiFilter = AsyncResult.isSuccess(aiFilterResult)
    ? aiFilterResult.value
    : null;
  useEffect(() => {
    if (typeof aiFilter === "string" && aiFilter !== filterQuery) {
      void setFilterQuery(aiFilter || null);
    }
    // We intentionally exclude filterQuery from the dep array: we only want to
    // react to changes coming from the AI, not to echo back user-typed values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiFilter, setFilterQuery]);

  const segments = queryToSegments(filterQuery);

  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [, setFocusedChipIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const inputValueRef = useRef(inputValue);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const listboxId = useId();
  const hintId = useId();

  const suggestions = getFuzzySuggestions(inputValue);
  const isOpen = inputValue.trim().length > 0 && suggestions.length > 0;

  useEffect(() => {
    setActiveIndex(-1);
    inputValueRef.current = inputValue;
  }, [inputValue]);

  // Clear the blur-commit timer if the component unmounts before it fires
  useEffect(() => () => clearTimeout(blurTimerRef.current), []);

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
      // Skip standalone ) if there's no matching (
      if (t.kind === "rparen") {
        const openCount = merged.filter((x) => x.kind === "lparen").length;
        const closeCount = merged.filter((x) => x.kind === "rparen").length;
        if (closeCount >= openCount) continue;
      }
      merged.push(t);
    }

    void setFilterQuery(serializeTokens(merged) || null);
    setInputValue("");
    setAnnouncement(`Filter "${token}" added.`);
  }

  function removeSegment(index: number) {
    const token = segments[index];

    // When removing a paren, also remove its matching counterpart
    let indicesToRemove = new Set([index]);
    if (token.kind === "lparen") {
      // Find the matching rparen (accounting for nesting)
      let depth = 0;
      for (let i = index; i < segments.length; i++) {
        if (segments[i].kind === "lparen") depth++;
        else if (segments[i].kind === "rparen") {
          depth--;
          if (depth === 0) {
            indicesToRemove.add(i);
            break;
          }
        }
      }
    } else if (token.kind === "rparen") {
      // Find the matching lparen (scanning backward)
      let depth = 0;
      for (let i = index; i >= 0; i--) {
        if (segments[i].kind === "rparen") depth++;
        else if (segments[i].kind === "lparen") {
          depth--;
          if (depth === 0) {
            indicesToRemove.add(i);
            break;
          }
        }
      }
    }

    let next = segments.filter((_, i) => !indicesToRemove.has(i));

    next = next.filter((t, i) => {
      if (t.kind !== "op") return true;
      const prev = next[i - 1];
      const after = next[i + 1];
      if (!prev || !after) return false; // leading or trailing op
      if (prev.kind === "op") return false; // double op
      return true;
    });

    void setFilterQuery(next.length > 0 ? serializeTokens(next) : null);
    setAnnouncement("Filter removed.");
    inputRef.current?.focus();
  }

  function commitEdit(index: number, raw: string) {
    setEditingIndex(null);
    const trimmed = raw.trim();

    if (!trimmed) {
      // Empty edit → remove the token
      removeSegment(index);
      return;
    }

    const newTokens = tokenize(trimmed);
    if (newTokens.length === 0) {
      removeSegment(index);
      return;
    }

    // Replace the token at `index` with the re-tokenized result
    const next = [
      ...segments.slice(0, index),
      ...newTokens,
      ...segments.slice(index + 1),
    ];

    void setFilterQuery(serializeTokens(next) || null);
    setAnnouncement(`Filter updated to "${trimmed}".`);
    inputRef.current?.focus();
  }

  function cancelEdit() {
    setEditingIndex(null);
    inputRef.current?.focus();
  }

  function selectChip(index: number, shift: boolean) {
    // Only field/text tokens are selectable (not ops or parens)
    const seg = segments[index];
    if (seg.kind === "op" || seg.kind === "lparen" || seg.kind === "rparen")
      return;

    if (!shift || !selectedRange) {
      // Start a fresh selection
      setSelectedRange({ start: index, end: index });
    } else {
      // Extend the range to include this index
      setSelectedRange({
        start: Math.min(selectedRange.start, index),
        end: Math.max(selectedRange.end, index),
      });
    }
  }

  function wrapSelection() {
    if (!selectedRange) return;
    const { start, end } = selectedRange;
    const next = [
      ...segments.slice(0, start),
      { kind: "lparen" as const },
      ...segments.slice(start, end + 1),
      { kind: "rparen" as const },
      ...segments.slice(end + 1),
    ];
    void setFilterQuery(serializeTokens(next) || null);
    setSelectedRange(null);
    setAnnouncement("Selection wrapped in parentheses.");
  }

  /**
   * Returns the label string for a given segment index (for announcements /
   * aria-labels). Returns an empty string for operator and paren tokens.
   */
  function segmentLabel(i: number): string {
    const seg = segments[i];
    if (!seg) return "";
    if (seg.kind === "field") return `${seg.field}:${seg.value}`;
    if (seg.kind === "text") return seg.value;
    return "";
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

    // Navigate into chips when input is empty and ArrowLeft is pressed
    if (e.key === "ArrowLeft" && inputValue === "" && segments.length > 0) {
      e.preventDefault();
      const target = segments.length - 1;
      setFocusedChipIndex(target);
      chipRefs.current[target]?.focus();
      return;
    }

    // Ctrl/Cmd+G wraps the current selection
    if ((e.ctrlKey || e.metaKey) && e.key === "g" && selectedRange) {
      e.preventDefault();
      wrapSelection();
      return;
    }

    if (e.key === "Backspace" && inputValue === "" && segments.length > 0) {
      removeSegment(segments.length - 1);
    }
  }

  function handleChipKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    // Shift+Arrow extends the selection range while navigating — check before plain Arrow
    if (e.shiftKey && e.key === "ArrowRight") {
      e.preventDefault();
      const next = index + 1;
      if (next < segments.length) {
        selectChip(next, true);
        chipRefs.current[next]?.focus();
      }
      return;
    }
    if (e.shiftKey && e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = index - 1;
      if (prev >= 0) {
        selectChip(prev, true);
        chipRefs.current[prev]?.focus();
      }
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < segments.length - 1) {
        const next = index + 1;
        setFocusedChipIndex(next);
        chipRefs.current[next]?.focus();
      } else {
        // Move back to the text input
        setFocusedChipIndex(null);
        inputRef.current?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) {
        const prev = index - 1;
        setFocusedChipIndex(prev);
        chipRefs.current[prev]?.focus();
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "g" && selectedRange) {
      e.preventDefault();
      wrapSelection();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setSelectedRange(null);
      setFocusedChipIndex(null);
      inputRef.current?.focus();
    }
  }

  function clearAll() {
    void setFilterQuery(null);
    setInputValue("");
    setSelectedRange(null);
    setFocusedChipIndex(null);
    setAnnouncement("All filters cleared.");
    inputRef.current?.focus();
  }

  const hasFilter = segments.length > 0 || inputValue.length > 0;

  return (
    <div
      role="group"
      aria-label="Filter users"
      className={cn("relative w-full")}>
      {/* Visually-hidden live region for screen reader announcements */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only">
        {announcement}
      </span>

      {selectedRange && <WrapButton onClick={wrapSelection} />}
      <div
        onClick={(e) => {
          // Don't steal focus on shift+click (used for chip range selection)
          if (e.shiftKey) return;
          inputRef.current?.focus();
        }}
        className={cn(
          "bg-input/20 dark:bg-input/30 border-input focus-within:border-ring focus-within:ring-ring/30",
          "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-md border px-2 py-1 text-sm transition-colors",
          "cursor-text focus-within:ring-2",
        )}>
        {/* Segments: chips and operator labels */}
        <div className="flex flex-wrap items-center gap-1">
          {segments.map((seg, i) => {
            const segKey =
              seg.kind === "field"
                ? `field-${seg.field}:${seg.value}-${i}`
                : seg.kind === "text"
                  ? `text-${seg.value}-${i}`
                  : seg.kind === "op"
                    ? `op-${seg.op}-${i}`
                    : `${seg.kind}-${i}`;
            return seg.kind === "op" ? (
              <OperatorLabel key={segKey} op={seg.op} />
            ) : seg.kind === "lparen" || seg.kind === "rparen" ? (
              <ParenChip
                key={segKey}
                paren={seg.kind === "lparen" ? "(" : ")"}
                onRemove={() => removeSegment(i)}
              />
            ) : editingIndex === i ? (
              <EditingChip
                key={segKey}
                initialValue={
                  seg.kind === "field" ? `${seg.field}:${seg.value}` : seg.value
                }
                originalLabel={segmentLabel(i)}
                onCommit={(val) => commitEdit(i, val)}
                onCancel={cancelEdit}
              />
            ) : (
              <FilterChip
                key={segKey}
                ref={(el) => {
                  chipRefs.current[i] = el;
                }}
                label={segmentLabel(i)}
                selected={
                  selectedRange !== null &&
                  i >= selectedRange.start &&
                  i <= selectedRange.end
                }
                onRemove={() => removeSegment(i)}
                onSelect={(shift) => selectChip(i, shift)}
                onEdit={() => {
                  setSelectedRange(null);
                  setEditingIndex(i);
                }}
                onChipKeyDown={(e) => handleChipKeyDown(e, i)}
              />
            );
          })}
        </div>

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
          aria-describedby={hintId}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={() => setSelectedRange(null)}
          onBlur={() => {
            if (editingIndex !== null) return;
            blurTimerRef.current = setTimeout(
              () => commitToken(inputValueRef.current),
              150,
            );
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

      {/* Visually-hidden usage hint announced by screen readers via aria-describedby */}
      <span id={hintId} className="sr-only">
        Type to filter users. Use field:value syntax, for example name:john or
        email:star@gmail.com. Use AND or OR to combine filters. Press Space or
        Enter to commit a token. Press Backspace on empty input to remove the
        last filter. Use Arrow Left to navigate into filter chips; press Enter
        or F2 on a chip to edit it. Press Ctrl+G to wrap a selection in
        parentheses.
      </span>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Filter suggestions"
          className="bg-popover border-border absolute top-full left-0 z-50 mt-1 w-full min-w-48 overflow-hidden rounded-md border shadow-md">
          {suggestions.map((s, i) => (
            <li
              key={s.label}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              aria-label={s.label}
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
      )}
    </div>
  );
}
