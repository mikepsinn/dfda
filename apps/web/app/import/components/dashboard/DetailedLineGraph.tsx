'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DetailedLineGraphProps {
  data: any[];
  dataKey: string;
  title: string;
  target: number;
}

export function DetailedLineGraph({ data, dataKey, title, target }: DetailedLineGraphProps) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date"
            scale="auto"
            padding={{ left: 10, right: 10 }}
          />
          <YAxis 
            width={40}
            tickFormatter={(value) => `${value}`}
            padding={{ top: 20, bottom: 20 }}
            allowDecimals={false}
            scale="auto"
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
          {target && (
            <Line
              type="monotone"
              dataKey={() => target}
              stroke="#82ca9d"
              strokeDasharray="3 3"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
