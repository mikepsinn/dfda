import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TreatmentCardSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        {/* Skeleton for Image/Emoji section */}
        <Skeleton className="h-32 w-full mb-3 rounded-md" />
        {/* Skeleton for Title */}
        <Skeleton className="h-6 w-3/4 rounded" />
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between pt-2">
        <div>
          {/* Skeleton for Description */}
          <Skeleton className="h-4 w-full mb-2 rounded" />
          <Skeleton className="h-4 w-5/6 mb-3 rounded" />
        </div>
        {/* Skeleton for Badges Section */}
        <div className="mt-auto pt-2 flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
} 