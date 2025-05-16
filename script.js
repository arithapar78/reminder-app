// Load theme preference from localStorage
function loadThemePreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
        updateThemeToggleUI(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateThemeToggleUI(false);
    }
}

// Toggle between light and dark theme
function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    
    // Update localStorage
    localStorage.setItem('darkMode', isDarkMode);
    
    // Update toggle UI
    updateThemeToggleUI(isDarkMode);
    
    // Show notification
    showNotification(`Switched to ${isDarkMode ? 'dark' : 'light'} mode`);
}

// Update theme toggle button UI
function updateThemeToggleUI(isDarkMode) {
    const toggleIcon = themeToggle.querySelector('.toggle-icon');
    const toggleText = themeToggle.querySelector('.toggle-text');
    
    if (isDarkMode) {
        toggleIcon.textContent = '🏀'; // Keep basketball icon for both themes
        toggleText.textContent = 'Light Mode';
    } else {
        toggleIcon.textContent = '🏀'; // Keep basketball icon for both themes
        toggleText.textContent = 'Dark Mode';
    }
}// DOM Elements
const reminderForm = document.getElementById('reminder-form');
const remindersList = document.getElementById('reminders-list');
const filterDateInput = document.getElementById('filter-date');
const filterBtn = document.getElementById('filter-btn');
const showAllBtn = document.getElementById('show-all-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const clearBtn = document.getElementById('clear-btn');
const dateDisplay = document.getElementById('date-display');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const themeToggle = document.getElementById('theme-toggle');

// Initialize app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);

// Main initialization function
function initApp() {
    // Set up date display
    updateDateDisplay();
    
    // Set up default date values
    setDefaultDates();
    
    // Load theme preference
    loadThemePreference();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load and display reminders
    loadReminders();
}

// Update the date display in the header
function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('en-US', options);
}

// Set default dates for form and filter
function setDefaultDates() {
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    
    // Set default date for new reminders to today
    const reminderDateInput = document.getElementById('reminder-date');
    if (reminderDateInput) {
        reminderDateInput.value = formattedDate;
    }
    
    // Set default filter date to today
    if (filterDateInput) {
        filterDateInput.value = formattedDate;
    }
}

// Helper function to format date for input fields
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Set up event listeners
function setupEventListeners() {
    // Form submission for adding/editing reminders
    if (reminderForm) {
        reminderForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Filter buttons
    if (filterBtn) {
        filterBtn.addEventListener('click', filterReminders);
    }
    
    if (showAllBtn) {
        showAllBtn.addEventListener('click', showAllReminders);
    }
    
    // Data management buttons
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReminders);
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', importReminders);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllReminders);
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const reminderText = document.getElementById('reminder-text').value;
    const reminderDate = document.getElementById('reminder-date').value;
    const reminderTime = document.getElementById('reminder-time').value;
    
    // Validation
    if (!reminderText || !reminderDate || !reminderTime) {
        showNotification('Please fill out all fields', 'error');
        return;
    }
    
    // Check if we're editing an existing reminder
    const editId = reminderForm.getAttribute('data-edit-id');
    
    if (editId) {
        // Update existing reminder
        updateReminder(editId, reminderText, reminderDate, reminderTime);
    } else {
        // Add new reminder
        addReminder(reminderText, reminderDate, reminderTime);
    }
    
    // Reset form
    reminderForm.reset();
    reminderForm.removeAttribute('data-edit-id');
    
    // Restore default date
    setDefaultDates();
    
    // Reload reminders
    loadReminders();
}

// Add a new reminder
function addReminder(text, date, time) {
    try {
        // Create reminder object
        const reminder = {
            id: Date.now(), // Use timestamp as unique ID
            text: text,
            date: date,
            time: time,
            createdAt: new Date().toISOString()
        };
        
        // Get existing reminders
        const reminders = getReminders();
        
        // Add new reminder
        reminders.push(reminder);
        
        // Save to localStorage
        saveReminders(reminders);
        
        showNotification('Reminder added successfully');
    } catch (error) {
        console.error('Error adding reminder:', error);
        showNotification('Failed to add reminder', 'error');
    }
}

// Update an existing reminder
function updateReminder(id, text, date, time) {
    try {
        // Get existing reminders
        const reminders = getReminders();
        
        // Find the reminder to update
        const index = reminders.findIndex(reminder => reminder.id == id);
        
        if (index !== -1) {
            // Update the reminder
            reminders[index].text = text;
            reminders[index].date = date;
            reminders[index].time = time;
            
            // Save to localStorage
            saveReminders(reminders);
            
            showNotification('Reminder updated successfully');
        } else {
            showNotification('Reminder not found', 'error');
        }
    } catch (error) {
        console.error('Error updating reminder:', error);
        showNotification('Failed to update reminder', 'error');
    }
}

// Delete a reminder
function deleteReminder(id) {
    try {
        // Get existing reminders
        const reminders = getReminders();
        
        // Filter out the reminder to delete
        const updatedReminders = reminders.filter(reminder => reminder.id != id);
        
        // Save to localStorage
        saveReminders(updatedReminders);
        
        // Reload reminders
        loadReminders();
        
        showNotification('Reminder deleted');
    } catch (error) {
        console.error('Error deleting reminder:', error);
        showNotification('Failed to delete reminder', 'error');
    }
}

// Edit a reminder
function editReminder(id) {
    // Get existing reminders
    const reminders = getReminders();
    
    // Find the reminder to edit
    const reminder = reminders.find(reminder => reminder.id == id);
    
    if (reminder) {
        // Populate form with reminder data
        document.getElementById('reminder-text').value = reminder.text;
        document.getElementById('reminder-date').value = reminder.date;
        document.getElementById('reminder-time').value = reminder.time;
        
        // Set edit mode
        reminderForm.setAttribute('data-edit-id', id);
        
        // Scroll to form
        document.getElementById('add-reminder-panel').scrollIntoView({ behavior: 'smooth' });
        
        showNotification('Editing reminder');
    }
}

// Load reminders from localStorage
function loadReminders() {
    try {
        // Get reminders
        const reminders = getReminders();
        
        // Check if we're filtering
        const filterDate = filterDateInput.value;
        
        // Filter reminders if a date is selected
        const filteredReminders = filterDate
            ? reminders.filter(reminder => reminder.date === filterDate)
            : reminders;
        
        // Sort reminders by date and time
        filteredReminders.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });
        
        // Clear current list
        remindersList.innerHTML = '';
        
        // Check if we have any reminders
        if (filteredReminders.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = filterDate
                ? `No reminders found for ${formatDateDisplay(filterDate)}`
                : 'No reminders yet. Add one above!';
            remindersList.appendChild(emptyState);
        } else {
            // Display each reminder
            filteredReminders.forEach(displayReminder);
        }
    } catch (error) {
        console.error('Error loading reminders:', error);
        showNotification('Failed to load reminders', 'error');
    }
}

// Display a single reminder
function displayReminder(reminder) {
    // Create reminder element
    const reminderElement = document.createElement('div');
    reminderElement.className = 'reminder-item';
    reminderElement.setAttribute('data-id', reminder.id);
    
    // Format date and time for display
    const displayDate = formatDateDisplay(reminder.date);
    const displayTime = formatTimeDisplay(reminder.time);
    
    // Add reminder content
    reminderElement.innerHTML = `
        <h3>${reminder.text}</h3>
        <div class="reminder-meta">
            <span class="reminder-date">${displayDate}</span>
            <span class="reminder-time">${displayTime}</span>
        </div>
        <div class="reminder-actions">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;
    
    // Add event listeners
    const editBtn = reminderElement.querySelector('.edit-btn');
    const deleteBtn = reminderElement.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => editReminder(reminder.id));
    deleteBtn.addEventListener('click', () => deleteReminder(reminder.id));
    
    // Add to DOM
    remindersList.appendChild(reminderElement);
}

// Helper function to format date for display
function formatDateDisplay(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Helper function to format time for display
function formatTimeDisplay(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
}

// Filter reminders by date
function filterReminders() {
    loadReminders();
}

// Show all reminders
function showAllReminders() {
    // Clear filter date
    filterDateInput.value = '';
    
    // Reload reminders
    loadReminders();
}

// Export reminders
function exportReminders() {
    try {
        // Get reminders
        const reminders = getReminders();
        
        if (reminders.length === 0) {
            showNotification('No reminders to export', 'warning');
            return;
        }
        
        // Create export data
        const exportData = {
            reminders: reminders,
            exportDate: new Date().toISOString()
        };
        
        // Convert to JSON string
        const dataStr = JSON.stringify(exportData, null, 2);
        
        // Create download link
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileName = 'reminders-export.json';
        
        // Create download link
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        showNotification('Reminders exported successfully');
    } catch (error) {
        console.error('Error exporting reminders:', error);
        showNotification('Failed to export reminders', 'error');
    }
}

// Import reminders
function importReminders() {
    try {
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'application/json';
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    // Validate import data
                    if (!importData.reminders || !Array.isArray(importData.reminders)) {
                        throw new Error('Invalid import file format');
                    }
                    
                    // Save imported reminders
                    saveReminders(importData.reminders);
                    
                    // Reload reminders
                    loadReminders();
                    
                    showNotification(`${importData.reminders.length} reminders imported successfully`);
                } catch (error) {
                    console.error('Import error:', error);
                    showNotification('Failed to import reminders: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        });
        
        fileInput.click();
    } catch (error) {
        console.error('Error setting up import:', error);
        showNotification('Failed to set up import', 'error');
    }
}

// Clear all reminders
function clearAllReminders() {
    try {
        // Confirm before clearing
        if (confirm('Are you sure you want to delete all reminders? This cannot be undone.')) {
            // Clear reminders
            saveReminders([]);
            
            // Reload reminders
            loadReminders();
            
            showNotification('All reminders cleared');
        }
    } catch (error) {
        console.error('Error clearing reminders:', error);
        showNotification('Failed to clear reminders', 'error');
    }
}

// Helper function to get reminders from localStorage
function getReminders() {
    try {
        const reminders = localStorage.getItem('reminders');
        return reminders ? JSON.parse(reminders) : [];
    } catch (error) {
        console.error('Error getting reminders:', error);
        return [];
    }
}

// Helper function to save reminders to localStorage
function saveReminders(reminders) {
    try {
        localStorage.setItem('reminders', JSON.stringify(reminders));
    } catch (error) {
        console.error('Error saving reminders:', error);
        showNotification('Failed to save reminders', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Set message
    notificationMessage.textContent = message;
    
    // Set type class
    notification.className = 'notification';
    if (type !== 'success') {
        notification.classList.add(type);
    }
    
    // Show notification
    notification.classList.remove('hidden');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}