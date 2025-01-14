"use client";
import React, { useState, useEffect } from 'react';
import GlobalBrainNetwork from "@/components/landingPage/global-brain-network";

const GlobalHealthOptimizationAgent = () => {
  const [currentDisease, setCurrentDisease] = useState('');
  const [taskProgress, setTaskProgress] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);

  const diseases = [
    '�� Alzheimer\'s Disease',
    '⚡ Chronic Pain Syndrome',
    '💭 Major Depressive Disorder',
    '🔄 Amyotrophic Lateral Sclerosis',
    '🎯 Pancreatic Cancer',
    '🦠 Cerebral Malaria',
    '💊 Multi-Drug Resistant Tuberculosis'
  ];

  const tasks = [
    '🧬 Genetic Analysis',
    '🔬 Protein Folding Simulation',
    '📊 Clinical Trial Design',
    '💊 Drug Interaction Modeling',
    '📈 Patient Data Mining',
    '🔍 Biomarker Identification',
    '📋 Treatment Protocol Optimization'
  ];

  const [progressWidths, setProgressWidths] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const diseaseInterval = setInterval(() => {
      setCurrentDisease(diseases[Math.floor(Math.random() * diseases.length)]);
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
    <div className="flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl rounded-xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="mb-6 text-4xl font-black uppercase tracking-tight text-black">
          🤖 GLOBAL HEALTH OPTIMIZATION AGENT v3.0
        </h1>

        <div className="mb-8 rounded-xl border-4 border-black bg-gradient-to-r from-pink-400 to-purple-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xl font-bold text-black mb-2">🔬 Current Disease Focus:</p>
          <p className="text-2xl font-black text-black">
            {currentDisease}
          </p>
        </div>

        <div className="mb-8">
          <div className="w-full h-8 bg-white rounded-xl border-4 border-black overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 to-purple-400"
              style={{width: `${taskProgress}%`}}
            />
          </div>
          <p className="mt-2 font-bold text-black">
            Task Progress: {taskProgress}%
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border-4 border-black bg-gradient-to-r from-green-400 to-emerald-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl font-bold text-black mb-2">👥 Active Problem Solvers</p>
            <p className="text-3xl font-black text-black">{activeAgents.toLocaleString()}</p>
            <p className="mt-2 font-bold text-black">🌍 Experts collaborating globally</p>
          </div>
          <div className="rounded-xl border-4 border-black bg-gradient-to-r from-blue-400 to-indigo-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl font-bold text-black mb-2">⚡ Current Task Assignment</p>
            <p className="text-2xl font-black text-black">
              {tasks[Math.floor(taskProgress / 100 * tasks.length)]}
            </p>
            <p className="mt-2 font-bold text-black">🔄 Matching experts to specific tasks</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xl font-bold text-black">📊 Resource Allocation by Research Phase:</p>
          {[
            '📚 Data Analysis', 
            '🧪 Experimental Design', 
            '🔬 Clinical Trials', 
            '💊 Treatment Development'
          ].map((phase, index) => (
            <div key={index} className="w-full">
              <p className="font-bold text-black mb-2">{phase}</p>
              <div className="w-full h-6 bg-white rounded-xl border-4 border-black overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-red-400"
                  style={{width: `${progressWidths[index]}%`}}
                />
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

export default GlobalHealthOptimizationAgent;