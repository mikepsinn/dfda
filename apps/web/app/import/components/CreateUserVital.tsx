'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateUserVitalProps {
  users: Array<any>;
  onCreate: (userId: string) => void;
  onSelect: (userId: string) => void;
}

export function CreateUserVital({ users, onCreate, onSelect }: CreateUserVitalProps) {
  const [email, setEmail] = useState("");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>1. Create a new user</Label>
          <div className="flex gap-4">
            <Input
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={() => onCreate(email)}>
              Create User
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>2. Select existing user</Label>
          <Select onValueChange={onSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
