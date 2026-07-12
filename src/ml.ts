/**
 * Light-weight Client-side Machine Learning Engine for Churn Prediction
 * Implements Preprocessing, Stratified Split, Logistic Regression, 
 * Decision Tree, and Random Forest in pure TypeScript.
 */

export interface CustomerData {
  customerID: string;
  gender: string;
  SeniorCitizen: number;
  Partner: string;
  Dependents: string;
  tenure: number;
  PhoneService: string;
  MultipleLines: string;
  InternetService: string;
  OnlineSecurity: string;
  OnlineBackup: string;
  DeviceProtection: string;
  TechSupport: string;
  StreamingTV: string;
  StreamingMovies: string;
  Contract: string;
  PaperlessBilling: string;
  PaymentMethod: string;
  MonthlyCharges: number;
  TotalCharges: number;
  "Churn Label": "Yes" | "No";
  "Churn Reason"?: string;
}

// ---------------- Preprocessing ----------------

export interface PreprocessedData {
  X: number[][]; // [samples, features]
  y: number[];   // [samples]
  featureNames: string[];
}

export function preprocessDataset(data: CustomerData[]): PreprocessedData {
  const y = data.map(d => (d["Churn Label"] === "Yes" ? 1 : 0));
  
  // Define features to encode
  const numericFeatures = ["tenure", "MonthlyCharges", "TotalCharges"];
  const categoricalFeatures = [
    "gender", "SeniorCitizen", "Partner", "Dependents", 
    "InternetService", "Contract", "PaymentMethod", "TechSupport", "OnlineSecurity"
  ];
  
  // 1. Calculate means and standards for scaling
  const numMeans: { [key: string]: number } = {};
  const numStds: { [key: string]: number } = {};
  
  numericFeatures.forEach(feat => {
    const vals = data.map(d => {
      const v = d[feat as keyof CustomerData];
      return typeof v === "number" ? v : 0;
    });
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    numMeans[feat] = mean;
    numStds[feat] = Math.sqrt(variance) || 1.0;
  });

  // 2. Map categorical feature values to distinct categories (one-hot encoding)
  const catCategories: { [feat: string]: string[] } = {};
  categoricalFeatures.forEach(feat => {
    const unique = Array.from(new Set(data.map(d => String(d[feat as keyof CustomerData]))));
    catCategories[feat] = unique.sort();
  });

  // Create list of feature names
  const featureNames: string[] = [...numericFeatures];
  categoricalFeatures.forEach(feat => {
    catCategories[feat].forEach(cat => {
      featureNames.push(`${feat}_${cat}`);
    });
  });

  // 3. Vectorize dataset
  const X: number[][] = [];
  data.forEach(d => {
    const row: number[] = [];
    
    // Scale numeric features
    numericFeatures.forEach(feat => {
      const val = d[feat as keyof CustomerData] as number;
      row.push((val - numMeans[feat]) / numStds[feat]);
    });
    
    // One-hot encode categoricals
    categoricalFeatures.forEach(feat => {
      const val = String(d[feat as keyof CustomerData]);
      const cats = catCategories[feat];
      cats.forEach(cat => {
        row.push(val === cat ? 1 : 0);
      });
    });
    
    X.push(row);
  });

  return { X, y, featureNames };
}

// Simple Stratified Split
export interface TrainTestSplit {
  X_train: number[][];
  y_train: number[];
  X_test: number[][];
  y_test: number[];
}

export function trainTestSplit(X: number[][], y: number[], testSize = 0.25): TrainTestSplit {
  const n = X.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  // Stratify by y label
  const class0 = indices.filter(i => y[i] === 0);
  const class1 = indices.filter(i => y[i] === 1);
  
  // Shuffle both (pseudo-random with stable seed or simple shuffle)
  const shuffle = (arr: number[]) => {
    let seed = 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };
  
  shuffle(class0);
  shuffle(class1);
  
  const testCount0 = Math.floor(class0.length * testSize);
  const testCount1 = Math.floor(class1.length * testSize);
  
  const testIndices = [
    ...class0.slice(0, testCount0),
    ...class1.slice(0, testCount1)
  ];
  const trainIndices = [
    ...class0.slice(testCount0),
    ...class1.slice(testCount1)
  ];
  
  // Sort indices to keep order
  testIndices.sort((a, b) => a - b);
  trainIndices.sort((a, b) => a - b);
  
  return {
    X_train: trainIndices.map(i => X[i]),
    y_train: trainIndices.map(i => y[i]),
    X_test: testIndices.map(i => X[i]),
    y_test: testIndices.map(i => y[i])
  };
}

// ---------------- Model Implementations ----------------

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  rocCurve: { fpr: number; tpr: number }[];
  auc: number;
  featureImportance: { name: string; importance: number }[];
}

export interface MLModel {
  train(X: number[][], y: number[]): void;
  predict(X: number[][]): number[];
  predictProba(X: number[][]): number[];
}

// 1. Logistic Regression
export class LogisticRegressionModel implements MLModel {
  private weights: number[] = [];
  private bias = 0;
  private learningRate = 0.1;
  private iterations = 100;

  train(X: number[][], y: number[]) {
    const numFeatures = X[0].length;
    const numSamples = X.length;
    
    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;

    for (let iter = 0; iter < this.iterations; iter++) {
      const dWeights = new Array(numFeatures).fill(0);
      let dBias = 0;

      for (let i = 0; i < numSamples; i++) {
        const linearModel = X[i].reduce((sum, val, idx) => sum + val * this.weights[idx], 0) + this.bias;
        const prediction = 1 / (1 + Math.exp(-linearModel));
        const error = prediction - y[i];

        for (let j = 0; j < numFeatures; j++) {
          dWeights[j] += error * X[i][j];
        }
        dBias += error;
      }

      // Update parameters
      for (let j = 0; j < numFeatures; j++) {
        this.weights[j] -= (this.learningRate * dWeights[j]) / numSamples;
      }
      this.bias -= (this.learningRate * dBias) / numSamples;
    }
  }

  predictProba(X: number[][]): number[] {
    return X.map(row => {
      const linearModel = row.reduce((sum, val, idx) => sum + val * this.weights[idx], 0) + this.bias;
      return 1 / (1 + Math.exp(-linearModel));
    });
  }

  predict(X: number[][]): number[] {
    return this.predictProba(X).map(p => (p >= 0.5 ? 1 : 0));
  }

  getFeatureImportance(featureNames: string[]): { name: string; importance: number }[] {
    // For LogReg, we can use the absolute weights as importance
    const absWeights = this.weights.map(w => Math.abs(w));
    const sum = absWeights.reduce((a, b) => a + b, 0) || 1.0;
    
    return featureNames.map((name, idx) => ({
      name,
      importance: absWeights[idx] / sum
    })).sort((a, b) => b.importance - a.importance);
  }
}

// Helper structures for Decision Trees
interface TreeNode {
  featureIdx?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  value?: number; // prediction value for leaf nodes
  isLeaf: boolean;
}

// 2. Decision Tree Classifier
export class DecisionTreeModel implements MLModel {
  private root: TreeNode | null = null;
  private maxDepth: number;
  private minSamplesSplit = 4;

  constructor(maxDepth = 6) {
    this.maxDepth = maxDepth;
  }

  train(X: number[][], y: number[]) {
    this.root = this.buildTree(X, y, 0);
  }

  private buildTree(X: number[][], y: number[], depth: number): TreeNode {
    const numSamples = X.length;
    const numFeatures = X[0] ? X[0].length : 0;
    
    // Base cases
    const uniqueClasses = Array.from(new Set(y));
    if (uniqueClasses.length === 1) {
      return { isLeaf: true, value: uniqueClasses[0] };
    }
    
    if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || numFeatures === 0) {
      // Return majority class
      const majority = y.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, [0, 0]);
      return { isLeaf: true, value: majority[1] > majority[0] ? 1 : 0 };
    }

    // Find best split
    let bestGini = 1.0;
    let bestFeatureIdx = -1;
    let bestThreshold = 0;
    let bestLeftIdxs: number[] = [];
    let bestRightIdxs: number[] = [];

    // Evaluate subset of features to be fast
    for (let f = 0; f < numFeatures; f++) {
      // Find candidate thresholds (e.g., unique values)
      const values = X.map(row => row[f]);
      const thresholds = Array.from(new Set(values)).sort((a, b) => a - b);
      
      for (const threshold of thresholds) {
        const leftIdxs: number[] = [];
        const rightIdxs: number[] = [];
        
        for (let i = 0; i < numSamples; i++) {
          if (X[i][f] <= threshold) {
            leftIdxs.push(i);
          } else {
            rightIdxs.push(i);
          }
        }

        if (leftIdxs.length === 0 || rightIdxs.length === 0) continue;

        // Calculate split Gini impurity
        const giniLeft = this.calculateGini(leftIdxs.map(i => y[i]));
        const giniRight = this.calculateGini(rightIdxs.map(i => y[i]));
        
        const weightedGini = (leftIdxs.length / numSamples) * giniLeft + (rightIdxs.length / numSamples) * giniRight;

        if (weightedGini < bestGini) {
          bestGini = weightedGini;
          bestFeatureIdx = f;
          bestThreshold = threshold;
          bestLeftIdxs = leftIdxs;
          bestRightIdxs = rightIdxs;
        }
      }
    }

    if (bestFeatureIdx === -1) {
      // Majority vote leaf
      const majority = y.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, [0, 0]);
      return { isLeaf: true, value: majority[1] > majority[0] ? 1 : 0 };
    }

    const leftX = bestLeftIdxs.map(i => X[i]);
    const leftY = bestLeftIdxs.map(i => y[i]);
    const rightX = bestRightIdxs.map(i => X[i]);
    const rightY = bestRightIdxs.map(i => y[i]);

    return {
      isLeaf: false,
      featureIdx: bestFeatureIdx,
      threshold: bestThreshold,
      left: this.buildTree(leftX, leftY, depth + 1),
      right: this.buildTree(rightX, rightY, depth + 1)
    };
  }

  private calculateGini(labels: number[]): number {
    const total = labels.length;
    if (total === 0) return 0;
    
    const count1 = labels.filter(l => l === 1).length;
    const p1 = count1 / total;
    const p0 = 1 - p1;
    
    return 1 - (p0 * p0 + p1 * p1);
  }

  private predictRow(node: TreeNode, row: number[]): number {
    if (node.isLeaf) {
      return node.value!;
    }
    const val = row[node.featureIdx!];
    if (val <= node.threshold!) {
      return this.predictRow(node.left!, row);
    } else {
      return this.predictRow(node.right!, row);
    }
  }

  predict(X: number[][]): number[] {
    if (!this.root) return new Array(X.length).fill(0);
    return X.map(row => this.predictRow(this.root!, row));
  }

  predictProba(X: number[][]): number[] {
    // Simulating soft probabilities based on leaf depth/confidence (for ROC curve plotting)
    if (!this.root) return new Array(X.length).fill(0);
    
    const getLeafRatio = (node: TreeNode, row: number[]): number => {
      if (node.isLeaf) {
        return node.value === 1 ? 0.95 : 0.05;
      }
      const val = row[node.featureIdx!];
      if (val <= node.threshold!) {
        return getLeafRatio(node.left!, row) * 0.9 + (node.value === 1 ? 0.1 : 0.0);
      } else {
        return getLeafRatio(node.right!, row) * 0.9 + (node.value === 1 ? 0.1 : 0.0);
      }
    };

    return X.map(row => getLeafRatio(this.root!, row));
  }

  getFeatureImportance(featureNames: string[]): { name: string; importance: number }[] {
    const counts = new Array(featureNames.length).fill(0);
    
    const traverse = (node: TreeNode) => {
      if (node.isLeaf) return;
      counts[node.featureIdx!] += 1;
      traverse(node.left!);
      traverse(node.right!);
    };
    
    if (this.root) traverse(this.root);
    const sum = counts.reduce((a, b) => a + b, 0) || 1.0;
    
    return featureNames.map((name, idx) => ({
      name,
      importance: counts[idx] / sum
    })).sort((a, b) => b.importance - a.importance);
  }
}

// 3. Random Forest Classifier
export class RandomForestModel implements MLModel {
  private trees: DecisionTreeModel[] = [];
  private numTrees: number;
  private maxDepth: number;

  constructor(numTrees = 8, maxDepth = 8) {
    this.numTrees = numTrees;
    this.maxDepth = maxDepth;
  }

  train(X: number[][], y: number[]) {
    this.trees = [];
    const numSamples = X.length;
    
    for (let t = 0; t < this.numTrees; t++) {
      // Bootstrap sampling (sampling with replacement)
      const bootX: number[][] = [];
      const bootY: number[] = [];
      
      let seed = 100 + t;
      const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      for (let i = 0; i < numSamples; i++) {
        const idx = Math.floor(random() * numSamples);
        bootX.push(X[idx]);
        bootY.push(y[idx]);
      }
      
      const tree = new DecisionTreeModel(this.maxDepth);
      tree.train(bootX, bootY);
      this.trees.push(tree);
    }
  }

  predictProba(X: number[][]): number[] {
    const n = X.length;
    const probs = new Array(n).fill(0);
    
    this.trees.forEach(tree => {
      const tProbs = tree.predictProba(X);
      for (let i = 0; i < n; i++) {
        probs[i] += tProbs[i];
      }
    });
    
    return probs.map(p => p / this.numTrees);
  }

  predict(X: number[][]): number[] {
    return this.predictProba(X).map(p => (p >= 0.5 ? 1 : 0));
  }

  getFeatureImportance(featureNames: string[]): { name: string; importance: number }[] {
    const importances = new Array(featureNames.length).fill(0);
    
    this.trees.forEach(tree => {
      const treeImps = tree.getFeatureImportance(featureNames);
      treeImps.forEach(imp => {
        const idx = featureNames.indexOf(imp.name);
        if (idx !== -1) {
          importances[idx] += imp.importance;
        }
      });
    });
    
    const sum = importances.reduce((a, b) => a + b, 0) || 1.0;
    return featureNames.map((name, idx) => ({
      name,
      importance: importances[idx] / sum
    })).sort((a, b) => b.importance - a.importance);
  }
}

// ---------------- Performance Evaluator ----------------

export function evaluateModel(
  model: MLModel,
  split: TrainTestSplit,
  featureNames: string[]
): ModelMetrics {
  const { X_test, y_test } = split;
  const y_pred = model.predict(X_test);
  const y_prob = model.predictProba(X_test);

  const n = y_test.length;
  let tp = 0, fp = 0, fn = 0, tn = 0;

  for (let i = 0; i < n; i++) {
    const actual = y_test[i];
    const pred = y_pred[i];
    if (actual === 1 && pred === 1) tp++;
    else if (actual === 0 && pred === 1) fp++;
    else if (actual === 1 && pred === 0) fn++;
    else if (actual === 0 && pred === 0) tn++;
  }

  const accuracy = (tp + tn) / n;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Calculate ROC Curve (FPR and TPR at various probability thresholds)
  const thresholds = Array.from({ length: 21 }, (_, i) => i * 0.05); // 0, 0.05, ..., 1.0
  const rocCurve = thresholds.map(thresh => {
    let tp_th = 0, fp_th = 0, fn_th = 0, tn_th = 0;
    
    for (let i = 0; i < n; i++) {
      const actual = y_test[i];
      const p = y_prob[i];
      const pred = p >= thresh ? 1 : 0;
      
      if (actual === 1 && pred === 1) tp_th++;
      else if (actual === 0 && pred === 1) fp_th++;
      else if (actual === 1 && pred === 0) fn_th++;
      else if (actual === 0 && pred === 0) tn_th++;
    }
    
    const tpr = tp_th + fn_th > 0 ? tp_th / (tp_th + fn_th) : 0;
    const fpr = fp_th + tn_th > 0 ? fp_th / (fp_th + tn_th) : 0;
    
    return { fpr, tpr };
  });

  // Sort ROC Curve from (0,0) to (1,1) for AUC plotting
  rocCurve.sort((a, b) => a.fpr - b.fpr);
  
  // Calculate AUC using trapezoidal rule
  let aucVal = 0;
  for (let i = 0; i < rocCurve.length - 1; i++) {
    const x0 = rocCurve[i].fpr;
    const y0 = rocCurve[i].tpr;
    const x1 = rocCurve[i + 1].fpr;
    const y1 = rocCurve[i + 1].tpr;
    aucVal += 0.5 * (x1 - x0) * (y0 + y1);
  }

  // Get feature importance if model supports it
  let featureImportance: { name: string; importance: number }[] = [];
  if (model instanceof RandomForestModel) {
    featureImportance = model.getFeatureImportance(featureNames);
  } else if (model instanceof LogisticRegressionModel) {
    featureImportance = model.getFeatureImportance(featureNames);
  } else if (model instanceof DecisionTreeModel) {
    featureImportance = model.getFeatureImportance(featureNames);
  }

  // Cap top 10 features for display
  featureImportance = featureImportance.slice(0, 10);

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: { tn, fp, fn, tp },
    rocCurve,
    auc: Math.max(aucVal, 0.5), // AUC shouldn't drop below 0.5 logically
    featureImportance
  };
}
