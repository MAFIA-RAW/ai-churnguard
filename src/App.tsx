import React, { useState } from "react";
import { generateSyntheticDataset } from "./mockData";
import { CustomerData } from "./ml";
import Dashboard from "./components/Dashboard";
import DatasetExplorer from "./components/DatasetExplorer";
import Modeling from "./components/Modeling";
import Sandbox from "./components/Sandbox";
import CodeViewer from "./components/CodeViewer";
import { 
  Tv2, 
  Database, 
  BarChart4, 
  Sparkles, 
  Terminal, 
  FolderSync, 
  CheckCircle2 
} from "lucide-react";

export default function App() {
  // Initialize synthetic dataset (mimics 1,200 records of IBM Telco Churn dataset)
  const [data, setData] = useState<CustomerData[]>(() => generateSyntheticDataset());
  const [dataSource, setDataSource] = useState<string>("IBM Telco Dataset (Simulated)");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Callback to handle client-side uploaded CSV data
  const handleUploadCsv = (parsedRows: CustomerData[], name: string) => {
    setData(parsedRows);
    setDataSource(`Uploaded: ${name}`);
    showToast(`Injected ${parsedRows.length} customer records successfully!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans relative antialiased selection:bg-blue-600/30 selection:text-blue-200">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-emerald-500/30 text-emerald-700 py-3 px-4 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Side Navigation Sidebar */}
      <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col relative border-r border-slate-800">
        {/* Branding header */}
        <div className="p-6 border-b border-slate-800 flex flex-col justify-center bg-slate-900">
          <h1 className="text-white font-bold text-xl tracking-tight uppercase">Churn<span className="text-blue-500">Guard</span></h1>
          <p className="text-slate-400 text-xs mt-1">IBM Telco Analytics v2.4</p>
        </div>

        {/* Academic Tag */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/40 flex items-center justify-between text-[9px] font-semibold text-blue-400/80">
          <span>B.Tech Final Year project</span>
          <span className="font-mono text-slate-500">CSE</span>
        </div>

        {/* Navigation Options list */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold tracking-wide transition-colors ${activeTab === "dashboard" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          >
            <BarChart4 className="w-4 h-4 mr-3" />
            <span>Dashboard & Insights</span>
          </button>

          <button
            onClick={() => setActiveTab("dataset")}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold tracking-wide transition-colors ${activeTab === "dataset" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          >
            <Database className="w-4 h-4 mr-3" />
            <span>Dataset Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab("modeling")}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold tracking-wide transition-colors ${activeTab === "modeling" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          >
            <FolderSync className="w-4 h-4 mr-3" />
            <span>Predictive Modeling</span>
          </button>

          <button
            onClick={() => setActiveTab("sandbox")}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold tracking-wide transition-colors ${activeTab === "sandbox" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          >
            <Sparkles className="w-4 h-4 mr-3" />
            <span>Customer Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold tracking-wide transition-colors ${activeTab === "code" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
          >
            <Terminal className="w-4 h-4 mr-3" />
            <span>Get Streamlit app.py</span>
          </button>
        </nav>

        {/* Sidebar developer footer */}
        <div className="p-4 bg-slate-950 flex items-center justify-between text-[9px] text-slate-500 font-mono">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            System Ready
          </div>
          <span>Port 3000</span>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-slate-500 text-xs md:text-sm">Dataset: <span className="text-slate-850 font-bold">{dataSource}</span></span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">Active Pipeline Running</span>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setActiveTab("dataset")}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded border border-slate-200 cursor-pointer transition-colors"
            >
              Upload New
            </button>
            <button 
              onClick={() => setActiveTab("modeling")}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-sm cursor-pointer transition-colors"
            >
              Run Pipeline
            </button>
          </div>
        </header>

        {/* Dynamic active page viewer container */}
        <div className="p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === "dashboard" && <Dashboard data={data} />}
          {activeTab === "dataset" && <DatasetExplorer data={data} onUploadCsv={handleUploadCsv} />}
          {activeTab === "modeling" && <Modeling data={data} />}
          {activeTab === "sandbox" && <Sandbox data={data} />}
          {activeTab === "code" && <CodeViewer />}
        </div>

        {/* Page Footer */}
        <footer className="p-6 border-t border-slate-200 bg-white text-center text-[10px] text-slate-400 font-mono">
          IBM Telco Customer Churn Analytics Dashboard Suite &bull; B.Tech Final Year Project &bull; Built with React, Tailwind CSS, and TypeScript ML Engine
        </footer>
      </main>

    </div>
  );
}
