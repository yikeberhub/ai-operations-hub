"use client";

import { useEffect, useRef } from "react";
import { Chart, type ChartItem, registerables } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

Chart.register(...registerables);

type SentimentCount = { sentiment: string; count: number };
type SentimentTrendPoint = { day: string; avg_sentiment_score: number };
type PriorityVsSentiment = { priority: string; sentiment: string; count: number };

type StatsResponse = {
  sentimentCounts: SentimentCount[];
  sentimentTrend: SentimentTrendPoint[];
  priorityVsSentiment: PriorityVsSentiment[];
};

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "#10b981",
  Neutral: "#f59e0b",
  Negative: "#f43f5e",
  Unset: "#a1a1aa",
};

export function SentimentCharts() {
  const pieRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const charts: Chart[] = [];
    let cancelled = false;

    fetch("/api/email-stats")
      .then((res) => res.json())
      .then((stats: StatsResponse) => {
        if (cancelled) return;

        if (pieRef.current) {
          charts.push(
            new Chart(pieRef.current as ChartItem, {
              type: "pie",
              data: {
                labels: stats.sentimentCounts.map((r) => r.sentiment),
                datasets: [
                  {
                    data: stats.sentimentCounts.map((r) => r.count),
                    backgroundColor: stats.sentimentCounts.map(
                      (r) => SENTIMENT_COLORS[r.sentiment] ?? SENTIMENT_COLORS.Unset
                    ),
                  },
                ],
              },
              options: { plugins: { legend: { position: "bottom" } } },
            })
          );
        }

        if (lineRef.current) {
          charts.push(
            new Chart(lineRef.current as ChartItem, {
              type: "line",
              data: {
                labels: stats.sentimentTrend.map((r) => r.day),
                datasets: [
                  {
                    label: "Avg sentiment score",
                    data: stats.sentimentTrend.map((r) => r.avg_sentiment_score),
                    borderColor: "#6366f1",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    tension: 0.3,
                    fill: true,
                  },
                ],
              },
              options: { scales: { y: { min: 0, max: 1 } } },
            })
          );
        }

        if (barRef.current) {
          const priorities = [...new Set(stats.priorityVsSentiment.map((r) => r.priority))];
          const sentiments = ["Positive", "Neutral", "Negative"];

          charts.push(
            new Chart(barRef.current as ChartItem, {
              type: "bar",
              data: {
                labels: priorities,
                datasets: sentiments.map((s) => ({
                  label: s,
                  backgroundColor: SENTIMENT_COLORS[s],
                  data: priorities.map(
                    (p) =>
                      stats.priorityVsSentiment.find((r) => r.priority === p && r.sentiment === s)
                        ?.count ?? 0
                  ),
                })),
              },
              options: {
                scales: { x: { stacked: true }, y: { stacked: true } },
              },
            })
          );
        }
      })
      .catch(() => {
        // Charts stay empty if the stats webhook is unreachable — non-fatal for the rest of the page.
      });

    return () => {
      cancelled = true;
      charts.forEach((c) => c.destroy());
    };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Sentiment breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas ref={pieRef} />
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Sentiment trend (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas ref={lineRef} />
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Priority vs sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas ref={barRef} />
        </CardContent>
      </Card>
    </div>
  );
}
