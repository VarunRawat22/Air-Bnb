/**
 * Dark Mode Toggle Functionality
 * Handles switching between light and dark modes with localStorage persistence
 */

class DarkModeToggle {
    constructor() {
        this.toggleButton = document.getElementById('darkModeToggle');
        this.toggleIcon = document.getElementById('toggleIcon');
        this.toggleText = document.getElementById('toggleText');
        this.body = document.body;
        
        // Initialize dark mode state
        this.init();
    }

    /**
     * Initialize dark mode based on localStorage or system preference
     */
    init() {
        // Check if dark mode preference is saved in localStorage
        const savedTheme = localStorage.getItem('darkMode');
        
        // If no saved preference, check system preference
        if (savedTheme === null) {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setDarkMode(systemPrefersDark);
        } else {
            this.setDarkMode(savedTheme === 'true');
        }

        // Add event listener to toggle button
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => this.toggle());
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (localStorage.getItem('darkMode') === null) {
                this.setDarkMode(e.matches);
            }
        });
    }

    /**
     * Toggle between light and dark mode
     */
    toggle() {
        const isDarkMode = this.body.classList.contains('dark-mode');
        this.setDarkMode(!isDarkMode);
    }

    /**
     * Set dark mode state
     * @param {boolean} isDark - Whether to enable dark mode
     */
    setDarkMode(isDark) {
        if (isDark) {
            this.enableDarkMode();
        } else {
            this.disableDarkMode();
        }
        
        // Save preference to localStorage
        localStorage.setItem('darkMode', isDark.toString());
    }

    /**
     * Enable dark mode
     */
    enableDarkMode() {
        this.body.classList.add('dark-mode');
        this.updateToggleButton(true);
        
        // Ensure navbar gets dark mode styling
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.add('dark-mode-navbar');
        }
        
        // Dispatch custom event for other scripts that might need to know about theme changes
        window.dispatchEvent(new CustomEvent('darkModeChanged', { 
            detail: { isDark: true } 
        }));
    }

    /**
     * Disable dark mode
     */
    disableDarkMode() {
        this.body.classList.remove('dark-mode');
        this.updateToggleButton(false);
        
        // Remove dark mode styling from navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.remove('dark-mode-navbar');
        }
        
        // Dispatch custom event for other scripts that might need to know about theme changes
        window.dispatchEvent(new CustomEvent('darkModeChanged', { 
            detail: { isDark: false } 
        }));
    }

    /**
     * Update toggle button appearance
     * @param {boolean} isDark - Whether dark mode is active
     */
    updateToggleButton(isDark) {
        if (isDark) {
            // Dark mode is active - show light mode option
            this.toggleIcon.className = 'fas fa-sun';
            this.toggleButton.title = 'Switch to Light Mode';
        } else {
            // Light mode is active - show dark mode option
            this.toggleIcon.className = 'fas fa-moon';
            this.toggleButton.title = 'Switch to Dark Mode';
        }
    }

    /**
     * Check if dark mode is currently active
     * @returns {boolean} - Whether dark mode is active
     */
    isDarkMode() {
        return this.body.classList.contains('dark-mode');
    }

    /**
     * Get current theme preference
     * @returns {string} - 'light' or 'dark'
     */
    getCurrentTheme() {
        return this.isDarkMode() ? 'dark' : 'light';
    }
}

// Initialize dark mode toggle when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.darkModeToggle = new DarkModeToggle();
    
    // Add some smooth transitions for theme switching
    const style = document.createElement('style');
    style.textContent = `
        * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
        }
        
        /* Exclude images and videos from transitions */
        img, video, iframe, canvas, svg {
            transition: none !important;
        }
        
        /* Exclude transform animations */
        .dark-mode-toggle i {
            transition: transform 0.3s ease !important;
        }
    `;
    document.head.appendChild(style);
});

// Utility functions for other scripts to use
window.DarkModeUtils = {
    /**
     * Check if dark mode is active
     */
    isDarkMode: () => {
        return document.body.classList.contains('dark-mode');
    },
    
    /**
     * Get current theme
     */
    getTheme: () => {
        return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    },
    
    /**
     * Set theme programmatically
     */
    setTheme: (theme) => {
        if (window.darkModeToggle) {
            window.darkModeToggle.setDarkMode(theme === 'dark');
        }
    },
    
    /**
     * Toggle theme programmatically
     */
    toggleTheme: () => {
        if (window.darkModeToggle) {
            window.darkModeToggle.toggle();
        }
    }
};

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkModeToggle;
}
