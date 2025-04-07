document.addEventListener('DOMContentLoaded', () => {
    // Load dashboard data
    loadDashboardData();
    
    // Set up logout button
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});

function loadDashboardData() {
    // Show loading state
    const tableBody = document.getElementById('formTableBody');
    tableBody.innerHTML = '<tr><td colspan="6">Loading data...</td></tr>';

    fetch('/admin/dashboard-data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.events || !Array.isArray(data.events)) {
                throw new Error('Invalid data format received');
            }

            renderEvents(data.events);
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Failed to load data. Error: ${error.message}
                        <button onclick="loadDashboardData()" class="retry-btn">Retry</button>
                    </td>
                </tr>
            `;
        });
}

function renderEvents(events) {
  const tableBody = document.getElementById('formTableBody');
  tableBody.innerHTML = '';

  if (events.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6">No events found</td></tr>';
      return;
  }

  events.forEach(event => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
          <td>${event.id}</td>
          <td>${event.event_name}</td>
          <td>${event.username}</td>
          <td>${formatDate(event.date_submitted || event.date_filled)}</td>
          <td class="status-${event.status_name.toLowerCase()}">${event.status_name}</td>
          <td class="actions">
              <button class="view-btn" onclick="viewDetails(${event.id})">View</button>
              <button class="approve-btn" onclick="openModal(${event.id}, 'approve')">Approve</button>
              <button class="deny-btn" onclick="openModal(${event.id}, 'deny')">Deny</button>
          </td>
      `;
      
      tableBody.appendChild(row);
  });
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
      // Handle both Date objects and strings
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
      });
  } catch (e) {
      console.error('Date formatting error:', e);
      return 'N/A';
  }
}

function logout() {
    fetch('/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url;
        }
    })
    .catch(error => {
        console.error('Logout failed:', error);
        alert('Logout failed. Please try again.');
    });
}

// Modal functions
let currentEventId = null;
let currentAction = null;

function openModal(eventId, action) {
    currentEventId = eventId;
    currentAction = action;
    document.getElementById('commentModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('commentModal').style.display = 'none';
    document.getElementById('commentText').value = '';
}

function viewDetails(eventId) {
    window.location.href = `/view-event.html?id=${eventId}`;
}

// Modal event listeners
document.getElementById('submitComment').addEventListener('click', () => {
    const comment = document.getElementById('commentText').value;
    
    fetch('/admin/update-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            eventId: currentEventId,
            status: currentAction === 'approve' ? 'Approved' : 'Rejected',
            comment: comment
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.reload();
        } else {
            alert(data.error || 'Failed to update status');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update status. Please try again.');
    });
});

document.getElementById('cancelComment').addEventListener('click', closeModal);