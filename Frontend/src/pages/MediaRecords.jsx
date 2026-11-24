import React, { useEffect, useState, useCallback, useRef } from "react";
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
  RefreshCw,
  Check,
} from "lucide-react";
import {
  LoadMore,
  ProgressBar,
  SearchInput,
  StorageSearch,
  TopBar,
} from "../components/CustomComponents";
import {
  deleteMedia,
  getMediaRecords,
  UpdateFile,
} from "../services/upload.services";
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
    <div
      style={{
        width: "26px",
        height: "26px",
        borderRadius: "50%",
        background: "var(--primary-hover)",
        border: "1.5px solid var(--primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: "700",
        color: "var(--primary)",
        flexShrink: 0,
      }}
    >
      {user?.name?.charAt(0)?.toUpperCase() || "?"}
    </div>
    <div>
      <div style={{ fontSize: "12px", fontWeight: "500" }}>
        {user?.name || "—"}
      </div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
        {user?.email || ""}
      </div>
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
  const LIMIT = 20;

  const searchDebounce = useDebounce(search, 500);

  const filters = [
    { label: "All", value: "all" },
    { label: "Image", value: "image" },
    { label: "Audio", value: "audio" },
    { label: "Video", value: "video" },
    { label: "Pdf", value: "pdf" },
    { label: "Other", value: "other" },
  ];

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminGetMediaRecords({
        page,
        limit: LIMIT,
        search: searchDebounce || undefined,
        contentType: filter !== "all" ? filter : undefined,
      });
      setRecords(res.files || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error("Failed to load media records");
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounce, filter]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounce, filter]);
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <>
      <TopBar title="Media Records" />
      <div className="page-container">
        <div className="media-record-topbar">
          <SearchInput value={search} setValue={setSearch} width="280px" />
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
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    No media found.
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <UserBadge user={item.uploadBy} />
                    </td>
                    <td style={{ maxWidth: "180px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span className="media-record-icon">
                          {getIcon(item.contentType)}
                        </span>
                        <span className="elepsis" style={{ fontSize: "13px" }}>
                          {item.filename || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        fontSize: "12px",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {item.contentType?.split("/")[0] || "N/A"}
                    </td>
                    <td>{formatFileSize(item.size) || "N/A"}</td>
                    <td>{item.views || 0}</td>
                    <td
                      style={{
                        fontSize: "12px",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {formateDate(item.createdAt)}
                    </td>
                    <td>
                      <Eye
                        size={15}
                        style={{ cursor: "pointer", color: "var(--primary)" }}
                        onClick={() => window.open(item.fileUrl, "_blank")}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              className="admin-btn admin-btn-primary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages} ({total} files)
            </span>
            <button
              className="admin-btn admin-btn-primary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
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
  const [updatingId, setUpdatingId] = useState(null);
  const fileInputRef = useRef(null);
  const updateIdRef = useRef(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [progress, setProgress] = useState({
    active: false,
    label: "",
    percent: 0,
    indeterminate: false,
  });

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
      setProgress({
        active: true,
        label: "Deleting file...",
        percent: 0,
        indeterminate: true,
      });

      await deleteMedia(id);

      setRecords((prev) => prev.filter((r) => r._id !== id));
      setProgress({
        active: true,
        label: "Deleted",
        percent: 100,
        indeterminate: false,
      });
      toast.success("Media deleted successfully!");
    } catch (err) {
      console.log("Failed to delete media:", err);
      toast.error(err?.message || "Failed to delete media!");
    } finally {
      setTimeout(
        () => setProgress((p) => ({ ...p, active: false, percent: 0 })),
        600,
      );
    }
  };

  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds([]);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
    setShowDeleteConfirm(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // NOTE: this only selects files currently loaded on the page
  const selectAllLoaded = () => {
    setSelectedIds(records.map((r) => r._id));
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    setShowDeleteConfirm(false);
    setDeletingSelected(true);

    let deleted = 0;
    let failed = 0;

    setProgress({
      active: true,
      label: `Deleting 0 / ${selectedIds.length}...`,
      percent: 0,
      indeterminate: true,
    });

    for (const id of selectedIds) {
      try {
        await deleteMedia(id);
        deleted++;
        setRecords((prev) => prev.filter((r) => r._id !== id));
      } catch (err) {
        failed++;
        console.log("Failed to delete media:", err);
      }
      setProgress((p) => ({
        ...p,
        label: `Deleting ${deleted + failed} / ${selectedIds.length}...`,
      }));
    }

    setDeletingSelected(false);
    setProgress({
      active: true,
      label: `Deleted ${deleted} file${deleted === 1 ? "" : "s"}`,
      percent: 100,
      indeterminate: false,
    });
    setTimeout(
      () => setProgress((p) => ({ ...p, active: false, percent: 0 })),
      600,
    );

    if (deleted > 0) {
      toast.success(
        `${deleted} media file${deleted === 1 ? "" : "s"} deleted successfully!`,
      );
    }
    if (failed > 0) {
      toast.error(`${failed} file${failed === 1 ? "" : "s"} failed to delete`);
    }
    exitSelectionMode();
  };

  const handleUpdateMedia = (id) => {
    updateIdRef.current = id;
    fileInputRef.current.click();
  };

  const handleUpdateFile = async (e) => {
    const file = e.target.files?.[0];
    const id = updateIdRef.current;
    e.target.value = "";
    if (!file || !id) return;

    try {
      setUpdatingId(id);
      setProgress({
        active: true,
        label: "Updating file...",
        percent: 0,
        indeterminate: false,
      });

      const res = await UpdateFile({
        id,
        file,
        onUploadProgress: (e) => {
          if (!e.total) return;
          const pct = Math.round((e.loaded * 100) / e.total);
          if (pct >= 100) {
            setProgress((p) => ({
              ...p,
              percent: 100,
              label: `Processing... ${formatFileSize(e.loaded)}`,
            }));
          } else {
            setProgress((p) => ({
              ...p,
              percent: pct,
              label: `Updating file... ${formatFileSize(e.loaded)} / ${formatFileSize(e.total)}`,
            }));
          }
        },
      });

      setProgress((p) => ({ ...p, label: "Updating file... done" }));
      toast.success(res?.message || "File updated successfully");
      setRecords((prev) =>
        prev.map((item) => (item._id === id ? { ...item, ...res.file } : item)),
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
      console.error("err-->", err);
    } finally {
      setUpdatingId(null);
      updateIdRef.current = null;
      setTimeout(
        () => setProgress((p) => ({ ...p, active: false, percent: 0 })),
        600,
      );
    }
  };
  return (
    <>
      <TopBar title="Media Records" />
      <ProgressBar {...progress} />
      <div className="page-container">
        <div className="media-record-topbar">
          <StorageSearch
            setValue={setSearch}
            width="310px"
            storage="mediaRecordSearchHistory"
          />
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
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpdateFile}
                        style={{ display: "none" }}
                      />
                      <RefreshCw
                        onClick={() =>
                          updatingId !== item?._id &&
                          handleUpdateMedia(item?._id)
                        }
                        size={16}
                        className={updatingId === item?._id ? "spin" : ""}
                        style={{
                          cursor:
                            updatingId === item?._id
                              ? "not-allowed"
                              : "pointer",
                          opacity: updatingId === item?._id ? 0.5 : 1,
                        }}
                        title="Replace file"
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
                <div
                  key={i}
                  className={`media-record-card ${selectionMode && selectedIds.includes(item?._id) ? "media-record-card-selected" : ""}`}
                >
                  {selectionMode && (
                    <div
                      className="media-record-checkbox"
                      onClick={() => toggleSelect(item?._id)}
                      title="Select file"
                    >
                      {selectedIds.includes(item?._id) && <Check size={14} />}
                    </div>
                  )}
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
                      onClick={() =>
                        selectionMode
                          ? toggleSelect(item?._id)
                          : window.open(item?.fileUrl, "_blank")
                      }
                    >
                      <Eye size={16} /> View
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUpdateFile}
                      style={{ display: "none" }}
                    />
                    <button
                      disabled={selectionMode}
                      style={{
                        cursor:
                          selectionMode || updatingId === item?._id
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          selectionMode || updatingId === item?._id ? 0.5 : 1,
                      }}
                      onClick={() =>
                        !selectionMode &&
                        updatingId !== item?._id &&
                        handleUpdateMedia(item?._id)
                      }
                    >
                      <RefreshCw
                        size={16}
                        className={updatingId === item?._id ? "spin" : ""}
                      />{" "}
                      Update
                    </button>

                    <button onClick={() => handleDownload(item?.fileUrl)}>
                      <Download size={16} /> Download
                    </button>
                    <button
                      onClick={() =>
                        selectionMode
                          ? toggleSelect(item?._id)
                          : enterSelectionMode()
                      }
                    >
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

        {/* Fixed bottom selection bar */}
        {selectionMode && (
          <div className="media-select-bar">
            <span className="media-select-count">
              {selectedIds.length} selected
            </span>
            <div className="media-select-actions">
              <button
                className="media-select-btn"
                onClick={selectAllLoaded}
                title="Selects only the files currently loaded on this page"
              >
                Select All
              </button>
              <button
                className="media-select-btn media-select-cancel"
                onClick={exitSelectionMode}
              >
                Cancel
              </button>
              <button
                className="media-select-btn media-select-delete"
                disabled={!selectedIds.length || deletingSelected}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        )}

        {selectionMode && (
          <p className="media-select-hint">
            "Select All" only selects the files currently loaded on this page —
            use "Load More" to load and select additional files.
          </p>
        )}

        {/* Confirm modal for bulk delete */}
        {showDeleteConfirm && (
          <div
            className="media-confirm-overlay"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="media-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>
                Delete {selectedIds.length} file
                {selectedIds.length === 1 ? "" : "s"}?
              </h3>
              <p>
                This will permanently delete the selected media files. This
                action cannot be undone.
              </p>
              <div className="media-confirm-actions">
                <button
                  className="media-confirm-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="media-confirm-delete"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
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
