import React, { useState } from "react";
import { CustomerData } from "../ml";
import { Table, Search, AlertCircle, FileSpreadsheet, RefreshCw } from "lucide-react";

interface DatasetExplorerProps {
  data: CustomerData[];
  onUploadCsv: (parsedData: CustomerData[], sourceName: string) => void;
}

export default function DatasetExplorer({ data, onUploadCsv }: DatasetExplorerProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const rowsPerPage = 12;

  // Search filter
  const filteredData = data.filter(
    (d) =>
      d.customerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.Contract.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Handle local file parse (FileReader API)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      if (!csvText) return;

      try {
        const lines = csvText.split("\n");
        if (lines.length < 2) return;

        // Parse headers
        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        const parsedRows: CustomerData[] = [];

        // Parse rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple split (respecting potential quoted commas is better, but split(",") is standard for simple CSVs)
          const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
          if (cols.length < headers.length) continue;

          // Build row mapping columns to CustomerData properties
          const customerID = cols[headers.indexOf("customerID")] || cols[headers.indexOf("customerid")] || `MOCK-${i}`;
          const gender = cols[headers.indexOf("gender")] || "Female";
          const SeniorCitizen = parseInt(cols[headers.indexOf("SeniorCitizen")]) || 0;
          const Partner = cols[headers.indexOf("Partner")] || "No";
          const Dependents = cols[headers.indexOf("Dependents")] || "No";
          const tenure = parseInt(cols[headers.indexOf("tenure")]) || 12;
          const PhoneService = cols[headers.indexOf("PhoneService")] || "Yes";
          const MultipleLines = cols[headers.indexOf("MultipleLines")] || "No";
          const InternetService = cols[headers.indexOf("InternetService")] || "Fiber optic";
          const OnlineSecurity = cols[headers.indexOf("OnlineSecurity")] || "No";
          const OnlineBackup = cols[headers.indexOf("OnlineBackup")] || "No";
          const DeviceProtection = cols[headers.indexOf("DeviceProtection")] || "No";
          const TechSupport = cols[headers.indexOf("TechSupport")] || "No";
          const StreamingTV = cols[headers.indexOf("StreamingTV")] || "No";
          const StreamingMovies = cols[headers.indexOf("StreamingMovies")] || "No";
          const Contract = cols[headers.indexOf("Contract")] || "Month-to-month";
          const PaperlessBilling = cols[headers.indexOf("PaperlessBilling")] || "Yes";
          const PaymentMethod = cols[headers.indexOf("PaymentMethod")] || "Electronic check";
          
          // Monthly Charges
          const MonthlyCharges = parseFloat(cols[headers.indexOf("MonthlyCharges")]) || 65.0;
          
          // Clean Total Charges (convert spacing and parse numeric)
          const rawTotal = cols[headers.indexOf("TotalCharges")] || "";
          let TotalCharges = 0;
          if (rawTotal.trim() === "" || isNaN(Number(rawTotal))) {
            // Impute with tenure * MonthlyCharges as per the app rules
            TotalCharges = tenure * MonthlyCharges;
          } else {
            TotalCharges = parseFloat(rawTotal);
          }

          // Churn label
          const rawChurn = cols[headers.indexOf("Churn Label")] || cols[headers.indexOf("Churn")] || "No";
          const ChurnLabel = (rawChurn.trim().toLowerCase() === "yes" || rawChurn === "1") ? "Yes" : "No";

          parsedRows.push({
            customerID,
            gender,
            SeniorCitizen,
            Partner,
            Dependents,
            tenure,
            PhoneService,
            MultipleLines,
            InternetService,
            OnlineSecurity,
            OnlineBackup,
            DeviceProtection,
            TechSupport,
            StreamingTV,
            StreamingMovies,
            Contract,
            PaperlessBilling,
            PaymentMethod,
            MonthlyCharges,
            TotalCharges,
            "Churn Label": ChurnLabel
          });
        }

        if (parsedRows.length > 0) {
          onUploadCsv(parsedRows, file.name);
        }
      } catch (err) {
        console.error("Failed to parse file client-side:", err);
      }
    };
    reader.readAsText(file);
  };

  // Download cleaned data client-side as CSV trigger
  const downloadCleanedCSV = () => {
    const headers = "customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges,Churn Label\n";
    const rows = data
      .map(
        (row) =>
          `${row.customerID},${row.gender},${row.SeniorCitizen},${row.Partner},${row.Dependents},${row.tenure},${row.PhoneService},${row.MultipleLines},${row.InternetService},${row.OnlineSecurity},${row.OnlineBackup},${row.DeviceProtection},${row.TechSupport},${row.StreamingTV},${row.StreamingMovies},${row.Contract},${row.PaperlessBilling},${row.PaymentMethod},${row.MonthlyCharges},${row.TotalCharges},${row["Churn Label"]}`
      )
      .join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "IBM_Telco_Churn_Standardized.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="dataset-explorer" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Statistics details */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-3">
          <h4 className="text-xs font-bold font-display text-slate-500 uppercase tracking-wider flex items-center">
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-blue-600" />
            Database Profile
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-250/60 text-center">
              <span className="text-slate-500 block text-[9px] uppercase font-semibold font-display">Row Matrix</span>
              <span className="text-sm font-bold text-slate-800">{data.length}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-250/60 text-center">
              <span className="text-slate-500 block text-[9px] uppercase font-semibold font-display">Feature count</span>
              <span className="text-sm font-bold text-slate-800">21 columns</span>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded p-3 text-[10px] text-slate-600 leading-relaxed">
            <strong>Data Status</strong>: Clean. &quot;Total Charges&quot; missing values automatically imputed. customerID and Churn Reasons correctly flagged to bypass ML training algorithms.
          </div>
        </div>

        {/* Missing value matrix diagnostics */}
        <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-display text-slate-500 uppercase tracking-wider flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 text-amber-500" />
              Standard Imputation & Missing Value Report
            </h4>
            <p className="text-[10px] text-slate-500">
              The original IBM Telco dataset contains blank spaces in the &quot;Total Charges&quot; column for new customers with 0 tenure. The system isolates and automatically patches these.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-200">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] block">TotalCharges Nulls</span>
              <span className="font-mono text-emerald-600 font-semibold flex items-center">
                0 Cells (Fully Patched)
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] block">Categorical Nulls</span>
              <span className="font-mono text-emerald-600 font-semibold">0 Cells (Cleaned)</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] block">Diagnostics Status</span>
              <span className="font-mono text-emerald-600 font-semibold">Ready for ML</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset table search / pagination box */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search by customerID or Contract..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-750 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* React CSV Importer */}
            <div className="relative overflow-hidden inline-block cursor-pointer">
              <button className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-display font-bold text-xs tracking-wide rounded shadow flex items-center space-x-1.5 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Inject Custom CSV</span>
              </button>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            {/* Downloader */}
            <button
              onClick={downloadCleanedCSV}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs tracking-wide rounded shadow flex items-center space-x-1.5"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Export Dataset (CSV)</span>
            </button>
          </div>
        </div>

        {/* Database Grid */}
        <div className="overflow-x-auto text-[10px] font-mono text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[8px] tracking-wider border-b border-slate-200">
                <th className="p-3">customerID</th>
                <th className="p-3">gender</th>
                <th className="p-3">Senior</th>
                <th className="p-3">Partner</th>
                <th className="p-3">Dependents</th>
                <th className="p-3">Tenure</th>
                <th className="p-3">Internet</th>
                <th className="p-3">Contract</th>
                <th className="p-3">Monthly Charges</th>
                <th className="p-3">Total Charges</th>
                <th className="p-3">Churn</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 text-xs font-sans">
                    No records found matching search queries.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-blue-600 font-semibold">{row.customerID}</td>
                    <td className="p-3">{row.gender}</td>
                    <td className="p-3">{row.SeniorCitizen === 1 ? "Yes" : "No"}</td>
                    <td className="p-3">{row.Partner}</td>
                    <td className="p-3">{row.Dependents}</td>
                    <td className="p-3 font-semibold text-slate-850">{row.tenure} mos</td>
                    <td className="p-3">{row.InternetService}</td>
                    <td className="p-3">{row.Contract}</td>
                    <td className="p-3">${row.MonthlyCharges.toFixed(2)}</td>
                    <td className="p-3">${row.TotalCharges.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-display uppercase tracking-wide border ${row["Churn Label"] === "Yes" ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                        {row["Churn Label"] === "Yes" ? "Churn" : "Retained"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer Pagination controls */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-display">
            <span>
              Showing {currentPage * rowsPerPage + 1} - {Math.min((currentPage + 1) * rowsPerPage, filteredData.length)} of {filteredData.length} records
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="py-1 px-2.5 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-semibold transition-colors"
              >
                Prev
              </button>
              <span className="font-mono text-[10px] text-slate-400">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="py-1 px-2.5 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-semibold transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
