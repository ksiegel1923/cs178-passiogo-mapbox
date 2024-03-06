import "./App.css";
import DataLoader from "./components/DataLoader";
import Map from "./components/Map.js";
import { shuttleStops } from "./data/shuttleStops";
import { stop_times } from "./data/routes";

function App() {
  return (
    <div className="App">
      {/* <Map /> */}
      <DataLoader />
      {/* {console.log(stop_times)}
      {console.log(shuttleStops)} */}
    </div>
  );
}

export default App;
