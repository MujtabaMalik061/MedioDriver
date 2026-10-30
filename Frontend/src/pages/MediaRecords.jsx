import React, { useEffect, useState, useCallback } from "react";
import "../assets/style/MediaRecords.css";
import "../assets/style/Admin.css";
import {
  LayoutGrid,
  List,
  Eye,
  Download,
  Trash2,
  Image,
  Music,
  Video,
  FileText,
} from "lucide-react";
import { LoadMore, SearchInput, StorageSearch, TopBar } from "../components/CustomComponents";
import { deleteMedia, getMediaRecords } from "../services/upload.services";
import Loader from "../components/Loader";
import { formateDate, formatFileSize, handleDownload } from "../utils/Helper";
import { toast } from "sonner";
import { limit } from "../utils/constants";
import { useDebounce } from "../utils/hooks/useDebounce";
import { useAuth } from "../context/AuthContext";
import { adminGetMediaRecords } from "../services/admin.services";

const getIcon = (type = "") => {
  if (type.includes("audio")) return <Music size={20} />;
  else if (type.includes("video")) return <Video size={20} />;
  else if (type.includes("image")) return <Image size={20} />;
  else return <FileText size={20} />;
};

const UserBadge = ({ user }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--primary-hover)", border: "1.5px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "var(--primary)", flexShrink: 0 }}>
      {user?.name?.charAt(0)?.toUpperCase() || "?"}
    </div>
    <div>
      <div style={{ fontSize: "12px", fontWeight: "500" }}>{user?.name || "—"}</div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{user?.email || ""}</div>
    </div>
  </div>
);

const AdminMediaRecords = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const searchDebounce = useDebounce(search, 500);

  const filters = [
    { label: "All", value: "all" },
    { label: "Image", value: "image" },
    { label: "Audio", value: "audio" },
    { label: "Video", value: "video" },
    { label: "Pdf", value: "pdf" },
  ];

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminGetMediaRecords({ page, limit: LIMIT, search: searchDebounce || undefined, contentType: filter !== "all" ? filter : undefined });
      setRecords(res.files || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error("Failed to load media records");
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounce, filter]);

  useEffect(() => { setPage(1); }, [searchDebounce, filter]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <>
      <TopBar title="Media Records" />
      <div className="page-container">
        <div className="media-record-topbar">
          <SearchInput value={search} setValue={setSearch} width="280px" />
          <div className="media-record-filters">
            {filters.map((f, i) => (
              <button key={i} className={`media-record-filter ${filter === f.value ? "active" : ""}`} onClick={() => setFilter(f.value)}>{f.label}</button>
            ))}
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>File</th>
                <th>Type</th>
                <th>Size</th>
                <th>Views</th>
                <th>Date</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)" }}>Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)" }}>No media found.</td></tr>
              ) : records.map((item) => (
                <tr key={item._id}>
                  <td><UserBadge user={item.uploadBy} /></td>
                  <td style={{ maxWidth: "180px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="media-record-icon">{getIcon(item.contentType)}</span>
                      <span className="elepsis" style={{ fontSize: "13px" }}>{item.filename || "N/A"}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{item.contentType?.split("/")[0] || "N/A"}</td>
                  <td>{formatFileSize(item.size) || "N/A"}</td>
                  <td>{item.views || 0}</td>
                  <td style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{formateDate(item.createdAt)}</td>
                  <td>
                    <Eye size={15} style={{ cursor: "pointer", color: "var(--primary)" }} onClick={() => window.open(item.fileUrl, "_blank")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button className="admin-btn admin-btn-primary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span>Page {page} of {totalPages} ({total} files)</span>
            <button className="admin-btn admin-btn-primary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </>
  );
};

const UserMediaRecords = () => {
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const searchDebounce = useDebounce(search, 500);

  const filters = [
    { label: "All", value: "all" },
    { label: "Image", value: "image" },
    { label: "Audio", value: "audio" },
    { label: "Video", value: "video" },
    { label: "Pdf", value: "pdf" },
    { label: "Other", value: "other" },
  ];

  useEffect(() => {
    setPage(1);
    getRecords(1);
  }, [filter, searchDebounce]);

  const getRecords = async (nextPage = 1) => {
    try {
      if (nextPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await getMediaRecords({
        page: nextPage,
        limit,
        contentType: filter !== "all" ? filter : undefined,
        search: searchDebounce || undefined,
      });

      const newFiles = res?.files || [];

      setRecords((prev) =>
        nextPage === 1 ? newFiles : [...prev, ...newFiles],
      );

      setPage(res?.meta?.page || 1);
      setLastPage(res?.meta?.totalPages || 1);
    } catch (err) {
      console.log("Failed to load Media Records:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (page < lastPage && !loadingMore) {
      getRecords(page + 1);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMedia(id);
      setRecords(records.filter((r) => r._id !== id));
      toast.success("Media deleted successfully!");
    } catch (err) {
      console.log("Failed to delete media:", err);
      toast.error(err?.message || "Failed to delete media!");
    }
  };

  return (
    <>
      <TopBar title="Media Records" />
      <div className="page-container">
        <div className="media-record-topbar">
          <StorageSearch setValue={setSearch} width="310px"  storage="mediaRecordSearchHistory"/>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div className="media-record-filters">
              {filters.map((f, i) => (
                <button
                  key={i}
                  className={`media-record-filter ${filter === f.value ? "active" : ""}`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="divider" />

            <div className="media-record-view-toggle">
              <button
                className={view === "grid" ? "active icon" : "icon"}
                onClick={() => setView("grid")}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                className={view === "list" ? "active icon" : "icon"}
                onClick={() => setView("list")}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {view === "list" && (
          <div className="media-record-table-container">
            <div className="media-record-table">
              <div className="media-record-table-header">
                <span>File</span>
                <span>Type</span>
                <span>Size</span>
                <span>Views</span>
                <span>Date</span>
                <span>Actions</span>
              </div>
              {loading ? (
                <Loader style={{ height: "300px" }} />
              ) : records?.length > 0 ? (
                records.map((item, i) => (
                  <div key={i} className="media-record-row">
                    <div
                      style={{ width: "300px" }}
                      className="media-record-file"
                    >
                      <span className="media-record-icon">
                        {getIcon(item?.contentType)}
                      </span>
                      <span className="elepsis">{item?.filename || "N/A"}</span>
                    </div>
                    <span>{item?.contentType || "N/A"}</span>
                    <span>{formatFileSize(item?.size) || "N/A"}</span>
                    <span>{item?.views || 0}</span>
                    <span>{formateDate(item.createdAt)}</span>

                    <div className="media-record-actions">
                      <Eye
                        onClick={() => window.open(item?.fileUrl, "_blank")}
                        size={16}
                      />
                      <Download
                        onClick={() => handleDownload(item?.fileUrl)}
                        size={16}
                      />
                      <Trash2
                        onClick={() => handleDelete(item?._id)}
                        size={16}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-data">No media records found.</p>
              )}
            </div>
          </div>
        )}

        {view === "grid" &&
          (loading ? (
            <Loader style={{ height: "300px" }} />
          ) : records?.length > 0 ? (
            <div className="media-record-grid">
              {records.map((item, i) => (
                <div key={i} className="media-record-card">
                  <div className="media-record-card-icon">
                    {getIcon(item?.contentType)}
                  </div>

                  <p className="media-record-card-name elepsis">
                    {item?.filename || "N/A"}
                  </p>

                  <span className="media-record-card-meta">
                    {formatFileSize(item?.size) || "N/A"} • {item?.views || 0}{" "}
                    views
                  </span>

                  <div className="media-record-card-actions">
                    <button
                      onClick={() => window.open(item?.fileUrl, "_blank")}
                    >
                      <Eye size={16} /> View
                    </button>
                    <button onClick={() => handleDownload(item?.fileUrl)}>
                      <Download size={16} /> Download
                    </button>
                    <button onClick={() => handleDelete(item?._id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-data">No media records found.</p>
          ))}
        <LoadMore
          loading={loadingMore}
          disabled={loadingMore}
          show={loadingMore || page < lastPage}
          onLoad={handleLoadMore}
        />
      </div>
    </>
  );
};

const MediaRecords = () => {
  const { currentUser } = useAuth();
  if (currentUser?.role === "admin") return <AdminMediaRecords />;
  return <UserMediaRecords />;
};

export default MediaRecords;
