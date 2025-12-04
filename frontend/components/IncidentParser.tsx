"use client";

import { useState } from "react";
import { parseIncident } from "@/lib/api";
import { ParsedIncident, ParseIncidentResponse } from "@/types/incident";

const SAMPLE_INCIDENT = `Hey team, the production database US-East-1 just timed out at 6:30 PM. I think it's the migration script deployed by Sarah. Error code 503 showing up on the load balancer. 500 users affected.`;

export default function IncidentParser() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseIncidentResponse | null>(null);

  const handleParse = async () => {
    if (!inputText.trim() || inputText.trim().length < 10) {
      setResult({
        success: false,
        error: "Please enter at least 10 characters of incident text.",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await parseIncident(inputText);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSampleData = () => {
    setInputText(SAMPLE_INCIDENT);
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "Med":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "Low":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto p-6 space-y-8 z-10">
      <div className="text-center space-y-4 pb-2">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent leading-tight pb-2">
          Intelligent Incident Parser
        </h1>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto">
          Convert unstructured incident reports into structured JSON using AI
        </p>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl shadow-2xl p-8 md:p-10 space-y-6">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <label
              htmlFor="incident-input"
              className="text-xl font-semibold text-white flex items-center gap-2"
            >
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Incident Report
            </label>
            <div className="flex gap-3">
              <button
                onClick={handleSampleData}
                className="px-5 py-2.5 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 hover:border-blue-500/50 transition-all"
              >
                Load Sample
              </button>
              <button
                onClick={handleClear}
                className="px-5 py-2.5 text-sm font-medium text-gray-400 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:bg-gray-800 hover:border-gray-600 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            id="incident-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your incident report here...&#10;&#10;Example: Production server crashed at 3 PM. 1000 users affected. Suspected cause: Database migration."
            className="w-full h-56 p-5 bg-gray-950/70 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none text-gray-100 placeholder-gray-500 text-base leading-relaxed transition-all"
          />
          <button
            onClick={handleParse}
            disabled={loading || !inputText.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600/70 via-blue-500/60 to-cyan-500/70 text-white font-semibold text-lg rounded-xl hover:from-blue-600/80 hover:via-blue-500/70 hover:to-cyan-500/80 disabled:from-gray-700/50 disabled:via-gray-700/50 disabled:to-gray-700/50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transform hover:scale-[1.01] disabled:transform-none border border-blue-400/30"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Parsing...
              </>
            ) : (
              "Parse Incident"
            )}
          </button>
        </div>

        {result && (
          <div className="mt-8 pt-8 border-t border-gray-700/50">
            {result.success && result.data ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <svg
                      className="w-7 h-7 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Parsed Results
                  </h2>
                  <button
                    onClick={() =>
                      copyToClipboard(JSON.stringify(result.data, null, 2))
                    }
                    className="px-5 py-2.5 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 hover:border-blue-500/50 transition-all flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy JSON
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-5 bg-gray-950/60 border border-gray-800/50 rounded-xl backdrop-blur-sm hover:border-gray-700/50 transition-all">
                    <div className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Severity
                    </div>
                    <div
                      className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border shadow-lg ${getSeverityColor(
                        result.data.Severity
                      )}`}
                    >
                      {result.data.Severity}
                    </div>
                  </div>

                  <div className="p-5 bg-gray-950/60 border border-gray-800/50 rounded-xl backdrop-blur-sm hover:border-gray-700/50 transition-all">
                    <div className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Impact Count
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {result.data.Impact_Count.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-5 bg-gray-950/60 border border-gray-800/50 rounded-xl backdrop-blur-sm hover:border-gray-700/50 transition-all md:col-span-2">
                    <div className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      Component
                    </div>
                    <div className="text-xl font-semibold text-white">
                      {result.data.Component}
                    </div>
                  </div>

                  <div className="p-5 bg-gray-950/60 border border-gray-800/50 rounded-xl backdrop-blur-sm hover:border-gray-700/50 transition-all md:col-span-2">
                    <div className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      Suspected Cause
                    </div>
                    <div className="text-lg text-gray-200 leading-relaxed">
                      {result.data.Suspected_Cause}
                    </div>
                  </div>

                  <div className="p-5 bg-gray-950/60 border border-gray-800/50 rounded-xl backdrop-blur-sm hover:border-gray-700/50 transition-all md:col-span-2">
                    <div className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Timestamp
                    </div>
                    <div className="text-lg font-mono text-blue-400">
                      {result.data.Timestamp}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      JSON Output
                    </h3>
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(result.data, null, 2))
                      }
                      className="px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-5 bg-gray-950 border border-gray-800/50 rounded-xl overflow-x-auto text-sm text-green-400 font-mono shadow-inner">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-red-400">Error</h3>
                </div>
                <p className="mt-2 text-red-300/80">
                  {result.error ||
                    "An error occurred while parsing the incident."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
