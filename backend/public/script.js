document.addEventListener('DOMContentLoaded', function() {
  const dbStatusIndicator = document.getElementById('db-status-indicator');
  const dbStatusText = document.getElementById('db-status-text');
  const dbLatency = document.getElementById('db-latency');
  const refreshBtn = document.getElementById('refresh-btn');
  const containerId = document.getElementById('container-id');
  const footerContainerId = document.getElementById('footer-container-id');
  const hostname = document.getElementById('hostname');
  const memoryUsage = document.getElementById('memory-usage');
  const uptime = document.getElementById('uptime');
  
  // Generate a unique container ID for demo purposes
  const demoContainerId = 'ecs-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  containerId.textContent = demoContainerId;
  footerContainerId.textContent = demoContainerId;
  
  // Set hostname
  hostname.textContent = window.location.hostname;
  
  // Update memory usage (demo)
  function updateMemoryUsage() {
    const used = Math.floor(Math.random() * 300) + 200;
    const total = 1024;
    memoryUsage.textContent = `${used}MB / ${total}MB (${Math.round(used/total*100)}%)`;
  }
  
  // Update uptime (demo)
  function updateUptime() {
    const start = Date.now() - Math.floor(Math.random() * 3600000);
    const seconds = Math.floor((Date.now() - start) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    uptime.textContent = `${hours}h ${minutes}m ${secs}s`;
  }
  
  // Initialize demo system info
  updateMemoryUsage();
  updateUptime();
  setInterval(updateMemoryUsage, 5000);
  setInterval(updateUptime, 1000);
  
  // Check database status
  function checkDbStatus() {
    dbStatusIndicator.className = 'status-indicator';
    dbStatusText.textContent = 'Checking...';
    dbLatency.textContent = '-- ms';
    
    const startTime = Date.now();
    
    fetch('/db-status')
      .then(response => response.json())
      .then(data => {
        const latency = Date.now() - startTime;
        
        if (data.status === 'success') {
          dbStatusIndicator.classList.add('connected');
          dbStatusText.textContent = data.message;
          dbLatency.textContent = `${latency} ms`;
        } else {
          dbStatusIndicator.classList.add('error');
          dbStatusText.textContent = data.message;
        }
      })
      .catch(error => {
        dbStatusIndicator.classList.add('error');
        dbStatusText.textContent = 'Connection check failed';
        console.error('Error checking DB status:', error);
      });
  }
  
  // Initial check
  checkDbStatus();
  
  // Set up refresh button
  refreshBtn.addEventListener('click', checkDbStatus);
  
  // Auto-refresh every 30 seconds
  setInterval(checkDbStatus, 30000);
});