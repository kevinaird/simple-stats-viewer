import React, { useState, useEffect } from "react";
import LazyLoad, { forceCheck } from "react-lazyload";
import Loader from "./Loader";

import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
  Legend,
  ResponsiveContainer,
  LabelList,
  Brush
} from "recharts";
import moment from "moment";
import numeral from "numeral";
import * as d3 from "d3";

const colors =
  d3.schemeCategory10; /*[
  "#8884d8",
  "#4097f4",
  "#00abff",

  //"#b67ed8",
  "#e971c2",

  "#00dc8e",
  "#0ee052",
  "#00bbff",
  "#00c9e9",
  "#00d4c2",

  "#ff689c",
  "#ff716d",
  "#ff8b3a",
  "#f4aa00",
  "#c2c800",
  "#72e00e"
];*/

const colorMap = {
  Pass: "rgb(25, 135, 84)",
  Fail: "rgb(220, 53, 69)",
  Stop: "rgb(255, 193, 7)"
};

// Helper component to convert C3 format to Rechart format for
// common use cases.
export function C3ReChart({
  data,
  getRef,
  disableDot,
  labelListContent,
  enableBrush,
  syncId
}) {
  const width = (data && data.size && data.size.width) || 500;
  const height = (data && data.size && data.size.height) || 320;
  const [chartData, setChartData] = useState(false);
  const [columns, setColumns] = useState([]);
  const [xAxisKey, setXAxisKey] = useState([]);
  const [xIsTime, setXIsTime] = useState();
  const [xLabel, setXLabel] = useState();
  const [xBuffer, setXBuffer] = useState(0);
  const [yLabel, setYLabel] = useState();
  const [yLabel2, setYLabel2] = useState();
  const [hasY2, setHasY2] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [legendItems, setLegendItems] = useState(false);

  const getDefaultOpacity = col => {
    return col.type == "area" ? 0.2 : 0.6;
  };

  useEffect(() => {
    if (!data.data.columns) return;

    console.log("input data", data);
    const xIndex = Math.min(
      data.data.columns.map(c => c[0]).indexOf(data.data.x),
      0
    );

    setXAxisKey(data.data.columns[xIndex][0]);

    const firstXVal = data.data.columns[xIndex]
      .slice(1)
      .filter(x => !isNaN(x) && x != null)[0];
    const isXTime = new Date(firstXVal).getTime() > 0;
    //console.log("isXTime test", firstXVal, new Date(firstXVal).getTime());
    //console.log("isXTime", isXTime);
    setXIsTime(isXTime);

    const hasBars =
      data.data.type == "bar" ||
      (data.data.types &&
        Object.keys(data.data.types)
          .map(t => data.data.types[t])
          .indexOf("bar") >= 0);

    if (isXTime && hasBars) {
      const lastXVal = data.data.columns[xIndex]
        .slice(1)
        .filter(x => !isNaN(x) && x != null)
        .slice(-1)[0];
      const b = (lastXVal - firstXVal) / data.data.columns[xIndex].length;
      setXBuffer(b);
    }

    const ret = data.data.columns[xIndex].slice(1).map((val, i) => {
      const item = {};
      data.data.columns.forEach((cols, j) => {
        const label = cols[0];
        item[label] = cols.slice(1)[i];
      });
      return item;
    });

    console.log("output data", ret);
    setChartData(ret);

    const cols = data.data.columns
      .map((cols, i) => {
        if (i == xIndex) return false;
        const label = cols[0];
        const type =
          data.data.types && data.data.types[label]
            ? data.data.types[label]
            : data.data.type
            ? data.data.type
            : "line";
        return {
          label,
          type,
          color:
            data.data.colors && data.data.colors[label]
              ? data.data.colors[label]
              : colorMap[label]
              ? colorMap[label]
              : colors[(i + colors.length - 1) % colors.length],
          opacity: getDefaultOpacity({ type }),
          yAxisId:
            data.data.axes && data.data.axes[label]
              ? data.data.axes[label]
              : "y"
        };
      })
      .filter(a => a !== false);

    console.log("columns", cols);
    setColumns(cols);

    if (data.axis && data.axis.y && data.axis.y.label) {
      if (typeof data.axis.y.label == "string") setYLabel(data.axis.y.label);
      else if (typeof data.axis.y.label.text == "string")
        setYLabel(data.axis.y.label.text);
    }

    if (data.axis && data.axis.x && data.axis.x.label) {
      if (typeof data.axis.x.label == "string") setXLabel(data.axis.x.label);
      else if (typeof data.axis.x.label.text == "string")
        setXLabel(data.axis.x.label.text);
    } /*else if (data.axis && data.axis.x && data.axis.x.type == "timeseries") {
      setXLabel("Time");
    }*/

    if (data.axis && data.axis.y2 && data.axis.y2.show === true) {
      setHasY2(true);
      if (typeof data.axis.y2.label == "string") setYLabel2(data.axis.y2.label);
      else if (typeof data.axis.y2.label.text == "string")
        setYLabel2(data.axis.y2.label.text);
    }
  }, [data]);

  const setFocus = label => {
    const focusedCol = columns.map(c => c.label).indexOf(label);
    //console.log("focus", label, focusedCol);
    const cols = columns.map(col => ({
      ...col,
      opacity:
        focusedCol == -1 ? getDefaultOpacity(col) : getDefaultOpacity(col) * 0.3
    }));
    if (focusedCol >= 0)
      cols[focusedCol].opacity = getDefaultOpacity(cols[focusedCol]) * 1.5;
    setColumns(cols);
  };

  useEffect(() => {
    if (columns.length == 0) return;
    if (typeof getRef != "function") return;
    getRef({
      data: {
        colors: () => {
          const out = {};
          columns.forEach(col => (out[col.label] = col.color));
          //console.log("generated chart colors", columns, out);
          return out;
        }
      },
      focus: label => setFocus(label),
      legend: {
        show: items => {
          setShowLegend(true);
          setLegendItems(
            items.map(n => {
              const column = columns.filter(c => c.label == n)[0];
              return {
                dataKey: column.label,
                value: column.label,
                id: column.label,
                type: column.type,
                color: column.color
              };
            })
          );
        }
      }
    });
  }, [chartData, columns]);

  if (!chartData) return <Loader height={height} />;

  const handleMouseEnter = column => () => {
    if (data.data && data.data.onmouseover)
      data.data.onmouseover({
        ...column,
        id: column.label
      });
  };
  const handleMouseLeave = column => () => {
    if (data.data && data.data.onmouseover)
      data.data.onmouseout({
        ...column,
        id: column.label
      });
  };
  const handleMouseClick = column => () => {
    if (data.data && data.data.onmouseover)
      data.data.onclick({
        ...column,
        id: column.label
      });
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        width={width}
        height={height}
        data={chartData}
        syncId={syncId}
        margin={{
          //top: 5,
          right: yLabel2 ? 20 : 0,
          left: yLabel ? 20 : 0,
          bottom: enableBrush ? 5 : 0 /*xLabel ? 20 : 0*/
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xAxisKey}
          interval={"preserveStartEnd"}
          tickCount={10}
          domain={[`dataMin - ${xBuffer}`, `dataMax + ${xBuffer}`]}
          tickFormatter={val => {
            if (xIsTime) return moment(val).format("HH:mm");
            return val;
          }}
          {...(xIsTime
            ? {
                type: "number"
              }
            : {})}
        >
          {/*xLabel && (
            <Label
              value={xLabel}
              position="bottom"
              style={{ textAnchor: "middle" }}
            />
          )*/}
        </XAxis>
        <YAxis yAxisId="y">
          {yLabel && (
            <Label
              angle={-90}
              value={yLabel}
              position="left"
              style={{ textAnchor: "middle", fontSize: "0.8rem" }}
            />
          )}
        </YAxis>
        {hasY2 && (
          <YAxis yAxisId="y2" orientation="right">
            {yLabel2 && (
              <Label
                angle={-90}
                value={yLabel2}
                position="right"
                style={{ textAnchor: "middle", fontSize: "0.8rem" }}
              />
            )}
          </YAxis>
        )}
        {columns.length <= 5 && (
          <Tooltip
            labelFormatter={label => moment(label).format("HH:mm")}
            formatter={value => numeral(value).format("0,0.00")}
          />
        )}
        {showLegend && (
          <Legend
            wrapperStyle={{ position: "relative", marginTop: "-7px" }}
            onMouseEnter={({ dataKey }) => setFocus(dataKey)}
            onMouseLeave={() => setFocus(false)}
            {...(legendItems ? { payload: legendItems } : {})}
          />
        )}
        {columns.map((column, i) =>
          column.type == "line" ? (
            <Line
              key={column.label}
              type="monotone"
              dataKey={column.label}
              strokeWidth={2}
              stroke={column.color}
              strokeOpacity={column.opacity}
              activeDot={{ r: 8 }}
              onMouseEnter={handleMouseEnter(column)}
              onMouseLeave={handleMouseLeave(column)}
              onClick={handleMouseClick(column)}
              yAxisId={column.yAxisId}
              connectNulls={true}
              {...(disableDot ? { dot: false } : {})}
            />
          ) : column.type == "area" ? (
            <Area
              key={column.label}
              type="monotone"
              dataKey={column.label}
              stroke={column.color}
              fill={column.color}
              strokeOpacity={column.opacity}
              fillOpacity={column.opacity}
              onMouseEnter={handleMouseEnter(column)}
              onMouseLeave={handleMouseLeave(column)}
              onClick={handleMouseClick(column)}
              yAxisId={column.yAxisId}
            >
              {labelListContent && (
                <LabelList
                  dataKey={column.label}
                  position="insideTop"
                  content={props => labelListContent({ ...props, column })}
                />
              )}
            </Area>
          ) : column.type == "bar" ? (
            <Bar
              key={column.label}
              dataKey={column.label}
              fill={column.color}
              fillOpacity={column.opacity}
              onMouseEnter={handleMouseEnter(column)}
              onMouseLeave={handleMouseLeave(column)}
              onClick={handleMouseClick(column)}
              style={{ cursor: "pointer" }}
              stackId={xAxisKey}
              yAxisId={column.yAxisId}
            />
          ) : (
            ""
          )
        )}
        {enableBrush && <Brush />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default function LazyC3Chart(opts) {
  const height = opts && opts.data && opts.data.size && opts.data.size.height;
  useEffect(() => forceCheck());
  return (
    <LazyLoad height={height || 320} offset={100} once>
      <C3ReChart {...opts} />
    </LazyLoad>
  );
}
