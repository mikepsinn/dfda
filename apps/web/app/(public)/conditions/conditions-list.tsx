'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronRight } from 'lucide-react';
import { getConditionsAction } from '@/lib/actions/conditions';
import { logger } from '@/lib/logger';

type Condition = {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
};

export function ConditionsList() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConditions() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getConditionsAction();
        setConditions(data || []);
      } catch (err) {
        logger.error('Failed to fetch conditions in client component:', err);
        setError('Failed to load conditions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchConditions();
  }, []);

  const filteredConditions = useMemo(() => {
    if (!searchQuery) {
      return conditions;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return conditions.filter(
      (condition) =>
        condition.name.toLowerCase().includes(lowerCaseQuery) ||
        condition.description?.toLowerCase().includes(lowerCaseQuery)
    );
  }, [conditions, searchQuery]);

  if (isLoading) {
    return <ConditionsList.Skeleton />;
  }

  if (error) {
    return <div className="text-center text-destructive py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search conditions by name or description..."
          className="pl-10 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search conditions"
        />
      </div>

      {filteredConditions.length === 0 && !isLoading ? (
        <div className="text-center text-muted-foreground py-8">
          No conditions found matching your search.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConditions.map((condition) => (
            <Link
              key={condition.id}
              href={`/conditions/${encodeURIComponent(condition.id)}/trials`}
              className="block rounded-lg border p-4 bg-card hover:bg-accent hover:cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                  {condition.emoji && <span className="text-xl hidden sm:inline">{condition.emoji}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{condition.name}</div>
                    {condition.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {condition.description}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Skeleton component for loading state
ConditionsList.Skeleton = function ConditionsListSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-[76px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}; 