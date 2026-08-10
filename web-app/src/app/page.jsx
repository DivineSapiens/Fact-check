"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, Trophy, Flame, Search, RefreshCw, Sparkles, CheckCircle2, User, Activity, X, Paperclip, FileText } from "lucide-react";

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [testClaim, setTestClaim] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Real-time Firestore Listener
  useEffect(() => {
    try {
      const q = query(collection(db, "reports"), orderBy("timestamp", "desc"), limit(50));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setReports(docs);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore onSnapshot error:", error);
          // Fallback to empty if index missing or permission error
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Firestore initialization error:", err);
      setLoading(false);
    }
  }, []);

  // Calculate Leaderboard
  const leaderboard = Object.values(
    reports.reduce((acc, report) => {
      const id = report.reporterId || "anonymous";
      if (!acc[id]) {
        acc[id] = { reporterId: id, count: 0, lastActive: report.createdAt || "Recently" };
      }
      acc[id].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  // Compute Overall Stats
  const totalReports = reports.length;
  const avgScore = totalReports > 0 ? Math.round(reports.reduce((sum, r) => sum + (r.score || 0), 0) / totalReports) : 0;
  const totalReporters = leaderboard.length;

  // Filtered reports
  const filteredReports = reports.filter((r) =>
    (r.claim || "").toLowerCase().includes(filterText.toLowerCase())
  );

  const handleTestClaim = async (e) => {
    e.preventDefault();
    if (!testClaim.trim()) return;
    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/check-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: testClaim }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error("Test claim error:", err);
      setTestResult({
        error: "Failed to connect to fact-check service",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleClearInput = () => {
    setTestClaim("");
    setAttachedFile(null);
    setTestResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        const cleanText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ").trim();
        const snippet = cleanText.substring(0, 1000);
        setTestClaim(snippet);
        setAttachedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
        });
        setTestResult(null);
      }
    };
    reader.readAsText(file);
  };

  const getBadgeColor = (score) => {
    if (score >= 80) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    if (score >= 40) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    return "bg-rose-500/20 text-rose-400 border-rose-500/40";
  };

  const getBadgeIcon = (score) => {
    if (score >= 80) return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    if (score >= 40) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <ShieldAlert className="w-4 h-4 text-rose-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                Fact-Check Beacon
              </h1>
              <p className="text-xs text-slate-400">Gemini Grounded AI & Community Rumor Radar</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Firestore Live
            </div>
            <a
              href="#tester"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" /> Test Claim Live
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 space-y-8">
        {/* Key Metrics Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Rumors Reported</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">{totalReports}</h2>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Trust Score</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">{avgScore}<span className="text-sm font-normal text-slate-400">/100</span></h2>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Reporters</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">{totalReporters}</h2>
            </div>
          </div>
        </section>

        {/* Live Interactive Claim Tester */}
        <section id="tester" className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" /> Live Gemini Grounding Sandbox
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Test Any Claim in Real-Time</h2>
          
          <form onSubmit={handleTestClaim} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={testClaim}
                  onChange={(e) => setTestClaim(e.target.value)}
                  placeholder="e.g. The Great Wall of China is visible from the Moon"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {testClaim && (
                  <button
                    type="button"
                    onClick={handleClearInput}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 transition-colors"
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3 bg-slate-900 border border-slate-700/80 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs font-semibold shrink-0"
                title="Upload Document (PDF, DOC, TXT)"
              >
                <Paperclip className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.md,.json,.csv"
                className="hidden"
              />

              <button
                type="submit"
                disabled={testLoading || !testClaim.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>Verify Claim</>
                )}
              </button>
            </div>

            {attachedFile && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-950/60 border border-indigo-500/40 rounded-lg text-xs text-indigo-300 max-w-max animate-fadeIn">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Attached document: <strong>{attachedFile.name}</strong> ({attachedFile.size})</span>
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="ml-1 text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors"
                  title="Remove attached file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </form>

          {/* Test Result Display */}
          {testResult && (
            <div className="mt-6 bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-4 animate-fadeIn">
              {testResult.error ? (
                <div className="text-rose-400 text-sm">{testResult.error}</div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      {getBadgeIcon(testResult.trustScore)}
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${getBadgeColor(testResult.trustScore)}`}>
                        {testResult.status} ({testResult.trustScore}/100)
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">Gemini 3.5 Grounded</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Explanation</h4>
                    <p className="text-sm text-slate-200 mt-1">{testResult.explanation}</p>
                  </div>

                  {testResult.correctedText && (
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Verified Context</h4>
                      <p className="text-xs text-slate-300 mt-1">{testResult.correctedText}</p>
                    </div>
                  )}

                  {testResult.sources?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Grounding Citations</h4>
                      <div className="flex flex-wrap gap-2">
                        {testResult.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-slate-900 border border-slate-800 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <span>{src.title}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* Dashboard Grid: Feed & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 cols): Recent Reports Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-400" /> Recent Rumor Reports
              </h2>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter claims..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3 bg-slate-900/40 rounded-xl border border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Syncing live reports from Firestore...</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                No rumor reports match your filter. Use the extension or test sandbox above to submit reports!
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium text-slate-200 leading-snug">
                        "{report.claim}"
                      </p>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border shrink-0 flex items-center gap-1.5 ${getBadgeColor(report.score)}`}>
                        {getBadgeIcon(report.score)}
                        {report.score}/100
                      </span>
                    </div>

                    {report.sourceUrl && (
                      <div className="pt-1">
                        <a
                          href={report.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <span>Original Webpage Source</span>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-mono text-slate-300">{report.reporterId}</span>
                      </div>
                      <span>{report.createdAt ? new Date(report.createdAt).toLocaleString() : "Just now"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (1 col): Reporter Leaderboard */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Community Leaderboard
            </h2>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No active reporters yet.</p>
              ) : (
                leaderboard.map((item, index) => (
                  <div
                    key={item.reporterId}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      index === 0
                        ? "bg-amber-500/10 border-amber-500/30"
                        : index === 1
                        ? "bg-slate-800/60 border-slate-700"
                        : index === 2
                        ? "bg-amber-900/10 border-amber-800/30"
                        : "bg-slate-950/40 border-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0 ? "bg-amber-400 text-slate-950" : index === 1 ? "bg-slate-300 text-slate-950" : index === 2 ? "bg-amber-700 text-slate-100" : "bg-slate-800 text-slate-400"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-xs font-mono font-bold text-slate-200">{item.reporterId}</p>
                        <p className="text-[10px] text-slate-400">
                          {index === 0 ? "🏆 Top Guardian" : "Fact Checker"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-indigo-400">{item.count}</span>
                      <span className="text-[10px] text-slate-500 block">reports</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Fact-Check Beacon — Hackathon MVP powered by Gemini 3.5 Flash & Firebase Firestore.
      </footer>
    </div>
  );
}
