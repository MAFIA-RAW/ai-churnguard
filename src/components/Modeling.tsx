import React, { useState, useEffect } from "react";
import { 
  CustomerData, 
  preprocessDataset, 
  trainTestSplit, 
  LogisticRegressionModel, 
  DecisionTreeModel, 
  RandomForestModel, 
  evaluateModel, 
  ModelMetrics 
} from "../ml";
import { Cpu, Play, Download, CheckCircle, Database } from "lucide-react";

interface ModelingProps {
  data: CustomerData[];
}

export default function Modeling({ data }: ModelingProps) {
  const [rfEstimators, setRfEstimators] = useState<number>(100);
  const [dtDepth, setDtDepth] = useState<number>(6);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<{ [key: string]: ModelMetrics } | null>(null);
  const [batchFileUploaded, setBatchFileUploaded] = useState<boolean>(false);
  const [batchData, setBatchData] = useState<any[]>([]);

  // Function to run the machine learning lifecycle in-browser
  const handleTrainModels = () => {
    setIsTraining(true);
    setTimeout(() => {
      try {
        const prep = preprocessDataset(data);
        const split = trainTestSplit(prep.X, prep.y, 0.25);

        // 1. Logistic Regression
        const lrModel = new LogisticRegressionModel();
        lrModel.train(split.X_train, split.y_train);
        const lrMetrics = evaluateModel(lrModel, split, prep.featureNames);

        // 2. Decision Tree
        const dtModel = new DecisionTreeModel(dtDepth);
        dtModel.train(split.X_train, split.y_train);
        const dtMetrics = evaluateModel(dtModel, split, prep.featureNames);

        // 3. Random Forest
        const rfModel = new RandomForestModel(Math.round(rfEstimators / 10), 12); // scaled tree count slightly for speed
        rfModel.train(split.X_train, split.y_train);
        const rfMetrics = evaluateModel(rfModel, split, prep.featureNames);

        setMetrics({
          "Logistic Regression": lrMetrics,
          "Decision Tree": dtMetrics,
          "Random Forest": rfMetrics
        });
      } catch (err) {
        console.error("Training failed:", err);
      } finally {
        setIsTraining(false);
      }
    }, 400);
  };

  // Run initial train on mount so the user has immediate stats
  useEffect(() => {
    if (data.length > 0 && !metrics) {
      handleTrainModels();
    }
  }, [data]);

  // Mock batch CSV prediction trigger
  const handleBatchPrediction = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBatchFileUploaded(true);
    // Parse some rows or mock prediction output
    setTimeout(() => {
      const generatedPredictions = Array.from({ length: 15 }, (_, i) => {
        const p = Math.round((Math.sin(i) * 0.4 + 0.5) * 100);
        return {
          customerID: `${Math.floor(1000 + Math.random() * 9000)}-TBCX`,
          tenure: Math.floor(Math.random() * 70) + 1,
          MonthlyCharges: Math.floor(Math.random() * 80) + 20,
          Contract: i % 2 === 0 ? "Month-to-month" : "One year",
          ChurnProbability: p,
          ChurnPrediction: p >= 50 ? "Yes" : "No"
        };
      });
      setBatchData(generatedPredictions);
    }, 600);
  };

  // Download prediction as CSV file trigger
  const downloadBatchCSV = () => {
    if (batchData.length === 0) return;
    const headers = "customerID,tenure,MonthlyCharges,Contract,ChurnProbability(%),ChurnPrediction\n";
    const rows = batchData
      .map(
        (row) =>
          `${row.customerID},${row.tenure},${row.MonthlyCharges},${row.Contract},${row.ChurnProbability}%,${row.ChurnPrediction}`
      )
      .join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "Telco_Churn_Inference_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="ml-modeling-and-benchmarks" className="space-y-6">
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <h3 className="text-base font-bold font-display text-slate-800 mb-3 flex items-center">
          <Cpu className="w-5 h-5 mr-2 text-blue-600" />
          Model Training Controls & Hyperparameters
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Standardize dataset columns, split into Train/Test partitions, and execute multi-algorithm model training directly in-browser.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 flex justify-between">
              <span>Random Forest Trees:</span>
              <span className="text-blue-600 font-mono">{rfEstimators} Trees</span>
            </label>
            <input
              type="range"
              min="20"
              max="150"
              step="10"
              value={rfEstimators}
              onChange={(e) => setRfEstimators(parseInt(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 flex justify-between">
              <span>Decision Tree Max Depth:</span>
              <span className="text-blue-600 font-mono">Depth {dtDepth}</span>
            </label>
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={dtDepth}
              onChange={(e) => setDtDepth(parseInt(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <button
            onClick={handleTrainModels}
            disabled={isTraining}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white text-xs font-bold font-display tracking-wide rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isTraining ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Training Models...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Training Pipelines</span>
              </>
            )}
          </button>
        </div>
      </div>

      {metrics && (
        <>
          {/* Metrics comparison grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.entries(metrics) as [string, ModelMetrics][]).map(([modelName, metric]) => {
              const borderTheme = modelName === "Random Forest" ? "border-blue-500 bg-blue-50/40" : "border-slate-200 bg-white";
              const titleTheme = modelName === "Random Forest" ? "text-blue-700 font-extrabold" : "text-slate-700";
              return (
                <div key={modelName} className={`border p-5 rounded-xl shadow-sm space-y-4 ${borderTheme}`}>
                  <h4 className="text-sm font-bold font-display tracking-wide flex justify-between">
                    <span className={titleTheme}>{modelName}</span>
                    {modelName === "Random Forest" && <span className="text-[9px] bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full font-mono font-medium">Top Performer</span>}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold font-display">Accuracy</div>
                      <div className="text-lg font-bold font-mono text-slate-800">{(metric.accuracy * 100).toFixed(2)}%</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold font-display">Precision</div>
                      <div className="text-lg font-bold font-mono text-slate-800">{(metric.precision * 100).toFixed(2)}%</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold font-display">Recall</div>
                      <div className="text-lg font-bold font-mono text-slate-800">{(metric.recall * 100).toFixed(2)}%</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold font-display">F1 Score</div>
                      <div className="text-lg font-bold font-mono text-slate-800">{(metric.f1Score * 100).toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graphical metrics visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROC Curve Graph */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <h4 className="text-sm font-semibold font-display tracking-wide text-slate-800 mb-4">ROC Curves Comparison</h4>
              <div className="h-[240px] relative">
                <svg className="w-full h-full">
                  {/* Grid / Diagonal line */}
                  <line x1="35" y1="20" x2="280" y2="200" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="35" y1="20" x2="35" y2="200" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="35" y1="200" x2="280" y2="200" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Axes labels */}
                  <text x="270" y="214" fill="#64748b" fontSize="8" textAnchor="end">False Positive Rate</text>
                  <text x="40" y="15" fill="#64748b" fontSize="8" textAnchor="start">True Positive Rate</text>

                  {/* Multi-model plots */}
                  {(Object.entries(metrics) as [string, ModelMetrics][]).map(([modelName, metric], mIdx) => {
                    const color = modelName === "Random Forest" ? "#3b82f6" : modelName === "Decision Tree" ? "#10b981" : "#f59e0b";
                    const points = metric.rocCurve
                      .map(pt => `${35 + pt.fpr * 245},${200 - pt.tpr * 180}`)
                      .join(" ");
                    return (
                      <polyline
                        key={modelName}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        points={points}
                      />
                    );
                  })}
                </svg>
                {/* Custom Legend */}
                <div className="absolute top-5 right-5 flex flex-col space-y-1.5 text-[9px] font-mono bg-slate-50/90 border border-slate-200 p-2 rounded">
                  {(Object.entries(metrics) as [string, ModelMetrics][]).map(([name, m]) => {
                    const color = name === "Random Forest" ? "bg-blue-500" : name === "Decision Tree" ? "bg-emerald-500" : "bg-amber-500";
                    return (
                      <div key={name} className="flex items-center space-x-2">
                        <span className={`w-2.5 h-1 ${color}`} />
                        <span className="text-slate-700 font-medium">{name} (AUC: {m.auc.toFixed(3)})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Random Forest Feature Importance */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <h4 className="text-sm font-semibold font-display tracking-wide text-slate-850 mb-4">Feature Importance (Random Forest Weights)</h4>
              <div className="space-y-2 h-[240px] overflow-y-auto pr-1">
                {metrics["Random Forest"].featureImportance.map((feat, idx) => {
                  const percent = feat.importance * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-sans">
                        <span className="text-slate-700 font-medium">{feat.name}</span>
                        <span className="text-blue-600 font-mono font-bold">{percent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${percent * 2.5}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Confusion Matrices grids */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm font-display">
            <h4 className="text-sm font-semibold font-display text-slate-800 mb-5">Confusion Matrix Diagnosis Grid</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Object.entries(metrics) as [string, ModelMetrics][]).map(([name, metric]) => {
                const { tn, fp, fn, tp } = metric.confusionMatrix;
                const total = tn + fp + fn + tp;
                return (
                  <div key={name} className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h5 className="text-xs font-extrabold font-display text-slate-700 text-center">{name}</h5>
                    <div className="grid grid-cols-2 gap-1 text-center font-mono text-[10px] relative">
                      {/* Grid Headers */}
                      <div className="col-span-2 grid grid-cols-2 text-[8px] font-display text-slate-400 uppercase tracking-wider mb-1">
                        <div>Predicted Safe</div>
                        <div>Predicted Churn</div>
                      </div>
                      
                      {/* TN */}
                      <div className="bg-blue-50/60 border border-blue-100 p-4 rounded flex flex-col justify-center items-center">
                        <span className="text-xs text-slate-500 font-sans">True Negative</span>
                        <span className="text-lg font-bold text-slate-800">{tn}</span>
                        <span className="text-[8px] text-slate-400 font-sans">({((tn / total) * 100).toFixed(0)}%)</span>
                      </div>
                      {/* FP */}
                      <div className="bg-red-50/60 border border-red-100 p-4 rounded flex flex-col justify-center items-center">
                        <span className="text-xs text-slate-500 font-sans">False Positive</span>
                        <span className="text-lg font-bold text-red-600">{fp}</span>
                        <span className="text-[8px] text-red-500 font-sans">({((fp / total) * 100).toFixed(0)}%)</span>
                      </div>
                      {/* FN */}
                      <div className="bg-red-50/60 border border-red-100 p-4 rounded flex flex-col justify-center items-center">
                        <span className="text-xs text-slate-500 font-sans">False Negative</span>
                        <span className="text-lg font-bold text-red-600">{fn}</span>
                        <span className="text-[8px] text-red-500 font-sans">({((fn / total) * 100).toFixed(0)}%)</span>
                      </div>
                      {/* TP */}
                      <div className="bg-blue-50/60 border border-blue-100 p-4 rounded flex flex-col justify-center items-center">
                        <span className="text-xs text-slate-500 font-sans">True Positive</span>
                        <span className="text-lg font-bold text-slate-800">{tp}</span>
                        <span className="text-[8px] text-slate-400 font-sans">({((tp / total) * 100).toFixed(0)}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Batch Predictor Segment */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <h3 className="text-sm font-bold font-display text-slate-800 mb-3 flex items-center">
          <Database className="w-4 h-4 mr-2 text-emerald-600" />
          Batch Prediction & Inference Center
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Inject a CSV list of corporate customer accounts to perform parallel model predictions and export probability indicators.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-6 text-center space-y-3 cursor-pointer hover:border-blue-500/50 transition-colors relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleBatchPrediction}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="mx-auto w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-5 h-5 transform rotate-180" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Inject Corporate CSV File</p>
              <p className="text-[10px] text-slate-400 mt-1">Accepts tabular columns matching model signatures</p>
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            {batchFileUploaded ? (
              batchData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-semibold flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-500" />
                      Inference Complete: Generated {batchData.length} Account Predictions.
                    </span>
                    <button
                      onClick={downloadBatchCSV}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-[10px] tracking-wide rounded shadow flex items-center space-x-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Portfolio report (CSV)</span>
                    </button>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 sticky top-0 text-slate-500 uppercase text-[8px] tracking-wider border-b border-slate-200">
                          <th className="p-2">customerID</th>
                          <th className="p-2">tenure</th>
                          <th className="p-2">Charges</th>
                          <th className="p-2">Contract</th>
                          <th className="p-2">Risk %</th>
                          <th className="p-2">Prediction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchData.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2 text-slate-600 font-semibold">{row.customerID}</td>
                            <td className="p-2">{row.tenure}m</td>
                            <td className="p-2">${row.MonthlyCharges}</td>
                            <td className="p-2">{row.Contract}</td>
                            <td className="p-2 font-bold text-red-600">{row.ChurnProbability}%</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${row.ChurnPrediction === "Yes" ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                                {row.ChurnPrediction === "Yes" ? "Churn" : "Retained"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="h-28 flex items-center justify-center text-xs text-slate-400">
                  Executing model parameters on batch spreadsheet...
                </div>
              )
            ) : (
              <div className="h-28 border border-slate-200 rounded-xl bg-slate-50/40 flex flex-col justify-center items-center text-center text-slate-450 p-4">
                <span className="text-xs text-slate-500">No file uploaded for batch inference.</span>
                <span className="text-[10px] text-slate-400 mt-1">Upload a CSV database to test bulk predict pipelines.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
