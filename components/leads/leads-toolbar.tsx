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

const PRIORITY_OPTIONS = ["HOT", "WARM", "COLD"];
const STATUS_OPTIONS = ["new", "processing", "qualified", "contacted", "closed"];
const SOURCE_OPTIONS = ["website", "client-dashboard"];

const ALL = "all";

export function LeadsToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const priority = searchParams.get("priority") ?? ALL;
  const status = searchParams.get("status") ?? ALL;
  const source = searchParams.get("source") ?? ALL;

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

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query !== (searchParams.get("q") ?? "")) setParam("q", query);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const activeFilterCount =
    [priority, status, source].filter((v) => v !== ALL).length + (searchParams.get("q") ? 1 : 0);

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
          placeholder="Search name, email, or company…"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" />

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

        <Select value={source} onValueChange={(v) => v && setParam("source", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sources</SelectItem>
            {SOURCE_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "client-dashboard" ? "Client portal" : "Website"}
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
