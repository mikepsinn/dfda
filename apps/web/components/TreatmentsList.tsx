"use client";

import { useState } from 'react';
import Image from 'next/image';
import type { Treatment } from "@/lib/actions/treatments";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InternalLink } from "@/components/internal-link";
import { Badge } from "@/components/ui/badge";

interface TreatmentsListProps {
  treatments: Treatment[];
}

export function TreatmentsList({ treatments }: TreatmentsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTreatments = treatments.filter(treatment =>
    treatment.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search treatments by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredTreatments.length === 0 ? (
        <p>No treatments found{searchQuery ? ` matching "${searchQuery}"` : ''}.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTreatments.map((treatment) => (
            <InternalLink
              key={treatment.id}
              navKey="treatments_globalvariableid"
              params={{ globalVariableId: treatment.id }}
              className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Card className="h-full flex flex-col transition-transform duration-200 ease-in-out hover:scale-[1.02] hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="relative h-32 w-full mb-3 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                    {treatment.image_url ? (
                      <Image
                        src={treatment.image_url}
                        alt={treatment.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        priority={false}
                      />
                    ) : (
                      <span className="text-4xl">{treatment.emoji || '💊'}</span>
                    )}
                  </div>
                  <CardTitle className="flex items-center">
                    {/* Emoji can be removed from title if image/fallback exists above */}
                    {/* {treatment.emoji && <span className="mr-2 text-xl">{treatment.emoji}</span>} */}
                    <span className="hover:underline">
                      {treatment.name}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {treatment.description || "No description available."}
                    </p>
                  </div>
                  <div className="mt-auto pt-2 flex flex-wrap gap-2">
                    {treatment.treatment_type && (
                      <Badge variant="secondary">{treatment.treatment_type}</Badge>
                    )}
                    {treatment.manufacturer && (
                      <Badge variant="outline">{treatment.manufacturer}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </InternalLink>
          ))}
        </div>
      )}
    </div>
  );
} 