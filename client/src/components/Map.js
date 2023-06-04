import React from 'react';
import {
  withGoogleMap,
  withScriptjs,
  GoogleMap,
  Marker,
} from 'react-google-maps';

const Map = ({ coords }) => {
  return (
    <>
      {coords.lat && coords.lng && (
        <GoogleMap
          defaultZoom={18}
          defaultCenter={{ lat: 21.027763, lng: 105.83416 }}
          center={coords}
        >
          <Marker position={coords} />
        </GoogleMap>
      )}
    </>
  );
};

export default withScriptjs(withGoogleMap(Map));
