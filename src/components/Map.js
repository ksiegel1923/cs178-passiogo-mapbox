import React, { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
// import "./Map.css";
import * as turf from "@turf/turf";
import InputAutofill from "./InputAutofill";
import { shuttleStops } from "../data/shuttleStops";
import { stopIds } from "../data/stopIds";
import moment from "moment";
import { useStateWithCallbackLazy } from "use-state-with-callback";
import {
  Typography,
  Button,
  List,
  ListSubheader,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  ListItem,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import AirportShuttleIcon from "@mui/icons-material/AirportShuttle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import PlaceIcon from "@mui/icons-material/Place";
import { shapes } from "../data/routes";
import TimeBlockVisualization from "./TimeBlockVisualization";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

const popup = new mapboxgl.Popup();

function Map({ passioData, dataLoading }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  // States for Map
  const [lng, setLng] = useState(5);
  const [lat, setLat] = useState(34);
  const [zoom, setZoom] = useState(1.5);

  // States for location / destination / stops
  const [currentLocation, setCurrentLocation] = useState([-71.1174, 42.3705]);
  const [destination, setDestination] = useState([-71.12643, 42.36351]);
  const [nearestStopCur, setNearestStopCur] = useStateWithCallbackLazy("");
  const [nearestStopDest, setNearestStopDest] = useStateWithCallbackLazy("");
  const [directionsLoaded, setDirectionsLoaded] = useState(false);
  const [directionsInfoOpen, setDirectionsInfoOpen] = useState(true);
  const [walkingCur, setWalkingCur] = useState("");
  const [walkingDest, setWalkingDest] = useState("");
  const [shuttleDepart, setShuttleDepart] = useState("");
  const [shuttleArrive, setShuttleArrive] = useState("");
  // const [allPoints, setAllPoints] = useState("");
  const [timeOnShuttle, setTimeOnShuttle] = useState("");

  // Initialize map when component mounts
  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-71.11, 42.37], // Center the map in Cambridge
      zoom: 13,
    });

    // Add navigation control (the +/- zoom buttons)
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Change lat / long when move map
    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    map.current.on("load", () => {
      // Show all the shuttle stops on the map
      map.current.addLayer({
        id: "stops",
        type: "symbol",
        source: {
          type: "geojson",
          data: shuttleStops,
        },
        layout: {
          "icon-image": "marker",
          "icon-size": 2,
          "icon-allow-overlap": true,
        },
        paint: {},
      });

      // If click on a stop show a popup that shows the name of the stop
      map.current.on("mousemove", (event) => {
        const features = map.current.queryRenderedFeatures(event.point, {
          layers: ["stops"],
        });
        if (!features.length) {
          popup.remove();
          return;
        }
        const feature = features[0];

        popup
          .setLngLat(feature.geometry.coordinates)
          .setHTML(feature.properties.Name)
          .addTo(map.current);

        map.current.getCanvas().style.cursor = features.length ? "pointer" : "";
      });
    });
    // Clean up on unmount
    return () => map.current.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Find the closest stop to the location passed in as an argument
  function findClosestStop(location) {
    const nearestStop = turf.nearest(location, shuttleStops);
    // If a nearest library is not found, return early
    if (nearestStop === null) return;
    // Add a circle on the map around the nearest stop that you found
    map.current.addLayer({
      id: `closest-stop-${location}`,
      type: "circle",
      source: {
        type: "geojson",
        data: nearestStop,
      },
      paint: {
        "circle-radius": 12,
        "circle-color": "#486DE0",
      },
    });

    //Save the nearest stop as a state variable (based on if current location or destination)
    if (location[0] === currentLocation[0]) {
      setNearestStopCur(nearestStop, () => {
        getDirections(location, nearestStop.geometry.coordinates);
      });
    } else {
      setNearestStopDest(nearestStop, () => {
        // getDirections(nearestStop.geometry.coordinates, location);
        getDirections(location, nearestStop.geometry.coordinates);
      });
    }
  }

  async function getRoute(start, end, type) {
    // make a directions request using walking profile
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${type}/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
      { method: "GET" }
    );
    const json = await query.json();
    const data = json.routes[0];
    // duration will be walking time in seconds
    const walkingDuration = data.duration;
    const walkingMinutes = Math.ceil(walkingDuration / 60);
    // const walkingSeconds = (walkingDuration - walkingMinutes * 60).toFixed(2);
    // String describing how long it will take to walk
    const walkingDurationString = walkingMinutes.toString() + " minutes";
    console.log("walking duration" + walkingDurationString);
    if (start === currentLocation) {
      setWalkingCur(walkingDuration);
    } else if (start === destination) {
      setWalkingDest(walkingDuration);
    }
    var route = data.geometry.coordinates;
    var geojson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: route,
      },
    };
    if (type === "driving") {
      map.current.addLayer({
        id: `route-${start}`,
        type: "line",
        source: {
          type: "geojson",
          data: geojson,
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "gray",
          "line-width": 3,
          "line-dasharray": [1, 1],
          "line-gap-width": 1,
        },
      });
    } else {
      map.current.addLayer({
        id: `route-${start}`,
        type: "line",
        source: {
          type: "geojson",
          data: geojson,
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": start === currentLocation ? "#FF0000" : "#008000",
          "line-width": 5,
          "line-opacity": 0.75,
        },
      });
    }
  }

  // Retrieve current location from search boxe
  const handleRetrieveLocation = useCallback(
    (res) => {
      console.log(res);
      const feature = res.features[0].geometry.coordinates;
      setCurrentLocation(feature);
    },
    [setCurrentLocation]
  );

  // Retrieve destination from search box
  const handleRetrieveDestination = useCallback(
    (res) => {
      console.log(res);
      const feature = res.features[0].geometry.coordinates;
      setDestination(feature);
    },
    [setDestination]
  );

  // Get directions from two points on the map
  function getDirections(start, end) {
    getRoute(start, end, "walking");

    // Add starting point to the map
    map.current.addLayer({
      id: `starting-point-${start}`,
      type: "circle",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: start,
              },
            },
          ],
        },
      },
      paint: {
        "circle-radius": 10,
        "circle-color": start === currentLocation ? "#FF0000" : "#008000",
      },
    });
  }

  // const findRoutesWithStop = () => {
  useEffect(() => {
    console.log(nearestStopCur);
    console.log(nearestStopDest);
    if (nearestStopCur !== "" && nearestStopDest !== "") {
      console.log(nearestStopCur);

      let featureStartNumber = nearestStopCur.properties.featureIndex;
      let startStopId = stopIds[featureStartNumber];
      let featureEndNumber = nearestStopDest.properties.featureIndex;
      let endStopId = stopIds[featureEndNumber];
      let routesWithStop = [];
      let routesWithStopTime = [];
      let finalRoute;
      let destinationArrival;
      let stopArrival;
      // console.log(stopId);
      // Find routes with currentStop
      // for (const [key, value] of Object.entries(tripUpdates.entity)) {
      for (const [key, value] of Object.entries(
        passioData.tripUpdates.entity
      )) {
        // console.log(`${key}: ${value}`);
        // console.log(key);
        // console.log(value);
        for (const [key, valueNew] of Object.entries(
          value.trip_update.stop_time_update
        )) {
          //console.log(value);
          if (valueNew.stop_id === startStopId) {
            routesWithStop.push(value.id);
            console.log(value.id);
            //FINISH THIS
            routesWithStopTime.push(valueNew.arrival.time);
            break;
          }
        }
      }

      //Find routes with currentStop and destination
      for (const [key, value] of Object.entries(
        passioData.tripUpdates.entity
      )) {
        if (routesWithStop.includes(value.id)) {
          for (const [key, valueNew] of Object.entries(
            value.trip_update.stop_time_update
          )) {
            if (valueNew.stop_id === endStopId) {
              // console.log(value);
              // console.log(valueNew);
              // setVehicleId(value.trip_update.trip.trip_id);
              finalRoute = value;
              console.log(finalRoute);
              destinationArrival = valueNew.arrival.time;
              var stopIndex = routesWithStop.indexOf(value.id);
              stopArrival = routesWithStopTime[stopIndex];
              console.log("made it2");
              break;
            }
          }
        }
      }
      console.log(finalRoute);
      console.log(stopArrival);
      console.log(fromEpochToTime(stopArrival));
      console.log(destinationArrival);
      console.log(fromEpochToTime(destinationArrival));
      setShuttleDepart(fromEpochToTime(stopArrival));
      setShuttleArrive(fromEpochToTime(destinationArrival));
      setTimeOnShuttle(destinationArrival - stopArrival);
      // getRoute(
      //   nearestStopCur.geometry.coordinates,
      //   nearestStopDest.geometry.coordinates,
      //   "driving"
      // );
      setDirectionsLoaded(true);
      getRouteId(finalRoute);
    }
  }, [nearestStopCur, nearestStopDest]);

  // useEffect(() => {
  //   console.log(allPoints);
  //   if (allPoints !== "") {
  //     map.current.addLayer({
  //       id: "route",
  //       type: "circle",
  //       source: {
  //         type: "geojson",
  //         data: {
  //           type: "FeatureCollection",
  //           features: allPoints,
  //         },
  //       },
  //     });
  //   }
  // }, [allPoints]);

  function fromEpochToTime(epochTime) {
    return moment(epochTime * 1000).format("h:mm A");
  }

  function getRouteId(route) {
    shapes.forEach(function (item, index) {
      console.log(item.trips);
      console.log(Number(route.trip_update.trip.trip_id));
      if (item.trips) {
        if (item.trips.includes(Number(route.trip_update.trip.trip_id))) {
          console.log("found");
          plotRoute(index);
        }
      }
    });
  }

  function plotRoute(route_index) {
    map.current.addSource("route-drawing", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: shapes[route_index].path.map((e) =>
            Object.values(e).reverse()
          ),
        },
      },
    });
    map.current.addLayer({
      id: "route-drawing",
      type: "line",
      source: "route-drawing",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "black",
        "line-width": 2,
      },
    });
  }

  function handleSubmit() {
    // Find closest stop to your location
    findClosestStop(currentLocation);
    // Get directions to closest stop
    // console.log(nearestStopCur);
    // getDirections(currentLocation, nearestStopCur.geometry.coordinates);
    // // Find closest stop to destination location
    findClosestStop(destination);
    // // Get directions from stop to destination
    // getDirections(destination, nearestStopDest.geometry.coordinates);
    // Get shuttle schedule for departure stop
    // findRoutesWithStop();
    // Make sure shuttle doesn't leave before you will arrive
    // Calculate wait time at stop
    // Calculate time on shuttle to destination
    // Also want to include if click on stop tells you the schedule
    // Add shuttle to map? --> maybe with a toggle button
  }

  return (
    <div>
      <div className="sidebarStyle">
        <div>
          Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
        </div>
      </div>
      <div>
        <Typography>Current Location</Typography>
        <InputAutofill onRetrieve={handleRetrieveLocation} />
        <Typography>Destination</Typography>
        <InputAutofill onRetrieve={handleRetrieveDestination} />
        <Button variant="contained" onClick={handleSubmit}>
          Get Direction
        </Button>
      </div>
      {!dataLoading && <div className="map-container" ref={mapContainer} />}
      {directionsLoaded && (
        <>
          <TimeBlockVisualization
            walkingCur={walkingCur}
            timeOnShuttle={timeOnShuttle}
            walkingDest={walkingDest}
            uncertaintyBefore = 2*(1.96*(221.49/Math.sqrt(4850))); //from Jupyter Notebook calcs
            uncertaintyAfter = 2*(1.96*(221.49/Math.sqrt(4850))); //from Jupyter Notebook calcs
        />
        <List
          sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
          component="nav"
          aria-labelledby="nested-list-subheader"
          subheader={
            <ListSubheader component="div" id="nested-list-subheader">
              Directions
            </ListSubheader>
          }
        >
          <ListItem>
            <ListItemIcon>
              <DirectionsWalkIcon sx={{ color: "#3887be" }} />
            </ListItemIcon>
            <ListItemText
              primary={`Leave: Walk ${Math.ceil(
                walkingCur / 60
              )} minutes to your shuttle stop following the blue path`}
            />
          </ListItem>
          <ListItemButton
            onClick={() => setDirectionsInfoOpen(!directionsInfoOpen)}
          >
            <ListItemIcon>
              <AirportShuttleIcon />
            </ListItemIcon>
            <ListItemText
              primary={`${nearestStopCur.properties.Name}: ${shuttleDepart}: shuttle arrives`}
            />
            {directionsInfoOpen ? <ExpandLessIcon /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={directionsInfoOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem sx={{ pl: 4 }}>
                <ListItemIcon>
                  <HourglassBottomIcon />
                </ListItemIcon>
                <ListItemText
                  primary={`${moment(timeOnShuttle * 1000).format(
                    "m"
                  )} minutes on shuttle`}
                />
              </ListItem>
              {console.log(shuttleDepart)}
            </List>
          </Collapse>
          <ListItem>
            <ListItemIcon>
              <PlaceIcon />
            </ListItemIcon>
            <ListItemText
              primary={`${nearestStopDest.properties.Name}: ${shuttleArrive}: Arrive at destination stop`}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <DirectionsWalkIcon sx={{ color: "#008000" }} />
            </ListItemIcon>
            <ListItemText
              primary={`Walk ${Math.ceil(
                walkingDest / 60
              )} minutes to your destination following the green path`}
            />
          </ListItem>
        </List>
      )}
      {/* <button onClick={handleSubmit}>Get Directions</button> */}
    </div>
  );
}

export default Map;
