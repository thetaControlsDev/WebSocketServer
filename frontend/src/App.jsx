import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

import React, { useState, useCallback, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [socketUrl, setSocketUrl] = useState("ws://127.0.0.1:1234");
  const [count, setCount] = useState(0);
  const [log, setLog] = useState("");

  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(socketUrl, {
    onOpen: () => console.log("opened"),
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: (closeEvent) => true,
  });

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          let currLocation = position.coords;
          const locationString = `${currLocation.latitude},${currLocation.longitude}`;
          sendMessage(locationString);
          setLog(
            (prev) =>
              prev +
              " Lat: " +
              currLocation.latitude +
              ", " +
              "Lng: " +
              currLocation.longitude +
              "\n"
          );
        },
        (error) => {
          console.log("error getting user location");
        }
      );
    } else {
      console.log("Geo Location is not supported in this browser");
    }
  };

  const startLocationInterval = () => {
    setInterval(() => {
      getUserLocation();
    }, 4000);
  };

  useEffect(() => {
    // setInterval(()=>{
    //     getUserLocation()
    // },4000)
  }, []);

  return (
    <>
      <div className="flex flex-col w-screen">
        <div className="p-4">
          <div className="h-24">Live Location Sender</div>
          <button onClick={() => startLocationInterval()}>
            Get User Location
          </button>
        </div>
        <div className="flex justify-center align-center h-[60%] border-1 border-blue-100 m-5">
          <textarea
            className="h-[60%] w-[100%]"
            value={log}
            readOnly
          ></textarea>
        </div>
      </div>
    </>
  );
}

export default App;
