export default function Loader({ status, height }) {
  return (
    <div
      className="row align-items-center justify-content-center"
      style={{ height }}
    >
      <div className="col-3 align-self-center justify-content-center">
        <div
          className="align-self-center"
          style={{ width: 144, marginLeft: "4px" }}
        >
          <div
            className="spinner-grow m-2"
            style={{ width: "2rem", height: "2rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div
            className="spinner-grow m-2"
            style={{ width: "2rem", height: "2rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div
            className="spinner-grow m-2"
            style={{ width: "2rem", height: "2rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        {status && (
          <div>
            <center>
              <h2>{status}</h2>
            </center>
          </div>
        )}
      </div>
    </div>
  );
}
