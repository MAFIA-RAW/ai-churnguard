import React, { useState, useEffect } from "react";
import { 
  CustomerData, 
  preprocessDataset, 
  RandomForestModel 
} from "../ml";
import { Sparkles, ShieldAlert, BadgeHelp, CheckCircle2 } from "lucide-react";

interface SandboxProps {
  data: CustomerData[];
}

export default function Sandbox({ data }: SandboxProps) {
  // Train a robust Random Forest model on mount using the full current dataset
  const [rfModel, setRfModel] = useState<RandomForestModel | null>(null);
  const [featureNames, setFeatureNames] = useState<string[]>([]);

  useEffect(() => {
    if (data.length > 0) {
      const prep = preprocessDataset(data);
      const model = new RandomForestModel(10, 8); // 10 trees, depth 8 for single predictions
      model.train(prep.X, prep.y);
      setRfModel(model);
      setFeatureNames(prep.featureNames);
    }
  }, [data]);

  // Form states for profile calibration
  const [gender, setGender] = useState<string>("Female");
  const [senior, setSenior] = useState<number>(0);
  const [partner, setPartner] = useState<string>("No");
  const [dependents, setDependents] = useState<string>("No");
  const [tenure, setTenure] = useState<number>(12);
  const [phoneService, setPhoneService] = useState<string>("Yes");
  const [multipleLines, setMultipleLines] = useState<string>("No");
  const [internetService, setInternetService] = useState<string>("Fiber optic");
  const [security, setSecurity] = useState<string>("No");
  const [backup, setBackup] = useState<string>("No");
  const [protection, setProtection] = useState<string>("No");
  const [techSupport, setTechSupport] = useState<string>("No");
  const [tv, setTv] = useState<string>("No");
  const [movies, setMovies] = useState<string>("No");
  const [contract, setContract] = useState<string>("Month-to-month");
  const [paperless, setPaperless] = useState<string>("Yes");
  const [payment, setPayment] = useState<string>("Electronic check");
  const [monthlyCharges, setMonthlyCharges] = useState<number>(85);
  const [totalCharges, setTotalCharges] = useState<number>(1020);

  // Sync total charges with tenure * monthlyCharges if tenure changes
  useEffect(() => {
    setTotalCharges(Math.round(tenure * monthlyCharges * 100) / 100);
  }, [tenure, monthlyCharges]);

  // Predict churn probability for the calibrated form data
  const calculateProbability = (): number => {
    if (!rfModel || featureNames.length === 0) return 0.25; // default fallback

    // Map inputs to a mock customer record
    const customer: CustomerData = {
      customerID: "SANDBOX-MOCK",
      gender,
      SeniorCitizen: senior,
      Partner: partner,
      Dependents: dependents,
      tenure,
      PhoneService: phoneService,
      MultipleLines: phoneService === "No" ? "No phone service" : multipleLines,
      InternetService: internetService,
      OnlineSecurity: internetService === "No" ? "No internet service" : security,
      OnlineBackup: internetService === "No" ? "No internet service" : backup,
      DeviceProtection: internetService === "No" ? "No internet service" : protection,
      TechSupport: internetService === "No" ? "No internet service" : techSupport,
      StreamingTV: internetService === "No" ? "No internet service" : tv,
      StreamingMovies: internetService === "No" ? "No internet service" : movies,
      Contract: contract,
      PaperlessBilling: paperless,
      PaymentMethod: payment,
      MonthlyCharges: monthlyCharges,
      TotalCharges: totalCharges,
      "Churn Label": "No" // dummy
    };

    // Preprocess single row
    const prep = preprocessDataset([customer, ...data]); // put at front to process cleanly
    const row = prep.X[0]; // get the active preprocessed vector

    // run prob
    const prob = rfModel.predictProba([row])[0];
    return prob;
  };

  const prob = calculateProbability();
  const probPercent = Math.round(prob * 100);

  // Gauge colors
  const gaugeColor = probPercent >= 70 ? "#ef4444" : probPercent >= 30 ? "#f59e0b" : "#10b981";
  const riskClass = probPercent >= 70 ? "text-red-600 font-bold border-red-200 bg-red-50" : probPercent >= 30 ? "text-amber-600 font-bold border-amber-200 bg-amber-50" : "text-emerald-600 font-bold border-emerald-200 bg-emerald-50";

  // Generate actionable retention advice
  const getRetentionRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (contract === "Month-to-month") {
      recommendations.push(
        "**Strategic Contract Conversion**: This customer is on a volatile Month-to-Month plan. Offer a **One-Year agreement** with a loyalty commitment discount of **10%** off their Monthly Charges (saving them approx. $" + (monthlyCharges * 0.1).toFixed(1) + "/mo)."
      );
    }
    
    if (payment === "Electronic check") {
      recommendations.push(
        "**Payment Channel Auto-Pay Promotion**: Electronic Check transactions exhibit high attrition. Incentivize a transition to **Credit Card (automatic)** or **Bank Transfer** with a one-time **$15 account credit**."
      );
    }
    
    if (internetService === "Fiber optic" && techSupport === "No") {
      recommendations.push(
        "**Premium Tech Support Bundling**: Customer uses fiber optic broadband but lacks technical support backup. Bundle **Premium Tech Support** at half price ($3.00/mo) for 6 months to reduce infrastructure connectivity frustration."
      );
    }
    
    if (tenure < 12) {
      recommendations.push(
        "**Early Life Cycle Care**: Since their lifespan is under a year, enroll them in the **Executive Welcome Program**, which includes direct monthly diagnostic checks on their satisfaction score."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "**Relationship Advocate Outreach**: Customer displays exceptional contract stability. Target with loyalty reward programs, or invite them to become a **Brand Ambassador** in exchange for referral discounts."
      );
    }

    return recommendations;
  };

  const recommendations = getRetentionRecommendations();

  return (
    <div id="customer-churn-probability-sandbox" className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-lg font-bold font-display text-slate-800">Customer Lifetime Value (CLV) Sandbox</h3>
        <p className="text-xs text-slate-500">Tweak custom subscription metrics below to observe real-time risk diagnostic changes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters Box */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <h4 className="text-sm font-semibold font-display text-slate-800 border-b border-slate-100 pb-2">Profile Configuration</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Demographics */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Demographics</h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Gender</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Senior Citizen</label>
                  <select 
                    value={senior} 
                    onChange={(e) => setSenior(parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value={0}>0 (Non-Senior)</option>
                    <option value={1}>1 (Senior)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Has Partner</label>
                  <select 
                    value={partner} 
                    onChange={(e) => setPartner(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Has Dependents</label>
                  <select 
                    value={dependents} 
                    onChange={(e) => setDependents(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-semibold text-slate-650 flex justify-between">
                  <span>Account Lifespan (Tenure)</span>
                  <span className="text-blue-600 font-mono font-bold">{tenure} Months</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="72"
                  value={tenure}
                  onChange={(e) => setTenure(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Core Services */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Services Matrix</h5>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Internet Link</label>
                  <select 
                    value={internetService} 
                    onChange={(e) => setInternetService(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Fiber optic">Fiber Optic</option>
                    <option value="DSL">DSL</option>
                    <option value="No">No Internet</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Phone Service</label>
                  <select 
                    value={phoneService} 
                    onChange={(e) => setPhoneService(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {internetService !== "No" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600">Online Security</label>
                      <select 
                        value={security} 
                        onChange={(e) => setSecurity(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600">Tech Support</label>
                      <select 
                        value={techSupport} 
                        onChange={(e) => setTechSupport(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 text-center py-2.5 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-400 font-medium">
                    No active digital parameters to configure (Internet Link disabled)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Financial Details */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Financial Setup</h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Contract Plan</label>
                  <select 
                    value={contract} 
                    onChange={(e) => setContract(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Month-to-month">Month-to-month</option>
                    <option value="One year">One year</option>
                    <option value="Two year">Two year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Billing Channel</label>
                  <select 
                    value={payment} 
                    onChange={(e) => setPayment(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Electronic check">Electronic check</option>
                    <option value="Mailed check">Mailed check</option>
                    <option value="Bank transfer (automatic)">Bank transfer (auto)</option>
                    <option value="Credit card (automatic)">Credit card (auto)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Monthly Bill ($)</label>
                  <input
                    type="number"
                    min="18"
                    max="125"
                    value={monthlyCharges}
                    onChange={(e) => setMonthlyCharges(parseFloat(e.target.value) || 18)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Total Charged ($)</label>
                  <input
                    type="number"
                    value={totalCharges}
                    onChange={(e) => setTotalCharges(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Empty block for padding / helper specs */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg flex flex-col justify-between">
              <span className="text-[10px] text-slate-650 leading-relaxed">
                🚨 <strong>Analytical Tip</strong>: In the IBM Telco Customer Churn dataset, the highest weight indicators of churn include <strong>Month-to-month contracts</strong>, <strong>Fiber Optic connections with no Online Security/Support</strong>, and <strong>Electronic Check payment methods</strong>. Adjust these features to observe how they alter predictions.
              </span>
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mt-2 border-t border-slate-200 pt-2">
                <span>Model Profile: RFC (10 trees)</span>
                <span>Seed: Stratified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Risk Gauge panel */}
        <div className="space-y-6">
          {/* Radial Gauge Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col items-center justify-between h-[250px]">
            <h4 className="text-sm font-semibold font-display text-slate-800">Real-Time Risk Diagnosis</h4>
            <div className="relative h-32 flex items-center justify-center">
              {/* SVG circular gauge */}
              <svg width="120" height="120" viewBox="0 0 120 120">
                {/* Background tracks */}
                <path d="M 20,100 A 45,45 0 1,1 100,100" fill="none" stroke="#f1f5f9" strokeWidth="10" strokeLinecap="round" />
                {/* Filled tracks */}
                <path
                  d="M 20,100 A 45,45 0 1,1 100,100"
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="212"
                  strokeDashoffset={`${212 - (212 * probPercent) / 100}`}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black font-mono" style={{ color: gaugeColor }}>{probPercent}%</span>
                <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider">Churn risk</span>
              </div>
            </div>

            {/* Class text */}
            <div className={`w-full py-1.5 px-3 border rounded-lg text-center text-[10px] tracking-wide font-semibold ${riskClass}`}>
              {probPercent >= 70 ? "🚨 HIGH CRITICAL ATTRITION RISK" : probPercent >= 30 ? "⚠️ ELEVATED ATTRITION WARNING" : "✅ STABLE CUSTOMER RELATIONSHIP"}
            </div>
          </div>

          {/* Retention Advice Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm min-h-[200px] flex flex-col justify-between">
            <h4 className="text-sm font-semibold font-display text-slate-800 border-b border-slate-100 pb-2 flex items-center">
              <Sparkles className="w-4 h-4 text-amber-500 mr-2" />
              Tailored Retention Playbook
            </h4>
            <div className="space-y-3 py-3 overflow-y-auto max-h-[180px]">
              {recommendations.map((rec, rIdx) => {
                const parts = rec.split("**");
                const title = parts[1];
                const content = parts[2];
                return (
                  <div key={rIdx} className="text-[10px] leading-relaxed text-slate-600">
                    <span className="font-bold text-blue-600 block mb-0.5">{title}</span>
                    <span>{content}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-100 pt-2 text-center text-[8px] font-mono text-slate-400">
              Retention triggers generated dynamically based on classifier attributes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
