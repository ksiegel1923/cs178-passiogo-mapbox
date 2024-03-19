import React, { useEffect, useState } from "react";
import Map from "./Map";

// This component is in charge of getting the live data from PassioGo
function DataLoader() {
  // initial state with placeholders for the API data
  const [passioData, setPassioData] = useState({
    serviceAlerts: {},
    tripUpdates: {},
    vehiclePositions: {},
  });
  const [loading, setLoading] = useState(true);

  // function to fetch data from the API
  const fetchData = async () => {
    try {
      const baseUrl =
        "https://passio3.com/harvard/passioTransit/gtfs/realtime/"; // make sure to replace placeholder with endpoint
      const proxyUrl = "https://corsproxy.io/?"; // cors proxy to get info from passio go
      const encodedBaseUrl = encodeURIComponent(baseUrl);

      // fetch vehicle positions
      const vehiclePositionsResponse = await fetch(
        proxyUrl + encodedBaseUrl + "/vehiclePositions.json"
      );
      const vehiclePositions = await vehiclePositionsResponse.json();

      // fetch service alerts
      const serviceAlertsResponse = await fetch(
        proxyUrl + encodedBaseUrl + "/serviceAlerts.json"
      );
      const serviceAlerts = await serviceAlertsResponse.json();

      // fetch trip updates
      const tripUpdatesResponse = await fetch(
        proxyUrl + encodedBaseUrl + "/tripUpdates.json"
      );
      const tripUpdates = await tripUpdatesResponse.json();

      // update state with fetched data
      setPassioData({
        serviceAlerts,
        tripUpdates,
        vehiclePositions,
      });
      setLoading(false);
    } catch (error) {
      console.error(`An error occurred while fetching the data: ${error}`);
      setLoading(false); // Ensure loading state is updated in case of error
    }
  };

  // effect to run once on mount and listen at specified intervals
  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 300000); // 5 minutes interval
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div>
      <Map passioData={passioData} loading={loading} />
    </div>
  );
}

export default DataLoader;
