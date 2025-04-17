import { OutcomeLabel } from "@/components/OutcomeLabel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOutcomeLabelDataAction } from "@/app/actions/global-variable-relationships";
import { createClient } from "@/lib/supabase/server";

// The Page Component
export default async function OutcomeLabelPage({ params }: { params: { predictorVariableId: string } }) {
    const { predictorVariableId } = await params;
    
    // Call the server action to get data
    const outcomeLabelData = await getOutcomeLabelDataAction(predictorVariableId);

    return (
        <div className="py-6 md:py-10">
            <div className="container">
                <div className="mb-8 flex items-center gap-2">
                    <Link href="/outcome-labels" className="text-muted-foreground hover:text-foreground flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Outcome Labels
                    </Link>
                </div>
                <div className="flex justify-center">
                    <OutcomeLabel {...outcomeLabelData} />
                </div>
            </div>
        </div>
    );
}

// Optional: Add generateMetadata function if needed for dynamic titles
export async function generateMetadata({ params }: { params: { predictorVariableId: string } }) {
    const { predictorVariableId } = await params;
    const supabase = await createClient();
    const { data: predictorData } = await supabase
        .from('global_variables')
        .select('name')
        .eq('id', predictorVariableId)
        .single<{name: string | null}>();

    return {
        title: `${predictorData?.name || 'Outcome Label'} | Decentralized FDA`,
    };
} 