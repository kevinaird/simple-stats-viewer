import React, { useEffect, useState } from "react";
import Collapse from 'react-bootstrap/Collapse';
import group from 'array.prototype.group';
import yaml from "yaml";

import { MdNavigateNext, MdKeyboardArrowDown } from 'react-icons/md';

import Loader from './Loader';
import StatsChart from "./StatsChart";
import useWindowDimensions from "../utils/WindowDimensions";

export default function StatsReport({ reportId }) {
  const [config, setConfig] = useState(false);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(false);

  const { height } = useWindowDimensions();

  useEffect(()=>{
    setLoading(true);
    let config = {};
    fetch(`/reports/${reportId}/stats.yml`)
    .then(res=>res.text())
    .then(res=>{
      config = yaml.parse(res);
      console.log("config==>",config);
      setConfig(config);
      return fetch(`/reports/${reportId}/stats.csv`);
    })
    .then(res=>res.text())
    .then(res=>{
      const data = res.split(/\n/g).map(line=>{
        const [ time, label, value ] = line.split(/\,/g);
        return { time: parseInt(time), label, value: parseFloat(value) };
      });
      console.log("data==>",data);

      const stats = {};
      for(let metric in config.metrics) {
        const re = new RegExp(`^${metric}`);
        const filteredData = data.filter(d=>re.test(d.label));
        stats[metric] = group(filteredData,({label})=>label);
      }

      console.log("stats==>",stats);
      setStats(stats);
      setLoading(false);
    });
  },[reportId]);

  return (
    <div>
      {loading
      ?<div>
        <Loader />
      </div>
      :<div className="row m-0">
        <div className="flex-shrink-0 p-3 bg-white shadow-lg" 
            style={{width: "360px",height, overflowY:"auto"}}>          
          <a className="d-flex align-items-center pb-3 mb-3 link-dark text-decoration-none border-bottom">
            <span className="fs-5 fw-semibold">Metrics</span>
          </a>
          <ul className="list-unstyled ps-0">
            {Object.keys(stats).map(metricGroup=><li key={metricGroup} className="mb-1">
              <button 
                className="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed" 
                onClick={()=>setCollapse(collapse!=metricGroup?metricGroup:false)}
                >
                {collapse==metricGroup
                ?<MdNavigateNext />
                :<MdKeyboardArrowDown />} {metricGroup}
              </button>
              <Collapse in={collapse==metricGroup}>
                <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                  {Object.keys(stats[metricGroup]).map(metric=><li 
                    key={metric}
                    className="ms-5">
                    <a 
                      style={{fontSize:"small"}}
                      className={`link-dark d-inline-flex text-decoration-none rounded ps-1 pe-1 ${selectedMetric && metric==selectedMetric.metric?'bg-info':''}`}
                      onClick={()=>setSelectedMetric({ metricGroup, metric })}
                      >
                        {metric.replace(metricGroup+"_","")}
                    </a>
                  </li>)}
                </ul>
              </Collapse>
            </li>)}
          </ul>
        </div>
        {selectedMetric && <div 
        style={{width: "calc(100% - 360px)", height, overflowY:"auto"}} 
        className="p-3">
          <a className="d-flex align-items-center pb-3 mb-3 link-dark text-decoration-none border-bottom">
            <span className="fs-5 fw-semibold">{selectedMetric.metric}</span>
          </a>
          <StatsChart 
            label={selectedMetric.metric}
            stat={stats[selectedMetric.metricGroup][selectedMetric.metric]} 
          />
        </div>}
      </div>}
    </div>
  );
}
