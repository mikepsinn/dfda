import React from "react"
import { MuscleMassSimulator } from '@/components/health-econ/MuscleMassSimulator';

export default async function MuscleMassAnalysisPage() {
  return (
    <main>
      <div className="container mx-auto px-4 py-8">
        {/* Title Box */}
        <div className="neobrutalist-markdown-container">
          <h1 className="neobrutalist-title">
            Health and Economic Impact of Increasing Muscle Mass
          </h1>
          <p className="neobrutalist-description">
            This model simulates the societal benefits of an intervention that increases muscle mass across a population. Adjust the parameters below to explore how varying levels of muscle mass increase and population sizes can influence health outcomes and economic impacts.
          </p>
        </div>

        {/* Interactive Simulator Component */}
        <MuscleMassSimulator />
      </div>
    </main>
  );
}
