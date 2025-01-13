import React from 'react';
import { ExtendedMetaAnalysisReport } from "@/lib/agents/fdai/fdaiMetaAnalyzer";
import CostBenefitAnalysisReport from "@/app/components/CostBenefitAnalysisReport";
import BackButton from '../../../../../components/BackButton';
import { DFDABreadcrumbs } from '@/components/Breadcrumbs/DFDABreadcrumbs';
import { doMetaAnalysis } from '@/lib/agents/fdai/fdaiMetaAnalyzer';

// Add type for page props
type PageProps = {
  params: {
    conditionName: string;
    treatmentName: string;
  };
};

async function generateCostBenefitAnalysis(treatmentName: string, conditionName: string) {
  try {
    const report = await doMetaAnalysis(treatmentName, conditionName);
    return report;
  } catch (error) {
    console.error('Error generating cost-benefit analysis:', error);
    throw error;
  }
}

// Update the component to receive and use params
const CostBenefitAnalysisPage = async ({ params }: PageProps) => {
  const { conditionName, treatmentName } = params;
  
  if (!conditionName || !treatmentName) {
    throw new Error('Missing required route parameters');
  }

  const report = await generateCostBenefitAnalysis(treatmentName, conditionName);
  
  return (
    <div className="container mx-auto p-4">
      <DFDABreadcrumbs dynamicValues={{ 
        conditionName,
        treatmentName
      }} />
      <BackButton />
      <CostBenefitAnalysisReport report={report} />
    </div>
  );
};

export default CostBenefitAnalysisPage;