import API from "../utils/api";

export const UploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await API.post("/api/media/upload-media", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const UploadFileWithCredits = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("creditRequired", "true");
    const res = await API.post("/api/media/upload-media", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const UploadMultipleFiles = async (files) => {
  try {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i].file);
    }
    const res = await API.post("/api/media/upload-multiple-media", formData);
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const getTodayUploads = async () => {
  try {
    const res = await API.get("/api/media/today-uploads");
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const UpdateFile = async ({ id, file }) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await API.put(`/api/media/update-media/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const getMediaRecords = async (params) => {
  try {
    const res = await API.get("/api/media/media-records", { params });
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};

export const deleteMedia = async (id) => {
  try {
    const res = await API.delete(`/api/media/delete-media/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};
