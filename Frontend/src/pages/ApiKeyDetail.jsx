import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Activity, FileText, Image, Music, Video, Calendar } from "lucide-react";
import { TopBar } from "../components/CustomComponents";
import Loader from "../components/Loader";
import { formateDate, formatFileSize, timeAgo } from "../utils/Helper";
import { getApiKeyDetails } from "../services/key.services";
import { toast } from "sonner";
import "../assets/style/APISection.css";
import "../assets/style/Admin.css";

const getIcon = (type = "") => {
  if (type.includes("audio")) return <Music size={16} />;
  if (type.includes("video")) return <Video size={16} />;
  if (type.includes("image")) return <Image size={16} />;
  return <FileText size={16} />;
};

const ApiKeyDetail = () => {
  const { keyId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApiKeyDetails(keyId)
      .then(setData)
      .catch((err) => toast.error(err?.message || "Failed to load key details"))
      .finally(() => setLoading(false));
  }, [keyId]);

  return (
    <>
      <TopBar title="API Key Details" />
      <div className="api-container">
        <button
          className="back-btn"
          onClick={() => navigate("/api-section")}
        >
          <ArrowLeft size={16} />
          Back to API Section
        </button>

        {loading ? (
          <Loader style={{ height: "300px" }} />
        ) : !data ? (
          <p className="empty-data">Key not found.</p>
        ) : (
          <>
            <div className="key-detail-header">
              <div className="key-detail-title-row">
                <h2 className="key-detail-name">{data.key.name}</h2>
                <span className="api-key-badge">{data.key.totalCalls} calls</span>
              </div>
              <div className="key-detail-meta">
                <span><Calendar size={13} /> Created {formateDate(data.key.createdAt)}</span>
                <span>
                  <Clock size={13} />
                  {data.key.lastUsed ? `Last used ${timeAgo(data.key.lastUsed)}` : "Never used"}
                </span>
                <span><Activity size={13} /> {data.key.totalCalls} total calls</span>
              </div>
            </div>

            <div className="api-keys-section" style={{ marginTop: "20px" }}>
              <div className="api-keys-header">
                <h3>Uploaded Files ({data.uploadedMedia?.length || 0})</h3>
              </div>

              {data.uploadedMedia?.length === 0 ? (
                <p className="empty-data">No files uploaded via this key.</p>
              ) : (
                <div className="admin-table-wrap" style={{ marginTop: "14px" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.uploadedMedia.map((file) => (
                        <tr key={file._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className="media-record-icon">{getIcon(file.contentType)}</span>
                              <span className="elepsis" style={{ fontSize: "13px", maxWidth: "200px" }}>
                                {file.filename || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                            {file.contentType?.split("/")[0] || "N/A"}
                          </td>
                          <td>{formatFileSize(file.size)}</td>
                          <td style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                            {formateDate(file.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ApiKeyDetail;
