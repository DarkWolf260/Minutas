import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for data tables
 * 
 * Displays a skeleton UI while table data is loading
 * 
 * @param rows - Number of skeleton rows to display
 * @param columns - Number of columns in the table
 */
interface DataTableSkeletonProps {
    rows?: number;
    columns?: number;
}

export function DataTableSkeleton({ rows = 5, columns = 4 }: DataTableSkeletonProps) {
    return (
        <div className="space-y-3">
            {/* Header skeleton */}
            <div className="flex gap-3 pb-2 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-4 flex-1" />
                ))}
            </div>

            {/* Row skeletons */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={`row-${rowIndex}`} className="flex gap-3 items-center">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={`cell-${rowIndex}-${colIndex}`}
                            className="h-8 flex-1"
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/**
 * Loading skeleton for cards
 */
interface CardSkeletonProps {
    count?: number;
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-lg border p-6 space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            ))}
        </div>
    );
}

/**
 * Loading skeleton for forms
 */
export function FormSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            <div className="flex gap-2 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
}

/**
 * Generic content skeleton
 */
export function ContentSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="pt-4">
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    );
}
