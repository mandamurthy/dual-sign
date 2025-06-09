import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import App from "./App";
import DiffView from "./components/DiffView";

const DiffViewPage: React.FC = () => {
  // Parse query params for v0 and vN
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const v0 = params.get("v0");
  const vN = params.get("vN");
  const versionLabel = params.get("versionLabel");
  const uploadedAt = params.get("uploadedAt");
  const [v0Content, setV0Content] = React.useState("");
  const [vNContent, setVNContent] = React.useState("");

  React.useEffect(() => {
    if (v0) {
      // Use replaced workspace file if present
      const replaced = localStorage.getItem(`dualSignWorkspace_${v0}`);
      if (replaced) {
        setV0Content(replaced);
      } else {
        fetch(`/${v0}`)
          .then((r) => r.text())
          .then(setV0Content);
      }
    }
    if (vN) {
      const vNData = localStorage.getItem(vN);
      if (vNData) {
        try {
          const parsed = JSON.parse(vNData);
          setVNContent(parsed.content || vNData);
        } catch {
          setVNContent(vNData);
        }
      } else {
        setVNContent("");
      }
    }
  }, [v0, vN]);

  if (!v0 || !vN) return <div>Invalid diff parameters.</div>;
  if (!v0Content && !vNContent) return <div>Loading...</div>;
  return (
    <DiffView
      v0Content={v0Content}
      vNContent={vNContent}
      versionLabel={versionLabel || undefined}
      uploadedAt={uploadedAt || undefined}
      fileName={v0}
    />
  );
};

const AppRoutes: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/diff" element={<DiffViewPage />} />
    </Routes>
  </Router>
);

export default AppRoutes;
