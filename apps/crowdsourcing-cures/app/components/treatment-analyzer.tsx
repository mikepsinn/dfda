"use client";
import React, { useState, useEffect } from 'react';
import GlobalBrainNetwork from "@/components/landingPage/global-brain-network";

interface TreatmentAnalyzerProps {
  treatmentName: string;
}

const TreatmentAnalyzer = ({ treatmentName }: TreatmentAnalyzerProps) => {
  const [currentDisease, setCurrentDisease] = useState('');
  const [taskProgress, setTaskProgress] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);

  const healthCategories = [
    '❤️ Cardiovascular Health',
    '🧠 Mental Wellbeing',
    '🛡️ Immune Function',
    '⚡ Metabolic Health',
    '🎯 Cognitive Performance',
    '💪 Physical Fitness',
    '😴 Sleep Quality',
    '🔄 Cellular Regeneration'
  ];

  const analysisTasks = [
    '📊 Data Collection',
    '📈 Statistical Analysis',
    '🔍 Pattern Recognition',
    '🔗 Study Synthesis',
    '✅ Outcome Validation',
    '📋 Impact Assessment',
    '⚠️ Risk Factor Analysis',
    '📊 Benefit Quantification'
  ];

  const [progressWidths, setProgressWidths] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const diseaseInterval = setInterval(() => {
      setCurrentDisease(healthCategories[Math.floor(Math.random() * healthCategories.length)]);
    }, 4000);

    const progressInterval = setInterval(() => {
      setTaskProgress(prev => (prev < 100 ? prev + 1 : 0));
    }, 50);

    const agentInterval = setInterval(() => {
      setActiveAgents(prev => (prev < 1000 ? prev + 5 : 0));
    }, 100);

    const progressBarsInterval = setInterval(() => {
      setProgressWidths(prev => prev.map(width => {
        const increment = Math.random() * 1.5 + 0.5;
        return width >= 100 ? 0 : Math.min(width + increment, 100);
      }));
    }, 100);

    return () => {
      clearInterval(diseaseInterval);
      clearInterval(progressInterval);
      clearInterval(agentInterval);
      clearInterval(progressBarsInterval);
    };
  }, []);

  return (
    <div className="">
      <div className="relative mb-8 overflow-hidden rounded-xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="mb-4 text-4xl font-black uppercase tracking-tight text-black">
          🤖 Analyzing {treatmentName}
        </h1>

        <div className="mb-8 rounded-xl border-4 border-black bg-gradient-to-r from-pink-400 to-purple-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xl font-bold text-black mb-2">🔬 Analyzing Health Category:</p>
          <p className="text-2xl font-black text-black">
            {currentDisease}
          </p>
        </div>

        <div className="mb-8">
          <div className="w-full h-8 bg-white rounded-xl border-4 border-black overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 to-purple-400"
              style={{width: `${taskProgress}%`}}
            ></div>
          </div>
          <p className="mt-2 font-bold text-black">
            Task Progress: {taskProgress}%
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border-4 border-black bg-gradient-to-r from-green-400 to-emerald-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl font-bold text-black mb-2">📚 Data Points Analyzed</p>
            <p className="text-3xl font-black text-black">{activeAgents.toLocaleString()}</p>
            <p className="mt-2 font-bold text-black">📑 Research papers and clinical studies</p>
          </div>
          <div className="rounded-xl border-4 border-black bg-gradient-to-r from-blue-400 to-indigo-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl font-bold text-black mb-2">⚡ Analysis Phase</p>
            <p className="text-2xl font-black text-black">
              {analysisTasks[Math.floor(taskProgress / 100 * analysisTasks.length)]}
            </p>
            <p className="mt-2 font-bold text-black">🔄 Processing research data</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xl font-bold text-black">📊 Meta-Analysis Progress:</p>
          {[
            '📚 Literature Review', 
            '🔄 Data Synthesis', 
            '📈 Statistical Analysis', 
            '📋 Impact Assessment'
          ].map((phase, index) => (
            <div key={index} className="w-full">
              <p className="font-bold text-black mb-2">{phase}</p>
              <div className="w-full h-6 bg-white rounded-xl border-4 border-black overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-red-400"
                  style={{width: `${progressWidths[index]}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border-4 border-black overflow-hidden">
          <GlobalBrainNetwork/>
        </div>
      </div>
    </div>
  );
};

export default TreatmentAnalyzer;
