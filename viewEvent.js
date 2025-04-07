document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const container = document.getElementById('eventDetails');

  if (!eventId) {
    showError('Invalid event ID', true);
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading event details...</p>
    </div>
  `;

  fetch(`/admin/view-event-data?id=${eventId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(event => {
      if (!event || !event.event_name) {
        throw new Error('Invalid event data received');
      }

      container.innerHTML = `
        <div class="detail-section">
          <h2>Basic Information</h2>
          <div class="detail-row">
            <div class="detail-label">Event ID:</div>
            <div class="detail-value">${event.id || 'N/A'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Event Name:</div>
            <div class="detail-value">${event.event_name}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Submitted By:</div>
            <div class="detail-value">${event.username}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Committee:</div>
            <div class="detail-value">${event.committee_name || 'N/A'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Status:</div>
            <div class="detail-value status-${event.status_name.toLowerCase()}">${event.status_name}</div>
          </div>
        </div>

        <div class="detail-section">
          <h2>Event Schedule</h2>
          <div class="detail-row">
            <div class="detail-label">Date Filled:</div>
            <div class="detail-value">${formatDate(event.date_filled)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Venue:</div>
            <div class="detail-value">${event.venue || 'N/A'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date From:</div>
            <div class="detail-value">${formatDate(event.date_from)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date To:</div>
            <div class="detail-value">${formatDate(event.date_to)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Time Slot:</div>
            <div class="detail-value">${event.time_slot || 'N/A'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Duration:</div>
            <div class="detail-value">${event.duration || 'N/A'}</div>
          </div>
        </div>

        ${(event.extra_requirements || event.catering_requirements) ? `
        <div class="detail-section">
          <h2>Requirements</h2>
          ${event.extra_requirements ? `
          <div class="requirements-section">
            <h3>Extra Requirements</h3>
            <p>${event.extra_requirements}</p>
          </div>
          ` : ''}
          ${event.catering_requirements ? `
          <div class="requirements-section">
            <h3>Catering Requirements</h3>
            <p>${event.catering_requirements}</p>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${event.admin_comment ? `
        <div class="detail-section">
          <h2>Admin Feedback</h2>
          <div class="admin-feedback">
            <p>${event.admin_comment}</p>
          </div>
        </div>
        ` : ''}

        <div class="action-buttons">
          <a href="adminDashboard.html" class="back-btn">Back to Dashboard</a>
        </div>
      `;
    })
    .catch(error => {
      console.error('Error loading event details:', error);
      showError(`Failed to load event details: ${error.message}`);
    });

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function showError(message, redirect = false) {
    container.innerHTML = `
      <div class="error-state">
        <p>${message}</p>
        <button onclick="window.location.href='adminDashboard.html'" class="back-btn">
          Back to Dashboard
        </button>
      </div>
    `;
    if (redirect) {
      setTimeout(() => {
        window.location.href = 'adminDashboard.html';
      }, 3000);
    }
  }
});
