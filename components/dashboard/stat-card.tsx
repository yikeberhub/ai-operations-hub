import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  borderColor = "border-t-primary/40",
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
  borderColor?: string;
}) {
  return (
    <Card
      size="sm"
      className={cn("border-t-2 transition-shadow hover:shadow-md", borderColor)}
    >
      <CardContent className="flex items-center gap-4">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", accent)}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
