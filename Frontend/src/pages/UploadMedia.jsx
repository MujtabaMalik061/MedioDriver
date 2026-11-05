import React, { useState, useRef, useEffect } from "react";
import "../assets/style/UploadMedia.css";
import {
  UploadCloud,
  Image,
  Music,
  Copy,
  Download,
  Upload,
  X,
  FileText,
  Video,
} from "lucide-react";
import {
  getTodayUploads,
  UploadMultipleFiles,
} from "../services/upload.services";
import { toast } from "sonner";
import { ImageViewModel, TopBar } from "../components/CustomComponents";
import Loader from "../components/Loader";
import { formatFileSize, handleCopy, handleDownload } from "../utils/Helper";
import { useAuth } from "../context/AuthContext";

const UploadMedia = () => {
  const { currentUser } = useAuth();
  const [credits, setCredits] = useState(currentUser?.credits || 0);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imageModel, setImageModel] = useState(null);
  const [loading, setLoading] = useState(null);
  const [todayUploades, setTodayUploades] = useState([]);
  const fileInputRef = useRef(null);
  const MAX_FILES = 5;
  const MAX_FILE_SIZE_MB = 500;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    handleGetTodayUploads();
  }, []);

  const handleGetTodayUploads = async () => {
    try {
      setLoading(true);
      const res = await getTodayUploads();
      setTodayUploades(res?.files || []);
    } catch (err) {
      console.error("Error fetching today's uploads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (newFiles) => {
    const incomingFiles = Array.from(newFiles);

    if (files.length + incomingFiles.length > MAX_FILES) {
      toast.error(`You can only upload up to ${MAX_FILES} files`);
      return;
    }

    const oversized = incomingFiles.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      toast.error(`Each file must be under ${MAX_FILE_SIZE_MB} MB`);
      return;
    }

    const fileArray = incomingFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
    }));

    setFiles((prev) => [...prev, ...fileArray]);
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => e.preventDefault();

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const uploadAll = async () => {
    if (!files.length) return;
    try {
      setUploading(true);
      const res = await UploadMultipleFiles(files);
      toast.success("All files uploaded!");
      setFiles([]);
      if (res?.remainingCredits !== undefined) {
        setCredits(res.remainingCredits);
      }
      if (res?.files?.length) {
        setTodayUploades((prev) => [...res.files, ...prev]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err?.message || "Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const IconSuggestion = (type = "") => {
    if (type.includes("audio")) return <Music size={20} />;
    else if (type.includes("video")) return <Video size={20} />;
    else if (type.includes("image")) return <Image size={20} />;
    else return <FileText size={20} />;
  };


  return (
    <>
      <TopBar title="Upload Media" updateCredits={credits} />
      <div className="page-container">
        <div className="upload-container">
          <div
            className="upload-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current.click()}
          >
            <UploadCloud className="upload-dropzone-icon" />

            <h2 className="upload-dropzone-title">Drag & drop files here</h2>

            <p className="upload-dropzone-subtitle">
              or click to browse • Any file type • Max 500 MB per file
            </p>

            <button
              className="upload-select-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current.click();
              }}
            >
              <Upload size={18} />
              Select Files
            </button>

            <input
              type="file"
              multiple
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="*/*"
            />
          </div>

          {files.length > 0 && (
            <div className="upload-preview-section">
              <div className="upload-preview-header">
                <h3>Selected Files ({files.length})</h3>

                <div className="upload-preview-actions">
                  <button className="upload-clear-btn" onClick={clearAll}>
                    Clear All
                  </button>

                  <button
                    className="upload-upload-btn"
                    onClick={uploadAll}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload All"}
                  </button>
                </div>
              </div>
              {imageModel && (
                <ImageViewModel
                  Image={imageModel}
                  onClose={() => setImageModel(null)}
                />
              )}
              <div className="upload-preview-grid">
                {files.map((item) => (
                  <div
                    className="upload-preview-card"
                    onClick={() => setImageModel(item.preview)}
                    key={item.id}
                  >
                    <button
                      className="upload-remove-btn icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(item.id);
                      }}
                    >
                      <X size={16} />
                    </button>

                    {item.file.type.startsWith("image") ? (
                      <img
                        src={item.preview}
                        alt=""
                        className="upload-preview-img"
                      />
                    ) : (
                      <div className="upload-preview-file">
                        {item.file.type.includes("audio") ? (
                          <Music />
                        ) : (
                          <Image />
                        )}
                      </div>
                    )}

                    <p className="upload-preview-name">{item.file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="upload-files-section">
            <h3 className="upload-files-title">Today Uploades</h3>

            {loading ? (
              <Loader style={{ height: "300px" }} />
            ) : todayUploades?.length > 0 ? (
              todayUploades.map((upload, index) => (
                <div className="upload-file-card" key={index}>
                  <div className="upload-file-left">
                    <div className="upload-file-icon">
                      {IconSuggestion(upload?.contentType)}
                    </div>
                    <div style={{ width: "100%" }}>
                      <p className="upload-file-name elepsis">
                        {upload?.filename || "N/A"}
                      </p>
                      <span className="upload-file-size">
                        {formatFileSize(upload?.size) || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="upload-file-right">
                    <p className="upload-file-link elepsis">
                      {upload?.fileUrl || "N/A"}
                    </p>
                    <Copy
                      onClick={() => handleCopy(upload?.fileUrl)}
                      className="upload-action-icon"
                    />
                    <Download
                      onClick={() => handleDownload(upload?.fileUrl)}
                      className="upload-action-icon"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-data">No uploads today</p>
            )}

            {/* <div className="upload-file-card">
              <div className="upload-file-left">
                <div className="upload-file-icon">
                  <Image size={20} />
                </div>

                <div>
                  <p className="upload-file-name">banner-design.png</p>
                  <span className="upload-file-size">3.2 MB</span>
                </div>
              </div>

              <div className="upload-file-right">
                <p className="upload-file-link">
                  https://mediaflow.io/f/abc123
                </p>
                <Copy className="upload-action-icon" />
                <Download className="upload-action-icon" />
              </div>
            </div>

            <div className="upload-file-card">
              <div className="upload-file-left">
                <div className="upload-file-icon">
                  <Music size={20} />
                </div>

                <div>
                  <p className="upload-file-name">intro-music.mp3</p>
                  <span className="upload-file-size">5.8 MB</span>
                </div>
              </div>

              <div className="upload-file-right">
                <p className="upload-file-link">
                  https://mediaflow.io/f/def456
                </p>
                <Copy className="upload-action-icon" />
                <Download className="upload-action-icon" />
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadMedia;
