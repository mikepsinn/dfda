'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailedLineGraph } from "./DetailedLineGraph";
import { InfoIcon } from "./InfoIcon";
import { Client } from "../../lib/client";
import useSWR from "swr";

interface SleepPanelProps {
  userId: string | null;
}

export function SleepPanel({ userId }: SleepPanelProps) {
  const client = new Client();
  const { data } = useSWR(
    userId ? `/sleep/${userId}` : null,
    () => client.getSleep(userId as string)
  );

  const sleepData = data?.data ?? [];

  // Convert seconds to hours for better readability
  const formatDuration = (seconds: number) => Math.round(seconds / 3600);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sleep</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoIcon
            title="Duration"
            value={sleepData[0]?.duration_seconds ?? 0}
            target={28800} // 8 hours in seconds
          />
          <InfoIcon
            title="Deep Sleep"
            value={sleepData[0]?.deep_seconds ?? 0}
            target={7200} // 2 hours in seconds
          />
          <InfoIcon
            title="REM Sleep"
            value={sleepData[0]?.rem_seconds ?? 0}
            target={5400} // 1.5 hours in seconds
          />
        </div>

        <DetailedLineGraph
          data={sleepData.map(item => ({
            ...item,
            duration_hours: formatDuration(item.duration_seconds)
          }))}
          dataKey="duration_hours"
          title="Sleep Duration (hours)"
          target={8} // 8 hours target
        />
      </CardContent>
    </Card>
  );
}
