# Sci-Clean Studio: Technical Research Specifications

This document outlines the architectural and algorithmic details of Sci-Clean Studio for use in academic and technical publications.

## 1. System Architecture
Sci-Clean Studio utilizes a **"Local-First, AI-Augmented"** architecture. 
- **Frontend**: Next.js 15 (App Router) with React 19.
- **Data Processing**: Multi-threaded client-side processing using Web Workers to handle large-scale CSV files (up to 500MB) without blocking the UI thread.
- **AI Engine**: Groq-powered Llama 3.3 model, utilizing a "Reactive Context" pattern where data summaries are injected into the prompt only upon specific analytical queries.

## 2. Data Profiling Methodology
The application employs several statistical heuristics for automated data health assessment:

### A. Sparsity Score
Calculated as the percentage of missing or null-equivalent cells across the entire matrix:
$$\text{Sparsity} = \frac{\sum \text{Missing Cells}}{\text{Total Rows} \times \text{Total Columns}} \times 100$$

### B. Anomaly Detection (Outliers)
Utilizes the **Z-Score** method for all numeric distributions. A cell is flagged as an anomaly if:
$$|Z| > 3, \text{ where } Z = \frac{x - \mu}{\sigma}$$
*(where $\mu$ is the mean and $\sigma$ is the standard deviation).*

### C. Variance & Unit Detection
Uses the **Coefficient of Variation (CV)** to detect potential unit mismatches or inconsistent data entry:
$$\text{CV} = \frac{\sigma}{|\mu|}$$
If $CV > 1.0$, the column is flagged for high variance.

## 3. Type Inference Engine
The application uses a multi-pass heuristic engine for type detection:
- **Numeric**: Regex-based validation after removing localized thousands-separators.
- **Boolean**: Mapping against a truth-set: `{'true', 'false', 'yes', 'no', '1', '0'}`.
- **Date**: Attempted parsing of ISO-8601 and common US/EU date strings with a 70% confidence threshold.
- **Categorical**: Detected when the ratio of $\frac{\text{Unique Values}}{\text{Total Rows}} < 0.6$ for columns with fewer than 10 unique entries.

## 4. Reproducibility & Audit Trail
A core research requirement is the **SHA-256 File Hashing**. Upon upload, the raw binary is hashed to ensure the "Cleaning Pipeline" is linked to a specific, immutable version of the source data.
- **Audit Log**: Every user confirmation or type-override is timestamped and stored.
- **Python Export**: The system maps UI-confirmed types to `pandas` data types (`pd.to_numeric`, `pd.to_datetime`, etc.) to generate a standalone cleaning script.

## 5. Human-AI Interaction Model
The "Data Assistant" implements a **Context-Enriched Prompting** strategy. 
- **Prompt Isolation**: Casual greetings are handled by a "Social Layer."
- **Data Injection**: Quantitative summaries are only processed when the LLM detects "Analytical Intent" in the user's query.
