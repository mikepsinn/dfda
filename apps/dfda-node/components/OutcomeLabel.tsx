import React from 'react';

interface OutcomeItem {
  name: string;
  value: number;
  positive?: boolean; // Green if true, Amber if false/undefined
}

interface OutcomeLabelProps {
  title: string;
  outcomeData: OutcomeItem[];
  sideEffectsData: OutcomeItem[];
}

export function OutcomeLabel({ title, outcomeData, sideEffectsData }: OutcomeLabelProps) {
  const renderProgressBar = (item: OutcomeItem, isSideEffect: boolean = false) => {
    const color = isSideEffect ? 'bg-amber-400' : item.positive !== false ? 'bg-green-500' : 'bg-red-500';
    const textColor = isSideEffect ? '' : item.positive !== false ? 'text-green-600' : 'text-red-600';
    const sign = isSideEffect ? '' : item.positive !== false ? '+' : '';

    return (
      <div key={item.name}>
        <div className="flex justify-between text-xs">
          <span>{item.name}</span>
          <span className={textColor}>{sign}{item.value}%</span>
        </div>
        <div className={`h-${isSideEffect ? '2' : '3'} w-full bg-gray-200 rounded-full mt-1`}>
          <div className={`h-${isSideEffect ? '2' : '3'} ${color} rounded-full`} style={{ width: `${item.value}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
      <div className="space-y-4">
        <div className="font-bold text-lg border-b pb-2">{title}</div>
        <div className="space-y-4">
          {outcomeData.length > 0 && (
            <div>
              <div className="font-medium text-sm mb-2">Change from Baseline (6 months)</div>
              <div className="space-y-3">
                {outcomeData.map(item => renderProgressBar(item))}
              </div>
            </div>
          )}
          {sideEffectsData.length > 0 && (
             <div>
               <div className="font-medium text-sm mb-2">Side Effects</div>
               <div className="space-y-2 mt-1">
                 {sideEffectsData.map(item => renderProgressBar(item, true))}
               </div>
             </div>
          )}
          <div className="text-xs text-primary font-medium cursor-pointer hover:underline">
            View full outcome label →
          </div>
        </div>
      </div>
    </div>
  );
} 