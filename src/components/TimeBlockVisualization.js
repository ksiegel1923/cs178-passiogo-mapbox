const TimeBlockVisualization = ({ walkingCur, timeOnShuttle, walkingDest, uncertaintyBefore, uncertaintyAfter }) => {
  // Placeholder values for uncertainties
  walkingCur = Math.ceil(walkingCur / 60); 
  timeOnShuttle = moment(timeOnShuttle * 1000).format("m"); 
  walkingDest = Math.ceil(walkingDest / 60); 
  uncertaintyBefore = 2*(1.96*(221.49/Math.sqrt(4850))); //from Jupyter Notebook calcs
  uncertaintyAfter = 2*(1.96*(221.49/Math.sqrt(4850))); //from Jupyter Notebook calcs

  const totalDuration = walkingCur + timeOnShuttle * 1000 + walkingDest + uncertaintyBefore + uncertaintyAfter;

  const getBlockWidth = (time) => {
    return `${(time / totalDuration) * 100}%`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <div style={{ flexGrow: 1, display: 'flex' }}>
        {/* block for walking to the stop */}
        <div style={{
          height: '20px',
          width: getBlockWidth(walkingCur),
          backgroundColor: '#3887be',
          marginRight: '5px',
          textAlign: 'center'
        }}>
          {Math.ceil(walkingCur / 60)} min
        </div>

        {/* uncertainty before shuttle */}
        <div style={{
          height: '20px',
          width: getBlockWidth(uncertaintyBefore),
          backgroundColor: '#ff9933',
          opacity: 0.5,
          marginRight: '5px',
          textAlign: 'center'
        }}>
          {/* Uncertainty @ 95% CF */}
        </div>

        {/* Block for time on the shuttle */}
        <div style={{
          height: '20px',
          width: getBlockWidth(timeOnShuttle * 1000),
          backgroundColor: '#ff9933',
          marginRight: '5px',
          textAlign: 'center'
        }}>
          {moment(timeOnShuttle * 1000).format("m")} min
        </div>

        {/* uncertainty after shuttle */}
        <div style={{
          height: '20px',
          width: getBlockWidth(uncertaintyAfter),
          backgroundColor: '#ff9933',
          opacity: 0.5,
          marginRight: '5px',
          textAlign: 'center'
        }}>
          {/* Uncertainty @ 95% CF */}
        </div>

        {/* block for walking from the stop to destination */}
        <div style={{
          height: '20px',
          width: getBlockWidth(walkingDest),
          backgroundColor: '#85e085',
          textAlign: 'center'
        }}>
          {Math.ceil(walkingDest / 60)} min
        </div>
      </div>
    </div>
  );
};

export default TimeBlockVisualization;
