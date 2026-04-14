// PASTE YOUR NEW GOOGLE APPS SCRIPT WEB APP URL HERE
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyGMJk9VR95X_ypQXBwnYZcRuAaTVvQy7vAojTP5rQ1E7xOsdFfTj0_Q8TM7Xu6497_/exec';

let allDocuments = []; 

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(SCRIPT_URL);
        allDocuments = await response.json();
        
        if (allDocuments.error) {
            document.getElementById('loadingMessage').innerText = "Error: Check your Folder ID and Permissions.";
            return;
        }

        document.getElementById('loadingMessage').style.display = 'none';
        displayDocuments(allDocuments);
    } catch (error) {
        document.getElementById('loadingMessage').innerText = "Failed to load documents.";
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

// Filters by looking at the folder name instead of the file name
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

// Live Search Bar searches the actual file names
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredDocs = allDocuments.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm) || 
        doc.parentFolder.toLowerCase().includes(searchTerm)
    );
    displayDocuments(filteredDocs);
});
