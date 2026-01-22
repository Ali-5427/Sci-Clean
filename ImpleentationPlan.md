# SCI-CLEAN STUDIO: PHASE-BY-PHASE BUILD PROMPT

**Total Duration:** 4 weeks  
**Total Phases:** 5 phases (1 week each)  
**Deliverable:** Production-ready MVP with user validation  

---

# PHASE 1: FOUNDATION & SETUP (WEEK 1)

**Goal:** Set up project infrastructure, authentication, and basic UI structure.  
**Duration:** 7 days  
**Deadline:** End of Day 7

## Phase 1 Deliverables

### 1.1 Project Initialization
- [ ] Create Next.js 15 project with TypeScript
- [ ] Initialize Firebase project (Auth + Firestore + Storage)
- [ ] Set up Tailwind CSS v4 with dark theme
- [ ] Configure shadcn/ui components
- [ ] Initialize GitHub repo (public, open-source)
- [ ] Set up .env.local for Firebase credentials

### 1.2 Folder Structure
```
sci-clean-studio/
├── src/app/
│   ├── page.tsx (Landing page)
│   ├── dashboard/[projectId]/page.tsx (Main app)
│   └── api/auth/route.ts
├── src/components/
│   ├── FileUpload.tsx
│   ├── DataHealthDashboard.tsx
│   ├── TypeInferencePanel.tsx
│   ├── AuditLog.tsx
│   └── ExportModal.tsx
├── src/lib/
│   ├── firebase.ts
│   ├── types.ts
│   └── constants.ts
└── public/
```

### 1.3 Authentication System
- [ ] Firebase Auth setup (Google OAuth + GitHub OAuth)
- [ ] Login page with two buttons: "Login with Google" + "Login with GitHub"
- [ ] Logout functionality
- [ ] Protected routes (dashboard only accessible after login)
- [ ] User session management

### 1.4 Landing Page
- [ ] Create landing page with:
  - Sci-Clean Studio title
  - Two main buttons: "☁️ Cloud Mode" | "🔒 Local Mode"
  - Brief description
  - "Get Started" link

### 1.5 Workspace Dashboard
- [ ] Create dashboard page showing:
  - Logged-in user's name
  - "[ + New Project ]" button
  - List of user's existing projects (initially empty)
  - Each project shows: name, created date, status

### 1.6 Firebase Firestore Setup
- [ ] Create collection: `projects`
- [ ] Document structure:
  ```
  projects/{projectId}: {
    name: string,
    userId: string,
    createdAt: timestamp,
    status: "uploading" | "analyzing" | "ready",
    fileHash: string (SHA-256)
  }
  ```

### 1.7 Testing
- [ ] Test login/logout flow
- [ ] Test project creation (creates Firestore doc)
- [ ] Test redirects (unauthorized users → login page)
- [ ] Test responsive design on mobile/tablet

---

# PHASE 2: FILE UPLOAD & STREAM PROCESSING (WEEK 2)

**Goal:** Build drag-drop upload with Web Worker processing, no browser freeze.  
**Duration:** 7 days  
**Deadline:** End of Day 14

## Phase 2 Deliverables

### 2.1 Web Worker for CSV Processing
- [ ] Create `csvProcessor.worker.ts`
- [ ] Implement functionality:
  - Read file in 5MB chunks
  - Parse CSV headers from first chunk
  - Extract first 100 rows per column
  - Calculate: rowCount, columnCount, missing counts
  - Infer column types (NUMERIC, TEXT, DATE, CATEGORICAL)
  - Calculate sparsity score
  - Calculate SHA-256 hash
  - Send progress updates to main thread every 5MB

### 2.2 Type Inference Logic
- [ ] Implement pattern matching:
  - NUMERIC: `/^-?\d+\.?\d*$/`
  - TEXT: Non-numeric strings
  - DATE: Common date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
  - CATEGORICAL: Text with <20 unique values
- [ ] Calculate confidence score (0-100%)
  - 90%+ = HIGH confidence
  - 70-90% = MEDIUM confidence
  - <70% = LOW confidence

### 2.3 File Upload Component
- [ ] Create `FileUpload.tsx`:
  - Drag-and-drop zone
  - File size validation (max 500MB)
  - Accept only .csv files
  - On file drop: spawn Web Worker
  - Show real-time progress bar
  - Display: rows processed, columns detected, time remaining

### 2.4 Progress Bar UI
- [ ] Show: "████████░░░░ 45% complete (225MB / 500MB)"
- [ ] Update every 5MB processed
- [ ] Display: "Rows: 45,000 | Columns: 45 | Time left: ~2 min"
- [ ] Smooth animation

### 2.5 Hashing Implementation
- [ ] Use crypto-js or TweetNaCl for SHA-256
- [ ] Calculate hash on upload
- [ ] Store in Firestore: `projects/{projectId}/fileHash`
- [ ] Display hash on dashboard

### 2.6 Data Structure Returned from Worker
```typescript
{
  fileName: string
  fileSize: number
  fileHash: string (SHA-256)
  rowCount: number
  columnCount: number
  columnNames: string[]
  columnTypes: Record<string, string>
  missingCounts: Record<string, number>
  sampleValues: Record<string, string[]>
  sparsityScore: number
}
```

### 2.7 Testing
- [ ] Test upload with 50MB CSV
- [ ] Test upload with 200MB CSV
- [ ] Verify progress bar updates every 5MB
- [ ] Verify no browser freeze
- [ ] Verify type inference accuracy (sample 100 rows)
- [ ] Verify hash calculation

---

# PHASE 3: DATA HEALTH DASHBOARD (WEEK 3, PART 1)

**Goal:** Build dashboard visualization showing data quality.  
**Duration:** 3-4 days  
**Deadline:** Middle of Week 3

## Phase 3 Deliverables

### 3.1 Sparsity Score Card
- [ ] Display large number: "22% Missing Data"
- [ ] Color coding:
  - GREEN: <10% missing
  - YELLOW: 10-25% missing
  - RED: >25% missing
- [ ] Show: "X missing cells out of Y total cells"
- [ ] Example: "22,000 / 100,000 cells empty"

### 3.2 Missing Data Table
- [ ] Create table with columns:
  - Column Name
  - Type (NUMERIC, TEXT, DATE, CATEGORICAL)
  - Missing Count (number)
  - Missing % (percentage)
  - Status (✅ Good, ⚠️ Many missing)
- [ ] Sort by missing % (highest first)
- [ ] Make rows clickable for details

### 3.3 Missingness Heatmap
- [ ] Use Recharts or simple SVG
- [ ] Each column = vertical bar
- [ ] Height = number of rows
- [ ] Color intensity = % missing in column
  - Blue = 0% missing (all present)
  - Red = 100% missing (all empty)
- [ ] On hover: show "Column: age, 12 missing (0.12%)"
- [ ] Responsive design

### 3.4 Summary Statistics Card
```
Total Rows: 100,000
Total Columns: 45
Overall Sparsity: 22% missing
File Size: 50.2 MB
File Hash: abc123def456xyz789
Upload Time: 2 min 34 sec
```

### 3.5 Component: DataHealthDashboard.tsx
- [ ] Accept props: fileData, stats
- [ ] Render: sparsity card + heatmap + table + summary
- [ ] Responsive layout (mobile-friendly)
- [ ] Dark theme styling

### 3.6 Testing
- [ ] Test with 100-row CSV
- [ ] Test with 100,000-row CSV
- [ ] Verify sparsity calculation accuracy
- [ ] Verify heatmap renders correctly
- [ ] Verify table sorts by missing %
- [ ] Test mobile responsiveness

---

# PHASE 4: TYPE INFERENCE + CONFIRMATION (WEEK 3, PART 2)

**Goal:** Show type suggestions and let users confirm/override.  
**Duration:** 3-4 days  
**Deadline:** End of Week 3

## Phase 4 Deliverables

### 4.1 Type Inference Panel Component
- [ ] Create `TypeInferencePanel.tsx`
- [ ] Loop through each column
- [ ] For each column, show card:
  ```
  ┌─────────────────────────────┐
  │ Column: "age"               │
  │ Detected: NUMERIC (92%)     │
  │ Samples: 25, 34, 51, ...    │
  │ [ ✅ Accept ] [ Override ▼ ]│
  └─────────────────────────────┘
  ```

### 4.2 High-Confidence Types (>80%)
- [ ] Show: "[ ✅ Accept ]" + "[ Change Type ▼ ]"
- [ ] User can click Accept or change type
- [ ] Default to accepting (but must confirm)

### 4.3 Low-Confidence Types (<80%)
- [ ] Show: "⚠️ Ambiguous (65% sure)"
- [ ] Display issue (e.g., "Mixed formats detected")
- [ ] Show radio buttons with options:
  ```
  ( ) US Format: 1,000.50
  ( ) EU Format: 1.000,50
  ```
- [ ] Force user to select one

### 4.4 Type Override Dropdown
- [ ] When user clicks "Change Type", show dropdown:
  - NUMERIC
  - TEXT
  - DATE
  - CATEGORICAL
- [ ] Update card with new selection

### 4.5 Confirmation Tracking
- [ ] Store confirmed types in state:
  ```typescript
  confirmedTypes = {
    age: { type: "NUMERIC", timestamp: "10:05:23" },
    income: { type: "TEXT", timestamp: "10:06:12" }
  }
  ```
- [ ] Track which columns still need confirmation
- [ ] Show progress: "5 of 45 types confirmed"

### 4.6 Audit Log Entry
- [ ] For each type confirmation, create audit entry:
  ```
  [10:05:23] User confirmed: age → NUMERIC (92%)
  [10:06:12] User selected: income → US Format
  ```

### 4.7 Testing
- [ ] Test with 4-5 column types
- [ ] Test override functionality
- [ ] Test ambiguous type handling
- [ ] Verify audit log entries created
- [ ] Test sorting by confidence (low-confidence first)

---

# PHASE 5: AUDIT LOG + PYTHON EXPORT (WEEK 4)

**Goal:** Complete audit trail and Python script generation.  
**Duration:** 7 days  
**Deadline:** End of Week 4

## Phase 5 Deliverables

### 5.1 Audit Log Display Component
- [ ] Create `AuditLog.tsx`
- [ ] Scrollable list of all actions:
  ```
  [10:05:23] File Uploaded: raw_data.csv (50.2 MB)
             Hash: abc123def456xyz789
  
  [10:05:45] Type detected: age → NUMERIC (92%)
             User confirmed: ✅ NUMERIC
  
  [10:06:12] Type detected: income → NUMERIC (65%)
             User selected: US Format (1,000.50)
  ```
- [ ] Timestamp for every action
- [ ] Show what was decided
- [ ] Make scrollable if many entries

### 5.2 Store Audit Log in Firestore
- [ ] Create collection: `projects/{projectId}/auditLog`
- [ ] Document structure:
  ```typescript
  {
    timestamp: "2024-01-15T10:05:23Z",
    action: "UPLOAD" | "TYPE_DETECTED" | "TYPE_CONFIRMED",
    details: {...},
    columnName?: string,
    type?: string
  }
  ```

### 5.3 Python Generator Function
- [ ] Create `pythonGenerator.ts`
- [ ] Input: confirmedTypes, fileName, fileHash
- [ ] Generate complete Python script:
  ```python
  """
  CLEANED DATA GENERATION SCRIPT
  Generated by Sci-Clean Studio
  Date: 2024-01-15 10:08:00
  Original File: raw_data.csv
  Original Hash: abc123def456xyz789
  """
  
  import pandas as pd
  import numpy as np
  
  INPUT_FILE = 'raw_data.csv'
  OUTPUT_FILE = 'cleaned_data.csv'
  
  df = pd.read_csv(INPUT_FILE)
  
  # Type conversions
  df['age'] = pd.to_numeric(df['age'], errors='coerce')
  df['income'] = df['income'].astype(str)
  
  df.to_csv(OUTPUT_FILE, index=False)
  print(f"✅ Done: {len(df)} rows")
  ```

### 5.4 Type-to-Code Mapping
- [ ] NUMERIC: `df['col'] = pd.to_numeric(df['col'], errors='coerce')`
- [ ] TEXT: `df['col'] = df['col'].astype(str)`
- [ ] DATE: `df['col'] = pd.to_datetime(df['col'], format='%Y-%m-%d')`
- [ ] CATEGORICAL: `df['col'] = df['col'].astype('category')`

### 5.5 Export Modal Component
- [ ] Create `ExportModal.tsx`
- [ ] Show three download options:
  ```
  [ 🐍 Download cleaning_pipeline.py ]
  [ 📊 Download cleaned_data.csv ]
  [ Copy to Clipboard ]
  ```
- [ ] Display file sizes
- [ ] Show file hash for verification
- [ ] "Ready to export" message

### 5.6 Download Functionality
- [ ] Generate .py file blob
- [ ] Generate .csv (if possible, or show note)
- [ ] Trigger browser download
- [ ] Copy-to-clipboard for Python script
- [ ] Show success message

### 5.7 Export Button
- [ ] Add "Export" button on main dashboard
- [ ] Only enabled after all types confirmed
- [ ] On click: show ExportModal
- [ ] Track export in audit log

### 5.8 Testing
- [ ] Test Python script generation (syntax valid)
- [ ] Test .py file download
- [ ] Test copy-to-clipboard
- [ ] Verify script contains all type conversions
- [ ] Test with 5+ columns
- [ ] Verify script is executable (dummy run)

---

# INTEGRATION & POLISH (Throughout Week 4)

## 5.9 Connect All Components
- [ ] Upload → Dashboard → Type Panel → Audit Log → Export (full flow)
- [ ] State management (Zustand or React Context)
- [ ] Pass data through components correctly
- [ ] Ensure no data loss between steps

## 5.10 Firestore Integration
- [ ] Store project metadata
- [ ] Store confirmed types
- [ ] Store audit log
- [ ] Store file hash
- [ ] Retrieve on page reload

## 5.11 Error Handling
- [ ] File too large (>500MB) → show error
- [ ] Invalid CSV format → show error
- [ ] Web Worker failure → show error
- [ ] Firebase auth failure → show error
- [ ] Network error → show retry button

## 5.12 UI Polish
- [ ] Dark theme applied throughout
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading skeletons while processing
- [ ] Smooth transitions
- [ ] Clear typography
- [ ] Good spacing and padding

## 5.13 Documentation
- [ ] README.md with:
  - Project overview
  - How to run locally
  - How to deploy
  - Tech stack
  - Features
  - Screenshots
- [ ] Code comments
- [ ] API documentation (if applicable)

## 5.14 Testing & QA
- [ ] Test complete flow (upload → export)
- [ ] Test on different browsers
- [ ] Test with different CSV formats
- [ ] Test edge cases (single column, 1000 columns)
- [ ] Performance test (time to process 100MB)

---

# DEPLOYMENT (End of Week 4)

- [ ] Deploy to Vercel
- [ ] Test live deployment
- [ ] Share live link: sci-clean.io (or similar)
- [ ] Verify Firebase connection works
- [ ] Test authentication on live site

---

# PHASE-BY-PHASE CHECKLIST

## Week 1: Foundation
- [ ] Next.js + Firebase + Tailwind setup
- [ ] Authentication (Google + GitHub)
- [ ] Landing page + Workspace dashboard
- [ ] Firestore structure

## Week 2: Upload & Processing
- [ ] Web Worker for CSV parsing
- [ ] Type inference engine
- [ ] Drag-drop upload component
- [ ] Progress bar
- [ ] SHA-256 hashing

## Week 3, Part 1: Dashboard
- [ ] Sparsity score card
- [ ] Missing data table
- [ ] Heatmap visualization
- [ ] Summary statistics

## Week 3, Part 2: Type Confirmation
- [ ] Type inference panel
- [ ] High/low confidence handling
- [ ] Override functionality
- [ ] Confirmation tracking

## Week 4: Export & Polish
- [ ] Audit log component
- [ ] Python script generation
- [ ] Export modal
- [ ] File downloads
- [ ] Integration & testing
- [ ] Deployment

---

# SUCCESS CRITERIA FOR EACH PHASE

## Phase 1 (Foundation)
✅ Can login/logout  
✅ Can create project  
✅ Firebase Firestore working  
✅ Dark theme applied  

## Phase 2 (Upload)
✅ Upload 100MB CSV without freezing  
✅ Progress bar updates smoothly  
✅ Type inference accurate (90%+ on obvious types)  
✅ File hash calculated correctly  

## Phase 3 (Dashboard)
✅ Sparsity score accurate  
✅ Heatmap renders properly  
✅ Missing % per column correct  
✅ Color coding intuitive  

## Phase 4 (Type Confirmation)
✅ Shows type + confidence  
✅ User can confirm/override  
✅ Low-confidence types force selection  
✅ Audit log entry created  

## Phase 5 (Export)
✅ Python script is syntactically valid  
✅ Contains all type conversions  
✅ Downloads successfully  
✅ Complete end-to-end flow works  

---

# TIME MANAGEMENT PER PHASE

| Phase | Week | Days | Key Task | Status |
|-------|------|------|----------|--------|
| 1 | Week 1 | 7 | Setup + Auth | ⬜ |
| 2 | Week 2 | 7 | Upload + Processing | ⬜ |
| 3a | Week 3 | 3-4 | Dashboard | ⬜ |
| 3b | Week 3 | 3-4 | Type Confirmation | ⬜ |
| 4 | Week 4 | 7 | Export + Polish | ⬜ |

---

# BUILD THIS WEEK BY WEEK

✅ **Week 1:** Just focus on authentication + landing page + Firestore  
✅ **Week 2:** Just focus on uploading + parsing + type inference  
✅ **Week 3:** Just focus on dashboard visualization + type confirmation  
✅ **Week 4:** Just focus on audit log + Python export + polish  

**Don't jump ahead. Finish each phase before starting the next.**

---

# FINAL DELIVERABLE

After 4 weeks, you have:

1. ✅ Working web app (sci-clean.io)
2. ✅ Complete source code (GitHub)
3. ✅ Clean documentation
4. ✅ Live demo
5. ✅ Ready to show OIST professors

Then: Get 3-5 researchers to TEST it and provide feedback.

**That's your winning application.** 🚀