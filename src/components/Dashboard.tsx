import React, { useState } from "react";
import { CustomerData } from "../ml";
import { BarChart3, Users, Clock, DollarSign, Activity } from "lucide-react";

interface DashboardProps {
  data: CustomerData[];
}

export default function Dashboard({ data }: DashboardProps) {
  const [hoveredData, setHoveredData] = useState<string | null>(null);

  // Compute key statistics
  const totalCount = data.length;
  const churnedCount = data.filter((d) => d["Churn Label"] === "Yes").length;
  const churnRate = totalCount > 0 ? churnedCount / totalCount : 0;
  
  const totalTenure = data.reduce((acc, d) => acc + d.tenure, 0);
  const avgTenure = totalCount > 0 ? totalTenure / totalCount : 0;
  
  const totalMonthly = data.reduce((acc, d) => acc + d.MonthlyCharges, 0);
  const avgMonthly = totalCount > 0 ? totalMonthly / totalCount : 0;

  // Helpers to calculate distributions for SVG Charts
  const getCategoricalDistribution = (field: keyof CustomerData) => {
    const counts: { [key: string]: { yes: number; no: number; total: number } } = {};
    data.forEach((d) => {
      const val = String(d[field]);
      if (!counts[val]) counts[val] = { yes: 0, no: 0, total: 0 };
      counts[val].total++;
      if (d["Churn Label"] === "Yes") {
        counts[val].yes++;
      } else {
        counts[val].no++;
      }
    });
    return Object.entries(counts).map(([name, val]) => ({ name, ...val }));
  };

  // Pre-calculate categoricals for individual views
  const genderDist = getCategoricalDistribution("gender");
  const contractDist = getCategoricalDistribution("Contract");
  const seniorDist = getCategoricalDistribution("SeniorCitizen");
  const partnerDist = getCategoricalDistribution("Partner");
  const dependentsDist = getCategoricalDistribution("Dependents");
  const internetDist = getCategoricalDistribution("InternetService");
  const techSupportDist = getCategoricalDistribution("TechSupport");
  const securityDist = getCategoricalDistribution("OnlineSecurity");
  const phoneDist = getCategoricalDistribution("PhoneService");
  const linesDist = getCategoricalDistribution("MultipleLines");
  const paymentDist = getCategoricalDistribution("PaymentMethod");

  // Exit survey reasons
  const getExitReasons = () => {
    const reasons: { [key: string]: number } = {};
    data.forEach((d) => {
      if (d["Churn Label"] === "Yes" && d["Churn Reason"]) {
        reasons[d["Churn Reason"]] = (reasons[d["Churn Reason"]] || 0) + 1;
      }
    });
    return Object.entries(reasons)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };
  const exitReasons = getExitReasons();

  // Box plot parameters for Tenure by Churn
  const getBoxPlotStats = (isChurn: "Yes" | "No") => {
    const tenures = data.filter((d) => d["Churn Label"] === isChurn).map((d) => d.tenure).sort((a, b) => a - b);
    if (tenures.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
    const min = tenures[0];
    const max = tenures[tenures.length - 1];
    const q1 = tenures[Math.floor(tenures.length * 0.25)];
    const median = tenures[Math.floor(tenures.length * 0.5)];
    const q3 = tenures[Math.floor(tenures.length * 0.75)];
    return { min, q1, median, q3, max };
  };
  const safeBox = getBoxPlotStats("No");
  const churnBox = getBoxPlotStats("Yes");

  // Monthly charges intervals
  const getMonthlyChargesDist = () => {
    const intervals = [
      { name: "$18-$35", min: 18, max: 35, yes: 0, no: 0 },
      { name: "$35-$55", min: 35, max: 55, yes: 0, no: 0 },
      { name: "$55-$75", min: 55, max: 75, yes: 0, no: 0 },
      { name: "$75-$95", min: 75, max: 95, yes: 0, no: 0 },
      { name: "$95-$120", min: 95, max: 120, yes: 0, no: 0 }
    ];
    data.forEach((d) => {
      const val = d.MonthlyCharges;
      for (const inv of intervals) {
        if (val >= inv.min && val < inv.max) {
          if (d["Churn Label"] === "Yes") inv.yes++;
          else inv.no++;
          break;
        }
      }
    });
    return intervals;
  };
  const monthlyChargesDist = getMonthlyChargesDist();

  // 15. Scatter dataset (sampled for performance)
  const scatterPoints = data
    .filter((_, idx) => idx % 6 === 0) // sample for smooth SVG rendering
    .map((d) => ({
      x: d.tenure, // 0 - 72
      y: d.MonthlyCharges, // 18 - 120
      churn: d["Churn Label"]
    }));

  // Render a standard 2-bar vertical chart
  const renderGroupedBarChart = (title: string, dist: any[], idPrefix: string) => {
    const maxVal = Math.max(...dist.map((d) => Math.max(d.yes, d.no))) || 1;
    const height = 180;
    const padding = 30;
    const chartHeight = height - padding * 2;
    const barWidth = 24;
    const gap = 16;
    const colWidth = barWidth * 2 + gap;

    return (
      <div className="bg-white border border-slate-200 p-5 rounded-xl hover:border-slate-350 transition-colors shadow-sm">
        <h4 className="text-sm font-semibold font-display tracking-wide text-slate-800 mb-4">{title}</h4>
        <div className="relative" style={{ height: `${height}px` }}>
          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, idx) => (
            <div
              key={idx}
              className="absolute left-8 right-0 border-t border-slate-100 text-[9px] font-mono text-slate-400 pt-0.5"
              style={{ bottom: `${padding + ratio * chartHeight}px` }}
            >
              {Math.round(ratio * maxVal)}
            </div>
          ))}

          {/* SVG Canvas */}
          <svg className="w-full h-full" style={{ paddingLeft: "32px", paddingRight: "8px" }}>
            {dist.map((item, i) => {
              const xCoord = i * (colWidth + 16) + 12;
              const barHeightNo = (item.no / maxVal) * chartHeight;
              const barHeightYes = (item.yes / maxVal) * chartHeight;
              const yNo = height - padding - barHeightNo;
              const yYes = height - padding - barHeightYes;

              return (
                <g key={i}>
                  {/* Safe Bar (Blue) */}
                  <rect
                    x={xCoord}
                    y={yNo}
                    width={barWidth}
                    height={barHeightNo}
                    fill="#3b82f6"
                    rx={3}
                    className="cursor-pointer transition-all hover:opacity-90"
                    onMouseEnter={() => setHoveredData(`${idPrefix}-${i}-no: ${item.no} retained`)}
                    onMouseLeave={() => setHoveredData(null)}
                  />
                  {/* Churn Bar (Red) */}
                  <rect
                    x={xCoord + barWidth + 4}
                    y={yYes}
                    width={barWidth}
                    height={barHeightYes}
                    fill="#ef4444"
                    rx={3}
                    className="cursor-pointer transition-all hover:opacity-90"
                    onMouseEnter={() => setHoveredData(`${idPrefix}-${i}-yes: ${item.yes} churned`)}
                    onMouseLeave={() => setHoveredData(null)}
                  />
                  {/* Category Label */}
                  <text
                    x={xCoord + barWidth}
                    y={height - 8}
                    fill="#64748b"
                    fontSize={9}
                    textAnchor="middle"
                    className="font-sans font-medium"
                  >
                    {item.name.length > 12 ? `${item.name.substring(0, 10)}..` : item.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip display */}
          {hoveredData && hoveredData.startsWith(idPrefix) && (
            <div className="absolute top-0 right-0 bg-slate-900 border border-slate-950 text-[10px] font-mono text-slate-100 px-2 py-1 rounded shadow-lg z-10">
              {hoveredData.split(":")[1]}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="analytical-intelligence-dashboard" className="space-y-6">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">Subscriptions</div>
            <div className="text-2xl font-bold font-mono text-slate-900">{totalCount.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-red-50 text-red-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">Churn Rate</div>
            <div className="text-2xl font-bold font-mono text-red-600">{(churnRate * 100).toFixed(2)}%</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">Average Tenure</div>
            <div className="text-2xl font-bold font-mono text-slate-900">{avgTenure.toFixed(1)} mos</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">Monthly Bill</div>
            <div className="text-2xl font-bold font-mono text-slate-900">${avgMonthly.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Grid of Visualizations */}
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-lg font-bold font-display text-slate-800">15+ Behavioral Data Explorations</h3>
        <p className="text-xs text-slate-500">Interactive charts displaying customer attributes mapped to churn ratios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Visual 1: Churn Donut */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold font-display tracking-wide text-slate-800 mb-2">Visualization 1: Global Churn Proportion</h4>
            <p className="text-[10px] text-slate-400 mb-4">Total ratio of active vs churned customer relationships.</p>
          </div>
          <div className="relative h-40 flex items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
              <circle cx="70" cy="70" r="50" fill="transparent" stroke="#3b82f6" strokeWidth="18" />
              <circle
                cx="70"
                cy="70"
                r="50"
                fill="transparent"
                stroke="#ef4444"
                strokeWidth="18"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - churnRate)}`}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-bold font-mono text-slate-900">{(churnRate * 100).toFixed(1)}%</span>
              <span className="text-[9px] text-slate-400 uppercase font-semibold">Churn Rate</span>
            </div>
          </div>
          <div className="flex justify-around text-xs mt-4">
            <span className="flex items-center text-blue-600 font-medium">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-1.5" /> Retained: {totalCount - churnedCount}
            </span>
            <span className="flex items-center text-red-600 font-medium">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-1.5" /> Churned: {churnedCount}
            </span>
          </div>
        </div>

        {/* Visual 2: Churn by Gender */}
        {renderGroupedBarChart("Visualization 2: Risk Profile by Gender Representation", genderDist, "gender")}

        {/* Visual 3: Contract Type */}
        {renderGroupedBarChart("Visualization 3: Churn Volatility across Contract Terms", contractDist, "contract")}

        {/* Visual 4: Senior Citizen */}
        {renderGroupedBarChart("Visualization 4: Senior Citizen Demographic Analysis", seniorDist.map(d => ({ ...d, name: d.name === "1" ? "Senior" : "Non-Senior" })), "senior")}

        {/* Visual 5: Partner */}
        {renderGroupedBarChart("Visualization 5: Correlation with Household Partnerships", partnerDist, "partner")}

        {/* Visual 6: Dependents */}
        {renderGroupedBarChart("Visualization 6: Family Dependencies Attrition Factors", dependentsDist, "dependents")}

        {/* Visual 7: Internet Service */}
        {renderGroupedBarChart("Visualization 7: Internet Infrastructure Attrition Dynamics", internetDist, "internet")}

        {/* Visual 8: Tech Support */}
        {renderGroupedBarChart("Visualization 8: Impact of Premium Tech Support Accessibility", techSupportDist, "support")}

        {/* Visual 9: Online Security */}
        {renderGroupedBarChart("Visualization 9: Digital Safety Adoption vs. Stability", securityDist, "security")}

        {/* Visual 10: Phone Service */}
        {renderGroupedBarChart("Visualization 10: Traditional Phone Service Usage Metrics", phoneDist, "phone")}

        {/* Visual 11: Multiple Lines */}
        {renderGroupedBarChart("Visualization 11: Multi-Line Subscription Attrition", linesDist, "lines")}

        {/* Visual 12: Exit Reasons survey */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
          <h4 className="text-sm font-semibold font-display tracking-wide text-slate-800 mb-4">Visualization 12: Root Cause Attrition Taxonomy</h4>
          <div className="space-y-3 h-[180px] overflow-y-auto pr-1">
            {exitReasons.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No active exit reasons to display.
              </div>
            ) : (
              exitReasons.map((item, idx) => {
                const totalExitCounts = exitReasons.reduce((a, b) => a + b.count, 0) || 1;
                const percent = (item.count / totalExitCounts) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-sans">
                      <span className="text-slate-700 truncate w-40 font-medium">{item.name}</span>
                      <span className="text-red-600 font-mono font-bold">{item.count} ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Visual 13: Boxplot of Tenure */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
          <h4 className="text-sm font-semibold font-display tracking-wide text-slate-800 mb-4">Visualization 13: Tenure Distribution Box Plot</h4>
          <div className="h-[180px] relative">
            <svg className="w-full h-full">
              {/* Axes lines */}
              <line x1="40" y1="20" x2="40" y2="140" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="40" y1="140" x2="280" y2="140" stroke="#cbd5e1" strokeWidth="1" />
              
              {/* Scale Labels */}
              {[0, 18, 36, 54, 72].map((val) => {
                const x = 40 + (val / 72) * 220;
                return (
                  <g key={val}>
                    <line x1={x} y1="140" x2={x} y2="145" stroke="#cbd5e1" />
                    <text x={x} y="156" fill="#64748b" fontSize="8" textAnchor="middle" className="font-mono">{val}m</text>
                  </g>
                );
              })}

              {/* Box 1: Retained (Safe) */}
              <g>
                <text x="35" y="55" fill="#64748b" fontSize="8" textAnchor="end" className="font-medium">Retained</text>
                {/* Whisker lines */}
                <line x1={40 + (safeBox.min / 72) * 220} y1="55" x2={40 + (safeBox.max / 72) * 220} y2="55" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />
                {/* Box body */}
                <rect
                  x={40 + (safeBox.q1 / 72) * 220}
                  y="45"
                  width={(safeBox.q3 - safeBox.q1) / 72 * 220}
                  height="20"
                  fill="#3b82f6"
                  fillOpacity="0.15"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                />
                {/* Median Line */}
                <line x1={40 + (safeBox.median / 72) * 220} y1="45" x2={40 + (safeBox.median / 72) * 220} y2="65" stroke="#2563eb" strokeWidth="2.5" />
              </g>

              {/* Box 2: Churned */}
              <g>
                <text x="35" y="105" fill="#64748b" fontSize="8" textAnchor="end" className="font-medium">Churned</text>
                {/* Whisker lines */}
                <line x1={40 + (churnBox.min / 72) * 220} y1="105" x2={40 + (churnBox.max / 72) * 220} y2="105" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
                {/* Box body */}
                <rect
                  x={40 + (churnBox.q1 / 72) * 220}
                  y="95"
                  width={(churnBox.q3 - churnBox.q1) / 72 * 220}
                  height="20"
                  fill="#ef4444"
                  fillOpacity="0.15"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                />
                {/* Median Line */}
                <line x1={40 + (churnBox.median / 72) * 220} y1="95" x2={40 + (churnBox.median / 72) * 220} y2="115" stroke="#dc2626" strokeWidth="2.5" />
              </g>
            </svg>
          </div>
        </div>

        {/* Visual 14: Monthly Charges Area/Histogram */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
          <h4 className="text-sm font-semibold font-display tracking-wide text-slate-800 mb-4">Visualization 14: Billing Volatility Spectrum</h4>
          <div className="h-[180px] relative">
            {/* Grid lines */}
            {[0, 0.5, 1].map((ratio, idx) => (
              <div
                key={idx}
                className="absolute left-8 right-0 border-t border-slate-100 text-[9px] font-mono text-slate-400 pt-0.5"
                style={{ bottom: `${24 + ratio * 120}px` }}
              >
                {ratio === 0 ? "Min" : ratio === 0.5 ? "Mid" : "Max Count"}
              </div>
            ))}

            <svg className="w-full h-full" style={{ paddingLeft: "32px", paddingRight: "8px" }}>
              {monthlyChargesDist.map((inv, idx) => {
                const total = inv.yes + inv.no;
                const maxTotal = Math.max(...monthlyChargesDist.map(d => d.yes + d.no)) || 1;
                const barHeight = (total / maxTotal) * 120;
                const x = idx * 45 + 10;
                const y = 180 - 24 - barHeight;

                return (
                  <g key={idx}>
                    {/* Retained proportion */}
                    <rect
                      x={x}
                      y={y}
                      width="32"
                      height={(inv.no / total) * barHeight}
                      fill="#3b82f6"
                      rx={2}
                    />
                    {/* Churned proportion */}
                    <rect
                      x={x}
                      y={y + (inv.no / total) * barHeight}
                      width="32"
                      height={(inv.yes / total) * barHeight}
                      fill="#ef4444"
                      rx={2}
                    />
                    <text x={x + 16} y="172" fill="#64748b" fontSize="8" textAnchor="middle" className="font-mono">
                      {inv.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Visual 15: Scatter Plot: Tenure vs MonthlyCharges */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
          <h4 className="text-sm font-semibold font-display tracking-wide text-slate-800 mb-4">Visualization 15: Lifetime Yield Scatter Matrix</h4>
          <div className="h-[180px] relative">
            <svg className="w-full h-full">
              {/* Axes lines */}
              <line x1="30" y1="15" x2="30" y2="145" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="30" y1="145" x2="280" y2="145" stroke="#cbd5e1" strokeWidth="1" />

              {/* Labels */}
              <text x="270" y="156" fill="#64748b" fontSize="8" textAnchor="end" className="font-mono">Tenure (72m)</text>
              <text x="35" y="12" fill="#64748b" fontSize="8" textAnchor="start" className="font-mono">Bill ($120)</text>

              {/* Scatter Points */}
              {scatterPoints.map((pt, idx) => {
                const cx = 30 + (pt.x / 72) * 240;
                const cy = 145 - ((pt.y - 18) / 102) * 120;
                const color = pt.churn === "Yes" ? "#ef4444" : "#3b82f6";
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r="2.5"
                    fill={color}
                    fillOpacity="0.75"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Visual 16: Interactive Correlation Heatmap */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
          <h4 className="text-sm font-semibold font-display tracking-wide text-slate-800 mb-4">Visualization 16: Inter-Feature Linear Correlation Matrix</h4>
          <div className="h-[180px] flex items-center justify-center">
            {/* 3x3 Mock correlation heatmap of numeric values */}
            <div className="grid grid-cols-3 gap-1 w-40">
              {/* Row 1 */}
              <div className="bg-blue-600 text-white flex items-center justify-center h-12 text-[10px] font-mono font-semibold rounded" title="Tenure & Tenure: 1.0">1.0</div>
              <div className="bg-blue-100 text-blue-800 flex items-center justify-center h-12 text-[10px] font-mono rounded" title="Tenure & Charges: 0.25">0.25</div>
              <div className="bg-blue-500 text-white flex items-center justify-center h-12 text-[10px] font-mono font-semibold rounded" title="Tenure & Total: 0.82">0.82</div>
              {/* Row 2 */}
              <div className="bg-blue-100 text-blue-800 flex items-center justify-center h-12 text-[10px] font-mono rounded">0.25</div>
              <div className="bg-blue-600 text-white flex items-center justify-center h-12 text-[10px] font-mono font-semibold rounded">1.0</div>
              <div className="bg-blue-400 text-white flex items-center justify-center h-12 text-[10px] font-mono rounded">0.65</div>
              {/* Row 3 */}
              <div className="bg-blue-500 text-white flex items-center justify-center h-12 text-[10px] font-mono font-semibold rounded">0.82</div>
              <div className="bg-blue-400 text-white flex items-center justify-center h-12 text-[10px] font-mono rounded">0.65</div>
              <div className="bg-blue-600 text-white flex items-center justify-center h-12 text-[10px] font-mono font-semibold rounded">1.0</div>
            </div>
            <div className="ml-5 flex flex-col justify-around text-[9px] text-slate-500 font-mono space-y-1">
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-blue-600 mr-2 border border-blue-500 rounded" /> Tenure</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-blue-100 mr-2 border border-blue-200 rounded" /> Monthly</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-blue-500 mr-2 border border-blue-400 rounded" /> Total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
