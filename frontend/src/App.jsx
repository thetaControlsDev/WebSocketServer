import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

import React, { useState, useCallback, useEffect, useRef } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [connection, setConnection] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const intervalIDRef = useRef(null);
  //"https://websocketserver-npgf.onrender.com"
  const [socketUrl, setSocketUrl] = useState(
    "wss://websocketserver-npgf.onrender.com"
  );
  //const [socketUrl, setSocketUrl] = useState("ws://127.0.0.1:1234");
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
    onOpen: () => {
      console.log("opened");
      setConnection(true);
    },
    onClose: () => {
      setSending(false);
      setConnection(false);
      stopTimer();
    },
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: (closeEvent) => true,
  });

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          let currLocation = position.coords;
          let speed = currLocation.speed;
          let accuracy = currLocation.accuracy;
          let timeStamp = position.timestamp;
          console.log(position);
          const locationString = `${timeStamp},${currLocation.latitude},${currLocation.longitude}`;
          sendMessage(locationString);
          setLog(
            (prev) =>
              prev +
              " Lat: " +
              currLocation.latitude +
              " ; " +
              "Lng: " +
              currLocation.longitude +
              " ; " +
              "Speed: " +
              speed +
              " ; " +
              "TimeStamp: " +
              new Date(timeStamp) +
              " ; " +
              "Accuracy: " +
              accuracy +
              "\n"
          );
        },
        (error) => {
          setSending(false);
          setError("error getting user location" + error);
          console.log("error getting user location" + error);
        }
      );
    } else {
      setSending(false);
      setError("Geo Location is not supported in this browser");
      console.log("Geo Location is not supported in this browser");
    }
  };

  const setError = (message) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage("");
    }, 4000);
  };

  const setMessageDialog = (message) => {
    setMessage(message);
    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  const startLocationInterval = () => {
    if (connection) {
      setMessageDialog("Starting Location Interval");
      startTimer();
      // setInterval(() => {
      //   getUserLocation();
      // }, 2000);
    } else {
      setError("No Connection to Websocket Server");
    }
  };

  const startTimer = useCallback(() => {
    setSending(true);
    intervalIDRef.current = setInterval(() => {
      getUserLocation();
    }, 2000);
  }, []);

  const stopTimer = useCallback(() => {
    setSending(false);
    clearInterval(intervalIDRef.current);
    intervalIDRef.current = null;
  }, []);

  useEffect(() => {
    // setInterval(()=>{
    //     getUserLocation()
    // },4000)
    return () => clearInterval(intervalIDRef.current);
  }, []);

  return (
    <div className="flex flex-col m-5 h-full">
      <div className="p-4">
        <h1 className="h-14">Live Location Sender</h1>
        <div className="text-red-400 h-10 flex justify-center items-center">
          {errorMessage}
        </div>
        <div className="text-green-400 h-10 flex justify-center items-center">
          {message}
        </div>
        <div className="flex flex-row justify-around items-center">
          <div>
            <span>Server WebSocket : </span>
            {connection ? (
              <>
                <span className="text-green-400"> Connected</span>
              </>
            ) : (
              <>
                <span className="text-red-400"> Disconnected</span>
              </>
            )}
          </div>
          {sending ? (
            <>
              <span>Sending data... </span>
              <button
                className="background-red-500"
                onClick={() => stopTimer()}
              >
                Stop
              </button>
            </>
          ) : (
            <>
              <button onClick={() => startLocationInterval()}>
                Send User Location
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex justify-center align-center h-[60vh] border-1 border-blue-100 m-0">
        <textarea
          className="h-[60vh] w-full"
          placeholder=" Location data logs are displayed here ............"
          value={log}
          readOnly
        ></textarea>
      </div>
    </div>
  );
}

export default App;
