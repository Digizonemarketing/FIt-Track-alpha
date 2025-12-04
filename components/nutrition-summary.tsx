"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

const data = [
  {
    name: "Mon",
    calories: 2400,
    target: 2200,
  },
  {
    name: "Tue",
    calories: 1800,
    target: 2200,
  },
  {
    name: "Wed",
    calories: 2300,
    target: 2200,
  },
  {
    name: "Thu",
    calories: 2500,
    target: 2200,
  },
  {
    name: "Fri",
    calories: 2100,
    target: 2200,
  },
  {
    name: "Sat",
    calories: 2800,
    target: 2200,
  },
  {
    name: "Sun",
    calories: 2200,
    target: 2200,
  },
]

export function NutritionSummary() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Bar dataKey="calories" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" name="Consumed" />
        <Bar dataKey="target" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary/20" name="Target" />
      </BarChart>
    </ResponsiveContainer>
  )
}
