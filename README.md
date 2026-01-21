# Sci-Clean Studio 🧪✨

**Fast, Reproducible Data Cleaning for Researchers**

Sci-Clean Studio is a lightweight, modern web application designed to streamline the initial data cleaning and profiling process for researchers and data analysts. It leverages AI to accelerate type inference and ensures every step is documented for full reproducibility.

## Core Features

-   **📊 Stream-processed CSV Upload:** Upload and process large CSV files (up to 500MB) without crashing your browser. The app calculates a file hash and performs an initial data profiling pass.
-   **🩺 Data Health Dashboard:** Get an instant overview of your data's quality.
    -   **Sparsity Score:** A single metric to understand the percentage of missing data.
    -   **Missing Data Table:** A column-by-column breakdown of missing values.
    -   **Missingness Heatmap:** A visual representation of where your data is missing.
-   **🤖 AI-Powered Type Inference:** Automatically detects the most likely data type for each column (Numeric, Text, Date, Categorical) and provides a confidence score, allowing you to quickly confirm or correct the types.
-   **📋 Reproducibility Audit Log:** Every action you take—from file upload to type confirmation—is recorded in a detailed audit log, ensuring your cleaning process is transparent and reproducible.
-   **🐍 Python Script Export:** Generate a complete, runnable Python script that uses the `pandas` library to replicate the exact cleaning steps you performed in the tool. You can also download the cleaned CSV directly.

## How to Use

1.  **Upload Data:** Drag and drop your `.csv` file onto the upload area.
2.  **Review Dashboard:** Analyze the data health dashboard to understand sparsity and column-level issues.
3.  **Confirm Types:** Go through the list of columns and confirm the AI-detected data types or manually select the correct one.
4.  **Export Results:** Once all types are confirmed, you can download the reproducible Python script and the cleaned CSV file.

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
-   **UI:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit)
-   **Icons:** [Lucide React](https://lucide.dev/)

---
*Built with Firebase Studio*
