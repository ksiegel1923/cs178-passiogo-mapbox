import React, { useEffect, useState } from "react";
import { config, SearchBox } from "@mapbox/search-js-react";

export default function InputAutofill({ ...props }) {
  const [token, setToken] = useState("");

  useEffect(() => {
    const accessToken = process.env.REACT_APP_MAPBOX_KEY;
    setToken(accessToken);
    config.accessToken = accessToken;
  }, []);

  return (
    <form>
      {/* <AddressAutofill accessToken={token}>
        <input
          autoComplete="shipping address-line1"
          onRetrieve={props.handleRetrieve}
          //   value={props.value}
          //   onChange={props.onChange}
        />
      </AddressAutofill> */}
      {console.log("hi")}
      <SearchBox accessToken={token} onRetrieve={props.onRetrieve} value={""} />
    </form>
  );
}
