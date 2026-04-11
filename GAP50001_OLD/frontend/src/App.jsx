/**
 * ISO 50001 GAP Survey — App entry
 * API base URL from env (build) or relative /api when behind same host
 */
import GapSurveyApp from "./GapSurveyApp";

const apiBase =
  typeof import.meta.env?.VITE_API_URL === "string" && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "";

export default function App() {
  return <GapSurveyApp apiUrl={apiBase || ""} />;
}
