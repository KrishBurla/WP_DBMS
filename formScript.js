document.addEventListener("DOMContentLoaded", () => {
    const title = document.querySelector("h1");
    if (!title || title.style.display === "none" || title.style.visibility === "hidden") {
        console.error("The title 'Event Form' is not visible.");
    }

    // Add event listener for form submission
    const form = document.getElementById("mainForm");
    if (form) {
        form.addEventListener("submit", handleFormSubmit);
    }
});

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate form first
    if (!validateMainForm()) {
        return false;
    }

    // Prepare form data
    const formData = {
        eventName: document.getElementById("eventName").value.trim(),
        dateFilled: document.getElementById("dateFilled").value.trim(),
        committeeName: document.getElementById("committeeName").value.trim(),
        venue: document.getElementById("venue").value.trim(),
        dateFrom: document.getElementById("dateFrom").value.trim(),
        dateTo: document.getElementById("dateTo").value.trim(),
        timeSlot: document.getElementById("timeSlot").value.trim(),
        duration: document.getElementById("duration").value.trim(),
        extraRequirements: document.getElementById("extraRequirements").value.trim(),
        cateringRequirements: document.getElementById("cateringRequirements").value.trim()
    };

    try {
        // Show loading state
        const submitButton = document.querySelector("#mainForm button[type='submit']");
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        const response = await fetch('/submit-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            credentials: 'include' // Important for session cookies
        });

        if (response.redirected) {
            window.location.href = response.url;
        } else {
            const data = await response.json();
            if (data.error) {
                showFormError(data.error);
            }
        }
    } catch (error) {
        console.error('Submission error:', error);
        showFormError('Failed to submit form. Please try again.');
    } finally {
        // Reset button state
        const submitButton = document.querySelector("#mainForm button[type='submit']");
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
}

function validateMainForm() {
    let isValid = true;

    // Validate date filled
    const dateFilled = document.getElementById("dateFilled").value;
    const dateFilledError = document.getElementById("dateFilledError");
    const datePattern = /^\d{2}-\d{2}-\d{4}$/; // DD-MM-YYYY format
    if (dateFilled.trim() === "") {
        dateFilledError.textContent = "Date filled is required.";
        dateFilledError.style.display = "block";
        isValid = false;
    } else if (!datePattern.test(dateFilled)) {
        dateFilledError.textContent = "Date must be in DD-MM-YYYY format.";
        dateFilledError.style.display = "block";
        isValid = false;
    } else {
        dateFilledError.style.display = "none";
    }

    // Validate event name
    const eventName = document.getElementById("eventName").value;
    const eventNameError = document.getElementById("eventNameError");
    if (eventName.trim() === "") {
        eventNameError.textContent = "Event meeting name is required.";
        eventNameError.style.display = "block";
        isValid = false;
    } else {
        eventNameError.style.display = "none";
    }

    // Validate committee name
    const committeeName = document.getElementById("committeeName").value;
    const committeeNameError = document.getElementById("committeeNameError");
    if (committeeName.trim() === "") {
        committeeNameError.textContent = "Committee/school & section name is required.";
        committeeNameError.style.display = "block";
        isValid = false;
    } else {
        committeeNameError.style.display = "none";
    }

    // Validate venue
    const venue = document.getElementById("venue").value;
    const venueError = document.getElementById("venueError");
    if (venue.trim() === "") {
        venueError.textContent = "Hall/venue name is required.";
        venueError.style.display = "block";
        isValid = false;
    } else {
        venueError.style.display = "none";
    }

    // Validate date from
    const dateFrom = document.getElementById("dateFrom").value;
    const dateFromError = document.getElementById("dateFromError");
    if (dateFrom.trim() === "") {
        dateFromError.textContent = "Start date is required.";
        dateFromError.style.display = "block";
        isValid = false;
    } else if (!datePattern.test(dateFrom)) {
        dateFromError.textContent = "Date must be in DD-MM-YYYY format.";
        dateFromError.style.display = "block";
        isValid = false;
    } else {
        dateFromError.style.display = "none";
    }

    // Validate date to
    const dateTo = document.getElementById("dateTo").value;
    const dateToError = document.getElementById("dateToError");
    if (dateTo.trim() === "") {
        dateToError.textContent = "End date is required.";
        dateToError.style.display = "block";
        isValid = false;
    } else if (!datePattern.test(dateTo)) {
        dateToError.textContent = "Date must be in DD-MM-YYYY format.";
        dateToError.style.display = "block";
        isValid = false;
    } else {
        dateToError.style.display = "none";
    }

    // Scroll to the top of the page if the form is invalid
    if (!isValid) {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return isValid;
}

function showFormError(message) {
    const errorElement = document.getElementById("formError") || document.createElement("div");
    errorElement.textContent = message;
    errorElement.style.color = "red";
    errorElement.style.marginTop = "10px";
    
    if (!document.getElementById("formError")) {
        errorElement.id = "formError";
        const form = document.getElementById("mainForm");
        form.appendChild(errorElement);
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function calculateDuration(timeFrom, timeTo) {
    const parseTime = (time) => {
        const [hours, minutes] = time.split(/[: ]/);
        const period = time.includes("PM") ? "PM" : "AM";
        let hour = parseInt(hours, 10);
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        return hour * 60 + parseInt(minutes, 10);
    };

    const fromMinutes = parseTime(timeFrom);
    const toMinutes = parseTime(timeTo);
    const durationMinutes = toMinutes - fromMinutes;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours} hours and ${minutes} minutes`;
}