import API from "../utils/api";
import axios from "axios";

export const genApiKey = async (name) => {
  try {
    const res = await API.post("/api/v1/key/gen", { name });
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const getApiKeys = async () => {
  try {
    const res = await API.get("/api/v1/key/get-keys");
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const deleteApiKeys = async (id) => {
  try {
    const res = await API.delete(`/api/v1/key/del-key/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const getApiUsage = async () => {
  try {
    const res = await API.get("/api/v1/key/api-usage");
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const getApiUsageByDate = async (date) => {
  try {
    const res = await API.get("/api/v1/key/api-uage-by-date", {
      params: { date },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const getApiUsageByMonth = async (month) => {
  try {
    const res = await API.get("/api/v1/key/api-uage-by-month", {
      params: { month },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const getApiKeyDetails = async (keyId) => {
  try {
    const res = await API.get(`/api/v1/key/api-details/${keyId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const uploadByApi = async (files) => {
  if (!files || files.length === 0) throw new Error("No files selected");
  else if (files.length > 5)
    throw new Error("maximum 5 files upload at a time.");
  const formData = new FormData();
  files.forEach((item) => {
    formData.append("files", item.file);
  });

  try {
    const res = await axios.post(
      "http://localhost:3000/api/v1/key/upload-media",
      formData,
      {
        headers: {
          apikey: "md_sk_a••••••••••••••••", // pass your apikey
        },
      },
    );

    return res.data; // { message, files, creditsUsed, remainingCredits }
  } catch (err) {
    console.error("Upload API error:", err.response?.data || err.message);
    throw err.response?.data || err;
  }
};