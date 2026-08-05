"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_OPTIONS = ["sales", "support", "billing", "spam", "other"];
const PRIORITY_OPTIONS = ["HOT", "WARM", "COLD"];
const SENTIMENT_OPTIONS = ["Positive", "Neutral", "Negative"];
const STATUS_OPTIONS = ["new", "processing", "processed", "replied"];

const ALL = "all";

export function EmailsToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const category = searchParams.get("category") ?? ALL;
  const priority = searchParams.get("priority") ?? ALL;
  const sentiment = searchParams.get("sentiment") ?? ALL;
  const status = searchParams.get("status") ?? ALL;

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === ALL || value === "") params.delete(key);
      else params.set(key, value);
      params.delete("page");
      startTransition(() => router.push(`?${params.toString()}`));
    },
    [router, searchParams]
  );

  // Debounce the search box so we're not pushing a route on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (query !== (searchParams.get("q") ?? "")) setParam("q", query);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const activeFilterCount = [category, priority, sentiment, status].filter((v) => v !== ALL).length + (searchParams.get("q") ? 1 : 0);

  const clearFilters = () => {
    setQuery("");
    startTransition(() => router.push(window.location.pathname));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sender or subject…"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" />

        <Select value={category} onValueChange={(v) => v && setParam("category", v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={(v) => v && setParam("priority", v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All priorities</SelectItem>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sentiment} onValueChange={(v) => v && setParam("sentiment", v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sentiments</SelectItem>
            {SENTIMENT_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => v && setParam("status", v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X data-icon="inline-start" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
}
