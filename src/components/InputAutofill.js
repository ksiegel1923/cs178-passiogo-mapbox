import React, { useEffect, useState } from "react";
import { config, SearchBox } from "@mapbox/search-js-react";

export default function InputAutofill({ ...props }) {
  const [token, setToken] = useState("");

  // Connect to the mapbox API
  useEffect(() => {
    const accessToken = process.env.REACT_APP_MAPBOX_KEY;
    setToken(accessToken);
    config.accessToken = accessToken;
  }, []);

  return (
    <form>
      {/* Using the Mapbox SearchBox API to suggest locations */}
      {/* onRetrieve automatically grabs the suggested input that the user selects */}
      <SearchBox accessToken={token} onRetrieve={props.onRetrieve} value={""} />
    </form>
  );
}
