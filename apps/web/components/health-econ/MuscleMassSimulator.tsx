'use client';

import React, { useState } from 'react';
import { MuscleMassReport } from './MuscleMassReport';

export function MuscleMassSimulator() {
  const [muscleMassIncreasePerPerson, setMuscleMassIncreasePerPerson] = useState(2);
  const [populationSize, setPopulationSize] = useState(335000000);

  // Helper function for number formatting
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  return (
    <>
      {/* Input Controls */}
      <div className="mb-12 p-6 bg-white rounded-lg shadow-md neobrutalist-markdown-container">
        <h2 className="text-2xl font-bold mb-6">Simulation Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Muscle Mass Increase (lbs per person)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                value={muscleMassIncreasePerPerson}
                onChange={(e) => setMuscleMassIncreasePerPerson(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-lg font-semibold min-w-[4rem]">
                {muscleMassIncreasePerPerson} lbs
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Population Size
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1000"
                max="8000000000"
                step="100000"
                value={populationSize}
                onChange={(e) => setPopulationSize(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-lg font-semibold min-w-[8rem]">
                {formatNumber(populationSize)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Adjust the sliders to see how different parameters affect the analysis results.
        </div>
      </div>

      {/* Report */}
      <MuscleMassReport 
        muscleMassIncreasePerPerson={muscleMassIncreasePerPerson}
        populationSize={populationSize} 
      />
    </>
  );
} 