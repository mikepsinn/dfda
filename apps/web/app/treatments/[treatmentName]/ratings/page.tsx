import { DFDABreadcrumbs } from '@/components/Breadcrumbs/DFDABreadcrumbs'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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

  if (totalResponses === 0) return 50; // Default to neutral if no ratings

  const weightedSum =
    weights.majorImprovement * ratings.majorImprovement +
    weights.moderateImprovement * ratings.moderateImprovement +
    weights.noEffect * ratings.noEffect +
    weights.worse * ratings.worse +
    weights.muchWorse * ratings.muchWorse;

  // Convert from -2 to 2 scale to 0-100 scale
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

export default async function TreatmentRatingsPage({ params }: { params: { treatmentName: string } }) {
  const treatmentName = decodeURIComponent(params.treatmentName)
  
  try {
    // Get the treatment with its condition ratings
    const treatment = await prisma.dfdaTreatment.findFirst({
      where: {
        name: {
          equals: treatmentName,
          mode: 'insensitive'
        }
      },
      include: {
        conditionTreatments: {
          where: {
            popularity: {
              gt: 10
            }
          },
          include: {
            condition: true
          },
          orderBy: [
            { popularity: 'desc' },
            { averageEffect: 'desc' }
          ]
        }
      }
    })

    if (!treatment) {
      notFound()
    }

    return (
      <div className="container mx-auto p-4">
        <DFDABreadcrumbs dynamicValues={{ 
          treatmentName: treatment.name
        }} />
        
        <h1 className="text-2xl font-bold mb-6">Condition Reviews for {treatment.name}</h1>
        
        <div className="space-y-4">
          {treatment.conditionTreatments.map((ct) => {
            const effectivenessScore = calculateEffectivenessScore({
              majorImprovement: ct.majorImprovement,
              moderateImprovement: ct.moderateImprovement,
              noEffect: ct.noEffect,
              worse: ct.worse,
              muchWorse: ct.muchWorse
            });
            const confidence = ct.popularity > 50 ? 'HIGH' : ct.popularity > 25 ? 'MEDIUM' : 'LOW';
            const confidenceColor = confidence === 'HIGH' ? 'bg-[#00CC66]' : confidence === 'MEDIUM' ? 'bg-[#FFB800]' : 'bg-[#FF3366]';
            
            // Calculate color based on effectiveness score
            const effectivenessColor = 
              effectivenessScore >= 75 ? 'bg-[#00CC66]' :  // Very effective (dark green)
              effectivenessScore >= 60 ? 'bg-[#7FE7A4]' :  // Moderately effective (light green)
              effectivenessScore >= 40 ? 'bg-[#FFB800]' :  // Neutral (yellow)
              effectivenessScore >= 25 ? 'bg-[#FF7799]' :  // Somewhat harmful (light red)
              'bg-[#FF3366]';                              // Very harmful (dark red)
            
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

          {treatment.conditionTreatments.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">No condition reviews available yet for {treatment.name}.</p>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
} 