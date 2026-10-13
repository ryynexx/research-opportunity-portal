// =========================
// API CONFIGURATION
// =========================

const API_URL = "/api/opportunities";

let opportunities = [];
let editingId = null;


// =========================
// ELEMENTS
// =========================

const opportunitiesList = document.getElementById("opportunitiesList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const areaFilter = document.getElementById("areaFilter");

const messageBox = document.getElementById("messageBox");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");

const formSection = document.getElementById("formSection");
const detailsSection = document.getElementById("detailsSection");
const opportunityForm = document.getElementById("opportunityForm");

const submitButton = document.getElementById("submitButton");


// =========================
// SHOW MESSAGE
// =========================

function showMessage(message, type = "success") {
    messageBox.textContent = message;

    messageBox.className = `message message-${type}`;

    messageBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

    setTimeout(() => {
        messageBox.classList.add("hidden");
    }, 5000);
}


// =========================
// API REQUEST HELPER
// =========================

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? {
                "Content-Type": "application/json"
            } : {}),
            ...options.headers
        }
    });

    const text = await response.text();

    let data = {};

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = {
                error: "The server returned an invalid response."
            };
        }
    }

    if (!response.ok) {
        throw new Error(
            data.error || `Request failed with status ${response.status}`
        );
    }

    return data;
}


// =========================
// LOAD ALL OPPORTUNITIES
// =========================

async function loadOpportunities(showSuccess = false) {
    loading.classList.remove("hidden");
    opportunitiesList.classList.add("hidden");
    emptyState.classList.add("hidden");

    try {
        const data = await apiRequest(API_URL);

        if (!Array.isArray(data)) {
            throw new Error("The server returned an unexpected response.");
        }

        opportunities = data;

        updateStatistics();
        updateAreaFilter();
        renderOpportunities();

        if (showSuccess) {
            showMessage("Opportunities refreshed successfully.");
        }

    } catch (error) {
        opportunities = [];

        updateStatistics();
        renderOpportunities();

        showMessage(
            "Unable to load opportunities. Make sure the Flask server is running. " +
            error.message,
            "error"
        );

    } finally {
        loading.classList.add("hidden");
    }
}


// =========================
// UPDATE STATISTICS
// =========================

function updateStatistics() {
    const total = opportunities.length;

    const open = opportunities.filter(
        opportunity => opportunity.status === "Open"
    ).length;

    const closed = opportunities.filter(
        opportunity => opportunity.status === "Closed"
    ).length;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("openCount").textContent = open;
    document.getElementById("closedCount").textContent = closed;
}


// =========================
// UPDATE RESEARCH AREA FILTER
// =========================

function updateAreaFilter() {
    const previousValue = areaFilter.value;

    const areas = [
        ...new Set(
            opportunities
                .map(opportunity => opportunity.research_area)
                .filter(Boolean)
        )
    ].sort();

    areaFilter.innerHTML = '<option value="All">All Research Areas</option>';

    areas.forEach(area => {
        const option = document.createElement("option");

        option.value = area;
        option.textContent = area;

        areaFilter.appendChild(option);
    });

    if (areas.includes(previousValue)) {
        areaFilter.value = previousValue;
    }
}


// =========================
// FILTER OPPORTUNITIES
// =========================

function getFilteredOpportunities() {
    const search = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedArea = areaFilter.value;

    return opportunities.filter(opportunity => {
        const searchableText = [
            opportunity.title,
            opportunity.faculty_name,
            opportunity.research_area,
            opportunity.department,
            opportunity.required_skills
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(search);

        const matchesStatus =
            selectedStatus === "All" ||
            opportunity.status === selectedStatus;

        const matchesArea =
            selectedArea === "All" ||
            opportunity.research_area === selectedArea;

        return matchesSearch && matchesStatus && matchesArea;
    });
}


// =========================
// RENDER OPPORTUNITY CARDS
// =========================

function renderOpportunities() {
    const filtered = getFilteredOpportunities();

    opportunitiesList.innerHTML = "";

    if (filtered.length === 0) {
        opportunitiesList.classList.add("hidden");
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    opportunitiesList.classList.remove("hidden");

    filtered.forEach(opportunity => {
        const card = document.createElement("article");

        card.className = "opportunity-card";

        const statusClass =
            opportunity.status === "Open"
                ? "status-open"
                : "status-closed";

        const closeButton = opportunity.status === "Open"
            ? `
                <button
                    class="btn btn-outline"
                    data-action="close"
                    data-id="${opportunity.id}"
                >
                    Close
                </button>
            `
            : "";

        card.innerHTML = `
            <div class="card-top">
                <span class="area-tag">
                    ${escapeHTML(opportunity.research_area)}
                </span>

                <span class="status-badge ${statusClass}">
                    ${escapeHTML(opportunity.status)}
                </span>
            </div>

            <h3>${escapeHTML(opportunity.title)}</h3>

            <p class="card-description">
                ${escapeHTML(opportunity.description)}
            </p>

            <div class="card-divider"></div>

            <div class="card-meta">
                <div class="meta-row">
                    <span class="meta-label">Faculty</span>
                    <span class="meta-value">
                        ${escapeHTML(opportunity.faculty_name)}
                    </span>
                </div>

                <div class="meta-row">
                    <span class="meta-label">Department</span>
                    <span class="meta-value">
                        ${escapeHTML(opportunity.department)}
                    </span>
                </div>

                <div class="meta-row">
                    <span class="meta-label">Positions</span>
                    <span class="meta-value">
                        ${escapeHTML(opportunity.available_positions)}
                    </span>
                </div>

                <div class="meta-row">
                    <span class="meta-label">Deadline</span>
                    <span class="meta-value">
                        ${escapeHTML(opportunity.application_deadline)}
                    </span>
                </div>
            </div>

            <div class="card-actions">
                <button
                    class="btn btn-outline"
                    data-action="details"
                    data-id="${opportunity.id}"
                >
                    Details
                </button>

                <button
                    class="btn btn-outline"
                    data-action="edit"
                    data-id="${opportunity.id}"
                >
                    Edit
                </button>

                ${closeButton}

                <button
                    class="btn btn-danger"
                    data-action="delete"
                    data-id="${opportunity.id}"
                >
                    Delete
                </button>
            </div>
        `;

        opportunitiesList.appendChild(card);
    });
}


// =========================
// ESCAPE USER-PROVIDED TEXT
// =========================

function escapeHTML(value) {
    const characters = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    };

    return String(value ?? "").replace(
        /[&<>"']/g,
        character => characters[character]
    );
}


// =========================
// OPEN CREATE FORM
// =========================

function openCreateForm() {
    editingId = null;

    opportunityForm.reset();

    document.getElementById("formTitle").textContent =
        "Create an Opportunity";

    submitButton.textContent = "Save Opportunity";

    document.getElementById("status").value = "Open";

    setDeadlineMinimum();

    detailsSection.classList.add("hidden");
    formSection.classList.remove("hidden");

    formSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// =========================
// CLOSE FORM
// =========================

function closeForm() {
    formSection.classList.add("hidden");
    opportunityForm.reset();
    editingId = null;
}


// =========================
// SET MINIMUM DEADLINE
// =========================

function setDeadlineMinimum() {
    const deadlineInput = document.getElementById("application_deadline");

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    deadlineInput.min = `${year}-${month}-${day}`;
}


// =========================
// EDIT OPPORTUNITY
// =========================

function editOpportunity(id) {
    const opportunity = opportunities.find(
        item => Number(item.id) === Number(id)
    );

    if (!opportunity) {
        showMessage("Opportunity not found.", "error");
        return;
    }

    editingId = opportunity.id;

    document.getElementById("title").value = opportunity.title;
    document.getElementById("description").value = opportunity.description;
    document.getElementById("research_area").value = opportunity.research_area;
    document.getElementById("faculty_name").value = opportunity.faculty_name;
    document.getElementById("department").value = opportunity.department;
    document.getElementById("required_skills").value = opportunity.required_skills;
    document.getElementById("available_positions").value =
        opportunity.available_positions;

    document.getElementById("application_deadline").value =
        opportunity.application_deadline;

    document.getElementById("status").value = opportunity.status;

    document.getElementById("formTitle").textContent =
        "Edit an Opportunity";

    submitButton.textContent = "Update Opportunity";

    setDeadlineMinimum();

    detailsSection.classList.add("hidden");
    formSection.classList.remove("hidden");

    formSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// =========================
// CREATE OR UPDATE
// =========================

opportunityForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const positions = document.getElementById(
        "available_positions"
    ).value;

    if (!Number.isInteger(Number(positions)) || Number(positions) < 1) {
        showMessage(
            "Available positions must be a positive whole number.",
            "error"
        );
        return;
    }

    const deadline = document.getElementById(
        "application_deadline"
    ).value;

    if (deadline < new Date().toLocaleDateString("en-CA")) {
        showMessage(
            "Application deadline cannot be in the past.",
            "error"
        );
        return;
    }

    const opportunityData = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        research_area: document.getElementById("research_area").value.trim(),
        faculty_name: document.getElementById("faculty_name").value.trim(),
        department: document.getElementById("department").value.trim(),
        required_skills: document.getElementById("required_skills").value.trim(),
        available_positions: Number(positions),
        application_deadline: deadline,
        status: document.getElementById("status").value
    };

    const isEditing = editingId !== null;

    const url = isEditing
        ? `${API_URL}/${editingId}`
        : API_URL;

    const method = isEditing ? "PUT" : "POST";

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    try {
        await apiRequest(url, {
            method: method,
            body: JSON.stringify(opportunityData)
        });

        closeForm();

        await loadOpportunities();

        showMessage(
            isEditing
                ? "Opportunity updated successfully."
                : "Opportunity created successfully."
        );

        document.getElementById("opportunities").scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {
        showMessage(error.message, "error");

    } finally {
        submitButton.disabled = false;

        submitButton.textContent = editingId !== null
            ? "Update Opportunity"
            : "Save Opportunity";
    }
});


// =========================
// SHOW OPPORTUNITY DETAILS
// =========================

function showDetails(id) {
    const opportunity = opportunities.find(
        item => Number(item.id) === Number(id)
    );

    if (!opportunity) {
        showMessage("Opportunity not found.", "error");
        return;
    }

    const statusClass =
        opportunity.status === "Open"
            ? "status-open"
            : "status-closed";

    document.getElementById("detailsContent").innerHTML = `
        <h3 class="detail-title">
            ${escapeHTML(opportunity.title)}
        </h3>

        <span class="status-badge ${statusClass}">
            ${escapeHTML(opportunity.status)}
        </span>

        <p class="detail-description">
            ${escapeHTML(opportunity.description)}
        </p>

        <div class="details-grid">

            <div class="detail-item">
                <p>Research Area</p>
                <h4>${escapeHTML(opportunity.research_area)}</h4>
            </div>

            <div class="detail-item">
                <p>Faculty Member</p>
                <h4>${escapeHTML(opportunity.faculty_name)}</h4>
            </div>

            <div class="detail-item">
                <p>Department</p>
                <h4>${escapeHTML(opportunity.department)}</h4>
            </div>

            <div class="detail-item">
                <p>Required Skills</p>
                <h4>${escapeHTML(opportunity.required_skills)}</h4>
            </div>

            <div class="detail-item">
                <p>Available Positions</p>
                <h4>${escapeHTML(opportunity.available_positions)}</h4>
            </div>

            <div class="detail-item">
                <p>Application Deadline</p>
                <h4>${escapeHTML(opportunity.application_deadline)}</h4>
            </div>

            <div class="detail-item">
                <p>Opportunity ID</p>
                <h4>${escapeHTML(opportunity.id)}</h4>
            </div>

        </div>
    `;

    formSection.classList.add("hidden");
    detailsSection.classList.remove("hidden");

    detailsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// =========================
// CLOSE DETAILS
// =========================

function closeDetails() {
    detailsSection.classList.add("hidden");
}


// =========================
// CLOSE OPPORTUNITY
// =========================

async function closeOpportunity(id) {
    const opportunity = opportunities.find(
        item => Number(item.id) === Number(id)
    );

    if (!opportunity) {
        showMessage("Opportunity not found.", "error");
        return;
    }

    if (opportunity.status === "Closed") {
        showMessage("This opportunity is already closed.", "error");
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to close "${opportunity.title}"?`
    );

    if (!confirmed) {
        return;
    }

    const updatedData = {
        title: opportunity.title,
        description: opportunity.description,
        research_area: opportunity.research_area,
        faculty_name: opportunity.faculty_name,
        department: opportunity.department,
        required_skills: opportunity.required_skills,
        available_positions: opportunity.available_positions,
        application_deadline: opportunity.application_deadline,
        status: "Closed"
    };

    try {
        await apiRequest(`${API_URL}/${id}`, {
            method: "PUT",
            body: JSON.stringify(updatedData)
        });

        await loadOpportunities();

        showMessage("Opportunity status changed to Closed.");

    } catch (error) {
        showMessage(error.message, "error");
    }
}


// =========================
// DELETE OPPORTUNITY
// =========================

async function deleteOpportunity(id) {
    const opportunity = opportunities.find(
        item => Number(item.id) === Number(id)
    );

    if (!opportunity) {
        showMessage("Opportunity not found.", "error");
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${opportunity.title}"? This cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        await loadOpportunities();

        showMessage("Opportunity deleted successfully.");

    } catch (error) {
        showMessage(error.message, "error");
    }
}


// =========================
// HANDLE CARD BUTTONS
// =========================

opportunitiesList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const id = Number(button.dataset.id);

    if (!Number.isInteger(id)) {
        return;
    }

    if (action === "details") {
        showDetails(id);
    }

    if (action === "edit") {
        editOpportunity(id);
    }

    if (action === "close") {
        closeOpportunity(id);
    }

    if (action === "delete") {
        deleteOpportunity(id);
    }
});


// =========================
// SEARCH AND FILTER EVENTS
// =========================

searchInput.addEventListener("input", renderOpportunities);
statusFilter.addEventListener("change", renderOpportunities);
areaFilter.addEventListener("change", renderOpportunities);


// =========================
// START THE APPLICATION
// =========================

setDeadlineMinimum();
loadOpportunities();