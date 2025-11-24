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
  const [speed, setSpeed] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  const watchIdRef = useRef(null);

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
          setSpeed(currLocation.speed);
          let speedData = currLocation.speed;
          setAccuracy(currLocation.accuracy);
          let accuracyData = currLocation.accuracy;
          let timeStamp = position.timestamp;
          //console.log(speed, accuracy);
          //console.log(position);
          const locationString = `${timeStamp},${currLocation.latitude},${currLocation.longitude}`;
          sendMessage(locationString);
          setLog(
            (prev) =>
              prev +
              " " +
              // " Lat: " +
              currLocation.latitude +
              " ; " +
              // "Lng: " +
              currLocation.longitude +
              // " ; " +
              // "Speed: " +
              // speed +
              " ; " +
              // "TimeStamp: " +
              new Date(timeStamp) +
              // " ; " +
              // "Accuracy: " +
              // accuracy +
              "\n"
          );
        },
        (error) => {
          setSending(false);
          setError("error getting user location" + error);
          console.log("error getting user location" + error);
          stopTimer();
        }
      );
    } else {
      setSending(false);
      setError("Geo Location is not supported in this browser");
      console.log("Geo Location is not supported in this browser");
      stopTimer();
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
    } else {
      setError("No Connection to Websocket Server");
      stopTimer();
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

  const startLocationTracking = () => {
    if (!connection) {
      setError("No Connection to Websocket Server");
      return;
    }
    if (watchIdRef.current !== null) {
      return;
    }
    setMessageDialog("Starting Location Tracker");
    setSending(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = position.coords;
        const timeStamp = position.timestamp;
        const speed = position.speed;

        setSpeed(coords.speed);
        setAccuracy(coords.accuracy);

        const locationString = `${timeStamp},${coords.latitude},${coords.longitude},${coords.speed}`;

        sendMessage(locationString);

        setLog(
          (prev) =>
            prev +
            `${coords.latitude}, ${coords.longitude}, ${new Date(timeStamp)}\n`
        );
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError("Error getting location: " + error.message);
        stopLocationTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 second timeout
        maximumAge: 0, // no caching
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSending(false);
  };

  useEffect(() => {
    return () => {
      //clearInterval(intervalIDRef.current);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
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
          <div className="flex flex-col">
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
            <div>
              <span>Data packets : </span>
              {sending ? (
                <>
                  <span className="text-green-400"> Sending</span>
                </>
              ) : (
                <>
                  <span className="text-red-400"> Not Sending</span>
                </>
              )}
            </div>
          </div>
          {sending ? (
            <>
              <button
                className="background-red-500"
                onClick={() => stopLocationTracking()}
              >
                Stop
              </button>
            </>
          ) : (
            <>
              <button onClick={() => startLocationTracking()}>
                Send User Location
              </button>
            </>
          )}
        </div>
        {sending ? (
          <>
            <div>
              {speed != null ? (
                <>
                  <span>
                    {" "}
                    Speed:<span className="text-yellow-400">{speed}</span>{" "}
                  </span>
                </>
              ) : (
                <></>
              )}
              {accuracy != null ? (
                <>
                  <span>
                    {" "}
                    Accuracy :{" "}
                    <span className="text-yellow-400">{accuracy}</span>{" "}
                  </span>
                </>
              ) : (
                <></>
              )}
            </div>
          </>
        ) : (
          <></>
        )}
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
