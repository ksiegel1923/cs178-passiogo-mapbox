import React from "react";
import moment from "moment";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const TimeBlockVisualization = ({ walkingCur, timeOnShuttle, walkingDest }) => {
  // Placeholder values for uncertainties
  walkingCur = Math.ceil(walkingCur / 60);
  timeOnShuttle = parseInt(moment(timeOnShuttle * 1000).format("m"), 10);
  walkingDest = Math.ceil(walkingDest / 60);
  // Uncertainty calculations done based on the 95% confidence interval
  var uncertaintyBefore = Math.round(2 * (1.96 * (221.49 / Math.sqrt(4850))));
  var uncertaintyAfter = Math.round(2 * (1.96 * (221.49 / Math.sqrt(4850))));

  const totalDuration =
    walkingCur +
    timeOnShuttle +
    walkingDest +
    uncertaintyBefore +
    uncertaintyAfter;

  // Function to calculate how wide each block should look
  const getBlockWidth = (time) => {
    return `${(time / totalDuration) * 100}%`;
  };

  return (
    <>
      <Box mt={2}>
        <Typography variant="body1" gutterBottom>
          Timing Uncertainty:
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
        <Box sx={{ flexGrow: 1, display: "flex" }}>
          {/* Block for walking to the stop */}
          <Box
            sx={{
              height: "60px",
              width: getBlockWidth(walkingCur),
              backgroundColor: "#3887be",
              mr: "5px",
              textAlign: "center",
              fontSize: "8px",
            }}
          >
            <Typography variant="caption">{walkingCur} min walk</Typography>
          </Box>

          {/* Uncertainty before shuttle */}
          <Box
            sx={{
              height: "60px",
              width: getBlockWidth(uncertaintyBefore),
              backgroundColor: "#ff9933",
              opacity: 0.5,
              mr: "5px",
              textAlign: "center",
            }}
          >
            <Typography variant="caption">
              {uncertaintyBefore} min uncertainty
            </Typography>
          </Box>

          {/* Block for time on the shuttle */}
          <Box
            sx={{
              height: "60px",
              width: getBlockWidth(timeOnShuttle),
              backgroundColor: "#ff9933",
              mr: "5px",
              textAlign: "center",
            }}
          >
            <Typography variant="body2">{timeOnShuttle} min on bus</Typography>
          </Box>

          {/* Uncertainty after shuttle */}
          <Box
            sx={{
              height: "60px",
              width: getBlockWidth(uncertaintyAfter),
              backgroundColor: "#ff9933",
              opacity: 0.5,
              mr: "5px",
              textAlign: "center",
            }}
          >
            <Typography variant="caption">
              {uncertaintyAfter} min uncertainty
            </Typography>
          </Box>

          {/* Block for walking from the stop to destination */}
          <Box
            sx={{
              height: "60px",
              width: getBlockWidth(walkingDest),
              backgroundColor: "#85e085",
              textAlign: "center",
            }}
          >
            <Typography variant="caption">{walkingDest} min walk</Typography>
          </Box>
        </Box>
      </Box>
      <Box mt={2}>
        <Typography variant="body1" gutterBottom>
          Details on Timing Uncertainty:
        </Typography>
        <Typography variant="body2">
          The error bars before and after the bus segment are calculated based
          on historical data for delays at the given route and estimated using a
          95% confidence interval. The total uncertainty added to the travel
          time is twice the result to account for both before and after the
          shuttle segments that may potentially overlap with walking times.
        </Typography>
      </Box>
    </>
  );
};

export default TimeBlockVisualization;
