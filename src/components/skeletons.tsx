import { Skeleton } from "@/components/ui/skeleton";

export function ProjectListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

export function TabContentSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-md border">
      <div className="border-b p-4">
        <div className="flex gap-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b p-4 last:border-0">
          <div className="flex gap-8">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-20" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EndpointDetailSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="rounded-lg border p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="rounded-lg border p-6 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="rounded-lg border p-6 space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
