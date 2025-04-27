import { getTreatmentByIdAction } from "@/lib/actions/treatments"
import { Separator } from "@/components/ui/separator"
import { logger } from "@/lib/logger";
import { getOutcomeLabelDataAction, type OutcomeLabelData } from "@/lib/actions/global-variable-relationships";
import { OutcomeLabel } from "@/components/OutcomeLabel";
import { getGroundedAnswerAction, type GroundedSearchResult } from "@/lib/actions/google-grounded-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

export default async function TreatmentPage({ params }: { params: Promise<{ globalVariableId: string }> }) {

  const { globalVariableId } = await params;

  logger.info('Fetching treatment details, outcome label data, and grounded answer for ID:', { globalVariableId });

  const initialTreatmentResult = await getTreatmentByIdAction(globalVariableId);

  if (!initialTreatmentResult) {
    logger.error('Error fetching initial treatment details or not found', { globalVariableId });
    return <div>Error loading treatment details. Please try again later.</div>;
  }
  const treatment = initialTreatmentResult;

  const [outcomeLabelResult, groundedAnswerResult] = await Promise.allSettled([
    getOutcomeLabelDataAction(globalVariableId),
    getGroundedAnswerAction(treatment.name)
  ]);

  let outcomeLabelData: OutcomeLabelData | null = null;
  if (outcomeLabelResult.status === 'rejected') {
     logger.error('Error fetching outcome label data:', { 
      error: outcomeLabelResult.reason, 
      globalVariableId 
    });
  } else {
    outcomeLabelData = outcomeLabelResult.value;
  }

  let groundedAnswerData: GroundedSearchResult | null = null;
  if (groundedAnswerResult.status === 'rejected') {
     logger.error('Error fetching grounded answer:', { 
      error: groundedAnswerResult.reason, 
      query: treatment.name 
    });
  } else {
    groundedAnswerData = groundedAnswerResult.value;
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center space-y-8">
      <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">{treatment.name}</h1>
          <p className="text-lg text-muted-foreground">{treatment.description}</p>
          <Separator className="my-4" />
      </div>

      <div className="w-full max-w-xl">
        {outcomeLabelData ? (
          <OutcomeLabel 
            title={outcomeLabelData.title}
            subtitle={outcomeLabelData.subtitle}
            tag={outcomeLabelData.tag}
            data={outcomeLabelData.data}
            footer={outcomeLabelData.footer}
          />
        ) : (
          <p>Outcome relationship data is not available for this treatment.</p>
        )}
      </div>

      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>AI Generated Summary</CardTitle>
            <CardDescription>Information gathered from Google Search results. Always consult a healthcare professional.</CardDescription>
          </CardHeader>
          <CardContent>
            {groundedAnswerData ? (
              <div>
                <p className="mb-4 whitespace-pre-wrap">{groundedAnswerData.answer}</p>
                {groundedAnswerData.citations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Sources:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {groundedAnswerData.citations.map((citation, index) => (
                        <li key={index}>
                          <Link href={citation.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {citation.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Could not generate AI summary.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
