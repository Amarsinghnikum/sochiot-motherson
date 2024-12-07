import React, { useState } from "react";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./admin.css";
import { v4 as uuidv4 } from "uuid";

const Admin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    siteName: "",
    device_id: "",
    deviceName: "",
    module_id: "",
    dynamicFields: [],
  });

  const [allModules, setAllModules] = useState([]);

  const predefinedDropdownOptions = [
    "Voltage L1N",
    "Voltage L2N",
    "Avg. Voltage L-L",
    "Average Voltage",
    "Power L1",
    "Power L2",
    "Power L3",
    "Current L1",
    "Current L2",
    "Current L3",
    "Power (KVAr)",
    "Frequency",
    "Battery Voltage",
    "Engine Coolant Temp",
    "Engine Oil Temp",
    "Engine Speed",
    "Engine Start/Stop",
    "Bus Voltage",
    "Current Frequency",
    "Output Current",
    "Output Power",
    "Running Rotation Speed",
    "Counter",
    "Close Time",
    "Open Time",
    "C&C-01-C",
    "C&C-02-C",
    "C&C-03-C",
    "C&C-04-C",
    "C&C-01-T",
    "C&C-02-T",
    "C&C-03-T",
    "C&C-04-T",
    "C&C-01-S",
    "C&C-02-S",
    "C&C-03-S",
    "C&C-04-S",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDropdownChange = (index, selectedKey) => {
    const updatedFields = [...formData.dynamicFields];
    updatedFields[index].dropdownValue = selectedKey;
    updatedFields[index].selectedKeyValue = {
      key: selectedKey,
      value: predefinedDropdownOptions.find((option) => option === selectedKey),
    };
    setFormData({ ...formData, dynamicFields: updatedFields });
  };

  const handleFetchData = async () => {
    try {
      const { device_id, deviceName, module_id } = formData;

      if (!device_id || !deviceName || !module_id) {
        return alert("Please fill all required fields.");
      }

      const response = await axios.get(
        `http://localhost:3000/get-latest-values`,
        {
          params: { device_id, deviceName, module_id },
        }
      );

      const { dynamicFieldsKeys } = response.data;

      const dynamicFieldsArray = dynamicFieldsKeys.map((key) => ({
        unique_id: uuidv4(),
        key,
        value: "",
        dropdownValue: "",
        dropdownOptions: predefinedDropdownOptions,
        selectedKeyValue: null,
      }));

      setFormData({ ...formData, dynamicFields: dynamicFieldsArray });
    } catch (error) {
      console.error("Error fetching dynamic keys:", error);
    }
  };

  const handleNext = async () => {
    if (!formData.module_id || !formData.device_id || !formData.deviceName) {
      alert("Please fill all required fields.");
      return;
    }

    const newModuleData = {
      module_id: formData.module_id,
      device_id: formData.device_id,
      dynamicFields: formData.dynamicFields.map((field) => ({
        key: field.key,
        value: field.selectedKeyValue?.value || field.value,
        actual_value: field.value || "",
      })),
    };

    try {
      const existingModules = JSON.parse(localStorage.getItem("allModules")) || [];
      const moduleIndex = existingModules.findIndex(
        (module) => module.module_id === newModuleData.module_id
      );

      if (moduleIndex >= 0) {
        existingModules[moduleIndex] = newModuleData;
      } else {
        existingModules.push(newModuleData);
      }

      localStorage.setItem("allModules", JSON.stringify(existingModules));

      setFormData({
        ...formData,
        module_id: "",
        dynamicFields: [],
      });

      alert("Module added successfully. You can now add another module.");
    } catch (error) {
      console.error("Error while adding module:", error);
      alert("An error occurred while adding the module.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const allModulesFromStorage = JSON.parse(localStorage.getItem("allModules")) || [];
      const finalPayload = {
        siteName: formData.siteName,
        Devices: allModulesFromStorage.map((module) => ({
          device_id: module.device_id,
          module_id: module.module_id,
          dynamic_fields: module.dynamicFields.map((field) => ({
            key: field.key,
            value: field.value,
            activeValue: field.selectedKeyValue?.value || field.value,
          })),
        })),
      };

      await axios.post("http://localhost:3000/device_motherson", finalPayload);

      alert("Data saved successfully!");

      localStorage.removeItem("allModules");
      setFormData({
        siteName: "",
        device_id: "",
        deviceName: "",
        module_id: "",
        dynamicFields: [],
      });

      const deviceIds = allModulesFromStorage.map((module) => module.device_id);
      const moduleIds = allModulesFromStorage.map((module) => module.module_id);

      navigate("/counterr", { state: { deviceIds, moduleIds } });
    } catch (error) {
      console.error("Error details:", error.response ? error.response.data : error.message);
      alert("An error occurred while saving data.");
    }
  };

  return (
    <Container fluid className="admin-panel">
      <Row className="justify-content-center">
        <Col xs={12} className="admin-box p-4">
          <h1 className="text-center">ADMIN PANEL</h1>
          <Form onSubmit={handleSubmit}>
            <Form.Group as={Row} className="mb-3" controlId="siteName">
              <Form.Label column sm={4}>
                Site Name
              </Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="text"
                  placeholder="Enter site name"
                  name="siteName"
                  value={formData.siteName}
                  onChange={handleChange}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="device_id">
              <Form.Label column sm={4}>
                Device ID
              </Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="text"
                  placeholder="Enter device ID"
                  name="device_id"
                  value={formData.device_id}
                  onChange={handleChange}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="deviceName">
              <Form.Label column sm={4}>
                Device Name
              </Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="text"
                  placeholder="Enter device name"
                  name="deviceName"
                  value={formData.deviceName}
                  onChange={handleChange}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="module_id">
              <Form.Label column sm={4}>
                Module ID
              </Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="text"
                  placeholder="Enter module ID"
                  name="module_id"
                  value={formData.module_id}
                  onChange={handleChange}
                />
              </Col>
            </Form.Group>
            <Button
              variant="dark"
              className="mb-3 w-100"
              onClick={handleFetchData}
            >
              Connect/Fetch
            </Button>
            {formData.dynamicFields.map((field, index) => (
              <Form.Group as={Row} className="mb-3" key={field.unique_id}>
                <Form.Label column sm={4}>
                  {field.key}
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    as="select"
                    value={field.dropdownValue}
                    onChange={(e) => handleDropdownChange(index, e.target.value)}
                  >
                    {field.dropdownOptions.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </Form.Control>
                </Col>
              </Form.Group>
            ))}
            <Button
              variant="dark"
              className="mb-3 w-100"
              onClick={handleNext}
            >
              Add Module
            </Button>
            <Button
              variant="success"
              type="submit"
              className="w-100"
            >
              Submit
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Admin;
