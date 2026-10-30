import React, { useEffect, useState, useCallback } from "react";
import "../assets/style/Payment.css";
import "../assets/style/Admin.css";
import { LoadMore, TopBar } from "../components/CustomComponents";
import { getPaymentRecordsHelper } from "../services/payment.services";
import { limit } from "../utils/constants";
import Loader from "../components/Loader";
import { formateDateTime } from "../utils/Helper";
import { useAuth } from "../context/AuthContext";
import { adminGetPayments } from "../services/admin.services";
import { toast } from "sonner";

const UserBadge = ({ user }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--primary-hover)", border: "1.5px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "var(--primary)", flexShrink: 0 }}>
      {user?.name?.charAt(0)?.toUpperCase() || "?"}
    </div>
    <div>
      <div style={{ fontSize: "13px", fontWeight: "500" }}>{user?.name || "—"}</div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{user?.email || ""}</div>
    </div>
  </div>
);

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 10;

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminGetPayments({ page, limit: LIMIT });
      setPayments(res.payments || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <>
      <TopBar title={`Payment Records (${total})`} />
      <div className="page-container">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Credits</th>
                <th>Price</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)" }}>Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)" }}>No payments found.</td></tr>
              ) : payments.map((p) => (
                <tr key={p._id}>
                  <td><UserBadge user={p.userId} /></td>
                  <td>{p.credits ?? "—"}</td>
                  <td>{p.price != null ? `€${p.price}` : "—"}</td>
                  <td><span className={`status-badge ${p.status}`}>{p.status}</span></td>
                  <td style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button className="admin-btn admin-btn-primary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button className="admin-btn admin-btn-primary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </>
  );
};

const UserPayments = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getPaymentRecords(1);
  }, []);

  const getPaymentRecords = async (nextPage = 1) => {
    try {
      if (nextPage === 1) setLoading(true);
      else setLoadMoreLoading(true);
      const res = await getPaymentRecordsHelper(nextPage, limit);
      if (nextPage === 1) {
        setPaymentRecords(res.data);
      } else {
        setPaymentRecords((prev) => [...prev, ...res.data]);
      }
      setTotal(res?.pagination?.total);
      setPage(nextPage);
    } catch (err) {
      console.error("Failed to get Services:", err);
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (paymentRecords.length >= total) return;
    getPaymentRecords(page + 1);
  };

  return (
    <>
      <TopBar title={`Payment Records (${total || 0})`} />
      <div className="page-container">
        <div className="princing-records-list">
          {loading ? (
            <Loader style={{ height: "180px", width: "100%" }} />
          ) : paymentRecords?.length > 0 ? (
            paymentRecords?.map((record, index) => (
              <div key={index} className="princing-record-card">
                <div className="princing-record-header">
                  <div className="princing-record-plan">Custom Plan</div>

                  <div
                    className={`princing-record-status princing-record-status-${record?.status}`}
                  >
                    {record?.status}
                  </div>
                </div>

                <div className="princing-record-body">
                  <div className="princing-record-item">
                    <span className="princing-record-label">Credits</span>
                    <span className="princing-record-value">
                      {record?.credits}
                    </span>
                  </div>

                  <div className="princing-record-item">
                    <span className="princing-record-label">Price</span>
                    <span className="princing-record-value">
                      € {record?.price}
                    </span>
                  </div>

                  <div className="princing-record-item">
                    <span className="princing-record-label">Subscribe At</span>
                    <span className="princing-record-value">
                      {formateDateTime(record?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-data">No records found.</p>
          )}
        </div>
        <LoadMore
          loading={loadMoreLoading}
          disabled={loadMoreLoading || loading}
          show={paymentRecords.length < total && !loading}
          onLoad={handleLoadMore}
        />
      </div>
    </>
  );
};

const Payments = () => {
  const { currentUser } = useAuth();
  if (currentUser?.role === "admin") return <AdminPayments />;
  return <UserPayments />;
};

export default Payments;
