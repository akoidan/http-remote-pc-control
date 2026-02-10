// Test file for native module API
const path = require('path');
const native = require('./build/Debug/native');

console.log(native)

// Helper function to run tests with error handling
async function test(name, fn) {
  try {
    process.stdout.write(`[TEST] ${name}... `);
    await fn();
    console.log('\n  ✓ PASSED\n');
    return true;
  } catch (error) {
    console.log('\n  ✗ FAILED');
    console.error('  Error:', error.message);
    console.error('  Stack:', error.stack.split('\n').slice(0, 3).join('\n    '), '...');
    return false;
  }
}

// Test Window APIs
async function testWindowApis() {
  console.log('\n=== Testing Window APIs ===');
  
  // Get active window ID
  console.log('\n1. Testing getWindowActiveId()');
  const activeWindowId = native.getWindowActiveId();
  console.log('  Active window ID:', activeWindowId);
  
  if (!activeWindowId || typeof activeWindowId !== 'number') {
    throw new Error('Invalid window ID returned');
  }
  
  // Get window info
  console.log('\n2. Testing getWindowInfo()');
  const windowInfo = native.getWindowInfo(activeWindowId);
  console.log('  Window info:', JSON.stringify(windowInfo, null, 2));
  
  if (!windowInfo || !windowInfo.bounds) {
    throw new Error('Invalid window info returned');
  }
  
  // Test window bounds
  console.log('\n3. Testing setWindowBounds()');
  const bounds = { 
    x: parseInt(windowInfo.bounds.x) + 10, 
    y: parseInt(windowInfo.bounds.y),
    width: parseInt(windowInfo.bounds.width),
    height: parseInt(windowInfo.bounds.height)
  };
  console.log('  Setting window bounds to:', bounds);
  native.setWindowBounds(activeWindowId, bounds);
  console.log('  Window bounds updated successfully');
  
  // Test window visibility
  console.log('\n4. Testing setWindowState()');
  console.log('  Showing window');
  native.setWindowState(activeWindowId, "show");
  
  // Test window opacity
  console.log('\n5. Testing window opacity functions');
  console.log('  Setting opacity to 0.8');
  native.setWindowOpacity(activeWindowId, 0.8);
  const opacity = native.getWindowOpacity(activeWindowId);
  console.log('  Current window opacity:', opacity);
  
  // Test window transparency
  console.log('\n6. Testing setWindowIsTransparent()');
  console.log('  Enabling transparency');
  native.setWindowIsTransparent(activeWindowId, true);
  
  // Bring window to top
  console.log('\n7. Testing setWindowActive()');
  native.setWindowActive(activeWindowId);
  console.log('  Window brought to top');
  
  // Test getting windows by process ID
  console.log('\n8. Testing getWindowsByProcessId()');
  const currentPid = process.pid;
  console.log('  Current process ID:', currentPid);
  
  const windowHandles = native.getWindowsByProcessId(currentPid);
  console.log('  Windows for current process:', windowHandles);
  
  if (!Array.isArray(windowHandles)) {
    throw new Error('Expected an array of window handles');
  }
  
  // If there are windows, test getting info for the first one
  if (windowHandles.length > 0) {
    console.log('  First window handle:', windowHandles[0]);
    const windowInfo = native.getWindowInfo(windowHandles[0]);
    console.log('  First window info:', JSON.stringify(windowInfo, null, 2));
  } else {
    console.log('  No windows found for current process');
  }
}

// Test Monitor APIs
async function testMonitorApis() {
  // Get all monitors
  const monitors = native.getMonitors();
  console.log('Detected monitors:', monitors);
  
  if (monitors.length > 0) {
    // Get monitor info
    const monitorInfo = native.getMonitorInfo(monitors[0]);
    console.log('Primary monitor info:', JSON.stringify(monitorInfo, null, 2));
    
    // Test get monitor from window
    const activeWindowId = native.getWindowActiveId();
    const monitorId = native.getMonitorFromWindow(activeWindowId);
    console.log('Monitor for active window:', monitorId);
  }
}

// Test Process APIs
async function testProcessApis() {
  // Test process elevation
  const isElevated = native.isProcessElevated();
  console.log('Process is elevated:', isElevated);
  
  // Test process creation (commented out for safety)
  // const pid = native.createProcess('notepad.exe');
  // console.log('Created process with PID:', pid);
}

// Test Keyboard APIs
async function testKeyboardApis() {
  // Test typing
  console.log('Testing keyboard input...');
  native.typeString('Hello, World!');
  
  // Test key combinations (Alt+Tab)
  native.keyToggle('alt', [], true);
  native.keyTap('tab', []);
  native.keyToggle('alt', [], false);
  
  // Test keyboard layout
  native.setKeyboardLayout('en');
}

// Test Mouse APIs
async function testMouseApis() {
  // Get current mouse position
  const pos = native.getMousePosition();
  console.log('Current mouse position:', pos);
  
  // Move mouse slightly
  native.setMousePosition({x: pos.x + 10, y: pos.y + 10});
  
  // Click left mouse button
  native.setMouseButtonToState(1, true);
}

// Run all tests
async function runTests() {
  console.log('Starting native module API tests...\n');
  
  await test('Window APIs', testWindowApis);
  await test('Monitor APIs', testMonitorApis);
  await test('Process APIs', testProcessApis);
  await test('Keyboard APIs', testKeyboardApis);
  await test('Mouse APIs', testMouseApis);
  
  console.log('\nAll tests completed successfully!');
}

// Run the tests
runTests().catch(console.error);
