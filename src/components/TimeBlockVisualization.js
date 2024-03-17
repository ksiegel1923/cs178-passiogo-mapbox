import moment from "moment";

const TimeBlockVisualization = ({ walkingCur, timeOnShuttle, walkingDest }) => {
  // Placeholder values for uncertainties
  walkingCur = Math.ceil(walkingCur / 60);
  timeOnShuttle = parseInt(moment(timeOnShuttle * 1000).format("m"), 10);
  walkingDest = Math.ceil(walkingDest / 60);
  var uncertaintyBefore = Math.round(2 * (1.96 * (221.49 / Math.sqrt(4850)))); //from Jupyter Notebook calcs
  var uncertaintyAfter = Math.round(2 * (1.96 * (221.49 / Math.sqrt(4850)))); //from Jupyter Notebook calcs

  const totalDuration =
    walkingCur +
    timeOnShuttle +
    walkingDest +
    uncertaintyBefore +
    uncertaintyAfter;

  const getBlockWidth = (time) => {
    return `${(time / totalDuration) * 100}%`;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      <div style={{ flexGrow: 1, display: "flex" }}>
        {/* block for walking to the stop */}
        <div
          style={{
            height: "20px",
            width: getBlockWidth(walkingCur),
            backgroundColor: "#3887be",
            marginRight: "5px",
            textAlign: "center",
          }}
        >
          {walkingCur} min to walk
        </div>

        {/* uncertainty before shuttle */}
        <div
          style={{
            height: "20px",
            width: getBlockWidth(uncertaintyBefore),
            backgroundColor: "#ff9933",
            opacity: 0.5,
            marginRight: "5px",
            textAlign: "center",
          }}
        >
          {/* Uncertainty @ 95% CF */}
        </div>

        {/* Block for time on the shuttle */}
        <div
          style={{
            height: "20px",
            width: getBlockWidth(timeOnShuttle * 1000),
            backgroundColor: "#ff9933",
            marginRight: "5px",
            textAlign: "center",
          }}
        >
          {timeOnShuttle} min on bus
        </div>

        {/* uncertainty after shuttle */}
        <div
          style={{
            height: "20px",
            width: getBlockWidth(uncertaintyAfter),
            backgroundColor: "#ff9933",
            opacity: 0.5,
            marginRight: "5px",
            textAlign: "center",
          }}
        >
          {/* Uncertainty @ 95% CF */}
        </div>

        {/* block for walking from the stop to destination */}
        <div
          style={{
            height: "20px",
            width: getBlockWidth(walkingDest),
            backgroundColor: "#85e085",
            textAlign: "center",
          }}
        >
          {walkingDest} min to walk
        </div>
      </div>
    </div>
  );
};

export default TimeBlockVisualization;
