import React, { useState, useEffect } from "react";
import C3ReChart from "./C3Rechart";

export default function StatsChart({ stat, label }) {
    const [chartData, setChartData] = useState(false);

    useEffect(()=>{
        setChartData({
            data: {
              type: "line",
              x: "time",
              columns: [
                ['time'].concat(stat.map(s=>s.time)),
                [label].concat(stat.map(s=>s.value))
              ]
            },
            legend: { hide: true },
            axis: {
              x: {
                type: "timeseries",
                tick: { format: "%H:%M:%S" },
                label: "Time"
              },
              y: { min: 0 }
            },
            grid: {
              y: { show: true }
            }
        });

    },[stat,label]);

    if (!chartData) return "";

    return <C3ReChart 
        data={chartData}
    />;
}