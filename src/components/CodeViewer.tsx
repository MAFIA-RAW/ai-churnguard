import React, { useState } from "react";
import { Terminal, Copy, Check, Download } from "lucide-react";

const STREAMLIT_PYTHON_CODE = `# -*- coding: utf-8 -*-
\"\"\"
B.Tech Final Year Project
Title: Customer Churn Prediction & Analysis using Machine Learning
Department: Computer Science and Engineering
Academic Year: 2025-2026

Student Details:
- Name: [Your Name]
- Roll Number: [Your Roll Number]
- Course: B.Tech (Computer Science & Engineering)

Project Guide: [Project Guide Name]
\"\"\"

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc
)
import io

# Set Page Config
st.set_page_config(
    page_title="Customer Churn Prediction and Analysis",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for UI elements
st.markdown(\"\"\"
<style>
    /* Card Styles */
    .metric-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        text-align: center;
        margin-bottom: 15px;
    }
    .metric-value {
        font-size: 28px;
        font-weight: 700;
        color: #1e3a8a;
    }
    .metric-label {
        font-size: 14px;
        color: #64748b;
        margin-top: 5px;
        font-weight: 500;
    }
    /* Header Banner */
    .project-banner {
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        color: white;
        padding: 30px;
        border-radius: 12px;
        margin-bottom: 25px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        text-align: center;
    }
    .project-banner h1 {
        color: white !important;
        margin: 0;
        font-size: 32px;
        font-weight: 800;
    }
    .project-banner p {
        margin: 10px 0 0 0;
        font-size: 15px;
        opacity: 0.9;
    }
</style>
\"\"\", unsafe_allow_html=True)

# Helper function to generate simulated data matching the IBM dataset if local file isn't found
@st.cache_data
def generate_sample_data():
    np.random.seed(42)
    n_samples = 1200
    
    # Generate columns matching the IBM Telco Churn dataset structure
    gender = np.random.choice(['Female', 'Male'], n_samples)
    senior = np.random.choice([0, 1], n_samples, p=[0.84, 0.16])
    partner = np.random.choice(['Yes', 'No'], n_samples, p=[0.48, 0.52])
    dependents = np.random.choice(['Yes', 'No'], n_samples, p=[0.3, 0.7])
    phone_service = np.random.choice(['Yes', 'No'], n_samples, p=[0.9, 0.1])
    
    multiple_lines = []
    for p in phone_service:
        if p == 'No':
            multiple_lines.append('No phone service')
        else:
            multiple_lines.append(np.random.choice(['No', 'Yes'], p=[0.55, 0.45]))
            
    internet = np.random.choice(['DSL', 'Fiber optic', 'No'], n_samples, p=[0.35, 0.45, 0.20])
    
    security, backup, protection, tech_support, tv, movies = [], [], [], [], [], []
    for i in internet:
        if i == 'No':
            val = 'No internet service'
            security.append(val); backup.append(val); protection.append(val)
            tech_support.append(val); tv.append(val); movies.append(val)
        else:
            security.append(np.random.choice(['No', 'Yes'], p=[0.7, 0.3]))
            backup.append(np.random.choice(['No', 'Yes'], p=[0.6, 0.4]))
            protection.append(np.random.choice(['No', 'Yes'], p=[0.6, 0.4]))
            tech_support.append(np.random.choice(['No', 'Yes'], p=[0.7, 0.3]))
            tv.append(np.random.choice(['No', 'Yes'], p=[0.5, 0.5]))
            movies.append(np.random.choice(['No', 'Yes'], p=[0.5, 0.5]))
            
    contract = np.random.choice(['Month-to-month', 'One year', 'Two year'], n_samples, p=[0.55, 0.21, 0.24])
    paperless = np.random.choice(['Yes', 'No'], n_samples, p=[0.6, 0.4])
    payment = np.random.choice([
        'Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'
    ], n_samples, p=[0.34, 0.23, 0.22, 0.21])
    
    tenure = np.random.randint(1, 73, n_samples)
    
    monthly_charges = []
    for i, p_s, m_l in zip(internet, phone_service, multiple_lines):
        base = 20.0
        if p_s == 'Yes': base += 10.0
        if m_l == 'Yes': base += 15.0
        if i == 'DSL': base += 25.0
        elif i == 'Fiber optic': base += 50.0
        monthly_charges.append(round(base + np.random.uniform(0, 15), 2))
        
    monthly_charges = np.array(monthly_charges)
    total_charges = tenure * monthly_charges + np.random.normal(0, 15, n_samples)
    total_charges = np.clip(total_charges, monthly_charges, None)
    
    total_charges_str = [str(round(tc, 2)) for tc in total_charges]
    for idx in np.random.choice(range(n_samples), size=12, replace=False):
        total_charges_str[idx] = " " # Empty spaces to simulate raw data cleaning
        tenure[idx] = 0
        
    # Standard probability assignment based on features
    churn_prob = []
    for i in range(n_samples):
        p = 0.05
        if contract[i] == 'Month-to-month': p += 0.35
        if internet[i] == 'Fiber optic': p += 0.20
        if payment[i] == 'Electronic check': p += 0.12
        if tech_support[i] == 'No': p += 0.15
        if tenure[i] < 12: p += 0.25
        if senior[i] == 1: p += 0.08
        churn_prob.append(np.clip(p, 0.02, 0.98))
        
    churn_label = [np.random.choice(['Yes', 'No'], p=[p, 1-p]) for p in churn_prob]
    
    churn_reasons = [
        np.random.choice([
            "Competitor offered higher speeds", "Competitor offered more product options",
            "Support person lacked technical skills", "Price too high", "Service dissatisfaction"
        ]) if c == 'Yes' else None for c in churn_label
    ]
    
    df = pd.DataFrame({
        'customerID': [f'{i:04d}-TBCX' for i in range(n_samples)],
        'gender': gender,
        'SeniorCitizen': senior,
        'Partner': partner,
        'Dependents': dependents,
        'tenure': tenure,
        'PhoneService': phone_service,
        'MultipleLines': multiple_lines,
        'InternetService': internet,
        'OnlineSecurity': security,
        'OnlineBackup': backup,
        'DeviceProtection': protection,
        'TechSupport': tech_support,
        'StreamingTV': tv,
        'StreamingMovies': movies,
        'Contract': contract,
        'PaperlessBilling': paperless,
        'PaymentMethod': payment,
        'MonthlyCharges': monthly_charges,
        'TotalCharges': total_charges_str,
        'Churn Label': churn_label,
        'Churn Reason': churn_reasons
    })
    return df

# Load dataset function
@st.cache_data
def load_dataset():
    for name in ["Telco-Customer-Churn.csv", "WA_Fn-UseC_-Telco-Customer-Churn.csv", "churn.csv"]:
        try:
            df = pd.read_csv(name)
            return df, f"Loaded local file: {name}"
        except Exception:
            pass
    return generate_sample_data(), "Simulated Dataset (IBM Telco Structure)"

# Initialize state variables
if 'data' not in st.session_state:
    df_loaded, src = load_dataset()
    st.session_state['data'] = df_loaded
    st.session_state['data_source'] = src

# Sidebar Panel
with st.sidebar:
    st.header("Project Navigation")
    st.write("🎓 **B.Tech CSE Major Project**")
    st.write("Academic Year: 2025-2026")
    st.markdown("---")
    
    menu = st.radio(
        "Select Section:",
        ["Dashboard & Visualizations", "Dataset Explorer", "ML Predictive Modeling", "Interactive Customer Sandbox"]
    )
    
    st.markdown("---")
    st.subheader("Database Settings")
    uploaded_file = st.file_uploader("Upload custom CSV/XLSX file", type=["csv", "xlsx"])
    
    if uploaded_file is not None:
        try:
            if uploaded_file.name.endswith('.csv'):
                st.session_state['data'] = pd.read_csv(uploaded_file)
            else:
                st.session_state['data'] = pd.read_excel(uploaded_file)
            st.session_state['data_source'] = f"Uploaded File: {uploaded_file.name}"
            st.toast("Database updated successfully!", icon="✅")
        except Exception as e:
            st.error(f"Error reading file: {e}")
            
    st.markdown("---")
    st.markdown(\"\"\"
    **Student Information:**
    - **Name:** [Your Name]
    - **Roll No:** [Your Roll Number]
    - **Guide:** [Project Guide Name]
    - **Department:** CSE
    \"\"\")

# Header Banner
st.markdown(\"\"\"
<div class="project-banner">
    <h1>Customer Churn Prediction and Analysis Dashboard</h1>
    <p>A Machine Learning Framework to Identify and Mitigate Subscriber Attrition</p>
</div>
\"\"\", unsafe_allow_html=True)

# Preprocessing logic
df_raw = st.session_state['data'].copy()

def preprocess_churn_data(df):
    df_cleaned = df.copy()
    
    # Clean TotalCharges (handling blank spaces for new accounts with 0 tenure)
    if 'TotalCharges' in df_cleaned.columns:
        df_cleaned['TotalCharges'] = df_cleaned['TotalCharges'].replace(r'^\\\\s*$', np.nan, regex=True)
        df_cleaned['TotalCharges'] = pd.to_numeric(df_cleaned['TotalCharges'], errors='coerce')
        if 'MonthlyCharges' in df_cleaned.columns and 'tenure' in df_cleaned.columns:
            df_cleaned['TotalCharges'] = df_cleaned['TotalCharges'].fillna(df_cleaned['tenure'] * df_cleaned['MonthlyCharges'])
        else:
            df_cleaned['TotalCharges'] = df_cleaned['TotalCharges'].fillna(0)
            
    # Handle numerical columns median imputation
    num_cols = df_cleaned.select_dtypes(include=[np.number]).columns.tolist()
    for col in num_cols:
        df_cleaned[col] = df_cleaned[col].fillna(df_cleaned[col].median())
        
    # Handle categorical columns mode imputation
    cat_cols = df_cleaned.select_dtypes(include=[object]).columns.tolist()
    for col in cat_cols:
        df_cleaned[col] = df_cleaned[col].fillna(df_cleaned[col].mode()[0] if not df_cleaned[col].mode().empty else 'Unknown')
        
    return df_cleaned

df_cleaned = preprocess_churn_data(df_raw)

# Identify target column dynamically
target_options = ['Churn Label', 'Churn', 'churn', 'Churn_Label']
target_col = None
for opt in target_options:
    if opt in df_cleaned.columns:
        target_col = opt
        break
if target_col is None:
    churn_like_cols = [c for c in df_cleaned.columns if 'churn' in c.lower()]
    if churn_like_cols:
        target_col = churn_like_cols[0]
    else:
        target_col = df_cleaned.select_dtypes(include=[object]).columns[-1]

# ----------------- SECTION 1: DASHBOARD & VISUALIZATIONS -----------------
if menu == "Dashboard & Visualizations":
    st.subheader("📈 Exploratory Data Analysis & Statistics")
    st.write(f"Active Data Source: **\\{st.session_state['data_source']}\**")
    
    total_customers = len(df_cleaned)
    
    if target_col in df_cleaned.columns:
        churn_series = df_cleaned[target_col].astype(str).str.strip().str.capitalize()
        churned_num = sum((churn_series == 'Yes') | (churn_series == '1') | (churn_series == 'True'))
        churn_rate = churned_num / total_customers
    else:
        churned_num = 0
        churn_rate = 0.0
        
    avg_tenure = df_cleaned['tenure'].mean() if 'tenure' in df_cleaned.columns else 0.0
    avg_monthly = df_cleaned['MonthlyCharges'].mean() if 'MonthlyCharges' in df_cleaned.columns else 0.0
    
    kpi1, kpi2, kpi3, kpi4 = st.columns(4)
    with kpi1:
        st.markdown(f\"\"\"
        <div class="metric-card">
            <div class="metric-value">{total_customers:,}</div>
            <div class="metric-label">Total Records</div>
        </div>
        \"\"\", unsafe_allow_html=True)
    with kpi2:
        st.markdown(f\"\"\"
        <div class="metric-card">
            <div class="metric-value">{churn_rate*100:.2f}%</div>
            <div class="metric-label">Overall Churn Rate</div>
        </div>
        \"\"\", unsafe_allow_html=True)
    with kpi3:
        st.markdown(f\"\"\"
        <div class="metric-card">
            <div class="metric-value">{avg_tenure:.1f} Months</div>
            <div class="metric-label">Average Tenure</div>
        </div>
        \"\"\", unsafe_allow_html=True)
    with kpi4:
        st.markdown(f\"\"\"
        <div class="metric-card">
            <div class="metric-value">\\\\\${avg_monthly:.2f}</div>
            <div class="metric-label">Average Monthly Charges</div>
        </div>
        \"\"\", unsafe_allow_html=True)
        
    st.markdown("---")
    st.subheader("Exploratory Data Analysis (EDA) - Feature Distributions")
    
    df_cleaned['Churn_Plot'] = df_cleaned[target_col].astype(str).str.strip().str.capitalize()
    
    tab_dem, tab_srv, tab_fin = st.tabs(["Demographics & Personal Details", "Services Used", "Financials & Target Correlations"])
    
    with tab_dem:
        v1, v2 = st.columns(2)
        with v1:
            fig1 = px.pie(df_cleaned, names='Churn_Plot', title="1. Target Distribution (Churn vs Retained)", 
                          hole=0.5, color='Churn_Plot', color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig1.update_layout(margin=dict(t=50, b=10, l=10, r=10), height=350)
            st.plotly_chart(fig1, use_container_width=True)
        with v2:
            fig2 = px.histogram(df_cleaned, x='gender', color='Churn_Plot', barmode='group',
                                title="2. Churn Distribution by Gender",
                                color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig2.update_layout(height=350, margin=dict(t=50, b=10))
            st.plotly_chart(fig2, use_container_width=True)
            
        v3, v4 = st.columns(2)
        with v3:
            fig3 = px.histogram(df_cleaned, x='Contract', color='Churn_Plot', barmode='group',
                                title="3. Churn vs Contract Type",
                                color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig3.update_layout(height=350)
            st.plotly_chart(fig3, use_container_width=True)
        with v4:
            fig4 = px.histogram(df_cleaned, x='SeniorCitizen', color='Churn_Plot', barmode='group',
                                title="4. Churn Distribution for Senior Citizens (1 = Yes)",
                                color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig4.update_layout(height=350, xaxis=dict(tickmode='array', tickvals=[0,1], ticktext=['Non-Senior', 'Senior']))
            st.plotly_chart(fig4, use_container_width=True)
            
        v5, v6 = st.columns(2)
        with v5:
            fig5 = px.histogram(df_cleaned, x='Partner', color='Churn_Plot', barmode='group',
                                title="5. Churn Distribution by Partner Status",
                                color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig5.update_layout(height=350)
            st.plotly_chart(fig5, use_container_width=True)
        with v6:
            fig6 = px.histogram(df_cleaned, x='Dependents', color='Churn_Plot', barmode='group',
                                title="6. Churn Distribution by Dependents Status",
                                color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig6.update_layout(height=350)
            st.plotly_chart(fig6, use_container_width=True)
            
    with tab_srv:
        v7, v8 = st.columns(2)
        with v7:
            fig7 = px.histogram(df_cleaned, x='InternetService', color='Churn_Plot', barmode='group',
                                title="7. Internet Service Type vs Churn",
                                color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig7.update_layout(height=350)
            st.plotly_chart(fig7, use_container_width=True)
        with v8:
            fig8 = px.histogram(df_cleaned, x='TechSupport', color='Churn_Plot', barmode='group',
                                title="8. Tech Support Subscription vs Churn",
                                color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig8.update_layout(height=350)
            st.plotly_chart(fig8, use_container_width=True)
            
        v9, v10 = st.columns(2)
        with v9:
            fig9 = px.histogram(df_cleaned, x='OnlineSecurity', color='Churn_Plot', barmode='group',
                                title="9. Online Security Service vs Churn",
                                color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig9.update_layout(height=350)
            st.plotly_chart(fig9, use_container_width=True)
        with v10:
            fig10 = px.histogram(df_cleaned, x='PhoneService', color='Churn_Plot', barmode='group',
                                 title="10. Phone Service Active vs Churn",
                                 color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig10.update_layout(height=350)
            st.plotly_chart(fig10, use_container_width=True)
            
        v11_c, v12_c = st.columns(2)
        with v11_c:
            fig11 = px.histogram(df_cleaned, x='MultipleLines', color='Churn_Plot', barmode='group',
                                 title="11. Multiple Lines Subscription vs Churn",
                                 color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig11.update_layout(height=350)
            st.plotly_chart(fig11, use_container_width=True)
        with v12_c:
            churn_reason_col = 'Churn Reason' if 'Churn Reason' in df_cleaned.columns else ('Churn_Reason' if 'Churn_Reason' in df_cleaned.columns else None)
            if churn_reason_col and df_cleaned[churn_reason_col].notna().sum() > 0:
                reasons_df = df_cleaned[df_cleaned[churn_reason_col].notna()]
                fig12 = px.bar(reasons_df[churn_reason_col].value_counts().reset_index(), x='count', y='index', orientation='h',
                               title="12. Key Reasons cited for Customer Churn",
                               labels={'index': 'Reason', 'count': 'Frequency'},
                               color_discrete_sequence=['#ef4444'])
                fig12.update_layout(height=350, margin=dict(l=150))
                st.plotly_chart(fig12, use_container_width=True)
            else:
                fig12 = px.histogram(df_cleaned, x='PaymentMethod', color='Churn_Plot', barmode='group',
                                     title="12. Payment Method Preferences vs Churn",
                                     color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
                fig12.update_layout(height=350)
                st.plotly_chart(fig12, use_container_width=True)
                
    with tab_fin:
        v13, v14 = st.columns(2)
        with v13:
            fig13 = px.box(df_cleaned, x='Churn_Plot', y='tenure', points="all",
                           title="13. Tenure (Months) distribution by Churn Status",
                           color='Churn_Plot', color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig13.update_layout(height=350)
            st.plotly_chart(fig13, use_container_width=True)
        with v14:
            fig14 = px.histogram(df_cleaned, x='MonthlyCharges', color='Churn_Plot', marginal="box",
                                 title="14. Monthly Charges distribution by Churn Status",
                                 color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig14.update_layout(height=350)
            st.plotly_chart(fig14, use_container_width=True)
            
        v15, v16 = st.columns(2)
        with v15:
            fig15 = px.scatter(df_cleaned, x='MonthlyCharges', y='TotalCharges', color='Churn_Plot',
                               title="15. Scatter Plot: Monthly Charges vs Total Charges",
                               opacity=0.6, color_discrete_map={'No':'#1e3a8a','Yes':'#ef4444'})
            fig15.update_layout(height=350)
            st.plotly_chart(fig15, use_container_width=True)
        with v16:
            numeric_df = df_cleaned.select_dtypes(include=[np.number]).copy()
            corr_matrix = numeric_df.corr()
            fig16 = go.Figure(data=go.Heatmap(
                z=corr_matrix.values,
                x=corr_matrix.columns,
                y=corr_matrix.columns,
                colorscale='Blues',
                zmin=-1, zmax=1
            ))
            fig16.update_layout(title="16. Correlation Heatmap of Numeric Features", height=350)
            st.plotly_chart(fig16, use_container_width=True)

# ----------------- SECTION 2: DATASET EXPLORER -----------------
elif menu == "Dataset Explorer":
    st.subheader("📁 Dataset Summary & Missing Values Report")
    
    c1, c2, c3 = st.columns(3)
    with c1:
        st.info(f"**Dataset Rows & Columns:** {df_raw.shape[0]} Rows | {df_raw.shape[1]} Columns")
    with c2:
        st.success(f"**Target Churn Field:** {target_col}")
    with c3:
        st.warning(f"**Null Handling:** TotalCharges blanks converted to numeric and imputed.")
        
    st.markdown("### Feature Completeness Analysis")
    
    missing_analysis = pd.DataFrame({
        'Missing Values (Raw)': df_raw.isnull().sum(),
        'Missing Values (Cleaned)': df_cleaned.drop(columns=['Churn_Plot']).isnull().sum(),
        'Data Type': df_raw.dtypes
    })
    
    if 'TotalCharges' in df_raw.columns:
        empty_spaces = (df_raw['TotalCharges'].astype(str).str.strip() == '').sum()
        st.write(f"ℹ️ Info: Found **{empty_spaces} empty space entries** in 'TotalCharges'. These have been handled using tenure * monthly charges.")
        
    st.dataframe(missing_analysis, use_container_width=True)
    
    st.markdown("### Live Dataset Preview")
    search_term = st.text_input("Filter Data (Search customerID, gender, contract, etc.):", "")
    
    if search_term:
        df_preview = df_raw[df_raw.astype(str).apply(lambda x: x.str.contains(search_term, case=False)).any(axis=1)]
    else:
        df_preview = df_raw
        
    st.dataframe(df_preview.head(100), use_container_width=True)
    
    csv_buffer = io.StringIO()
    df_cleaned.drop(columns=['Churn_Plot']).to_csv(csv_buffer, index=False)
    st.download_button(
        label="📥 Download Cleaned Dataset (CSV)",
        data=csv_buffer.getvalue(),
        file_name="cleaned_telco_churn.csv",
        mime="text/csv"
    )

# ----------------- SECTION 3: ML PREDICTIVE MODELING -----------------
elif menu == "ML Predictive Modeling":
    st.subheader("🤖 Model Training and Algorithm Comparison")
    st.write("We compare three classification algorithms: **Logistic Regression**, **Decision Tree**, and **Random Forest**.")
    
    ignore_cols = ['customerid', 'customerID', 'CustomerID', 'Churn Reason', 'Churn_Reason', 'Churn_Plot', target_col]
    features = [col for col in df_cleaned.columns if col not in ignore_cols]
    
    X = df_cleaned[features]
    y = df_cleaned[target_col].astype(str).str.strip().str.capitalize().map({'Yes': 1, 'No': 0})
    
    if len(y.unique()) < 2:
        st.error("Error: Target column doesn't contain both classes (Yes/No).")
    else:
        categorical_features = X.select_dtypes(include=[object]).columns.tolist()
        numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
        
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ]
        )
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
        
        st.markdown("### Model Hyperparameters")
        col_m1, col_m2 = st.columns(2)
        with col_m1:
            rf_estimators = st.slider("Number of Random Forest Trees (n_estimators)", 10, 200, 100, step=10)
        with col_m2:
            dt_depth = st.slider("Decision Tree Max Depth (max_depth)", 3, 20, 6)
            
        models = {
            'Logistic Regression': Pipeline(steps=[('preprocessor', preprocessor),
                                                 ('classifier', LogisticRegression(max_iter=1000, random_state=42))]),
            'Decision Tree': Pipeline(steps=[('preprocessor', preprocessor),
                                             ('classifier', DecisionTreeClassifier(max_depth=dt_depth, random_state=42))]),
            'Random Forest': Pipeline(steps=[('preprocessor', preprocessor),
                                             ('classifier', RandomForestClassifier(n_estimators=rf_estimators, max_depth=12, random_state=42))])
        }
        
        results = {}
        confusion_matrices = {}
        roc_curves = {}
        feature_importances = {}
        
        for name, pipeline in models.items():
            pipeline.fit(X_train, y_train)
            y_pred = pipeline.predict(X_test)
            y_prob = pipeline.predict_proba(X_test)[:, 1]
            
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, zero_division=0)
            rec = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            
            results[name] = {
                'Accuracy': acc,
                'Precision': prec,
                'Recall': rec,
                'F1 Score': f1
            }
            
            confusion_matrices[name] = confusion_matrix(y_test, y_pred)
            fpr, tpr, _ = roc_curve(y_test, y_prob)
            roc_curves[name] = (fpr, tpr, auc(fpr, tpr))
            
            if name == 'Random Forest':
                classifier = pipeline.named_steps['classifier']
                cat_encoder = preprocessor.named_transformers_['cat'].named_steps['onehot']
                if hasattr(cat_encoder, 'get_feature_names_out'):
                    cat_names = cat_encoder.get_feature_names_out(categorical_features).tolist()
                else:
                    cat_names = categorical_features
                transformed_names = numeric_features + cat_names
                importances = classifier.feature_importances_
                if len(transformed_names) == len(importances):
                    fi_df = pd.DataFrame({'Feature': transformed_names, 'Importance': importances})
                    fi_df = fi_df.sort_values(by='Importance', ascending=False).head(15)
                    feature_importances[name] = fi_df
                    
        st.markdown("### Performance Metrics Comparison")
        metrics_df = pd.DataFrame(results).T
        st.dataframe(metrics_df.style.highlight_max(axis=0, color='#dcfce7'), use_container_width=True)
        
        fig_comp = px.bar(
            metrics_df.reset_index().melt(id_vars='index'),
            x='index', y='value', color='variable', barmode='group',
            title="Model Metric Scores Bar Chart",
            labels={'index': 'Model', 'value': 'Score', 'variable': 'Metric'},
            color_discrete_sequence=['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd']
        )
        fig_comp.update_layout(height=400)
        st.plotly_chart(fig_comp, use_container_width=True)
        
        col_v1, col_v2 = st.columns(2)
        with col_v1:
            st.markdown("### Receiver Operating Characteristic (ROC) Curve")
            fig_roc = go.Figure()
            for name, (fpr, tpr, roc_auc) in roc_curves.items():
                fig_roc.add_trace(go.Scatter(x=fpr, y=tpr, mode='lines', name=f'{name} (AUC = {roc_auc:.3f})'))
            fig_roc.add_trace(go.Scatter(x=[0, 1], y=[0, 1], mode='lines', line=dict(dash='dash', color='grey'), showlegend=False))
            fig_roc.update_layout(xaxis_title='False Positive Rate', yaxis_title='True Positive Rate', height=400, margin=dict(t=30, b=30))
            st.plotly_chart(fig_roc, use_container_width=True)
            
        with col_v2:
            st.markdown("### Feature Importance Ranking")
            if 'Random Forest' in feature_importances:
                fi_df = feature_importances['Random Forest']
                fig_fi = px.bar(fi_df, x='Importance', y='Feature', orientation='h', color='Importance',
                               title="Top 15 Predictive Features (Random Forest)", color_continuous_scale='Blues')
                fig_fi.update_layout(height=400, yaxis=dict(autorange="reversed"))
                st.plotly_chart(fig_fi, use_container_width=True)
            else:
                st.write("Feature importance values not found.")
                
        st.markdown("### Confusion Matrices")
        cm_cols = st.columns(3)
        for idx, (name, cm) in enumerate(confusion_matrices.items()):
            with cm_cols[idx]:
                fig_cm = px.imshow(cm, text_auto=True, color_continuous_scale='Blues',
                                   x=['Predicted Safe', 'Predicted Churn'],
                                   y=['Actual Safe', 'Actual Churn'],
                                   title=f'{name} Confusion Matrix')
                fig_cm.update_layout(height=300, coloraxis_showscale=False)
                st.plotly_chart(fig_cm, use_container_width=True)
                
        st.markdown("---")
        st.subheader("📥 Bulk Predict & Export Prediction Results")
        st.write("Upload a portfolio of customers as a CSV file to evaluate churn risk for multiple subscribers simultaneously.")
        
        rf_pipeline = models['Random Forest']
        batch_file = st.file_uploader("Upload CSV/XLSX for batch prediction", type=["csv", "xlsx"], key="batch_inf")
        if batch_file is not None:
            try:
                if batch_file.name.endswith('.csv'):
                    batch_df = pd.read_csv(batch_file)
                else:
                    batch_df = pd.read_excel(batch_file)
                
                batch_cleaned = preprocess_churn_data(batch_df)
                batch_X = batch_cleaned[features]
                
                batch_df['Predicted Churn'] = rf_pipeline.predict(batch_X)
                batch_df['Predicted Churn'] = batch_df['Predicted Churn'].map({1: 'Churn (High Risk)', 0: 'Retained (Safe)'})
                batch_df['Churn Probability (%)'] = np.round(rf_pipeline.predict_proba(batch_X)[:, 1] * 100, 2)
                
                st.write("### Predictions Preview")
                st.dataframe(batch_df[['customerID', 'Contract', 'tenure', 'MonthlyCharges', 'Predicted Churn', 'Churn Probability (%)']].head(15), use_container_width=True)
                
                inf_buffer = io.StringIO()
                batch_df.to_csv(inf_buffer, index=False)
                st.download_button(
                    label="📥 Download Churn Predictions Portfolio (CSV)",
                    data=inf_buffer.getvalue(),
                    file_name="churn_predictions_portfolio.csv",
                    mime="text/csv"
                )
            except Exception as e:
                st.error(f"Error making predictions: {e}")

# ----------------- SECTION 4: CUSTOMER SANDBOX -----------------
elif menu == "Interactive Customer Sandbox":
    st.subheader("🔮 Individual Customer Risk Predictor")
    st.write("Construct a customer profile interactively to predict their risk of churning in real-time.")
    
    ignore_cols = ['customerid', 'customerID', 'CustomerID', 'Churn Reason', 'Churn_Reason', 'Churn_Plot', target_col]
    features = [col for col in df_cleaned.columns if col not in ignore_cols]
    
    X = df_cleaned[features]
    y = df_cleaned[target_col].astype(str).str.strip().str.capitalize().map({'Yes': 1, 'No': 0})
    
    categorical_features = X.select_dtypes(include=[object]).columns.tolist()
    numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
    
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ]
    )
    
    rf_pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                                 ('classifier', RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42))])
    rf_pipeline.fit(X, y)
    
    st.markdown("### Profile Settings")
    cs1, cs2, cs3 = st.columns(3)
    
    with cs1:
        gender_val = st.selectbox("Gender", ["Male", "Female"])
        senior_val = st.selectbox("Senior Citizen (0 = No, 1 = Yes)", ["0 (No)", "1 (Yes)"])
        senior_val = int(senior_val.split()[0])
        partner_val = st.selectbox("Partner Status", ["Yes", "No"])
        dependents_val = st.selectbox("Dependents Status", ["No", "Yes"])
        tenure_val = st.slider("Tenure in Months (How long they have been a customer)", 1, 72, 12)
        
    with cs2:
        phone_service_val = st.selectbox("Phone Service", ["Yes", "No"])
        multiple_lines_val = st.selectbox("Multiple Lines Service", ["No", "Yes", "No phone service"])
        internet_service_val = st.selectbox("Internet Service Provider", ["Fiber optic", "DSL", "No"])
        
        if internet_service_val != "No":
            security_val = st.selectbox("Online Security Feature", ["No", "Yes"])
            backup_val = st.selectbox("Online Backup Feature", ["No", "Yes"])
            protection_val = st.selectbox("Device Protection Feature", ["No", "Yes"])
            tech_support_val = st.selectbox("Tech Support Feature", ["No", "Yes"])
            streaming_tv_val = st.selectbox("Streaming TV", ["No", "Yes"])
            streaming_movies_val = st.selectbox("Streaming Movies", ["No", "Yes"])
        else:
            security_val = "No internet service"
            backup_val = "No internet service"
            protection_val = "No internet service"
            tech_support_val = "No internet service"
            streaming_tv_val = "No internet service"
            streaming_movies_val = "No internet service"
            
    with cs3:
        contract_val = st.selectbox("Contract Term", ["Month-to-month", "One year", "Two year"])
        paperless_val = st.selectbox("Paperless Billing", ["Yes", "No"])
        payment_val = st.selectbox("Payment Method", [
            "Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"
        ])
        monthly_charges_val = st.number_input("Monthly Charges Amount ($)", value=65.0, min_value=18.0, max_value=125.0, step=1.0)
        total_charges_val = st.number_input("Total Charges Amount ($)", value=float(tenure_val * monthly_charges_val), min_value=0.0)
        
    sample_dict = {
        'gender': gender_val,
        'SeniorCitizen': senior_val,
        'Partner': partner_val,
        'Dependents': dependents_val,
        'tenure': tenure_val,
        'PhoneService': phone_service_val,
        'MultipleLines': multiple_lines_val,
        'InternetService': internet_service_val,
        'OnlineSecurity': security_val,
        'OnlineBackup': backup_val,
        'DeviceProtection': protection_val,
        'TechSupport': tech_support_val,
        'StreamingTV': streaming_tv_val,
        'StreamingMovies': streaming_movies_val,
        'Contract': contract_val,
        'PaperlessBilling': paperless_val,
        'PaymentMethod': payment_val,
        'MonthlyCharges': monthly_charges_val,
        'TotalCharges': total_charges_val
    }
    
    sample_df = pd.DataFrame([sample_dict])
    prob = rf_pipeline.predict_proba(sample_df)[0][1]
    
    st.markdown("---")
    res_col1, res_col2 = st.columns([1, 2])
    
    with res_col1:
        st.markdown("### Churn Probability Dial")
        fig_g = go.Figure(go.Indicator(
            mode = "gauge+number",
            value = prob * 100,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "Predicted Probability"},
            gauge = {
                'axis': {'range': [None, 100]},
                'bar': {'color': "#ef4444" if prob > 0.5 else "#3b82f6"},
                'steps' : [
                    {'range': [0, 30], 'color': "#dcfce7"},
                    {'range': [30, 70], 'color': "#fef9c3"},
                    {'range': [70, 100], 'color': "#fee2e2"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 70
                }
            }
        ))
        fig_g.update_layout(height=280, margin=dict(t=30, b=10, l=10, r=10))
        st.plotly_chart(fig_g, use_container_width=True)
        
    with res_col2:
        st.markdown("### Retention Advice and Recommendations")
        if prob >= 0.7:
            st.error("🚨 **High Risk Level**: Subscriber displays strong signs of churn behavior.")
            rec_list = [
                "**Offer Contract Upgrade**: Encourage upgrading to a **1-Year or 2-Year Contract** with a loyalty discount of 15% to lock in the customer.",
                "**Review Customer Support Logs**: The customer might be experiencing technical issues. Consider a targeted technical support intervention.",
                "**Encourage Automated Payments**: If the customer uses electronic checks, suggest automated bank transfer or credit card payments."
            ]
        elif prob >= 0.3:
            st.warning("⚠️ **Medium Risk Level**: Subscriber shows moderate attrition likelihood.")
            rec_list = [
                "**Suggest Security & Backup Add-ons**: Proactively offer bundled digital services (Online Security and Backup) at a discount.",
                "**Customer Feedback Loop**: Reach out with a short survey or discount coupon to gauge satisfaction."
            ]
        else:
            st.success("✅ **Low Risk Level**: Subscriber is highly stable and likely to stay.")
            rec_list = [
                "**Enroll in Ambassador Program**: Offer loyalty bonuses or incentives for referring friends and family.",
                "**Early Access**: Introduce beta products or early upgrades for premium entertainment services."
            ]
            
        for r in rec_list:
            st.markdown(f"- {r}")

# Footer Metadata
st.markdown("---")
st.markdown(\"\"\"
<div style="text-align: center; color: #64748b; font-size: 12px; padding: 20px;">
    <strong>B.Tech CSE Capstone Project</strong> &bull; Customer Churn Analytics System &bull; Designed for Academic Submission
</div>
\"\"\")
`;

export default function CodeViewer() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(STREAMLIT_PYTHON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([STREAMLIT_PYTHON_CODE], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "app.py";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="streamlit-code-viewer" className="space-y-6">
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-bold font-display text-slate-800 flex items-center">
            <Terminal className="w-4 h-4 text-blue-600 mr-2" />
            B.Tech Final-Year Submission Code: app.py
          </h3>
          <p className="text-xs text-slate-500">
            Copy or download this fully-functional single-file Python Streamlit dashboard codebase for submission.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-display font-bold text-xs tracking-wide rounded flex items-center space-x-1.5 border border-slate-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Script</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs tracking-wide rounded shadow flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download app.py</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <pre className="bg-slate-950 font-mono text-[10px] leading-relaxed p-6 rounded-xl border border-slate-800 text-blue-300 overflow-x-auto max-h-[480px] shadow-inner select-all">
          <code>{STREAMLIT_PYTHON_CODE}</code>
        </pre>
        <div className="absolute top-3 right-3 text-[8px] font-mono uppercase bg-slate-900 border border-slate-800 py-0.5 px-1.5 rounded text-slate-500">
          python3 / streamlit
        </div>
      </div>
    </div>
  );
}
