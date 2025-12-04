"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"

const data = [
  {
    date: "May 1",
    calories: 2100,
    protein: 150,
    carbs: 210,
    fat: 70,
  },
  {
    date: "May 2",
    calories: 2250,
    protein: 160,
    carbs: 225,
    fat: 75,
  },
  {
    date: "May 3",
    calories: 1950,
    protein: 145,
    carbs: 195,
    fat: 65,
  },
  {
    date: "May 4",
    calories: 2300,
    protein: 165,
    carbs: 230,
    fat: 77,
  },
  {
    date: "May 5",
    calories: 2150,
    protein: 155,
    carbs: 215,
    fat: 72,
  },
  {
    date: "May 6",
    calories: 1850,
    protein: 145,
    carbs: 185,
    fat: 62,
  },
  {
    date: "May 7",
    calories: 2050,
    protein: 150,
    carbs: 205,
    fat: 68,
  },
]

export function NutritionChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="left"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}g`}
        />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="calories"
          stroke="#4CAF50"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
        <Line yAxisId="right" type="monotone" dataKey="protein" stroke="#2196F3" strokeWidth={2} dot={{ r: 4 }} />
        <Line yAxisId="right" type="monotone" dataKey="carbs" stroke="#FF9800" strokeWidth={2} dot={{ r: 4 }} />
        <Line yAxisId="right" type="monotone" dataKey="fat" stroke="#9C27B0" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
