# ChurnSense AI

An AI-powered web application that predicts customer churn using machine learning and provides insights to help businesses improve customer retention.

## Overview

Customer churn is one of the biggest challenges faced by subscription-based and service-oriented businesses. This project analyzes customer information, predicts whether a customer is likely to leave the company, and helps identify the major factors influencing churn.

The application provides an interactive dashboard where users can upload a customer dataset, explore visualizations, train machine learning models, and make predictions for new customers.

## Features

* Interactive dashboard
* Customer churn prediction
* Data preprocessing and cleaning
* Exploratory Data Analysis (EDA)
* Interactive charts and visualizations
* Multiple machine learning models for comparison
* Model evaluation using Accuracy, Precision, Recall and F1-Score
* Customer risk prediction
* Business insights for customer retention

## Technologies Used

* React
* TypeScript
* Node.js
* Google Gemini API
* Machine Learning
* Chart.js / Recharts (if applicable)
* HTML
* CSS

## Installation

### Prerequisites

* Node.js (v18 or above)
* npm
* Gemini API Key

### Steps

1. Clone the repository

```bash
git clone <repository-url>
```

2. Navigate to the project directory

```bash
cd <project-folder>
```

3. Install dependencies

```bash
npm install
```

4. Create a `.env.local` file in the project root and add your Gemini API key:

```env
GEMINI_API_KEY=YOUR_API_KEY
```

5. Start the development server

```bash
npm run dev
```

The application will open in your browser at the local development URL.

## Project Structure

```
├── src/
├── components/
├── pages/
├── assets/
├── public/
├── .env.local
├── package.json
└── README.md
```

## Future Enhancements

* Improve prediction accuracy using additional machine learning models.
* Add authentication for users.
* Generate downloadable reports.
* Deploy the application on a cloud platform.
* Support multiple datasets.

## Author

Developed as a Final Year B.Tech (CSE-AI) project to demonstrate the application of Artificial Intelligence and Machine Learning in customer retention analysis.
