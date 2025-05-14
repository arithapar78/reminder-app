// Get DOM elements
const reminderForm = document.querySelector('#reminderForm form');
const remindersList = document.getElementById('remindersList');

// Load reminders when page loads
document.addEventListener('DOMContentLoaded', loadReminders);

// Add event listener for form submission
reminderForm.addEventListener('submit', addReminder);

// Function to move email section to the bottom
function moveEmailSectionToBottom() {
    const container = document.querySelector('.container');
    const emailSettings = document.getElementById('emailSettings');
    
    if (emailSettings && container) {
        // Remove the email settings from its current position
        emailSettings.remove();
        
        // Add it back at the end (before reset panel)
        const resetPanel = document.getElementById('resetPanel');
        if (resetPanel) {
            container.insertBefore(emailSettings, resetPanel);
        } else {
            container.appendChild(emailSettings);
        }
        
        // Add a transition effect
        emailSettings.style.transition = 'opacity 0.5s ease';
        emailSettings.style.opacity = '0';
        
        // Fade it back in
        setTimeout(() => {
            emailSettings.style.opacity = '1';
        }, 50);
    }
}

// Function to move email section to the top
function moveEmailSectionToTop() {
    const container = document.querySelector('.container');
    const emailSettings = document.getElementById('emailSettings');
    
    if (emailSettings && container) {
        // Remove the email settings from its current position
        emailSettings.remove();
        
        // Add it back at the top (after header)
        const header = document.querySelector('.app-header');
        if (header) {
            container.insertBefore(emailSettings, header.nextSibling);
        } else {
            container.prepend(emailSettings);
        }
        
        // Add a transition effect
        emailSettings.style.transition = 'opacity 0.5s ease';
        emailSettings.style.opacity = '0';
        
        // Fade it back in
        setTimeout(() => {
            emailSettings.style.opacity = '1';
        }, 50);
    }
}

// Function to add a new reminder
function addReminder(e) {
    e.preventDefault();
    
    // Get form values
    const reminderText = document.getElementById('reminderText').value;
    const reminderTime = document.getElementById('reminderTime').value;
    const reminderMessage = document.getElementById('reminderMessage').value;
    
    // Validate
    if (!reminderText || !reminderTime) {
        alert('Please enter both a reminder and a time');
        showNotification('Please enter both a reminder and a time', 'error');
        return;
    }
    
    // Create reminder object
    const reminder = {
        id: Date.now(), // Unique ID based on timestamp
        text: reminderText,
        time: reminderTime,
        message: reminderMessage,
        date: new Date().toDateString(), // Store current date
        notificationSent: false // Track if email notification has been sent
    };
    
    // Add to localStorage
    saveReminder(reminder);
    
    // Display the reminder
    displayReminder(reminder);
    
    // Show success notification
    showNotification('Reminder added successfully', 'success');
    
    // Reset form
    reminderForm.reset();
}

// Function to save reminder to localStorage
function saveReminder(reminder) {
    let reminders = [];
    
    // Check if reminders already exist in localStorage
    if (localStorage.getItem('reminders')) {
        reminders = JSON.parse(localStorage.getItem('reminders'));
    }
    
    // Add new reminder to array
    reminders.push(reminder);
    
    // Save back to localStorage
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

// Function to display a reminder in the UI
function displayReminder(reminder) {
    const reminderItem = document.createElement('div');
    reminderItem.classList.add('reminder-item');
    reminderItem.setAttribute('data-id', reminder.id);
    
    // Format time for display
    const timeDisplay = formatTime(reminder.time);
    
    reminderItem.innerHTML = `
        <div class="reminder-time">${timeDisplay}</div>
        <div class="reminder-text">${reminder.text}</div>
        ${reminder.message ? `<div class="reminder-message">${reminder.message}</div>` : ''}
        <button class="delete-btn" onclick="deleteReminder(${reminder.id})">Delete</button>
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

// Function to format time (convert from 24h to 12h format)
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
}

// Function to load reminders from localStorage
function loadReminders() {
    let reminders = [];
    
    // Check if reminders exist in localStorage
    if (localStorage.getItem('reminders')) {
        reminders = JSON.parse(localStorage.getItem('reminders'));
    }
    
    // Get today's date string
    const today = new Date().toDateString();
    
    // Filter reminders for today only
    const todayReminders = reminders.filter(reminder => reminder.date === today);
    
    // Sort reminders by time
    todayReminders.sort((a, b) => {
        return new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time);
    });
    
    // Clear the reminders list first
    remindersList.innerHTML = '';
    
    // Display each reminder
    todayReminders.forEach(reminder => {
        displayReminder(reminder);
    });
    
    // Start checking for due reminders
    setUpReminderChecker();
    
    // Check if email is set and move email section accordingly
    if (localStorage.getItem('userEmail')) {
        moveEmailSectionToBottom();
    } else {
        moveEmailSectionToTop();
    }
}

// Function to delete a reminder
function deleteReminder(id) {
    // Remove from localStorage
    let reminders = JSON.parse(localStorage.getItem('reminders'));
    reminders = reminders.filter(reminder => reminder.id !== id);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    
    // Remove from UI
    document.querySelector(`.reminder-item[data-id="${id}"]`).remove();
    
    // Show delete notification
    showNotification('Reminder deleted', 'warning');
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
    
    console.log(`Reminder email notification system active. Checking for due reminders every minute.`);
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
    const currentTimeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    
    // Get all reminders
    let reminders = [];
    if (localStorage.getItem('reminders')) {
        reminders = JSON.parse(localStorage.getItem('reminders'));
    }
    
    // Filter for today's reminders
    const today = new Date().toDateString();
    const todayReminders = reminders.filter(reminder => reminder.date === today);
    
    // Check each reminder
    let updated = false;
    todayReminders.forEach(reminder => {
        // Check if time matches current time (within the same minute) and notification not sent yet
        if (reminder.time === currentTimeString && !reminder.notificationSent) {
            // Send email notification
            sendReminderEmail(userEmail, reminder);
            
            // Mark as sent
            reminder.notificationSent = true;
            updated = true;
            
            // Show a confirmation on the page
            showNotificationSent(reminder);
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
            subject: `Reminder: ${reminder.text}`,
            from_name: "Your Reminder App",
            reply_to: "noreply@reminderapp.com",
            reminder_text: reminder.text,
            reminder_time: formatTime(reminder.time),
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

// Simple email settings system
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
        moveEmailSectionToBottom();
    } else {
        moveEmailSectionToTop();
    }
    
    // Save email button click
    if (saveEmailBtn) {
        saveEmailBtn.addEventListener('click', function() {
            const email = userEmailInput.value.trim();
            
            // Validate email
            if (!email || !email.includes('@') || !email.includes('.')) {
                alert('Please enter a valid email address');
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Save email
            localStorage.setItem('userEmail', email);
            
            // Update status
            emailStatus.textContent = `Notifications will be sent to: ${email}`;
            emailStatus.className = 'success-message';
            
            // Move email section to bottom
            moveEmailSectionToBottom();
            
            // Send a test email
            sendTestEmail(email);
        });
    }
    
    // Reset app data button
    const resetAppBtn = document.getElementById('resetAppBtn');
    if (resetAppBtn) {
        resetAppBtn.addEventListener('click', function() {
            // Confirm before resetting
            if (confirm('Are you sure you want to reset all app data? This will delete all reminders and settings.')) {
                // Clear all localStorage
                localStorage.clear();
                
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
        subject: 'Test Email - Reminder App Setup',
        from_name: "Your Reminder App",
        reply_to: "noreply@reminderapp.com",
        reminder_text: 'Email Setup Complete',
        reminder_time: 'Now',
        reminder_message: 'Your email has been set up for reminder notifications. You will receive notifications for your reminders at this email address.'
    };

    // Send email using EmailJS
    emailjs.send('service_hfa9nka', 'template_211pgst', templateParams)
        .then(function(response) {
            console.log('Test email sent successfully:', response);
            alert('Test email sent to ' + email);
            showNotification(`Test email sent to ${email}`, 'success');
        }, function(error) {
            console.error('Error sending test email:', error);
            alert('Failed to send test email. Check console for details.');
            showNotification('Failed to send test email', 'error');
        });
}

// Function to show a temporary notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    
    // Set the message
    notificationMessage.textContent = message;
    
    // Set the type (success, error, warning)
    notification.className = 'notification';
    notification.classList.add(`notification-${type}`);
    
    // Set border color based on type
    if (type === 'success') {
        notification.style.borderLeftColor = '#2ecc71';
    } else if (type === 'error') {
        notification.style.borderLeftColor = '#e74c3c';
    } else if (type === 'warning') {
        notification.style.borderLeftColor = '#f39c12';
    }
    
    // Show the notification
    notification.style.display = 'block';
    
    // Hide after animation completes (4 seconds)
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}