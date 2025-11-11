// Initialize data storage
let participants = JSON.parse(localStorage.getItem('eventParticipants')) || [];
let participantIdCounter = parseInt(localStorage.getItem('participantIdCounter')) || 1;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadParticipants();
    populateEventFilter();
    updateStats();
});

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Reload data if admin tab
    if (tabName === 'admin') {
        loadParticipants();
        updateStats();
    }
}

// Handle registration form submission
function handleRegistration(event) {
    event.preventDefault();
    
    // Hide previous messages
    document.getElementById('success-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    
    // Get form values
    const formData = {
        id: participantIdCounter++,
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        contact: document.getElementById('contact').value.trim(),
        event: document.getElementById('event').value,
        notes: document.getElementById('notes').value.trim(),
        registrationDate: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: new Date().toISOString()
    };
    
    // Validate email
    if (!isValidEmail(formData.email)) {
        showError('Please enter a valid email address.');
        return;
    }
    
    // Check for duplicate email for same event
    const duplicate = participants.find(p => 
        p.email.toLowerCase() === formData.email.toLowerCase() && 
        p.event === formData.event
    );
    
    if (duplicate) {
        showError('You are already registered for this event.');
        return;
    }
    
    // Add to participants array
    participants.push(formData);
    
    // Save to localStorage
    localStorage.setItem('eventParticipants', JSON.stringify(participants));
    localStorage.setItem('participantIdCounter', participantIdCounter.toString());
    
    // Send confirmation email
    sendConfirmationEmail(formData);
    
    // Show success message
    document.getElementById('success-message').style.display = 'block';
    
    // Reset form
    document.getElementById('registrationForm').reset();
    
    // Scroll to success message
    document.getElementById('success-message').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show error message
function showError(message) {
    document.getElementById('error-text').textContent = message;
    document.getElementById('error-message').style.display = 'block';
}

// Send confirmation email (simulated)
function sendConfirmationEmail(participant) {
    // In a real application, this would call a backend API
    // For demo purposes, we'll simulate it and show an alert
    
    const emailContent = `
        Subject: Event Registration Confirmation
        
        Dear ${participant.name},
        
        Thank you for registering for "${participant.event}"!
        
        Your registration details:
        - Name: ${participant.name}
        - Email: ${participant.email}
        - Contact: ${participant.contact}
        - Event: ${participant.event}
        - Registration Date: ${participant.registrationDate}
        
        We look forward to seeing you at the event!
        
        Best regards,
        Event Management Team
    `;
    
    // Log to console (in production, this would be sent via email service)
    console.log('Confirmation Email Sent:', emailContent);
    
    // You can integrate with EmailJS or a backend service here
    // Example with EmailJS (requires setup):
    // emailjs.send('service_id', 'template_id', {
    //     to_email: participant.email,
    //     to_name: participant.name,
    //     event_name: participant.event,
    //     registration_date: participant.registrationDate
    // });
}

// Load participants into table
function loadParticipants() {
    const tbody = document.getElementById('participants-tbody');
    tbody.innerHTML = '';
    
    if (participants.length === 0) {
        document.getElementById('no-results').style.display = 'block';
        return;
    }
    
    document.getElementById('no-results').style.display = 'none';
    
    // Sort by registration date (newest first)
    const sortedParticipants = [...participants].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    sortedParticipants.forEach(participant => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${participant.id}</td>
            <td>${participant.name}</td>
            <td>${participant.email}</td>
            <td>${participant.contact}</td>
            <td>${participant.event}</td>
            <td>${participant.registrationDate}</td>
            <td>
                <button class="action-btn email-btn" onclick="resendEmail(${participant.id})" title="Resend Email">📧</button>
                <button class="action-btn delete-btn" onclick="deleteParticipant(${participant.id})" title="Delete">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update statistics
function updateStats() {
    const totalRegistrations = participants.length;
    const uniqueEvents = new Set(participants.map(p => p.event)).size;
    
    document.getElementById('total-registrations').textContent = totalRegistrations;
    document.getElementById('unique-events').textContent = uniqueEvents;
}

// Populate event filter dropdown
function populateEventFilter() {
    const eventFilter = document.getElementById('event-filter');
    const uniqueEvents = [...new Set(participants.map(p => p.event))].sort();
    
    // Clear existing options except "All Events"
    eventFilter.innerHTML = '<option value="">All Events</option>';
    
    uniqueEvents.forEach(event => {
        const option = document.createElement('option');
        option.value = event;
        option.textContent = event;
        eventFilter.appendChild(option);
    });
}

// Filter participants
function filterParticipants() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const eventFilter = document.getElementById('event-filter').value;
    
    const tbody = document.getElementById('participants-tbody');
    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const event = row.cells[4].textContent;
        
        const matchesSearch = !searchTerm || 
            name.includes(searchTerm) || 
            email.includes(searchTerm) || 
            event.toLowerCase().includes(searchTerm);
        
        const matchesFilter = !eventFilter || event === eventFilter;
        
        if (matchesSearch && matchesFilter) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show/hide no results message
    if (visibleCount === 0 && participants.length > 0) {
        document.getElementById('no-results').style.display = 'block';
    } else {
        document.getElementById('no-results').style.display = 'none';
    }
}

// Delete participant
function deleteParticipant(id) {
    if (confirm('Are you sure you want to delete this registration?')) {
        participants = participants.filter(p => p.id !== id);
        localStorage.setItem('eventParticipants', JSON.stringify(participants));
        loadParticipants();
        updateStats();
        populateEventFilter();
        filterParticipants(); // Reapply filters
    }
}

// Resend confirmation email
function resendEmail(id) {
    const participant = participants.find(p => p.id === id);
    if (participant) {
        sendConfirmationEmail(participant);
        alert(`Confirmation email sent to ${participant.email}`);
    }
}

// Export data to CSV
function exportData() {
    if (participants.length === 0) {
        alert('No data to export.');
        return;
    }
    
    // Get filtered data
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const eventFilter = document.getElementById('event-filter').value;
    
    let filteredData = participants.filter(p => {
        const matchesSearch = !searchTerm || 
            p.name.toLowerCase().includes(searchTerm) || 
            p.email.toLowerCase().includes(searchTerm) || 
            p.event.toLowerCase().includes(searchTerm);
        
        const matchesFilter = !eventFilter || p.event === eventFilter;
        
        return matchesSearch && matchesFilter;
    });
    
    // Create CSV content
    const headers = ['ID', 'Name', 'Email', 'Contact', 'Event', 'Registration Date', 'Notes'];
    const csvRows = [headers.join(',')];
    
    filteredData.forEach(participant => {
        const row = [
            participant.id,
            `"${participant.name}"`,
            participant.email,
            participant.contact,
            `"${participant.event}"`,
            `"${participant.registrationDate}"`,
            `"${participant.notes || ''}"`
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `event_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


