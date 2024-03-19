import React, { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
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
  Container,
  Box,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import AirportShuttleIcon from "@mui/icons-material/AirportShuttle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import PlaceIcon from "@mui/icons-material/Place";
import { trips, shapes } from "../data/trips";
import bus from "../data/bus.png";
import TimeBlockVisualization from "./TimeBlockVisualization";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

const popup = new mapboxgl.Popup();

function Map({ passioData, dataLoading }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

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
  const [timeOnShuttle, setTimeOnShuttle] = useState("");

  // Initialize map when component mounts
  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-71.11, 42.37], // Automatically center the map in Cambridge on load
      zoom: 13,
    });

    // Add navigation control (the +/- zoom buttons)
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

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
        "circle-color": `${
          location[0] === currentLocation[0] ? "#2434bf" : "#24bf3c"
        }`,
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
    // save the walking duration to state variables for later use
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
          "line-color": start === currentLocation ? "#5562d4" : "#008000",
          "line-width": 5,
          "line-opacity": 0.75,
        },
      });
    }
  }

  // Retrieve current location from search box
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
        "circle-color": start === currentLocation ? "#5562d4" : "#008000",
      },
    });
  }

  // Find the fastest routes that include the starting and destination stop
  useEffect(() => {
    if (nearestStopCur !== "" && nearestStopDest !== "") {
      let featureStartNumber = nearestStopCur.properties.featureIndex;
      let startStopId = stopIds[featureStartNumber];
      let featureEndNumber = nearestStopDest.properties.featureIndex;
      let endStopId = stopIds[featureEndNumber];
      let routesWithStop = [];
      let routesWithStopTime = [];
      let finalRoute;
      let destinationArrival;
      let stopArrival;
      // Find routes with currentStop
      for (const [key, value] of Object.entries(
        passioData.tripUpdates.entity
      )) {
        for (const [key, valueNew] of Object.entries(
          value.trip_update.stop_time_update
        )) {
          if (valueNew.stop_id === startStopId) {
            routesWithStop.push(value.id);
            console.log(value.id);
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
              finalRoute = value;
              destinationArrival = valueNew.arrival.time;
              var stopIndex = routesWithStop.indexOf(value.id);
              stopArrival = routesWithStopTime[stopIndex];
              break;
            }
          }
        }
      }
      setShuttleDepart(fromEpochToTime(stopArrival));
      setShuttleArrive(fromEpochToTime(destinationArrival));
      setTimeOnShuttle(destinationArrival - stopArrival);
      setDirectionsLoaded(true);
      getRouteId(finalRoute);
    }
  }, [nearestStopCur, nearestStopDest]);

  // Convert from epoch time to human readable time
  function fromEpochToTime(epochTime) {
    return moment(epochTime * 1000).format("h:mm A");
  }

  // Determine which shuttle route the user should take
  function getRouteId(route) {
    var shape_id;
    var routeCoords = [];
    trips.forEach(function (trip) {
      if (trip[2]) {
        if (trip[2] === route.trip_update.trip.trip_id) {
          shape_id = trip[7];
          shapes.forEach(function (shape) {
            if (shape[0] == shape_id) {
              routeCoords.push([shape[2], shape[1]]);
            }
          });
          plotRoute(routeCoords);
          plotBus(route.trip_update.trip.trip_id);
          return;
        }
      }
    });
  }

  // Show the shuttle route that is suggested on the map
  function plotRoute(routeCoords) {
    map.current.addSource("route-drawing", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeCoords,
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

  // Show the shuttle bus on the map once a route is chosen
  function plotBus(trip_id) {
    passioData.vehiclePositions.entity.forEach(function (item) {
      console.log(item);
      if (item.vehicle.trip.trip_id === trip_id) {
        map.current.loadImage(bus, (error, image) => {
          if (error) throw error;

          // Add the image to the map style.
          map.current.addImage("shuttle", image);

          // Add a data source containing one point feature.
          map.current.addSource("point", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [
                      item.vehicle.position.longitude,
                      item.vehicle.position.latitude,
                    ],
                  },
                },
              ],
            },
          });

          // Add a layer to use the image to represent the data.
          map.current.addLayer({
            id: "points",
            type: "symbol",
            source: "point", // reference the data source
            layout: {
              "icon-image": "shuttle", // reference the image
              "icon-size": 0.15,
            },
          });
        });
      }
    });
  }

  // Function that runs when we click the "get directions" button
  function handleSubmit() {
    // Find closest stop to your location
    findClosestStop(currentLocation);
    // Find closest stop to destination location
    findClosestStop(destination);
  }

  return (
    <div>
      <Typography variant="h3">
        NewPassioGo: Travel Around Harvard's Campus
      </Typography>
      <div>
        <Container maxWidth="md">
          <Box
            component="section"
            sx={{
              p: 2,
              border: "1px dashed grey",
            }}
          >
            <Typography fontWeight={"bold"} sx={{ textAlign: "left" }}>
              Where are you leaving from?
            </Typography>
            <InputAutofill onRetrieve={handleRetrieveLocation} />
            <Typography
              fontWeight={"bold"}
              sx={{ textAlign: "left", paddingTop: 2 }}
            >
              Where would you like to go?
            </Typography>
            <InputAutofill onRetrieve={handleRetrieveDestination} />
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{ marginTop: 2 }}
            >
              Get Directions
            </Button>
          </Box>
        </Container>
      </div>
      {!dataLoading && <div className="map-container" ref={mapContainer} />}
      {directionsLoaded && (
        <div>
          {/* Show the directions in the style of Google Maps */}
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
          {/* // Show uncertainty */}
          <TimeBlockVisualization
            walkingCur={walkingCur}
            timeOnShuttle={timeOnShuttle}
            walkingDest={walkingDest}
          />
        </div>
      )}
    </div>
  );
}

export default Map;
