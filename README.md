# Sci-Clean Studio 🧪✨

**Fast, Reproducible Data Cleaning for Researchers**

Sci-Clean Studio is a lightweight, modern web application designed to streamline the initial data cleaning and profiling process for researchers and data analysts. It leverages AI to accelerate type inference and ensures every step is documented for full reproducibility.

## 🚀 GitHub Repository

This project is hosted at: [https://github.com/Ali-5427/Sci-Clean](https://github.com/Ali-5427/Sci-Clean)

## 🛠️ How to Push Updates

Whenever we make changes here in the studio, follow these steps in your local terminal to update your GitHub repo:

```bash
# 1. Stage all new changes
git add .

# 2. Commit the changes
git commit -m "Update: [Describe your changes here]"

# 3. Push to GitHub
git push origin main
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
