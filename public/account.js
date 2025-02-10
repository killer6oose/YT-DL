document.addEventListener("DOMContentLoaded", async () => {
    console.log("🔄 Checking authentication...");
    const response = await fetch("/check-auth");
    const data = await response.json();
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    const deleteAccountModal = new bootstrap.Modal(document.getElementById("deleteAccountModal"));
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const deleteError = document.getElementById("deleteError");

    console.log("🔍 Auth Response:", data);

    if (!data.loggedIn) {
        console.warn("❌ User not logged in. Redirecting to login page.");
        window.location.href = "index.html";
        return;
    }

    document.getElementById("accountName").value = data.name;
    document.getElementById("accountEmail").value = data.email;
    // Save user ID in localStorage for debugging
    localStorage.setItem("userId", data.id);

    // Add event listeners
    document.getElementById("logoutBtn").addEventListener("click", async () => {
        console.log("🚪 Logging out user...");
        await fetch("/logout");
        console.log("✅ User logged out. Redirecting to home page.");
        window.location.href = "index.html";
    });

    // Show Delete Account modal
    deleteAccountBtn.addEventListener("click", () => {
        deleteAccountModal.show();
    });

    // Confirm deletion
    confirmDeleteBtn.addEventListener("click", async () => {
        const inputValue = document.getElementById("confirmDeleteInput").value.trim().toLowerCase();
        if (inputValue !== "delete") {
            deleteError.classList.remove("d-none"); // Show error
            return;
        }

        deleteError.classList.add("d-none"); // Hide error if any

        // Call server route to update isActive = 0
        const response = await fetch("/account/delete-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            alert("Error scheduling account deletion. Please try again.");
            return;
        }

        // Hide modal
        deleteAccountModal.hide();

        // Show red bar
        const container = document.querySelector(".container");
        const alertDiv = document.createElement("div");
        alertDiv.classList.add("alert", "alert-danger", "mt-3");
        alertDiv.innerText = "⚠️ Your account is scheduled for deletion within the next 24 hours.";
        container.prepend(alertDiv);
    });

    document.getElementById("saveEmailBtn").addEventListener("click", async () => {
        const newEmail = document.getElementById("accountEmail").value;
        console.log(`📧 Updating email to: ${newEmail}`);

        const response = await fetch("/account/update-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newEmail }),
        });

        if (response.ok) {
            alert("Email updated successfully!");
            document.querySelector(".warning").style.display = "none";
        } else {
            console.error("❌ Error updating email.");
            alert("Error updating email.");
        }
    });

    async function loadDownloadHistory() {
        console.log("📜 Fetching download history...");
        const response = await fetch("/account/history");

        if (response.status === 401) {
            console.error("❌ Unauthorized: User is not logged in.");
            return;
        }

        const data = await response.json();

        console.log("📄 Download History Data:", data);

        if (!Array.isArray(data)) {
            console.error("⚠️ Unexpected response format for download history:", data);
            return;
        }

        const historyDiv = document.getElementById("history");
        historyDiv.innerHTML = ""; // Clear previous entries

        if (data.length === 0) {
            historyDiv.innerHTML = "<p>No downloads found.</p>";
            return;
        }

        // Create a flexible grid layout
        const gridContainer = document.createElement("div");
        gridContainer.classList.add("download-grid");

        data.forEach(download => {
            const downloadItem = document.createElement("div");
            downloadItem.classList.add("download-item");

            downloadItem.innerHTML = `
                <img src="${download.thumbnail}" class="thumbnail" title="${download.filename}">
                <p>${download.filename}</p>
                <div class="actions">
                    <button class="btn btn-success btn-sm download-btn" data-url="${download.youtube_link}" title="Download">
                        ⬇️
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${download.id}" title="Delete">
                        ❌
                    </button>
                </div>
            `;

            gridContainer.appendChild(downloadItem);
        });

        historyDiv.appendChild(gridContainer);

        // Attach event listeners for the buttons
        document.querySelectorAll(".download-btn").forEach(button => {
            button.addEventListener("click", async (event) => {
                const youtubeLink = event.currentTarget.getAttribute("data-url");

                console.log(`🎬 Re-downloading: ${youtubeLink}`);

                const response = await fetch("/download", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: youtubeLink, format: "audio", fileFormat: "mp3" }), // Default to MP3 for now
                });

                if (!response.ok) {
                    alert("❌ Download failed. Try again.");
                    return;
                }

                // Get correct filename from response headers
                const contentDisposition = response.headers.get("Content-Disposition");
                let filename = "download.mp3";

                if (contentDisposition) {
                    const match = contentDisposition.match(/filename="(.+)"/);
                    if (match && match.length > 1) {
                        filename = decodeURIComponent(match[1]);
                    }
                }

                const blob = await response.blob();
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async (event) => {
                const downloadId = event.currentTarget.getAttribute("data-id");

                if (!confirm("Are you sure you want to delete this download entry?")) return;

                console.log(`🗑️ Deleting download entry ID: ${downloadId}`);

                const response = await fetch("/account/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: downloadId }),
                });

                if (response.ok) {
                    alert("✅ Download entry deleted.");
                    loadDownloadHistory(); // Refresh the list
                } else {
                    alert("❌ Error deleting entry.");
                }
            });
        });
    }

    loadDownloadHistory();
});
/**
 * Function to check if an account is scheduled for deletion
 */
async function checkAccountStatus(data) {
    if (data.isActive === 0) {
        const container = document.querySelector(".container");
        const alertDiv = document.createElement("div");
        alertDiv.classList.add("alert", "alert-danger", "mt-3");
        alertDiv.innerText = "⚠️ Your account is scheduled to be deleted within the next 24 hours.";
        container.prepend(alertDiv);
    }
}