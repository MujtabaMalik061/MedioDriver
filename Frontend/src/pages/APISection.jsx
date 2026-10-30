import React, { useEffect, useRef, useState } from "react";
import "../assets/style/APISection.css";
import "../assets/style/Admin.css";
import { Key, Eye, Copy, Trash2, EyeOff } from "lucide-react";
import { Input, TopBar } from "../components/CustomComponents";
import { toast } from "sonner";
import {
  deleteApiKeys,
  genApiKey,
  getApiKeys,
  getApiUsageByDate,
  getApiUsageByMonth,
} from "../services/key.services";
import Loader from "../components/Loader";
import { formateDate, handleCopy, timeAgo } from "../utils/Helper";
import { useAuth } from "../context/AuthContext";
import { adminGetApiStats } from "../services/admin.services";

const CODE_LINES = [
  `import axios from "axios";`,
  ``,
  `const API_URL= "https://medio-driver-backend.vercel.app"`,
  ``,
  `export const uploadByApi = async (files) => {`,
  `  if (!files || files.length === 0) throw new Error("No files selected");`,
  `  if (files.length > 5) throw new Error("Maximum 5 files at a time");`,
  `  const formData = new FormData();`,
  `  files.forEach((file) => formData.append("files", file));`,
  `  try {`,
  `    const res = await axios.post(`,
  "      `${API_URL}/api/v1/key/upload-media`,",
  `      formData,`,
  `      {`,
  `        headers: {`,
  `          apikey: "md_sk_••••••••••••••••", // Your API key`,
  `        },`,
  `      },`,
  `    );`,
  `    // response { message, files, creditsUsed, remainingCredits }`,
  `    return res.data;`,
  `  } catch (err) {`,
  `    console.error("Upload error:", err.response?.data || err.message);`,
  `    throw err.response?.data || err;`,
  `  }`,
  `};`,
];

// Single regex with 4 named capture groups — no nested groups, no duplicate splits
const TOKEN_RE =
  /("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*')|\b(import|export|const|async|await|return|throw|if|new|try|catch)\b|(uploadByApi|axios\.post|console\.error)|\b(\d+)\b/g;

function highlightLine(line) {
  if (line.trim().startsWith("//")) {
    return <span className="qs-cmt">{line}</span>;
  }

  const result = [];
  let lastIndex = 0;
  TOKEN_RE.lastIndex = 0;
  let match;

  while ((match = TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      result.push(<span key={lastIndex}>{line.slice(lastIndex, match.index)}</span>);
    }
    const token = match[0];
    const k = match.index;
    if (match[1])      result.push(<span key={k} className="qs-str">{token}</span>);
    else if (match[2]) result.push(<span key={k} className="qs-kw">{token}</span>);
    else if (match[3]) result.push(<span key={k} className="qs-fn">{token}</span>);
    else               result.push(<span key={k} className="qs-num">{token}</span>);
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    result.push(<span key={lastIndex}>{line.slice(lastIndex)}</span>);
  }
  return result;
}

const InstallBlock = ({ onCopy }) => {
  const cmd = "npm install axios";
  return (
    <div className="qs-block" style={{ marginBottom: "12px" }}>
      <div className="qs-header">
        <span className="qs-lang">Terminal</span>
        <button onClick={() => { navigator.clipboard.writeText(cmd); }} className="qs-copy-btn">
          <Copy size={14} />
          Copy
        </button>
      </div>
      <div className="qs-body">
        <div className="qs-lines"><div>1</div></div>
        <pre className="qs-code">
          <div>
            <span className="qs-kw">npm</span>
            <span> install </span>
            <span className="qs-fn">axios</span>
          </div>
        </pre>
      </div>
    </div>
  );
};

const CodeBlock = ({ codeRef, onCopy }) => {
  return (
    <div className="qs-block">
      <div className="qs-header">
        <span className="qs-lang">JavaScript</span>
        <button onClick={onCopy} className="qs-copy-btn">
          <Copy size={14} />
          Copy
        </button>
      </div>
      <div className="qs-body">
        <div className="qs-lines">
          {CODE_LINES.map((_, i) => (
            <div key={i} className="qs-line">{i + 1}</div>
          ))}
        </div>
        <pre className="qs-code" ref={codeRef}>
          {CODE_LINES.map((line, i) => (
            <div key={i} className="qs-line">{line === "" ? "\u00A0" : highlightLine(line)}</div>
          ))}
        </pre>
      </div>
    </div>
  );
};

const AdminApiSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetApiStats()
      .then(setData)
      .catch(() => toast.error("Failed to load API stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopBar title="API Section" />
      <div className="api-container">
        <div className="api-stats">
          <StateTabs
            title="Platform Calls Today"
            value={loading ? "…" : (data?.todayCalls ?? 0)}
          />
          <StateTabs
            title="Platform Monthly"
            value={loading ? "…" : (data?.monthCalls ?? 0)}
          />
          <StateTabs
            title="Active Users"
            value={loading ? "…" : (data?.userStats?.length ?? 0)}
          />
        </div>

        <div className="api-keys-section">
          <div className="api-keys-header">
            <h3>API Usage by User</h3>
          </div>
          {loading ? (
            <Loader style={{ height: "200px" }} />
          ) : data?.userStats?.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Total API Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {data.userStats.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: "var(--primary-hover)",
                              border: "1.5px solid var(--primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "var(--primary)",
                              flexShrink: 0,
                            }}
                          >
                            {item.userInfo?.name?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </div>
                          <div>
                            <div
                              style={{ fontSize: "13px", fontWeight: "500" }}
                            >
                              {item.userInfo?.name || "—"}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--muted-foreground)",
                              }}
                            >
                              {item.userInfo?.email || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`role-badge ${item.userInfo?.role || "user"}`}
                        >
                          {item.userInfo?.role || "user"}
                        </span>
                      </td>
                      <td>
                        <strong>{item.totalCalls ?? 0}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-data">No API usage data found.</p>
          )}
        </div>
      </div>
    </>
  );
};

const UserApiSection = () => {
  const [isGen, setIsGen] = useState(false);
  const [todayUsage, setTodayUsage] = useState(0);
  const [monthUsage, setMonthUsage] = useState(0);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const codeRef = useRef();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const today = new Date().toISOString().split("T")[0];
    const month = new Date().toISOString().slice(0, 7);

    try {
      setLoading(true);

      const [keysRes, todayRes, monthRes] = await Promise.all([
        getApiKeys(),
        getApiUsageByDate(today),
        getApiUsageByMonth(month),
      ]);

      setApiKeys(keysRes?.keys || []);
      setTodayUsage(todayRes?.totalCalls || 0);
      setMonthUsage(monthRes?.totalCalls || 0);
    } catch (err) {
      console.error("Failed to load API data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar title="API Section" />
      <div className="api-container">
        <div className="api-stats">
          <StateTabs
            title="API Calls Today"
            value={todayUsage || 0}
            maxValue={1000}
            isProgress={true}
          />
          <StateTabs
            title="Monthly Usage"
            value={monthUsage}
            maxValue={30000}
            isProgress={true}
          />
          <StateTabs title="Rate Limit" value="100 req" maxValue="min" />
        </div>

        <div className="api-keys-section">
          <div className="api-keys-header">
            <h3>API Keys</h3>
            <button onClick={() => setIsGen(true)} className="api-generate-btn">
              <Key size={16} />
              Generate New Key
            </button>
          </div>
          {loading ? (
            <Loader style={{ height: "200px" }} />
          ) : apiKeys?.length > 0 ? (
            apiKeys.map((key, index) => (
              <ApiKeyCard
                key={index}
                keyId={key?._id}
                title={key?.name}
                created={key?.createdAt}
                lastUsed={key?.lastUsed}
                calls={key?.keyCalles}
                apiKey={key?.key}
                setApiKeys={setApiKeys}
              />
            ))
          ) : (
            <p className="empty-data">No Keys found.</p>
          )}
        </div>

        <div className="api-quickstart">
          <h3 style={{ marginBottom: "12px" }}>Quick Start</h3>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "10px" }}>
            1. Install axios
          </p>
          <InstallBlock />
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: "14px 0 10px" }}>
            2. Upload files using your API key
          </p>
          <CodeBlock
            codeRef={codeRef}
            onCopy={() => handleCopy(codeRef.current.innerText)}
          />
        </div>
        {isGen && (
          <GenerateApiKey
            onClose={() => setIsGen(false)}
            setApiKeys={setApiKeys}
          />
        )}
      </div>
    </>
  );
};

const APISection = () => {
  const { currentUser } = useAuth();
  if (currentUser?.role === "admin") return <AdminApiSection />;
  return <UserApiSection />;
};

export default APISection;

const StateTabs = ({
  isProgress = false,
  title = "",
  value = 0,
  maxValue = 0,
}) => {
  return (
    <div className="api-stat-card">
      <p className="api-stat-title">{title}</p>
      <h2>
        {value} {maxValue ? `/ ${maxValue}` : ""}
      </h2>
      {isProgress && (
        <div className="api-progress">
          <div style={{ width: `${(value / maxValue) * 100}%` }}></div>
        </div>
      )}
    </div>
  );
};

const ApiKeyCard = ({
  title,
  created,
  lastUsed,
  calls,
  apiKey,
  keyId,
  setApiKeys,
}) => {
  const [isShow, setIsShow] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    alert("API Key copied to clipboard!");
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this API key?")) {
      try {
        await deleteApiKeys(keyId);
        setApiKeys((prev) => prev.filter((key) => key._id !== keyId));
        toast.success("Key deleted successfully.");
      } catch (err) {
        console.error("Failed to delete Key:", err);
        toast.error(err?.message || "Failed to delete key");
      }
    }
  };

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 7)}${"•".repeat(apiKey.length - 8)}`
    : "N/A";

  return (
    <div className="api-key-card">
      <div className="api-key-top">
        <div>
          <h4>{title || "N/A"}</h4>
          <p>
            Created {formateDate(created) || "N/A"}{" "}
            {lastUsed &&
              `• Last used
            ${timeAgo(lastUsed) || "N/A"}`}
          </p>
        </div>
        <span className="api-key-badge">{calls || 0} calls</span>
      </div>

      <div className="api-key-bottom">
        <p>{isShow ? apiKey : maskedKey}</p>
        <div className="api-key-actions">
          <span onClick={() => setIsShow(!isShow)} className="icon">
            {isShow ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
          <span onClick={handleCopy} className="icon">
            <Copy size={18} />
          </span>
          <span onClick={handleDelete} className="icon danger">
            <Trash2 size={18} />
          </span>
        </div>
      </div>
    </div>
  );
};

const GenerateApiKey = ({ onClose, setApiKeys }) => {
  const [keyName, setKeyName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenKey = async () => {
    if (keyName.trim() === "") return toast.error("Key Name is required!");
    try {
      setLoading(true);
      const res = await genApiKey(keyName);
      setApiKeys((prev) => [res?.apiKey, ...prev]);
      toast.success("Api key gen successfuly.");
    } catch (err) {
      console.error("Failed to gen api key:", err);
      toast.error(err.message || "Failed to gen api Key");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="model-overlay">
      <div className="model-content">
        <div className="model-header">
          <h2 className="model-header-title">Generate New API Key</h2>
          <button className="model-header-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="model-content-container">
          <Input
            label="API Key Name"
            placeholder="Key Name"
            value={keyName}
            setValue={setKeyName}
          />
          <button
            className="api-generate-btn"
            onClick={handleGenKey}
            disabled={loading}
            style={{
              width: "100%",
              justifyContent: "center",
              gap: "12px",
              padding: "11px 14px",
            }}
          >
            <span className="icon">
              <Key size={16} />
            </span>
            {loading ? "Generating..." : "Generate Key"}
          </button>
        </div>
      </div>
    </div>
  );
};
