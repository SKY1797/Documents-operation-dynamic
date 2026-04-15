// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE. IT MUST END IN /exec
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjH8cLS0UVOXfRLKw7iOxaKttsO2O32KlRrwSmacGdSH3T_zLUy-MHuUlFWznBX5QF/exec';

let allDocuments = []; 

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(SCRIPT_URL);
        
        // Fetch the raw text first to see if Google intercepted the request
        const rawText = await response.text();
        
        try {
            // Try to parse it as JSON
            allDocuments = JSON.parse(rawText);
        } catch (parseError) {
            // If it fails, Google sent an HTML error or login page instead of JSON
            document.getElementById('loadingMessage').innerHTML = 
                "<strong>Connection Error:</strong> Apps Script returned an HTML page instead of data. <br><br>1. Check that your SCRIPT_URL ends in <strong>/exec</strong>.<br>2. Ensure 'Who has access' is set to <strong>Anyone</strong>.";
            console.error("Raw response received:", rawText);
            return;
        }
        
        if (allDocuments.error) {
            document.getElementById('loadingMessage').innerText = "Script Error: " + allDocuments.error;
            return;
        }

        document.getElementById('loadingMessage').style.display = 'none';
        displayDocuments(allDocuments);
    } catch (error) {
        document.getElementById('loadingMessage').innerText = "Network Error: Could not connect to Google Apps Script.";
        console.error("Fetch error:", error);
    }
});

function displayDocuments(docs) {
    const listContainer = document.getElementById('documentList');
    listContainer.innerHTML = ''; 

    if (docs.length === 0) {
        listContainer.innerHTML = '<p>No documents found matching this criteria.</p>';
        return;
    }

    docs.forEach(doc => {
        const previewUrl = `https://drive.google.com/file/d/${doc.id}/preview`;
        
        const card = `
            <div class="doc-card">
                <div>
                    <span class="folder-badge">${doc.parentFolder}</span>
                    <h3>${doc.name}</h3>
                </div>
                <a href="${previewUrl}" class="view-btn" target="_blank">View PDF</a>
            </div>
        `;
        listContainer.innerHTML += card;
    });
}

function filterDocs(folderName) {
    if (folderName === 'all') {
        displayDocuments(allDocuments);
        return;
    }

    const searchTerm = folderName.toLowerCase();
    const filteredDocs = allDocuments.filter(doc => 
        doc.parentFolder.toLowerCase().includes(searchTerm)
    );
    displayDocuments(filteredDocs);
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredDocs = allDocuments.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm) || 
        doc.parentFolder.toLowerCase().includes(searchTerm)
    );
    displayDocuments(filteredDocs);
});
