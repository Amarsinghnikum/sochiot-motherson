const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb://isaqaadmin:password@44.240.110.54:27017/isa_qa", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const deviceEventSchema = new mongoose.Schema(
  {
    device_id: { type: String, required: true },
    entity_name: { type: String, required: true },
    module_id: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    dynamicFields: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
  },
  { collection: "device_events" }
);

const DeviceEvent = mongoose.model("DeviceEvent", deviceEventSchema);

const mothersonSchema = new mongoose.Schema(
  {
    siteName: { type: String, required: true },
    Devices: [
      {
        device_id: { type: String, required: true },
        module_id: { type: String, required: true },
        dynamic_fields: [
          {
            key: { type: String, required: true },
            value: { type: String, required: false },
            activeValue: { type: String, default: "" },
          },
        ],
      },
    ],
  },
  { collection: "device_motherson" }
);

const DeviceMotherson = mongoose.model("DeviceMotherson", mothersonSchema);

app.get("/device_motherson/:siteName/:device_id", async (req, res) => {
  try {
    const { siteName, device_id } = req.params;
    const site = await DeviceMotherson.findOne({ siteName });

    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    const device = site.Devices.find(d => d.device_id === device_id);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    return res.status(200).json({ message: "Device found", data: device });
  } catch (error) {
    console.error("Error fetching device:", error);
    res.status(500).json({ message: "Error fetching device", error: error.message });
  }
});

app.get("/get-latest-values", async (req, res) => {
  try {
    const { device_id, deviceName, module_id } = req.query;

    if (!device_id || !deviceName || !module_id) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const latestData = await DeviceEvent.find({
      device_id,
      entity_name: deviceName,
      module_id: parseInt(module_id),
    })
      .sort({ createdAt: -1 })
      .limit(20);

    if (latestData.length === 0) {
      return res.status(404).json({ error: "No matching data found" });
    }

    const dynamicFieldsKeys = new Set();
    latestData.forEach((data) => {
      Object.keys(data._doc).forEach((key) => {
        if (key.startsWith("2,") || key.startsWith("3,")) {
          dynamicFieldsKeys.add(key);
        }
      });
    });

    res.status(200).json({ dynamicFieldsKeys: Array.from(dynamicFieldsKeys) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/device_motherson", async (req, res) => {
  try {
    const { siteName, Devices } = req.body;

    if (!siteName || siteName.trim() === "") {
      return res.status(400).json({ message: "siteName is required" });
    }

    if (!Devices || !Array.isArray(Devices)) {
      return res.status(400).json({ message: "Devices array is required" });
    }

    let existingSite = await DeviceMotherson.findOne({ siteName });

    if (!existingSite) {
      const newSite = new DeviceMotherson({
        siteName,
        Devices: Devices.map(device => ({
          ...device,
          dynamic_fields: device.dynamic_fields || [],
        })),
      });

      await newSite.save();
      return res.status(201).json({ message: "Data saved successfully", data: newSite });
    } else {
      Devices.forEach((device) => {
        const existingDevice = existingSite.Devices.find(d => d.device_id === device.device_id);
        if (existingDevice) {
          existingDevice.dynamic_fields = device.dynamic_fields || [];
        } else {
          existingSite.Devices.push({
            ...device,
            dynamic_fields: device.dynamic_fields || [],
          });
        }
      });

      await existingSite.save();
      return res.status(200).json({ message: "Devices updated successfully", data: existingSite });
    }
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ message: "Error saving data", error: error.message });
  }
});

app.post("/get-device-events", async (req, res) => {
  try {
    const { siteName } = req.body;

    if (!siteName) {
      return res.status(400).json({ message: "Missing required parameter: siteName" });
    }

    const existingSite = await DeviceMotherson.findOne({ siteName });

    if (!existingSite) {
      return res.status(404).json({ message: `Site with name ${siteName} not found` });
    }

    const devicesPayload = existingSite.Devices.map(device => ({
      device_id: device.device_id,
      module_id: device.module_id,
    }));

    if (devicesPayload.length === 0) {
      return res.status(404).json({ message: "No devices found for this site" });
    }

    const deviceEventPromises = devicesPayload.map(async (device) => {
      try {
        const latestEvent = await DeviceEvent.findOne({
          device_id: device.device_id,
          module_id: device.module_id,
        })
          .sort({ createdAt: -1 })
          .exec();
          
        return {
          device_id: device.device_id,
          module_id: device.module_id,
          latest_event: latestEvent || null,
        };
      } catch (err) {
        console.error(`Error fetching event for device_id ${device.device_id} and module_id ${device.module_id}:`, err);
        return {
          device_id: device.device_id,
          module_id: device.module_id,
          latest_event: null,
        };
      }
    });

    const devicesWithLatestEvents = await Promise.all(deviceEventPromises);

    res.status(200).json({
      message: "Devices with latest events fetched successfully",
      data: devicesWithLatestEvents,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
