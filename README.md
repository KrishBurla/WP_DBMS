# Event Management System 

## Overview
This is a full-stack web application for managing event requests and approvals in an educational institution. The system allows students to submit event requests and administrators to review, approve, or deny them.

## Features

### User Roles
- **Students/Committees**:
  - Submit event request forms
  - View status of submitted events
  - See administrator feedback on their requests

- **Administrators**:
  - Review all submitted event requests
  - Approve or deny requests with comments
  - View detailed event information
  - Manage event statuses

### Core Functionality
- User authentication (login/logout)
- Event form submission with validation
- Admin dashboard for request management
- Status tracking for students
- Comment/feedback system

## Technical Stack

### Frontend
- HTML5, CSS3, JavaScript
- Responsive design
- Client-side form validation
- Fetch API for server communication

### Backend
- Node.js with Express
- MySQL database
- Session-based authentication
- RESTful API endpoints

### Database Tables
1. `users` - Stores user accounts (students and admins)
2. `committees` - Committee/school information
3. `status` - Possible event statuses (Pending, Approved, etc.)
4. `events` - All event submissions and their details

## Installation & Setup

1. **Prerequisites**:
   - Node.js (v14+)
   - MySQL (v5.7+)
   - Web browser (Chrome, Firefox recommended)

2. **Setup**:
   ```bash
   # Clone repository
   git clone [repository-url]
   cd event-management-system

   # Install dependencies
   npm install

   # Configure database
   # Update dbConfig in WP_Project.js with your MySQL credentials

   # Initialize database
   node WP_Project.js
   ```

3. **Running the Application**:
   ```bash
   node WP_Project.js
   ```
   - Access the application at: `http://localhost:3000`

## Usage

### Student Flow
1. Login with student credentials
2. Access the event form from the student dashboard
3. Fill out and submit the event request
4. Check status page for updates and admin comments

### Admin Flow
1. Login with admin credentials
2. View all submissions in the admin dashboard
3. Click "View" to see details
4. Approve/Deny requests with optional comments
5. Manage all events from one interface

## File Structure

```
/public
  /css
    styles.css       # All application styles
  /js
    adminDashboard.js # Admin dashboard functionality
    formScript.js    # Event form handling
    script.js        # Login functionality
    status.js        # Status page functionality
    viewEvent.js     # Event detail viewing
  adminDashboard.html
  form.html
  index.html
  status.html
  studentHome.html
  view-event.html
WP_Project.js       # Main server application
```
