import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./Counter.css";
import { format } from "date-fns";
import axios from "axios";

const MachineStatus = () => {
  const location = useLocation();
  const { deviceIds, moduleIds } = location.state || { deviceIds: [], moduleIds: [] };
  const [timestamps, setTimestamps] = useState(Array(16).fill(new Date().toLocaleString()));
  const [formatted, setFormattedDate] = useState(null);

  const initialMachinesData = [
    { name: "C&C-01", status: "Healthy", statusClass: "healthy" },
    { name: "C&C-02", status: "Under Maintenance", statusClass: "maintenance" },
    { name: "C&C-03", status: "Healthy", statusClass: "healthy" },
    { name: "C&C-04", status: "Under Maintenance", statusClass: "maintenance" },
    { name: "C&C-05", status: "Healthy", statusClass: "healthy" },
    { name: "C&C-06", status: "Under Maintenance", statusClass: "maintenance" },
    { name: "C&C-07", status: "Healthy", statusClass: "healthy" },
    { name: "C&C-08", status: "Under Maintenance", statusClass: "maintenance" },
    { name: "C&C-09", status: "Healthy", statusClass: "healthy" },
    { name: "C&C-10", status: "Under Maintenance", statusClass: "maintenance" },
    { name: "C&C-11", status: "Healthy", statusClass: "healthy" },
    { name: "C&C-12", status: "Under Maintenance", statusClass: "maintenance" },
    { name: "C&C-13", status: "Healthy", statusClass: "healthy" },
    { name: "C&C-14", status: "Under Maintenance", statusClass: "maintenance" },
    { name: "C&C-15", status: "Healthy", statusClass: "healthy" },
    { name: "C&C-16", status: "Under Maintenance", statusClass: "maintenance" },
  ];

  const [machines, setMachines] = useState(initialMachinesData);
  const [timerValues, setTimerValues] = useState(Array(machines.length).fill("0"));
  const [counterValues, setCounterValues] = useState(Array(machines.length).fill("0"));
  const [statusValues, setStatusValues] = useState(Array(machines.length).fill(2));

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    const time = date.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${day} ${month}' ${year}, ${time}`;
  };

  const [boxes, setBoxes] = useState({
    Box_1: [],
    Box_2: [],
    Box_3: [],
    Box_4: [],
  });

  const fetchData = useCallback(async () => {
    try {
      const payload = { siteName: "Motherson_P_1" };
      const response = await axios.post("http://localhost:3000/get-device-events", payload);
      const fetchedData = response.data;

      if (fetchedData && Array.isArray(fetchedData.data) && fetchedData.data.length > 0) {
        const boxes = { Box_1: [], Box_2: [], Box_3: [], Box_4: [] };
        const newTimerValues = [];
        const newCounterValues = [];
        const newStatusValues = [];
        let latestEventTimestamp = null;

        fetchedData.data.forEach(({ device_id, module_id, latest_event }) => {
          const entity_name = latest_event.entity_name || "Box_1";

          if (boxes[entity_name]) {
            boxes[entity_name].push({ device_id, module_id, latest_event });
          }

          Object.keys(latest_event).forEach((key) => {
            if (key.includes(",")) {
              if (key.startsWith("3,") && key.split(",")[1].length === 2) {
                newTimerValues.push(latest_event[key]);
              } else if (key.startsWith("3,") && key.split(",")[1].length === 1) {
                newCounterValues.push(latest_event[key]);
              } else if (key.startsWith("2,")) {
                newStatusValues.push(latest_event[key]);
              }
            }
          });

          if (latest_event.createdAt) {
            if (!latestEventTimestamp || new Date(latest_event.createdAt) > new Date(latestEventTimestamp)) {
              latestEventTimestamp = latest_event.createdAt;
            }
          }
        });

        if (latestEventTimestamp) {
          const formatted = formatDate(latestEventTimestamp);
          setFormattedDate(formatted);
        }
        setTimerValues(newTimerValues);
        setCounterValues(newCounterValues);
        setStatusValues(newStatusValues);
      }
    } catch (error) {
      console.error("Error fetching device events:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [deviceIds, moduleIds]);

  useEffect(() => {
    const updatedMachines = machines.map((machine, index) => {
      if (statusValues[index] === 1) {
        return { ...machine, status: "Under Maintenance", statusClass: "maintenance" };
      } else if (statusValues[index] === 2) {
        return { ...machine, status: "Healthy", statusClass: "healthy" };
      } else {
        return { ...machine, status: "Healthy", statusClass: "healthy" };
      }
    });

    setMachines(updatedMachines);
  }, [statusValues]);

  const handleInputChange = (index, value, type) => {
    if (index >= 0 && index < machines.length) {
      if (type === "timer") {
        const updatedTimerValues = [...timerValues];
        updatedTimerValues[index] = value;
        setTimerValues(updatedTimerValues);
      } else if (type === "counter") {
        const updatedCounterValues = [...counterValues];
        updatedCounterValues[index] = value;
        setCounterValues(updatedCounterValues);
      }
    }
  };

  const leftColumnMachines = machines.slice(0, machines.length / 2);
  const rightColumnMachines = machines.slice(machines.length / 2);

  return (
    <div className="machine-status-container">
      {[leftColumnMachines, rightColumnMachines].map((column, columnIndex) => (
        <div key={columnIndex} className="column">
          {column.map((machine, index) => {
            const actualIndex = columnIndex * (machines.length / 2) + index;
            return (
              <div key={actualIndex} className="machine-row">
                <div className="machine-name">{machine.name}</div>
                <div className={`status-box ${machine.statusClass}`}>{machine.status}</div>
                <div className="timer-counter">
                  <div className="input-box">
                    <label>Timer</label>
                    <input
                      type="text"
                      value={timerValues[actualIndex] || "0"}
                      onChange={(e) => handleInputChange(actualIndex, e.target.value, "timer")}
                    />
                  </div>
                  <div className="input-box">
                    <label>Counter</label>
                    <input
                      type="text"
                      value={counterValues[actualIndex] || "0"}
                      onChange={(e) => handleInputChange(actualIndex, e.target.value, "counter")}
                    />
                  </div>
                  <div className="input-box">
                    <label>Date & Time</label>
                    <div className="date-time-box">{formatted || "No data available"}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MachineStatus;
