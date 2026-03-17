// Seed 5–6 demo properties for UP / Uttarakhand so they appear in public verification.
// Run with: node backend/scripts/seed-demo-properties.js

const axios = require("axios");

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// Demo registrar login (from frontend login configuration)
const REGISTRAR_EMAIL = "suresh.reddy@gmail.com";
const DEMO_PASSWORD = "Bhoomi@2024";

const PROPERTIES = [
  {
    propertyId: "BC-UP-LKO-1234A",
    surveyNumber: "123/4A",
    villageWard: "Gomti Nagar",
    district: "Lucknow",
    state: "Uttar Pradesh",
    landAreaSqM: 240.5,
    landType: "RESIDENTIAL",
    coordinates: "26.8469,80.9463",
  },
  {
    propertyId: "BC-UP-LKO-0572B",
    surveyNumber: "57/2B",
    villageWard: "Indira Nagar",
    district: "Lucknow",
    state: "Uttar Pradesh",
    landAreaSqM: 180,
    landType: "RESIDENTIAL",
    coordinates: "26.8782,80.9994",
  },
  {
    propertyId: "BC-UP-NOIDA-0891",
    surveyNumber: "89/1",
    villageWard: "Noida Sector 62",
    district: "Gautam Buddha Nagar",
    state: "Uttar Pradesh",
    landAreaSqM: 325,
    landType: "RESIDENTIAL",
    coordinates: "28.6280,77.3683",
  },
  {
    propertyId: "BC-UP-GZB-2103C",
    surveyNumber: "210/3C",
    villageWard: "Raj Nagar Extension",
    district: "Ghaziabad",
    state: "Uttar Pradesh",
    landAreaSqM: 150,
    landType: "RESIDENTIAL",
    coordinates: "28.7022,77.4538",
  },
  {
    propertyId: "BC-UK-DDN-0457",
    surveyNumber: "45/7",
    villageWard: "Jakhan",
    district: "Dehradun",
    state: "Uttarakhand",
    landAreaSqM: 275,
    landType: "RESIDENTIAL",
    coordinates: "30.3369,78.0410",
  },
  {
    propertyId: "BC-UK-HALD-1322A",
    surveyNumber: "132/2A",
    villageWard: "Haldwani",
    district: "Nainital",
    state: "Uttarakhand",
    landAreaSqM: 310,
    landType: "RESIDENTIAL",
    coordinates: "29.2183,79.5120",
  },
];

async function main() {
  console.log("Seeding demo properties to", API_BASE);

  // 1) Login as registrar to get token
  const loginRes = await axios.post(`${API_BASE}/api/auth/login`, {
    email: REGISTRAR_EMAIL,
    password: DEMO_PASSWORD,
  });
  const { token } = loginRes.data;
  const headers = { Authorization: `Bearer ${token}` };

  // 2) Get a citizen user to assign as owner
  const usersRes = await axios.get(`${API_BASE}/api/users/users`, { headers });
  const citizens = (usersRes.data.users || []).filter((u) => u.role === "CITIZEN");
  if (!citizens.length) {
    throw new Error("No CITIZEN users found to assign as owners.");
  }
  const ownerUserId = citizens[0].id;

  // 3) Register each property (idempotent-ish: ignore duplicates)
  for (const prop of PROPERTIES) {
    try {
      console.log(`Registering property ${prop.propertyId} (${prop.district})...`);
      // Simple rectangular demo boundary around the given coordinate (~20–30m box)
      const [latStr, lngStr] = prop.coordinates.split(",");
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const dLat = 0.00015;
      const dLng = 0.00015;
      const boundaryGeojson = {
        type: "Polygon",
        coordinates: [[
          [lng - dLng, lat - dLat],
          [lng + dLng, lat - dLat],
          [lng + dLng, lat + dLat],
          [lng - dLng, lat + dLat],
          [lng - dLng, lat - dLat],
        ]],
      };

      await axios.post(
        `${API_BASE}/api/properties/register`,
        {
          propertyId: prop.propertyId,
          ownerUserId,
          geoCoordinates: prop.coordinates,
          ipfsHash: "", // demo: leave empty
          surveyNumber: prop.surveyNumber,
          state: prop.state,
          district: prop.district,
          villageWard: prop.villageWard,
          landAreaSqM: prop.landAreaSqM,
          landType: prop.landType,
          boundaryGeojson,
        },
        { headers }
      );
      console.log(`  ✔ Registered ${prop.propertyId}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.warn(`  ⚠ Skipped ${prop.propertyId}: ${msg}`);
    }
  }

  console.log("Done seeding demo properties.");
}

main().catch((err) => {
  console.error("Failed to seed demo properties:", err.message);
  process.exit(1);
});

