"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    date: "Jan 1",
    weight: 185,
  },
  {
    date: "Jan 8",
    weight: 183,
  },
  {
    date: "Jan 15",
    weight: 182,
  },
  {
    date: "Jan 22",
    weight: 180,
  },
  {
    date: "Jan 29",
    weight: 178,
  },
  {
    date: "Feb 5",
    weight: 176,
  },
  {
    date: "Feb 12",
    weight: 175,
  },
  {
    date: "Feb 19",
    weight: 173,
  },
  {
    date: "Feb 26",
    weight: 172,
  },
  {
    date: "Mar 5",
    weight: 170,
  },
]

export function WeightChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value} lbs`}
          domain={["dataMin - 5", "dataMax + 5"]}
        />
        <Tooltip />
        <Line type="monotone" dataKey="weight" stroke="#4CAF50" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
