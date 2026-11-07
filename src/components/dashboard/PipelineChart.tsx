'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCHF } from '@/lib/format';

export function PipelineChart({ data }: { data: { name: string; amount: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(214 32% 91%)" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={112} tickLine={false} />
          <Tooltip formatter={(value) => formatCHF(Number(value))} />
          <Bar dataKey="amount" name="Montant" fill="hsl(221 83% 53%)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
