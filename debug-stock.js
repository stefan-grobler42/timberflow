// Debug Stock Management - Test clicking functionality
console.log('=== STOCK MANAGEMENT DEBUG ===');

// Test if container exists
const container = document.getElementById('stock-management-content');
console.log('Container found:', !!container);
if (container) {
    console.log('Container innerHTML length:', container.innerHTML.length);
}

// Test if SimpleStockManager class exists
console.log('SimpleStockManager class exists:', typeof SimpleStockManager);

// Create a minimal test
function testClicking() {
    console.log('Starting click test...');
    
    // Clear container and add test content
    if (container) {
        container.innerHTML = `
            <div style="padding: 20px;">
                <h3>Click Test</h3>
                <button id="test-btn" class="btn btn-primary">Test Button</button>
                <div id="test-output" style="margin-top: 10px;"></div>
                <table class="table mt-3">
                    <tr class="test-row" style="cursor: pointer;" data-id="1">
                        <td>Click this row</td>
                        <td>Test data</td>
                    </tr>
                </table>
            </div>
        `;
        
        // Add event listeners
        const testBtn = document.getElementById('test-btn');
        const testOutput = document.getElementById('test-output');
        const testRow = document.querySelector('.test-row');
        
        if (testBtn) {
            testBtn.addEventListener('click', function() {
                console.log('Button clicked!');
                testOutput.innerHTML = '<p class="text-success">Button click works!</p>';
            });
            console.log('Button event listener added');
        }
        
        if (testRow) {
            testRow.addEventListener('click', function() {
                console.log('Row clicked!');
                testOutput.innerHTML = '<p class="text-info">Row click works!</p>';
            });
            console.log('Row event listener added');
        }
        
        console.log('Test setup complete - try clicking the button or row');
    }
}

// Run test immediately
testClicking();

// Also add to window for manual testing
window.testClicking = testClicking;