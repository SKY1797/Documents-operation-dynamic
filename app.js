// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE. IT MUST END IN /exec
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwihfjnqOQdiBEoD3D-8RCBAM60sa0hXaQbn_0tZM_mVXrofR7XGXvmegxcDkQ4AQgh/exec';

let allDocuments = [];
let currentPath = [];

const navIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';
const searchIcon = '<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

function formatName(filename) {
    return filename.replace(/\.[^/.]+$/, "");
}

document.addEventListener('DOMContentLoaded', async () => {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '<p style="text-align:center; padding: 3rem; color: var(--text-muted); font-weight: 500;">Scanning Google Drive hierarchy...</p>';

    try {
        const response = await fetch(SCRIPT_URL);
        const rawText = await response.text();

        try {
            allDocuments = JSON.parse(rawText);
        } catch (e) {
            appContainer.innerHTML = `<div style="text-align:center; color:#E8632B; padding:2rem;"><strong>Connection Error:</strong> Check URL and Permissions.</div>`;
            return;
        }

        if (allDocuments.error) {
            appContainer.innerHTML = `<div style="text-align:center; color:#E8632B; padding:2rem;">Script Error: ${allDocuments.error}</div>`;
            return;
        }

        renderView();
    } catch (error) {
        appContainer.innerHTML = `<div style="text-align:center; color:#E8632B; padding:2rem;">Network Error. Check connection.</div>`;
    }
});

function renderView() {
    const appContainer = document.getElementById('app-container');
    const mainHeader = document.getElementById('main-header');
    const mainDivider = document.getElementById('main-divider');

    if (currentPath.length === 0) {
        // TIER 1: HOME (Root Folders)
        mainHeader.style.display = 'block';
        mainDivider.style.display = 'block';

        let html = `
            <div class="view-container">
                <div class="section-header">
                    <h2 class="section-title">Select Folder</h2>
                    <div class="search-wrapper">
                        ${searchIcon}
                        <input type="text" id="global-search" placeholder="Search across all documents..." autocomplete="off">
                        <div id="search-results" class="search-results"></div>
                    </div>
                </div>
                <hr class="section-divider">
                <div class="item-grid" id="folderGrid"></div>
            </div>
        `;
        appContainer.innerHTML = html;
        setupSearch();

        const folderGrid = document.getElementById('folderGrid');
        const rootFolders = new Set();

        allDocuments.forEach(doc => {
            if (doc.path.length > 0) rootFolders.add(doc.path[0]);
        });

        // Unified Card Rendering
        [...rootFolders].sort().forEach((folderName, i) => {
            let themeClass = 'card-theme-glow-' + (i % 4);

            folderGrid.innerHTML += `
                <div class="item-card ${themeClass}" onclick="navigateTo('${folderName}')">
                    <div class="item-title">${folderName}</div>
                </div>
            `;
        });

    } else {
        // TIER 2+: SUBFOLDERS AND DOCUMENTS
        mainHeader.style.display = 'none';
        mainDivider.style.display = 'none';

        let currentFolderName = currentPath[currentPath.length - 1];

        let backName = "Home";
        if (currentPath.length > 1) {
            backName = currentPath[currentPath.length - 2];
        }

        let html = `
            <div class="view-container">
                <div class="view-header">
                    <h2 class="view-title">${currentFolderName}</h2>
                    <button class="btn-back" onclick="goBack()">
                        ${navIcon} Back to ${backName}
                    </button>
                </div>
                <div class="item-grid" id="contentGrid"></div>
            </div>
        `;
        appContainer.innerHTML = html;

        const contentGrid = document.getElementById('contentGrid');
        const currentPathStr = currentPath.join('/');
        const subfolders = new Set();

        allDocuments.forEach(doc => {
            const docPathStr = doc.path.join('/');
            if (docPathStr.startsWith(currentPathStr + '/') && doc.path.length > currentPath.length) {
                subfolders.add(doc.path[currentPath.length]);
            }
        });

        let cardCounter = 0;

        // Unified Subfolder Rendering
        [...subfolders].sort().forEach(folderName => {
            let themeClass = 'card-theme-glow-' + (cardCounter % 4);
            contentGrid.innerHTML += `
                <div class="item-card ${themeClass}" onclick="navigateTo('${folderName}')">
                    <div class="item-title">${folderName}</div>
                </div>
            `;
            cardCounter++;
        });

        // Unified File Rendering
        const filesHere = allDocuments.filter(doc => doc.path.join('/') === currentPathStr);
        filesHere.forEach(doc => {
            const previewUrl = `https://drive.google.com/file/d/${doc.id}/preview`;
            let themeClass = 'card-theme-glow-' + (cardCounter % 4);
            const cleanName = formatName(doc.name);

            contentGrid.innerHTML += `
                <div class="item-card ${themeClass}" onclick="openDocument('${previewUrl}', '${cleanName}')">
                    <div class="item-title">${cleanName}</div>
                </div>
            `;
            cardCounter++;
        });

        if (subfolders.size === 0 && filesHere.length === 0) {
            contentGrid.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">This folder is empty.</p>';
        }
    }
}

function navigateTo(folderName) {
    currentPath.push(folderName);
    renderView();
}

function goBack() {
    currentPath.pop();
    renderView();
}

function setupSearch() {
    const searchInput = document.getElementById('global-search');
    const searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchResults.innerHTML = '';

        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const matches = allDocuments.filter(doc =>
            formatName(doc.name).toLowerCase().includes(query)
        );

        if (matches.length > 0) {
            matches.slice(0, 10).forEach(match => {
                const docPath = match.path.length > 0 ? match.path.join(' / ') : 'Home';
                const previewUrl = `https://drive.google.com/file/d/${match.id}/preview`;
                const cleanName = formatName(match.name);

                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `
                    <div class="sr-equip">${cleanName}</div>
                    <div class="sr-area">Located in: ${docPath}</div>
                `;
                div.onclick = () => {
                    openDocument(previewUrl, cleanName);
                    searchInput.value = '';
                    searchResults.style.display = 'none';
                };
                searchResults.appendChild(div);
            });
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div class="search-result-empty">No matching documents found.</div>';
            searchResults.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

// --- Universal Modal Functions ---

function openDocument(url, title) {
    const modal = document.getElementById('docModal');
    const viewer = document.getElementById('docViewer');
    const mTitle = document.getElementById('modalTitle');

    if (!modal || !viewer || !mTitle) {
        alert("Error: Modal elements missing in HTML. Please add the <div id='docModal'> block to index.html");
        return;
    }

    mTitle.innerText = title;
    viewer.src = url;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeDocument() {
    document.getElementById('docModal').style.display = 'none';
    document.getElementById('docViewer').src = '';
    document.body.style.overflow = 'auto';
}
