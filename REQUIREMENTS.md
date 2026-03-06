# MQD Tracker — Requirements Document

## 1. Purpose

A web-based tool that helps airline loyalty program members track their Medallion Qualifying Dollars (MQDs) toward status goals. Users upload their Account Activity PDF, and the site parses, de-duplicates, and visualizes their progress — entirely in the browser.

## 2. Functional Requirements

### 2.1 PDF Import & Parsing
- Parse Account Activity PDFs client-side using pdf.js (pdfjs-dist)
- Extract all MQD-relevant entries: flights, MQD Boost, MQD Headstart, Delta Cars & Stays
- Handle both posted (complete) and pending entries
- Support year filtering to exclude prior-year data from multi-year PDFs
- Skip non-MQD entries: refunds, award redemptions, seat purchases

### 2.2 De-duplication
- Fingerprint entries by date + category + amount + flight number
- On re-import, detect and skip duplicates
- Update pending entries that have since completed

### 2.3 Dashboard
- Hero card showing Earned, Pending, and Total MQDs against the user's target
- Color-segmented progress bar (green = earned, yellow = pending)
- MQDs by Category table (Complete / Pending / Total)
- MQDs by Trip table
- Monthly Timeline with Earned, Pending, Cumulative, and % of Target columns
- Projected Year-End hero card showing Earned + Pending + Projected = Total
- Projected progress bar with color segments (green/yellow/blue) and target marker when exceeding 100%
- Spending Forecast card with per-card monthly spend/MQDs table
- Anticipated Trips card for manually adding future trip MQD estimates

### 2.4 Activity Table
- Full list of all imported entries
- Filtering by category and status
- Inline editing of entries
- Manual entry creation
- Delete entries

### 2.5 Settings
- Status target selection: Silver ($5,000), Gold ($10,000), Platinum ($15,000), Diamond ($28,000)
- Credit card configuration for spending forecast (auto-detected from PDF, with editable monthly spend and MQD rate)
- Custom MQD categories for future incentives
- Data management: export to CSV, clear all data

### 2.6 Projections
- Credit card spending projection: monthly MQD boost x months remaining (including partial current month)
- Anticipated trips: user-entered future trip MQDs
- Combined projection shown in Projected Year-End bar

### 2.7 CSV Export
- Export all activity entries as a CSV file
- Columns: Date, Category, Description, Origin, Destination, Flight, Base MQDs, Bonus MQDs, Total MQDs, Status, Trip
- Proper escaping for commas, quotes, and newlines
- Formula injection protection (prefix `=`, `+`, `-`, `@` cells with single quote)

### 2.8 How to Use Page
- Step-by-step instructions for using the site
- Privacy and security information

### 2.9 Import Tab
- Drag-and-drop or click-to-upload PDF
- Year filter selector
- Review screen showing new entries, updates, and duplicates before confirming
- Import button above review tables
- Auto-navigate to Dashboard after import

## 3. Non-Functional Requirements

### 3.1 Privacy & Data Handling
- **No server.** The site is a static web application. There is no backend, no API, and no database.
- **No data storage.** Nothing is saved to localStorage, cookies, session storage, or any cloud service. All data exists only in browser memory (React state) during the active session.
- **No persistence.** When the user closes the tab, refreshes, or navigates away, all data is permanently gone.
- **No tracking.** There are no user accounts, no analytics, no cookies, and no third-party scripts beyond Google Fonts.
- **Local PDF processing.** PDFs are parsed entirely in the browser using JavaScript. The file is never uploaded anywhere.

### 3.2 Technology Stack
- React 19 + TypeScript
- Vite 6 (build tooling)
- pdfjs-dist (Mozilla's pdf.js for client-side PDF text extraction)
- No other runtime dependencies

### 3.3 Deployment
- Static site hosting (Vercel, Netlify, or similar)
- No server-side infrastructure required

## 4. Security

### 4.1 Attack Surface Analysis

The primary attack surface is **client-side PDF parsing via pdf.js**.

**What a malicious PDF could attempt:**
- Exploit a vulnerability in pdf.js to execute arbitrary JavaScript in the user's browser tab
- Inject misleading text data that gets parsed as legitimate MQD entries

**What limits the blast radius:**
- **No server to reach.** Even if code execution occurred, there is no backend to attack, no API keys to steal, and no database to access.
- **No stored data to exfiltrate.** There is no persisted data from other sessions.
- **Browser sandbox.** All code runs in the browser's security sandbox. It cannot access the filesystem, other tabs, or the operating system.
- **Same-origin policy.** Malicious code cannot read data from other sites the user is logged into.
- **Text extraction only.** The app calls `page.getTextContent()` and works with plain strings. It does not render the PDF visually, execute embedded JavaScript, or follow embedded links or actions.

**Realistic worst case:**
A crafted PDF exploits an unpatched pdf.js vulnerability to run JavaScript in the user's tab. That script could read data already imported in the current session, redirect the user to a phishing page, or attempt cross-origin requests (limited by CORS). It could not install malware, access other tabs, or persist after the tab is closed.

**Practical risk level: Low.** pdf.js is maintained by Mozilla and used by Firefox itself. Vulnerabilities are found and patched quickly.

### 4.2 XSS (Cross-Site Scripting)
- React auto-escapes all rendered content by default
- No use of `dangerouslySetInnerHTML` anywhere in the codebase
- Parsed PDF text is treated as plain strings throughout

### 4.3 CSV Injection
- CSV export prefixes cells starting with `=`, `+`, `-`, or `@` with a single quote to prevent formula execution in Excel and Google Sheets
- Fields containing commas, quotes, or newlines are properly quoted

### 4.4 Supply Chain
- Dependencies are limited to well-maintained, widely-used packages (React, pdf.js, Vite)
- **pdfjs-dist must be kept updated** — this is the main security-sensitive dependency

### 4.5 What Is Explicitly Not Present
- No server-side code or API
- No database or data store
- No authentication or session management
- No cookies or local storage
- No file uploads to any server
- No third-party analytics or tracking scripts
- No user-generated content shared between users

## 5. Legal
- Copyright 2026 Erik Josephson. All rights reserved.
- Disclaimer: The site is not affiliated with, endorsed by, or in any way officially connected to Delta Air Lines, Inc. All trademarks and service marks are the property of their respective owners.
- No Delta logos or branding are used.
