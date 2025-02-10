document.addEventListener("DOMContentLoaded", async function () {
    const nameField = document.getElementById("name");
    const emailField = document.getElementById("email");
    const messageField = document.getElementById("message");
    const contactForm = document.getElementById("contactForm");
    const successMessage = document.getElementById("successMessage");

    if (!nameField || !emailField || !messageField || !contactForm || !successMessage) {
        console.error("Missing form elements! Ensure all form fields exist.");
        return;
    }

    // Fetch the reCAPTCHA site key from the backend
    let recaptchaSiteKey;
    try {
        const recaptchaResponse = await fetch("/recaptcha-key");
        const recaptchaData = await recaptchaResponse.json();
        recaptchaSiteKey = recaptchaData.siteKey;
    } catch (error) {
        console.error("Error fetching reCAPTCHA site key:", error);
        return;
    }

    try {
        const response = await fetch("/check-auth");
        const data = await response.json();

        if (data.loggedIn) {
            nameField.value = data.name;
            emailField.value = data.email;
        }
    } catch (error) {
        console.error("Error fetching auth status:", error);
    }

    contactForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        grecaptcha.ready(async function () {
            try {
                const token = await grecaptcha.execute(recaptchaSiteKey, { action: "submit" });

                const formData = {
                    name: nameField.value,
                    email: emailField.value,
                    message: messageField.value,
                    recaptchaToken: token
                };

                const response = await fetch("/send-message", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                if (result.success) {
                    // Hide Form and Show Success Message
                    contactForm.classList.add("hidden");
                    successMessage.classList.remove("hidden");

                    // Wait 5 seconds, then fade out the success message and show the form again
                    setTimeout(() => {
                        successMessage.style.opacity = "0";
                        setTimeout(() => {
                            successMessage.classList.add("hidden");
                            successMessage.style.opacity = "1"; // Reset opacity
                            contactForm.classList.remove("hidden"); // Show form again
                            contactForm.reset(); // Reset form fields
                        }, 1000); // Fade out transition
                    }, 5000);
                } else {
                    alert("reCAPTCHA verification failed. Try again.");
                }
            } catch (err) {
                console.error("reCAPTCHA execution failed:", err);
                alert("reCAPTCHA error, please try again.");
            }
        });
    });
});
