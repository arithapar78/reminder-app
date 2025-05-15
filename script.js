// Get DOM elements
const reminderForm = document.querySelector('#reminderForm form');
const remindersList = document.getElementById('remindersList');

// Initialize app settings
let appSettings = {
    darkMode: false,
    mobileView: window.innerWidth < 768,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

// Load reminders and settings when page loads
document.addEventListener('DOMContentLoaded', initializeApp);

// Function to initialize the app
// Function to initialize the app
function initializeApp() {
    // Load user settings
    loadSettings();
    
    // Apply the mobile/desktop view based on settings
    const body = document.body;
    if (appSettings.mobileView) {
        body.classList.add('mobile-view');
    } else {
        body.classList.remove('mobile-view');
    }
    
    // Initialize filter date to today's date - ADD THIS CODE HERE
    const filterDateElement = document.getElementById('filterDate');
    if (filterDateElement) {
        filterDateElement.valueAsDate = new Date();
        filterDateElement.addEventListener('change', handleDateFilterChange);
    }
    
    // Load reminders
    loadReminders();
    
    // Set up form event listeners
    if (reminderForm) {
        reminderForm.addEventListener('submit', addReminder);
    }
    
    // Set up layout toggle
    setupLayoutToggle();
    
    // Set up timezone detection
    displayTimeZone();
}
// Function to set up the layout toggle
function setupLayoutToggle() {
    const layoutToggleBtn = document.getElementById('layoutToggleBtn');
    if (layoutToggleBtn) {
        layoutToggleBtn.addEventListener('click', function() {
            // Toggle mobile view setting
            appSettings.mobileView = !appSettings.mobileView;
            
            // Update UI based on new setting
            document.body.classList.toggle('mobile-view', appSettings.mobileView);
            
            // Update button text
            layoutToggleBtn.textContent = appSettings.mobileView ? 'Switch to Desktop View' : 'Switch to Mobile View';
            
            // Save settings
            saveSettings();
            
            // Show notification
            showNotification(`Switched to ${appSettings.mobileView ? 'mobile' : 'desktop'} view`, 'info');
        });
        
        // Set initial state
        layoutToggleBtn.textContent = appSettings.mobileView ? 'Switch to Desktop View' : 'Switch to Mobile View';
        document.body.classList.toggle('mobile-view', appSettings.mobileView);
    }
}

// Function to move email section to the bottom
function moveEmailSectionToBottom() {
    const container = document.querySelector('.container');
    const emailSettings = document.getElementById('emailSettings');
    const resetPanel = document.getElementById('resetPanel');
    
    if (emailSettings && container && resetPanel) {
        // Add moving class for transition effect
        emailSettings.classList.add('moving');
        
        // Use setTimeout to allow transition to start before removing
        setTimeout(() => {
            // Remove the email settings from its current position
            emailSettings.remove();
            
            // Add it back at the end (before reset panel)
            container.insertBefore(emailSettings, resetPanel);
            
            // Remove moving class to fade it back in
            setTimeout(() => {
                emailSettings.classList.remove('moving');
            }, 50);
        }, 300);
    }
}

// Function to move email section to the top
function moveEmailSectionToTop() {
    const container = document.querySelector('.container');
    const emailSettings = document.getElementById('emailSettings');
    const statsPanel = document.getElementById('statsPanel');
    
    if (emailSettings && container && statsPanel) {
        // Add moving class for transition effect
        emailSettings.classList.add('moving');
        
        // Use setTimeout to allow transition to start before removing
        setTimeout(() => {
            // Remove the email settings from its current position
            emailSettings.remove();
            
            // Add it back at the top (before stats panel)
            container.insertBefore(emailSettings, statsPanel);
            
            // Remove moving class to fade it back in
            setTimeout(() => {
                emailSettings.classList.remove('moving');
            }, 50);
        }, 300);
    }
}

// Function to display the detected timezone
function displayTimeZone() {
    const timezoneDisplay = document.getElementById('timezoneDisplay');
    if (timezoneDisplay) {
        timezoneDisplay.textContent = `Your detected timezone: ${appSettings.timezone}`;
    }
}

// Function to save app settings
function saveSettings() {
    localStorage.setItem('reminderAppSettings', JSON.stringify(appSettings));
}

// Function to load app settings
function loadSettings() {
    const savedSettings = localStorage.getItem('reminderAppSettings');
    if (savedSettings) {
        appSettings = JSON.parse(savedSettings);
    }
}

// Function to add a new reminder
function addReminder(e) {
    e.preventDefault();
    
    // Get form values
    const reminderText = document.getElementById('reminderText').value;
    const reminderTime = document.getElementById('reminderTime').value;
    const reminderDate = document.getElementById('reminderDate').value || new Date().toISOString().split('T')[0];
    const reminderMessage = document.getElementById('reminderMessage').value;
    const isRecurring = document.getElementById('isRecurring').checked;
    const recurringType = document.getElementById('recurringType').value;
    
    // Check if we're editing an existing reminder
    const editId = reminderForm.getAttribute('data-edit-id');
    
    // Validate
    if (!reminderText || !reminderTime) {
        showNotification('Please enter both a reminder and a time', 'error');
        return;
    }
    
    try {
        if (editId) {
            // We're updating an existing reminder
            let reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
            const index = reminders.findIndex(r => r.id == editId);
            
            if (index !== -1) {
                // Update the reminder
                reminders[index].text = reminderText;
                reminders[index].time = reminderTime;
                reminders[index].date = reminderDate;
                reminders[index].message = reminderMessage;
                reminders[index].isRecurring = isRecurring;
                reminders[index].recurringType = recurringType;
                
                // Save back to localStorage
                localStorage.setItem('reminders', JSON.stringify(reminders));
                
                // Reset form
                reminderForm.removeAttribute('data-edit-id');
                document.querySelector('#reminderForm button[type="submit"]').textContent = 'Add Reminder';
                
                // Remove cancel button if it exists
                const cancelBtn = document.getElementById('cancelEditBtn');
                if (cancelBtn) cancelBtn.remove();
                
                showNotification('Reminder updated successfully', 'success');
            }
        } else {
            // Create a new reminder object
            const reminder = {
                id: Date.now(), // Unique ID based on timestamp
                text: reminderText,
                time: reminderTime,
                date: reminderDate,
                message: reminderMessage,
                isRecurring: isRecurring,
                recurringType: recurringType,
                timezone: appSettings.timezone,
                notificationSent: false, // Track if email notification has been sent
                createdAt: new Date().toISOString()
            };
            
            // Add to localStorage
            saveReminder(reminder);
            
            showNotification('Reminder added successfully', 'success');
        }
        
        // Reset form
        reminderForm.reset();
        
        // Set date field back to today
        const dateInput = document.getElementById('reminderDate');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
        
        // Reset recurring options
        const isRecurringCheckbox = document.getElementById('isRecurring');
        if (isRecurringCheckbox) {
            isRecurringCheckbox.checked = false;
            toggleRecurringOptions();
        }
        
        // Reload reminders to refresh the display
        loadReminders();
    } catch (error) {
        console.error('Error adding/updating reminder:', error);
        showNotification('Error saving reminder', 'error');
    }
}
    // Add to localStorage
    saveReminder(reminder);
    
    // Display the reminder if it's for today or future
    const reminderDateObj = new Date(reminderDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (reminderDateObj >= today) {
        displayReminder(reminder);
    }
    
    // Show success notification
    showNotification('Reminder added successfully', 'success');
    
    // Reset form
    reminderForm.reset();
    
    // Set date field back to today
    const dateInput = document.getElementById('reminderDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
        // Reset recurring options
const isRecurringCheckbox = document.getElementById('isRecurring');
if (isRecurringCheckbox) {
    isRecurringCheckbox.checked = false;
    toggleRecurringOptions();
}

// Add this line to reload reminders
loadReminders();
    }
}

// Function to save reminder to localStorage
function saveReminder(reminder) {
    try {
        let reminders = [];
        
        // Check if reminders already exist in localStorage
        if (localStorage.getItem('reminders')) {
            reminders = JSON.parse(localStorage.getItem('reminders'));
        }
        
        // Add new reminder to array
        reminders.push(reminder);
        
        // Save back to localStorage
        localStorage.setItem('reminders', JSON.stringify(reminders));
    } catch (error) {
        console.error('Error saving reminder:', error);
        showNotification('Error saving reminder', 'error');
    }
}
// Function to display a reminder in the UI
function displayReminder(reminder) {
    const reminderItem = document.createElement('div');
    reminderItem.classList.add('reminder-item');
    reminderItem.setAttribute('data-id', reminder.id);
    
    // Format time and date for display
    const timeDisplay = formatTime(reminder.time);
    const dateDisplay = formatDate(reminder.date);
    
    let recurringBadge = '';
    if (reminder.isRecurring) {
        recurringBadge = `<span class="recurring-badge">${capitalizeFirstLetter(reminder.recurringType)}</span>`;
    }
    
    reminderItem.innerHTML = `
        <div class="reminder-meta">
            <div class="reminder-time">${timeDisplay}</div>
            <div class="reminder-date">${dateDisplay}</div>
            ${recurringBadge}
        </div>
        <div class="reminder-text">${reminder.text}</div>
        ${reminder.message ? `<div class="reminder-message">${reminder.message}</div>` : ''}
        <div class="reminder-actions">
            <button class="edit-btn" onclick="editReminder(${reminder.id})">Edit</button>
            <button class="delete-btn" onclick="deleteReminder(${reminder.id})">Delete</button>
        </div>
    `;
    
    // Add notification sent indicator if applicable
    if (reminder.notificationSent) {
        const sentIndicator = document.createElement('div');
        sentIndicator.className = 'notification-sent';
        sentIndicator.textContent = '📧 Email sent';
        reminderItem.appendChild(sentIndicator);
    }
    
    remindersList.appendChild(reminderItem);
}

// Function to edit a reminder
function editReminder(id) {
    // Get the reminder from localStorage
    const reminders = JSON.parse(localStorage.getItem('reminders'));
    const reminder = reminders.find(r => r.id === id);
    
    if (!reminder) return;
    
    // Populate the form with the reminder data
    document.getElementById('reminderText').value = reminder.text;
    document.getElementById('reminderTime').value = reminder.time;
    
    const dateInput = document.getElementById('reminderDate');
    if (dateInput) {
        dateInput.value = reminder.date;
    }
    
    document.getElementById('reminderMessage').value = reminder.message || '';
    
    const isRecurringCheckbox = document.getElementById('isRecurring');
    if (isRecurringCheckbox) {
        isRecurringCheckbox.checked = reminder.isRecurring || false;
        toggleRecurringOptions();
    }
    
    const recurringTypeSelect = document.getElementById('recurringType');
    if (recurringTypeSelect && reminder.recurringType) {
        recurringTypeSelect.value = reminder.recurringType;
    }
    
    // Set up form for editing
    reminderForm.setAttribute('data-edit-id', id);
    document.querySelector('#reminderForm button[type="submit"]').textContent = 'Update Reminder';
    
    // Scroll to form
    reminderForm.scrollIntoView({ behavior: 'smooth' });
    
    // Show notification
    showNotification('Editing reminder - make your changes and click Update', 'info');
    
    // Set up cancel button if it doesn't exist
    if (!document.getElementById('cancelEditBtn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.marginLeft = '10px';
        
        cancelBtn.addEventListener('click', function() {
            // Reset form
            reminderForm.reset();
            reminderForm.removeAttribute('data-edit-id');
            document.querySelector('#reminderForm button[type="submit"]').textContent = 'Add Reminder';
            this.remove();
            
            // Reset date field to today
            if (dateInput) {
                dateInput.valueAsDate = new Date();
            }
            
            // Show notification
            showNotification('Editing cancelled', 'info');
        });
        
        document.querySelector('#reminderForm button[type="submit"]').after(cancelBtn);
    }
}

// Function to toggle recurring options visibility
function toggleRecurringOptions() {
    const isRecurring = document.getElementById('isRecurring').checked;
    const recurringOptions = document.getElementById('recurringOptions');
    
    if (recurringOptions) {
        recurringOptions.style.display = isRecurring ? 'block' : 'none';
    }
}

// Function to format time (convert from 24h to 12h format)
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
}

// Function to format date
function formatDate(dateString) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to load reminders from localStorage
// Function to load reminders from localStorage
function loadReminders() {
    let reminders = [];
    
    // Check if reminders exist in localStorage
    if (localStorage.getItem('reminders')) {
        reminders = JSON.parse(localStorage.getItem('reminders'));
    }
    
    // Process recurring reminders
    processRecurringReminders(reminders);
    
    // Get selected date for filtering
    const filterDateElement = document.getElementById('filterDate');
    let selectedDate = new Date().toISOString().split('T')[0]; // Default to today

    if (filterDateElement) {
        // If filter date has a value, use it
        if (filterDateElement.value) {
            selectedDate = filterDateElement.value;
        } else {
            // Otherwise set it to today
            filterDateElement.valueAsDate = new Date();
            selectedDate = filterDateElement.value || selectedDate;
        }
    }
    
    // Filter reminders for selected date
    const filteredReminders = filterRemindersByDate(reminders, selectedDate);
    
    // Sort reminders by time
    filteredReminders.sort((a, b) => {
        // First sort by date
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA - dateB;
    });
    
    // Clear the reminders list first
    remindersList.innerHTML = '';
    
    // Display each reminder
    filteredReminders.forEach(reminder => {
        displayReminder(reminder);
    });
    
    // Update counts and labels
    updateReminderCounts(reminders);
    
    // Start checking for due reminders
    setUpReminderChecker();
}

// Function to filter reminders by date
// Function to filter reminders by date
function filterRemindersByDate(reminders, targetDate) {
    // Create Date object for target date with time set to 00:00:00
    const targetDateObj = new Date(targetDate + 'T00:00:00');
    targetDateObj.setHours(0, 0, 0, 0);
    
    return reminders.filter(reminder => {
        // Get date object for reminder date
        const reminderDateObj = new Date(reminder.date + 'T00:00:00');
        reminderDateObj.setHours(0, 0, 0, 0);
        
        // Check if dates match (for non-recurring or reminder date is exactly target date)
        const datesMatch = reminderDateObj.getTime() === targetDateObj.getTime();
        
        // Include if dates match or it's a relevant recurring reminder
        return datesMatch;
    });
}

// Function to process recurring reminders
function processRecurringReminders(reminders) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const processedReminders = [...reminders];
    const recurringToAdd = [];
    
    // Check each reminder
    reminders.forEach(reminder => {
        if (reminder.isRecurring) {
            const reminderDate = new Date(reminder.date + 'T00:00:00');
            
            // If the base date is in the past, we may need to generate future instances
            if (reminderDate < today) {
                let nextOccurrence = calculateNextOccurrence(reminderDate, reminder.recurringType);
                
                // Keep generating future occurrences until we get one that's not in the past
                while (nextOccurrence < today) {
                    nextOccurrence = calculateNextOccurrence(nextOccurrence, reminder.recurringType);
                }
                
                // Add the next occurrence if it's not too far in the future (limit to 3 months ahead)
                const threeMonthsLater = new Date();
                threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
                
                if (nextOccurrence <= threeMonthsLater) {
                    const newReminder = {...reminder};
                    newReminder.id = Date.now() + Math.floor(Math.random() * 1000); // New unique ID
                    newReminder.date = nextOccurrence.toISOString().split('T')[0];
                    newReminder.notificationSent = false;
                    newReminder.generated = true; // Mark as generated
                    recurringToAdd.push(newReminder);
                }
            }
        }
    });
    
    // Add new recurring instances and save back
    if (recurringToAdd.length > 0) {
        const allReminders = [...reminders, ...recurringToAdd];
        localStorage.setItem('reminders', JSON.stringify(allReminders));
        return allReminders;
    }
    
    return reminders;
}

// Calculate next occurrence based on recurring type
function calculateNextOccurrence(dateObj, recurringType) {
    const nextDate = new Date(dateObj);
    
    switch (recurringType) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }
    
    return nextDate;
}

// Function to update reminder counts
function updateReminderCounts(allReminders) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count reminders
    const todayCount = allReminders.filter(r => {
        const reminderDate = new Date(r.date + 'T00:00:00');
        reminderDate.setHours(0, 0, 0, 0);
        return reminderDate.getTime() === today.getTime();
    }).length;
    
    const upcomingCount = allReminders.filter(r => {
        const reminderDate = new Date(r.date + 'T00:00:00');
        reminderDate.setHours(0, 0, 0, 0);
        return reminderDate > today;
    }).length;
    
    const totalCount = allReminders.length;
    
    // Update count displays if they exist
    if (document.getElementById('todayCount')) {
        document.getElementById('todayCount').textContent = todayCount;
    }
    
    if (document.getElementById('upcomingCount')) {
        document.getElementById('upcomingCount').textContent = upcomingCount;
    }
    
    if (document.getElementById('totalCount')) {
        document.getElementById('totalCount').textContent = totalCount;
    }
}

// Function to delete a reminder
function deleteReminder(id) {
    try {
        // Remove from localStorage
        let reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        reminders = reminders.filter(reminder => reminder.id !== id);
        localStorage.setItem('reminders', JSON.stringify(reminders));
        
        // Remove from UI
        const reminderElement = document.querySelector(`.reminder-item[data-id="${id}"]`);
        if (reminderElement) {
            reminderElement.remove();
        }
        
        // Update counts
        updateReminderCounts(reminders);
        
        // Show delete notification
        showNotification('Reminder deleted', 'warning');
    } catch (error) {
        console.error('Error deleting reminder:', error);
        showNotification('Error deleting reminder', 'error');
    }
}
// Function to set up the reminder checker timer
function setUpReminderChecker() {
    // Check immediately when page loads
    checkDueReminders();
    
    // Calculate seconds until the next minute starts
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();
    
    // First set a timeout to align with the minute change
    setTimeout(() => {
        // Check at the minute change
        checkDueReminders();
        
        // Then set interval to check every minute
        setInterval(checkDueReminders, 60000);
    }, secondsUntilNextMinute * 1000);
    
    console.log(`Reminder notification system active. Checking for due reminders every minute.`);
}

// Function to check for reminders that are due and send email notifications
function checkDueReminders() {
    // Only check if email is set
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        return;
    }
    
    // Get current time for comparison
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTimeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    
    // Get all reminders
    let reminders = [];
    if (localStorage.getItem('reminders')) {
        reminders = JSON.parse(localStorage.getItem('reminders'));
    }
    
    // Check each reminder
    let updated = false;
    reminders.forEach(reminder => {
        // Check if date matches current date and time matches current time (within the same minute) and notification not sent yet
        if (reminder.date === currentDate && 
            reminder.time === currentTimeString && 
            !reminder.notificationSent) {
            
            // Send email notification
            sendReminderEmail(userEmail, reminder);
            
            // Mark as sent
            reminder.notificationSent = true;
            updated = true;
            
            // Show a confirmation on the page
            showNotificationSent(reminder);
            
            // Show notification
            showNotification(`Reminder sent: ${reminder.text}`, 'success');
        }
    });
    
    // Update localStorage if needed
    if (updated) {
        localStorage.setItem('reminders', JSON.stringify(reminders));
    }
}

// Function to send a reminder email using EmailJS
function sendReminderEmail(email, reminder) {
    try {
        // Prepare template parameters
        const templateParams = {
            to_email: email,
            from_name: "Your Friendly Reminder",
            reply_to: "noreply@reminderapp.com",
            reminder_text: reminder.text,
            reminder_time: formatTime(reminder.time),
            reminder_date: formatDate(reminder.date),
            reminder_message: reminder.message || 'No additional message'
        };

        // Send email using EmailJS
        emailjs.send('service_hfa9nka', 'template_211pgst', templateParams)
            .then(function(response) {
                console.log('Reminder email sent successfully:', response);
                showNotification(`Reminder email sent: ${reminder.text}`, 'success');
                return true;
            }, function(error) {
                console.error('Error sending reminder email:', error);
                showNotification('Failed to send reminder email', 'error');
                return false;
            });
            
        return true;
    } catch (error) {
        console.error('Error sending reminder email:', error);
        return false;
    }
}

// Function to show notification sent status on the page
function showNotificationSent(reminder) {
    // Find the reminder element
    const reminderElement = document.querySelector(`.reminder-item[data-id="${reminder.id}"]`);
    
    if (reminderElement) {
        // Add a notification sent indicator
        const sentIndicator = document.createElement('div');
        sentIndicator.className = 'notification-sent';
        sentIndicator.textContent = '📧 Email sent';
        reminderElement.appendChild(sentIndicator);
    }
}

// Function to handle date filter change
function handleDateFilterChange() {
    loadReminders();
}

// Function to export reminders
function exportReminders() {
    const reminders = localStorage.getItem('reminders');
    if (!reminders || JSON.parse(reminders).length === 0) {
        showNotification('No reminders to export', 'warning');
        return;
    }
    
    // Create export data
    const exportData = {
        reminders: JSON.parse(reminders),
        email: localStorage.getItem('userEmail'),
        settings: appSettings,
        exportDate: new Date().toISOString()
    };
    
    // Convert to JSON string
    const dataStr = JSON.stringify(exportData, null, 2);
    
    // Create download link
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'reminder-app-data.json';
    
    // Create link element
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Reminders exported successfully', 'success');
}

// Function to import reminders
function importReminders() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!data.reminders) {
                    throw new Error('Invalid import file format');
                }
                
                // Import reminders
                localStorage.setItem('reminders', JSON.stringify(data.reminders));
                
                // Import email if not already set
                if (data.email && !localStorage.getItem('userEmail')) {
                    localStorage.setItem('userEmail', data.email);
                }
                
                // Import settings
                if (data.settings) {
                    appSettings = {...appSettings, ...data.settings};
                    saveSettings();
                }
                
                // Reload reminders
                loadReminders();
                
                showNotification('Reminders imported successfully', 'success');
            } catch (error) {
                console.error('Import error:', error);
                showNotification('Failed to import reminders: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    });
    
    fileInput.click();
}

// Email settings system
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const userEmailInput = document.getElementById('userEmail');
    const saveEmailBtn = document.getElementById('saveEmailBtn');
    const emailStatus = document.getElementById('emailStatus');
    
    // Load saved email if exists
    if (localStorage.getItem('userEmail')) {
        userEmailInput.value = localStorage.getItem('userEmail');
        emailStatus.textContent = `Notifications will be sent to: ${localStorage.getItem('userEmail')}`;
        emailStatus.className = 'success-message';
        
        // Move email section to bottom if email is set
        moveEmailSectionToBottom();
    }
    
    // Save email button click
    if (saveEmailBtn) {
        saveEmailBtn.addEventListener('click', function() {
            const email = userEmailInput.value.trim();
            
            // Validate email
            if (!email || !email.includes('@') || !email.includes('.')) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Save email
            localStorage.setItem('userEmail', email);
            
            // Update status
            emailStatus.textContent = `Notifications will be sent to: ${email}`;
            emailStatus.className = 'success-message';
            
            // Move email settings to bottom
            moveEmailSectionToBottom();
            
            // Send a test email
            sendTestEmail(email);
        });
    }
    
    // Set up recurring checkbox event listener
    const isRecurringCheckbox = document.getElementById('isRecurring');
    if (isRecurringCheckbox) {
        isRecurringCheckbox.addEventListener('change', toggleRecurringOptions);
    }
    
    // Set up date filter change event listener
    const filterDateInput = document.getElementById('filterDate');
    if (filterDateInput) {
        filterDateInput.addEventListener('change', handleDateFilterChange);
        
        // Initialize to today
        filterDateInput.valueAsDate = new Date();
    }
    
    // Initialize reminder date input to today
    const reminderDateInput = document.getElementById('reminderDate');
    if (reminderDateInput) {
        reminderDateInput.valueAsDate = new Date();
    }
    
    // Set up export and import buttons
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReminders);
    }
    
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', importReminders);
    }
    
    // Reset app data button
    const resetAppBtn = document.getElementById('resetAppBtn');
    if (resetAppBtn) {
        resetAppBtn.addEventListener('click', function() {
            // Confirm before resetting
            if (confirm('Are you sure you want to reset all app data? This will delete all reminders and settings.')) {
                // Clear all localStorage
                localStorage.clear();
                
                // Reset settings to defaults
                appSettings = {
                    darkMode: false,
                    mobileView: window.innerWidth < 768,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                };
                
                // Move email section back to top
                moveEmailSectionToTop();
                
                // Show notification before reload
                showNotification('App data has been reset successfully', 'warning');
                
                // Reload after a slight delay to ensure notification is seen
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        });
    }
});

// Function to send a test email using EmailJS
function sendTestEmail(email) {
    // Prepare template parameters
    const templateParams = {
        to_email: email,
        from_name: "Your Friendly Reminder",
        reply_to: "noreply@reminderapp.com",
        reminder_text: 'Email Setup Complete',
        reminder_time: 'Now',
        reminder_date: formatDate(new Date().toISOString().split('T')[0]),
        reminder_message: 'Your email has been set up for reminder notifications. You will receive notifications for your reminders at this email address.'
    };

    // Send email using EmailJS
    emailjs.send('service_hfa9nka', 'template_211pgst', templateParams)
        .then(function(response) {
            console.log('Test email sent successfully:', response);
            showNotification(`Test email sent to ${email}`, 'success');
        }, function(error) {
            console.error('Error sending test email:', error);
            showNotification('Failed to send test email', 'error');
        });
}

// Function to show a temporary notification
function showNotification(message, type = 'success') {
    let notification = document.getElementById('notification');
    let notificationMessage = document.getElementById('notificationMessage');
    
    // Create notification element if it doesn't exist
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        notification.style.display = 'none';
        
        notificationMessage = document.createElement('div');
        notificationMessage.id = 'notificationMessage';
        
        notification.appendChild(notificationMessage);
        document.body.appendChild(notification);
    }
    
    // Set the message
    notificationMessage.textContent = message;
    
    // Set the type (success, error, warning, info)
    notification.className = 'notification';
    notification.classList.add(`notification-${type}`);
    
    // Set border color based on type
    if (type === 'success') {
        notification.style.borderLeftColor = '#2ecc71';
    } else if (type === 'error') {
        notification.style.borderLeftColor = '#e74c3c';
    } else if (type === 'warning') {
        notification.style.borderLeftColor = '#f39c12';
    } else if (type === 'info') {
        notification.style.borderLeftColor = '#3498db';
    }
    
    // Show the notification
    notification.style.display = 'block';
    
    // Hide after animation completes (4 seconds)
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}