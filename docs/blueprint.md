# **App Name**: Sci-Clean Studio

## Core Features:

- Stream-processed CSV Upload: Upload and process CSV files up to 500MB in size, using a web worker to prevent browser crashes.  Calculates file hash and performs initial data profiling.
- Data Health Dashboard: Visualize data sparsity and missing values, displaying a sparsity score, a missing data table, and a missingness heatmap. Color-coded for quick assessment of data quality.
- Type Inference and Confirmation: Automatically infer data types (Numeric, Text, Date, Categorical) for each column, calculate a confidence score, and allow the user to confirm or override the detected types.
- Reproducibility Audit Log: Maintain a detailed audit log of all actions performed on the data, including file uploads, type confirmations, and export operations. Store the log in Firestore.
- Python Script Export: Generate a complete and runnable Python script that replicates the data cleaning steps performed in the tool. The script imports the 'pandas' package. Download as .py, copy to clipboard, and cleaned CSV is stored in Firebase Storage, providing multiple export options.

## Style Guidelines:

- Primary color: Dark electric blue (#209CEE) for a modern, scientific feel.
- Background color: Very dark gray (#12182B) for a sleek, data-focused environment.
- Accent color: Pale cerulean (#9DD6FF) to highlight important actions and confirmations.
- Body and headline font: 'Inter', a sans-serif font known for its legibility and modern appearance.
- Code font: 'Source Code Pro' for displaying code snippets, ensuring clarity and readability.
- Use minimalist, geometric icons to represent data types, actions, and statuses, in order to convey the scientific app's theme.
- Implement a dense, information-rich layout, similar to a scientific dashboard. Use clear labels and legible typography to present data effectively.