import { CustomerData } from "./ml";

export function generateSyntheticDataset(count = 1200): CustomerData[] {
  const genderOptions = ["Female", "Male"];
  const partnerOptions = ["Yes", "No"];
  const dependentsOptions = ["Yes", "No"];
  const phoneServiceOptions = ["Yes", "No"];
  const internetServiceOptions = ["DSL", "Fiber optic", "No"];
  const contractOptions = ["Month-to-month", "One year", "Two year"];
  const paperlessBillingOptions = ["Yes", "No"];
  const paymentMethodOptions = [
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)"
  ];
  
  const exitReasons = [
    "Competitor offered higher speeds",
    "Competitor offered more product options",
    "Support person lacked technical skills",
    "Price too high",
    "Service dissatisfaction"
  ];

  // Pseudo-random number generator with seed
  let seed = 42;
  function random(): number {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function choice<T>(arr: T[], weights?: number[]): T {
    if (!weights) {
      return arr[Math.floor(random() * arr.length)];
    }
    const r = random();
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += weights[i];
      if (r <= sum) return arr[i];
    }
    return arr[arr.length - 1];
  }

  function randint(min: number, max: number): number {
    return Math.floor(random() * (max - min)) + min;
  }

  const data: CustomerData[] = [];

  for (let i = 0; i < count; i++) {
    const gender = choice(genderOptions);
    const SeniorCitizen = choice([0, 1], [0.84, 0.16]);
    const Partner = choice(partnerOptions, [0.48, 0.52]);
    const Dependents = choice(dependentsOptions, [0.3, 0.7]);
    const tenure = randint(0, 73); // Includes 0 tenure (new accounts)
    const PhoneService = choice(phoneServiceOptions, [0.9, 0.1]);
    
    let MultipleLines = "No phone service";
    if (PhoneService === "Yes") {
      MultipleLines = choice(["No", "Yes"], [0.55, 0.45]);
    }
    
    const InternetService = choice(internetServiceOptions, [0.35, 0.45, 0.20]);
    
    let OnlineSecurity = "No internet service";
    let OnlineBackup = "No internet service";
    let DeviceProtection = "No internet service";
    let TechSupport = "No internet service";
    let StreamingTV = "No internet service";
    let StreamingMovies = "No internet service";
    
    if (InternetService !== "No") {
      OnlineSecurity = choice(["No", "Yes"], [0.7, 0.3]);
      OnlineBackup = choice(["No", "Yes"], [0.6, 0.4]);
      DeviceProtection = choice(["No", "Yes"], [0.6, 0.4]);
      TechSupport = choice(["No", "Yes"], [0.7, 0.3]);
      StreamingTV = choice(["No", "Yes"], [0.5, 0.5]);
      StreamingMovies = choice(["No", "Yes"], [0.5, 0.5]);
    }
    
    const Contract = choice(contractOptions, [0.55, 0.21, 0.24]);
    const PaperlessBilling = choice(paperlessBillingOptions, [0.6, 0.4]);
    const PaymentMethod = choice(paymentMethodOptions, [0.34, 0.23, 0.22, 0.21]);
    
    // Calculate Monthly Charges
    let monthlyBase = 20.0;
    if (PhoneService === "Yes") monthlyBase += 10.0;
    if (MultipleLines === "Yes") monthlyBase += 15.0;
    if (InternetService === "DSL") monthlyBase += 25.0;
    else if (InternetService === "Fiber optic") monthlyBase += 50.0;
    if (OnlineSecurity === "Yes") monthlyBase += 5.0;
    if (OnlineBackup === "Yes") monthlyBase += 5.0;
    if (DeviceProtection === "Yes") monthlyBase += 5.0;
    if (TechSupport === "Yes") monthlyBase += 5.0;
    if (StreamingTV === "Yes") monthlyBase += 10.0;
    if (StreamingMovies === "Yes") monthlyBase += 10.0;
    
    const MonthlyCharges = Math.round((monthlyBase + random() * 15) * 100) / 100;
    
    // Total Charges
    let TotalCharges = tenure * MonthlyCharges;
    if (tenure > 0) {
      TotalCharges += (random() - 0.5) * 30; // some noise
      TotalCharges = Math.max(TotalCharges, MonthlyCharges);
    } else {
      TotalCharges = 0; // matching tenure = 0 logic
    }
    TotalCharges = Math.round(TotalCharges * 100) / 100;
    
    // Simulate Churn Probability
    let p = 0.05;
    if (Contract === "Month-to-month") p += 0.35;
    if (InternetService === "Fiber optic") p += 0.20;
    if (PaymentMethod === "Electronic check") p += 0.12;
    if (TechSupport === "No") p += 0.15;
    if (OnlineSecurity === "No") p += 0.10;
    if (tenure < 12) p += 0.25;
    if (SeniorCitizen === 1) p += 0.08;
    p = Math.min(Math.max(p, 0.02), 0.98);
    
    const isChurn = random() <= p;
    const ChurnLabel = isChurn ? "Yes" : "No";
    const ChurnReason = isChurn ? choice(exitReasons) : undefined;
    
    data.push({
      customerID: `${String(i).padStart(4, "0")}-TBCX`,
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
      "Churn Label": ChurnLabel,
      "Churn Reason": ChurnReason
    });
  }

  // To simulate actual dataset discrepancies, let's set TotalCharges to NaN (represented by 0 or empty in raw) for 10 entries with 0 tenure
  let nanCount = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].tenure === 0 && nanCount < 8) {
      // simulate spaces or NaN
      data[i].TotalCharges = 0;
      nanCount++;
    }
  }

  return data;
}
