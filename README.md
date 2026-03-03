# Sci-Clean Studio 🧪✨

**Fast, Reproducible Data Cleaning for Researchers**

Sci-Clean Studio is a lightweight, modern web application designed to streamline the initial data cleaning and profiling process for researchers and data analysts. It leverages AI to accelerate type inference and ensures every step is documented for full reproducibility.

## 🚀 Getting Started

To push this project to your own GitHub repository, follow these commands in your terminal:

```bash
# 1. Initialize the local repository
git init

# 2. Add all files (the .gitignore will protect your secrets)
git add .

# 3. Create your first commit
git commit -m "Initial commit: Sci-Clean Studio Research MVP"

# 4. Rename the branch to main
git branch -M main

# 5. Add your remote GitHub repository (Replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/sci-clean-studio.git

# 6. Push to GitHub
git push -u origin main
```

## Core Features

-   **📊 Stream-processed CSV Upload:** Upload and process large CSV files (up to 500MB) without crashing your browser.
-   **🩺 Data Health Dashboard:** Instant overview of sparsity, missingness heatmaps, and anomalies.
-   **🤖 AI-Powered Research Assistant:** A friendly conversational partner (powered by Groq Llama 3.3) that helps you summarize and explore data health.
-   **📋 Reproducibility Audit Log:** Every action is recorded and timestamped for academic transparency.
-   **🐍 Python Script Export:** Generate a complete `pandas` script to replicate your cleaning steps exactly.

## Tech Stack

-   **Framework:** [Next.js 15](https://nextjs.org/)
-   **UI:** [React 19](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit) & [Groq](https://groq.com/)
-   **Icons:** [Lucide React](https://lucide.dev/)

---
*Developed for research reproducibility.*
