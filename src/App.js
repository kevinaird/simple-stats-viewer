import React, { useEffect, useState } from "react";
import Loader from './components/Loader';
import useWindowDimensions from "./utils/WindowDimensions";
import StatsReport from "./components/StatsReport";

function App() {
  const [reportList, setReportList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(false);

  const { height } = useWindowDimensions();

  useEffect(()=>{
    setLoading(true);
    fetch(`/reports/list.csv`)
    .then(res => res.text())
    .then(res => {
      const data = res.split(/\n/g).map(line=>{
        const [ id, label ] = line.split(/,/g);
        return { id, label };
      });
      setReportList(data);
      setLoading(false);
    });
  },[]);

  return (
    <div className="App">
      {loading
      ?<div>
        <Loader />
      </div>
      :<div className="row m-0">
        <div className="flex-shrink-0 p-3 bg-dark text-bg-dark shadow-lg" 
            style={{width: "260px",height, overflowY:"auto"}}>          
          <a className="d-flex align-items-center pb-3 mb-3 link-dark text-decoration-none border-bottom">
            <span className="fs-5 fw-semibold text-bg-dark">Simple Stats Reports</span>
          </a>
          <ul className="list-unstyled ps-0">
            {reportList.map(report=><li key={report.id} className="mb-1">
              <button 
                className={`btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed  ${selectedReport===report.id?"bg-info":" text-bg-dark"}`} 
                onClick={()=>setSelectedReport(report.id)}
                >
                {report.label}
              </button>
            </li>)}
          </ul>
        </div>
        <div className="p-0" style={{width:"calc(100% - 360px)"}}>
          {selectedReport && <StatsReport reportId={selectedReport} />}
        </div>
      </div>}
    </div>
  );
}

export default App;
