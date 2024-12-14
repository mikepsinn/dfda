'use client';

import { useState } from "react";
import useSWR from "swr";
import { CreateUserVital } from "./CreateUserVital";
import { Card } from "./Card";
import { SleepPanel } from "./dashboard/SleepPanel";
import { ActivityPanel } from "./dashboard/ActivityPanel";
import { fetcher } from "../lib/client";

interface User {
  id: string;
  name: string;
}

type UsersResponse = {
  users: User[];
};

export default function ImportDashboard() {
  const [userID, setUserID] = useState<string | null>(null);
  const { data, error, isLoading } = useSWR<UsersResponse>("/users/", fetcher);

  const users = data?.users ?? [];

  return (
    <div className="w-full space-y-6">
      <h1 className="text-3xl font-bold">
        Vital Quickstart
      </h1>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Visualize User Data</h2>
          <p className="text-muted-foreground mb-6">
            Request user data and plot activity, workout sleep and other health information.
          </p>

          {error ? (
            <div className="text-destructive">Failed to load users</div>
          ) : isLoading ? (
            <div className="text-muted-foreground">Loading users...</div>
          ) : (
            <>
              <CreateUserVital
                users={users}
                onCreate={setUserID}
                onSelect={setUserID}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <SleepPanel userId={userID} />
                <ActivityPanel userId={userID} />
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
} 