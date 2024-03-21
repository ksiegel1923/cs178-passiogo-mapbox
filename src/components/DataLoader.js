import React, { useEffect, useState } from "react";
import Map from "./Map";

// This component is in charge of getting the live data from PassioGo
function DataLoader() {
  // Set state variables that will hold the live data from passioGo
  const [passioData, setPassioData] = useState({
    serviceAlerts: {},
    tripUpdates: {},
    vehiclePositions: {},
  });
  const [loading, setLoading] = useState(true);

  // function to get data from the PassioGo api
  const fetchData = async () => {
    try {
      const baseUrl =
        "https://passio3.com/harvard/passioTransit/gtfs/realtime/";
      const proxyUrl = "https://corsproxy.io/?";
      const encodedBaseUrl = encodeURIComponent(baseUrl);

      // get vehicle positions
      const vehiclePositionsResponse = await fetch(
        proxyUrl + encodedBaseUrl + "/vehiclePositions.json"
      );
      const vehiclePositions = await vehiclePositionsResponse.json();

      // get service alerts
      const serviceAlertsResponse = await fetch(
        proxyUrl + encodedBaseUrl + "/serviceAlerts.json"
      );
      const serviceAlerts = await serviceAlertsResponse.json();

      // get trip updates
      const tripUpdatesResponse = await fetch(
        proxyUrl + encodedBaseUrl + "/tripUpdates.json"
      );
      const tripUpdates = await tripUpdatesResponse.json();

      // update state with PassioGo data
      setPassioData({
        serviceAlerts,
        tripUpdates,
        vehiclePositions,
      });
      setLoading(false);
    } catch (error) {
      console.error(`An error occurred while fetching the data: ${error}`);
      setLoading(false); // Set loading to false if there is an error
    }
  };

  // Actually get data from PassioGo
  useEffect(() => {
    fetchData(); // Initial API call
    const interval = setInterval(fetchData, 300000); // Re-call API every 5 minutes
    return () => clearInterval(interval); // Clear the interval when component unmounts
  }, []);

  return (
    <div>
      <Map passioData={passioData} loading={loading} />
    </div>
  );
}

export default DataLoader;
