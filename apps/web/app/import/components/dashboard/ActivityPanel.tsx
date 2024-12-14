'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailedLineGraph } from "./DetailedLineGraph";
import { InfoIcon } from "./InfoIcon";
import { Client } from "../../lib/client";
import useSWR from "swr";

interface ActivityPanelProps {
  userId: string | null;
}

export function ActivityPanel({ userId }: ActivityPanelProps) {
  const client = new Client();
  const { data } = useSWR(
    userId ? `/activity/${userId}` : null,
    () => client.getActivity(userId as string)
  );

  const activityData = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoIcon
            title="Steps"
            value={activityData[0]?.steps ?? 0}
            target={10000}
          />
          <InfoIcon
            title="Calories"
            value={activityData[0]?.calories_total ?? 0}
            target={2000}
          />
          <InfoIcon
            title="Distance"
            value={activityData[0]?.distance_meter ?? 0}
            target={5000}
          />
        </div>

        <DetailedLineGraph
          data={activityData}
          dataKey="steps"
          title="Steps"
          target={10000}
        />
      </CardContent>
    </Card>
  );
}
