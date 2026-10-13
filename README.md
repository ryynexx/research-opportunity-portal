# Research Opportunity Portal

A web application for sharing, discovering, and managing university research opportunities. Faculty can publish project details, and visitors can search and filter the available opportunities.

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Technologies](#technologies)
- [Architecture and workflow](#architecture-and-workflow)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation and setup](#installation-and-setup)
- [Configuration](#configuration)
- [Run the application](#run-the-application)
- [Usage](#usage)
- [HTTP Status Codes](#http-status-codes)
- [API](#api)
- [Testing](#testing)
- [API testing with Postman](#api-testing-with-postman)
- [Version Control](#version-control)

## Overview

Research opportunities can be difficult for students to find when project details are scattered across departments or shared informally. This portal provides a central interface for listing projects with their research area, faculty contact, department, skills, available positions, deadline, and status.

The frontend is served by a Flask application. Flask also exposes a JSON API, and a MySQL database stores opportunity records.
The current page footer identifies the portal with FAST-NUCES Peshawar.

## Features

- Browse research opportunity cards and view full details.
- Search by title, faculty name, research area, department, or required skills.
- Filter by status and research area.
- View counts of all, open, and closed opportunities.
- Create, edit, close, and delete opportunity records.
- Validate required fields, positive whole-number position counts, and non-past application deadlines.

## Technologies

| Area | Technologies |
| --- | --- |
| Frontend | HTML, CSS, and vanilla JavaScript |
| Backend | Python and Flask |
| Database | MySQL |
| Database access | `mysql-connector-python` |
| Environment configuration | `python-dotenv` | Git and Github | postman for api testing

The frontend is static and does not require a separate JavaScript package manager or build step.

## Architecture and workflow

1. The Flask application serves the files in `frontend/`.
2. The browser JavaScript requests opportunity data from `/api/opportunities`.
3. Flask handles API requests and reads or writes records in MySQL through `backend/db.py`.
4. The frontend displays the returned records and submits create, edit, close, and delete actions through the same API.

## Repository structure

```text
.
├── backend/
│   ├── app.py             # Flask frontend server and opportunity API
│   ├── db.py              # MySQL connection helper and dotenv loading
│   ├── requirements.txt   # Pinned Python dependencies
│   ├── test_db.py         # Database connectivity check
│ 
├── database/
│   └── schema.sql         # Creates the database and opportunities table
├── frontend/
│   ├── index.html         # Portal page and opportunity form
│   ├── script.js          # API requests, filtering, and page interactions
│   └── style.css          # Portal styles
├── .env.example           # Database environment-variable template
└── README.md
```

## Prerequisites

- Python 3 and `pip`
- A running MySQL server and a MySQL account that can create/use the project database and table

No frontend package installation is required.

## Installation and setup

Run the following commands from the repository root.

1. Create and activate a Python virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

   On Windows PowerShell, activate it with:

   ```powershell
   .venv\Scripts\Activate.ps1
   ```

2. Install the dependencies listed by the backend:

   ```bash
   python -m pip install -r backend/requirements.txt
   ```

3. Create the database and table using the provided schema. Replace the example account name with a MySQL account that has the required permissions:

   ```bash
   mysql -u your_mysql_admin_user -p < database/schema.sql
   ```

   The schema creates the database and table, but does not create a MySQL user. Ensure the account configured in `.env` exists and has permission to read and modify records in `research_portal_db`.

4. Copy the root environment template and edit `.env` with the connection details for your MySQL instance:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `DB_USER` and `DB_PASSWORD` to an account that can access the `research_portal_db` database created by the schema.

## Configuration

The backend loads database settings from environment variables using `python-dotenv`. The root `.env.example` documents the expected names:

| Variable | Purpose | Template value |
| --- | --- | --- |
| `DB_HOST` | MySQL server hostname | `localhost` |
| `DB_USER` | MySQL account | `research_portal_user` |
| `DB_PASSWORD` | MySQL account password | `your_database_password` (replace this placeholder) |
| `DB_NAME` | Database name | `research_portal_db` |

Keep credentials in your local `.env` file; `.env` is ignored by Git. Do not commit real passwords or other secrets.

## Run the application

With the virtual environment activated and `.env` configured, start Flask from the repository root:

```bash
python backend/app.py
```

Open <http://127.0.0.1:5000/> in a browser. The application uses Flask's built-in development server with debug mode enabled; it is intended for local development, not production deployment.

## Usage

From the portal:

1. Browse opportunity cards or enter a search term.
2. Narrow the list using the status or research-area filters.
3. Select **Details** to view a record, or use **Edit**, **Close**, and **Delete** to manage it.
4. Select **Create Opportunity** or **Post Opportunity**, complete the required fields, and save.

New opportunities require a title, description, research area, faculty name, department, required skills, a positive whole number of positions, and an application deadline that is today or later. The status must be `Open` or `Closed`; new records default to `Open` if no status is supplied through the API.

## REST API

All endpoints are served by the Flask application and return JSON for API requests.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/opportunities` | List opportunities, ordered by ID |
| `GET` | `/api/opportunities/<id>` | Retrieve one opportunity |
| `POST` | `/api/opportunities` | Create an opportunity |
| `PUT` | `/api/opportunities/<id>` | Replace an opportunity's editable fields |
| `DELETE` | `/api/opportunities/<id>` | Delete an opportunity |

Create and update requests use JSON with these fields:

```json
{
  "title": "Undergraduate Research Assistant",
  "description": "Assist with a faculty research project.",
  "research_area": "Environmental Science",
  "faculty_name": "Dr. Example",
  "department": "Environmental Science",
  "required_skills": "Data analysis, field work",
  "available_positions": 2,
  "application_deadline": "2035-12-31",
  "status": "Open"
}
```

The deadline must be in `YYYY-MM-DD` format and cannot be in the past. The example date is illustrative; use a valid future date when submitting a request. A `POST` may omit `status` to use the default `Open`; `PUT` requires all fields, including `status`.

Example requests:

```bash
# List all opportunities
curl http://127.0.0.1:5000/api/opportunities

# Retrieve opportunity 1
curl http://127.0.0.1:5000/api/opportunities/1

# Create an opportunity (replace the example deadline with a future date)
curl -X POST http://127.0.0.1:5000/api/opportunities \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Undergraduate Research Assistant",
    "description": "Assist with a faculty research project.",
    "research_area": "Environmental Science",
    "faculty_name": "Dr. Example",
    "department": "Environmental Science",
    "required_skills": "Data analysis, field work",
    "available_positions": 2,
    "application_deadline": "2035-12-31",
    "status": "Open"
  }'
```
## HTTP Status codes
Successful creation returns HTTP `201` with a success message and the new record ID. Successful reads return HTTP `200`; a request for a missing record returns `404`. Invalid request data returns `400`, and an unexpected server or database error returns `500`.



## Testing
`backend/test_db.py` is a database connectivity check. With dependencies installed and `.env` configured, run it from the repository root:

```bash
python backend/test_db.py
```

It reports whether a connection to the configured MySQL database succeeds.

### API testing with Postman

Import the exported collection from `postman/research-opportunity-portal.postman_collection.json` into Postman. Start the Flask server before sending requests.

The collection should demonstrate creating at least three opportunities, retrieving all opportunities, retrieving one by ID, updating an opportunity, changing its status from Open to Closed, deleting an opportunity, retrieving the deleted opportunity to verify the `404 Not Found` response, and submitting invalid or missing data to verify input validation with `400 Bad Request`.

Export the completed collection and include it in the repository and final submission ZIP.


## Version Control
Git is used to track project changes. The source code will be maintained in a GitHub repository.

## Author

FAST-NUCES Peshawar
BS Artificial Intelligence
Rabeesha Ijaz 
24P-0015
