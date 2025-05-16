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
        
        // Set tag if it exists
        const tagSelect = document.getElementById('reminder-tag');
        if (tagSelect && reminder.tag) {
            tagSelect.value = reminder.tag;
        } else if (tagSelect) {
            tagSelect.value = '';
        }
        
        // Set edit mode
        reminderForm.setAttribute('data-edit-id', id);
        
        // Scroll to form
        document.getElementById('add-reminder-panel').scrollIntoView({ behavior: 'smooth' });
        
        showNotification('Editing reminder');
    }
}

// Load reminders from localStorage with filtering
function loadReminders() {
    try {
        // Get reminders
        const reminders = getReminders();
        
        // Apply filters
        let filteredReminders = reminders;
        
        // Filter by date if selected
        const filterDate = filterDateInput.value;
        if (filterDate) {
            filteredReminders = filteredReminders.filter(reminder => reminder.date === filterDate);
        }
        
        // Filter by tag if selected
        if (activeTagFilter && activeTagFilter !== 'all') {
            filteredReminders = filteredReminders.filter(reminder => reminder.tag === activeTagFilter);
        }
        
        // Filter by search query if provided
        if (searchQuery) {
            filteredReminders = filteredReminders.filter(reminder => 
                reminder.text.toLowerCase().includes(searchQuery) ||
                (reminder.tag && reminder.tag.toLowerCase().includes(searchQuery))
            );
        }
        
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
            
            if (searchQuery) {
                emptyState.textContent = `No reminders found for "${searchQuery}"`;
            } else if (activeTagFilter !== 'all') {
                emptyState.textContent = `No "${activeTagFilter}" reminders found`;
            } else if (filterDate) {
                emptyState.textContent = `No reminders found for ${formatDateDisplay(filterDate)}`;
            } else {
                emptyState.textContent = 'No reminders yet. Add one above!';
            }
            
            remindersList.appendChild(emptyState);
        } else {
            // Display each reminder
            filteredReminders.forEach(displayReminder);
            
            // Update all countdowns
            updateCountdowns();
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
    
    // Create tag HTML if a tag exists
    let tagHTML = '';
    if (reminder.tag) {
        tagHTML = `<div class="reminder-tags">
            <span class="tag ${reminder.tag}">${reminder.tag}</span>
        </div>`;
    }
    
    // Calculate time left
    const timeLeft = getTimeLeft(reminder.date, reminder.time);
    const countdownClass = getCountdownClass(timeLeft);
    
    // Add reminder content
    reminderElement.innerHTML = `
        <div class="reminder-header">
            <h3>${reminder.text}</h3>
            <span class="countdown ${countdownClass}" data-date="${reminder.date}" data-time="${reminder.time}">${timeLeft}</span>
        </div>
        ${tagHTML}
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

// Calculate and format time left
function getTimeLeft(date, time) {
    const reminderDate = new Date(`${date}T${time}`);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diff = reminderDate - now;
    
    // If already passed
    if (diff < 0) {
        return 'Overdue';
    }
    
    // Convert to days/hours/minutes
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format output
    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} left`;
    } else {
        return `${minutes} minute${minutes > 1 ? 's' : ''} left`;
    }
}

// Get countdown class based on time left
function getCountdownClass(timeLeftText) {
    if (timeLeftText === 'Overdue') {
        return 'overdue';
    }
    
    if (timeLeftText.includes('minute')) {
        return 'imminent';
    }
    
    if (timeLeftText.includes('hour') && !timeLeftText.includes('24 hours')) {
        return 'soon';
    }
    
    return '';
}

// Update all countdown timers
function updateCountdowns() {
    const countdowns = document.querySelectorAll('.countdown');
    
    countdowns.forEach(countdown => {
        const date = countdown.getAttribute('data-date');
        const time = countdown.getAttribute('data-time');
        
        if (date && time) {
            const timeLeft = getTimeLeft(date, time);
            const countdownClass = getCountdownClass(timeLeft);
            
            // Update text and class
            countdown.textContent = timeLeft;
            
            // Remove all classes except 'countdown'
            countdown.className = 'countdown';
            
            // Add the appropriate class
            if (countdownClass) {
                countdown.classList.add(countdownClass);
            }
        }
    });
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
            exportDate: new Date().toISOString(),
            version: '2.0.0' // Add version info for future compatibility
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
                    
                    // Ensure all reminders have tags (for backward compatibility)
                    importData.reminders.forEach(reminder => {
                        if (!reminder.tag) {
                            reminder.tag = '';
                        }
                    });
                    
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

// Delete a reminder
function deleteReminder(id) {
    try {
        // Remove from localStorage
        let reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        reminders = reminders.filter(reminder => reminder.id != id);
        localStorage.setItem('reminders', JSON.stringify(reminders));
        
        // Remove from UI
        const reminderElement = document.querySelector(`.reminder-item[data-id="${id}"]`);
        if (reminderElement) {
            reminderElement.remove();
        }
        
        // Check if list is now empty
        if (reminders.length === 0 || document.querySelectorAll('.reminder-item').length === 0) {
            loadReminders(); // Will show the empty state
        }
        
        // Show delete notification
        showNotification('Reminder deleted', 'warning');
    } catch (error) {
        console.error('Error deleting reminder:', error);
        showNotification('Error deleting reminder', 'error');
    }
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
}// Load theme preference from localStorage
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
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const tagButtons = document.querySelectorAll('.tag-btn');

// Global Variables
let activeTagFilter = 'all';
let searchQuery = '';

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
    
    // Start countdown timer updates
    setInterval(updateCountdowns, 60000); // Update every minute
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
    
    // Search functionality
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Tag filtering
    if (tagButtons) {
        tagButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                tagButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Set active tag filter
                activeTagFilter = this.getAttribute('data-tag');
                
                // Reload reminders with tag filter
                loadReminders();
            });
        });
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

// Handle search functionality
function handleSearch() {
    searchQuery = searchInput.value.trim().toLowerCase();
    loadReminders();
    
    if (searchQuery) {
        showNotification(`Showing results for "${searchQuery}"`);
    }
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    loadReminders();
    showNotification('Search cleared');
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const reminderText = document.getElementById('reminder-text').value;
    const reminderDate = document.getElementById('reminder-date').value;
    const reminderTime = document.getElementById('reminder-time').value;
    const reminderTag = document.getElementById('reminder-tag').value;
    
    // Validation
    if (!reminderText || !reminderDate || !reminderTime) {
        showNotification('Please fill out all required fields', 'error');
        return;
    }
    
    // Check if we're editing an existing reminder
    const editId = reminderForm.getAttribute('data-edit-id');
    
    if (editId) {
        // Update existing reminder
        updateReminder(editId, reminderText, reminderDate, reminderTime, reminderTag);
    } else {
        // Add new reminder
        addReminder(reminderText, reminderDate, reminderTime, reminderTag);
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
function addReminder(text, date, time, tag) {
    try {
        // Create reminder object
        const reminder = {
            id: Date.now(), // Use timestamp as unique ID
            text: text,
            date: date,
            time: time,
            tag: tag,
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
function updateReminder(id, text, date, time, tag) {
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
            reminders[index].tag = tag;
            
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