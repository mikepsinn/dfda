'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DfdaCondition, DfdaConditionTreatment, DfdaTreatment } from '@prisma/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

type ExtendedConditionTreatment = DfdaConditionTreatment & {
  condition: DfdaCondition;
}

type TreatmentWithRatings = DfdaTreatment & {
  conditionTreatments: ExtendedConditionTreatment[];
}

function calculateEffectivenessScore(ratings: {
  majorImprovement: number;
  moderateImprovement: number;
  noEffect: number;
  worse: number;
  muchWorse: number;
}): number {
  const weights = {
    majorImprovement: 2,
    moderateImprovement: 1,
    noEffect: 0,
    worse: -1,
    muchWorse: -2
  };

  const totalResponses = 
    ratings.majorImprovement +
    ratings.moderateImprovement +
    ratings.noEffect +
    ratings.worse +
    ratings.muchWorse;

  if (totalResponses === 0) return 50;

  const weightedSum =
    weights.majorImprovement * ratings.majorImprovement +
    weights.moderateImprovement * ratings.moderateImprovement +
    weights.noEffect * ratings.noEffect +
    weights.worse * ratings.worse +
    weights.muchWorse * ratings.muchWorse;

  return ((weightedSum / totalResponses) + 2) / 4 * 100;
}

function RatingBar({ count, total, label, color }: { count: number; total: number; label: string; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-24 text-right font-medium">{label}</div>
      <div className="flex-grow h-2 bg-white rounded-xl border-2 border-black">
        <div
          className={`h-full rounded-xl ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-16 text-right font-medium">{count}</div>
    </div>
  );
}

export function TreatmentConditionRatingsList({ treatment }: { treatment: TreatmentWithRatings }) {
  const [sortBy, setSortBy] = useState<'effectiveness' | 'popularity'>('effectiveness')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayedTreatments, setDisplayedTreatments] = useState(() => {
    return [...treatment.conditionTreatments].sort((a, b) => {
      const scoreA = calculateEffectivenessScore(a);
      const scoreB = calculateEffectivenessScore(b);
      return scoreB - scoreA;
    });
  });

  const handleSort = (value: string) => {
    const sortType = value as 'effectiveness' | 'popularity';
    setSortBy(sortType);
    
    const sorted = [...displayedTreatments].sort((a, b) => {
      if (sortType === 'popularity') {
        return b.popularity - a.popularity;
      } else {
        const scoreA = calculateEffectivenessScore(a);
        const scoreB = calculateEffectivenessScore(b);
        return scoreB - scoreA;
      }
    });
    
    setDisplayedTreatments(sorted);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    const filtered = treatment.conditionTreatments.filter(ct => 
      ct.condition.name.toLowerCase().includes(query.toLowerCase())
    );
    
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'popularity') {
        return b.popularity - a.popularity;
      } else {
        const scoreA = calculateEffectivenessScore(a);
        const scoreB = calculateEffectivenessScore(b);
        return scoreB - scoreA;
      }
    });
    
    setDisplayedTreatments(sorted);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <Input
            type="text"
            placeholder="Search conditions..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9 neobrutalist-input"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded-full p-0.5"
            >
              <X className="h-4 w-4 text-gray-500" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>

        {/* Sort Select */}
        <Select onValueChange={handleSort} defaultValue={sortBy}>
          <SelectTrigger className="w-[200px] neobrutalist-button">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="effectiveness">Sort by Effectiveness</SelectItem>
            <SelectItem value="popularity">Sort by Most Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {displayedTreatments.map((ct) => {
          const effectivenessScore = calculateEffectivenessScore(ct);
          const confidence = ct.popularity > 50 ? 'HIGH' : ct.popularity > 25 ? 'MEDIUM' : 'LOW';
          const confidenceColor = confidence === 'HIGH' ? 'bg-[#00CC66]' : confidence === 'MEDIUM' ? 'bg-[#FFB800]' : 'bg-[#FF3366]';
          
          const effectivenessColor = 
            effectivenessScore >= 75 ? 'bg-[#00CC66]' :
            effectivenessScore >= 60 ? 'bg-[#7FE7A4]' :
            effectivenessScore >= 40 ? 'bg-[#FFB800]' :
            effectivenessScore >= 25 ? 'bg-[#FF7799]' :
            'bg-[#FF3366]';
          
          return (
            <Link
              key={ct.condition.id}
              href={`/conditions/${encodeURIComponent(ct.condition.name)}/treatments/${encodeURIComponent(treatment.name)}`}
              className="block hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <div className="neobrutalist-gradient-container">
                <div className="flex flex-col">
                  <h3 className="font-black text-lg mb-3">{ct.condition.name}</h3>
                  
                  {/* Overall Effectiveness */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-bold mr-3">Overall Effectiveness</span>
                      <div className="flex-grow h-4 bg-white rounded-xl border-2 border-black">
                        <div
                          className={`h-full rounded-xl ${effectivenessColor}`}
                          style={{ width: `${effectivenessScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-black ml-3">{Math.round(effectivenessScore)}%</span>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="space-y-1.5 mb-4">
                    <RatingBar
                      count={ct.majorImprovement}
                      total={ct.popularity}
                      label="Major Help"
                      color="bg-[#00CC66]"
                    />
                    <RatingBar
                      count={ct.moderateImprovement}
                      total={ct.popularity}
                      label="Moderate Help"
                      color="bg-[#7FE7A4]"
                    />
                    <RatingBar
                      count={ct.noEffect}
                      total={ct.popularity}
                      label="No Effect"
                      color="bg-[#FFB800]"
                    />
                    <RatingBar
                      count={ct.worse}
                      total={ct.popularity}
                      label="Worse"
                      color="bg-[#FF7799]"
                    />
                    <RatingBar
                      count={ct.muchWorse}
                      total={ct.popularity}
                      label="Much Worse"
                      color="bg-[#FF3366]"
                    />
                  </div>

                  {/* Confidence Level */}
                  <div className="flex items-center">
                    <span className="text-xs sm:text-sm font-bold mr-2 sm:mr-3">
                      Confidence
                    </span>
                    <div className="flex-grow h-3 sm:h-4 bg-white rounded-xl border-2 border-black">
                      <div
                        className={`h-full rounded-xl ${confidenceColor}`}
                        style={{ width: `${(ct.popularity / Math.max(...treatment.conditionTreatments.map(t => t.popularity))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs sm:text-sm font-black ml-2 sm:ml-3">
                      {ct.popularity} ratings
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

        {displayedTreatments.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            {searchQuery ? (
              <p className="text-gray-600">No conditions found matching "{searchQuery}"</p>
            ) : (
              <p className="text-gray-600">No condition reviews available yet for {treatment.name}.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 