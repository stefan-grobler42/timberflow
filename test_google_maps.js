const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to the app
  await page.goto('http://localhost:5000');
  await page.waitForLoadState('networkidle');
  
  // Click on Customers link
  await page.click('[data-module="customer"]');
  await page.waitForTimeout(1000);
  
  // Click the New button
  await page.click('button:has-text("New")');
  await page.waitForTimeout(1000);
  
  // Click on the Address tab
  await page.click('button#address-tab');
  await page.waitForTimeout(1000);
  
  // Check if the location field container exists
  const locationField = await page.$('#customerLocationField');
  console.log('Location field container exists:', !!locationField);
  
  // Check if EnhancedLocationField was initialized
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));
  
  // Take a screenshot
  await page.screenshot({ path: 'customer_form_address.png', fullPage: true });
  
  // Print all console logs
  console.log('\nConsole logs:');
  logs.forEach(log => console.log(log));
  
  await browser.close();
})();
