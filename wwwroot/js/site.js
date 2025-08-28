// Millennium Timber Roof ERP - Site Scripts

$(document).ready(function () {
    // Sidebar toggle
    $('#sidebarToggle').on('click', function () {
        $('#sidebar').toggleClass('collapsed');
        $('#content').toggleClass('expanded');
        
        // Save state to localStorage
        const isCollapsed = $('#sidebar').hasClass('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });
    
    // Restore sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        $('#sidebar').addClass('collapsed');
        $('#content').addClass('expanded');
    }
    
    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // Initialize popovers
    $('[data-bs-toggle="popover"]').popover();
});

// Common functions for all modules
var MillenniumERP = {
    // Show loading indicator
    showLoading: function () {
        // Implementation for loading indicator
    },
    
    // Hide loading indicator
    hideLoading: function () {
        // Implementation for hiding loading indicator
    },
    
    // Show notification
    showNotification: function (message, type) {
        const alertType = type || 'info';
        const alertHtml = `
            <div class="alert alert-${alertType} alert-dismissible fade show position-fixed top-0 end-0 m-3" style="z-index: 9999;" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        $('body').append(alertHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(function () {
            $('.alert').fadeOut('slow', function () {
                $(this).remove();
            });
        }, 5000);
    },
    
    // Confirm dialog
    confirm: function (message, callback) {
        if (confirm(message)) {
            callback();
        }
    },
    
    // Format date
    formatDate: function (date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-GB');
    },
    
    // Format currency
    formatCurrency: function (amount) {
        return 'R ' + parseFloat(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
};