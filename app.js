// ✅ Show greeting + date/time
function updateDateTime() {
  const now = new Date();

  // Time
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  // Date: mm/dd + 3-letter weekday
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dayNum = String(now.getDate()).padStart(2, '0');
  const weekday = now.toLocaleDateString([], { weekday: 'short' });

  document.getElementById("datetime").textContent = `${time} | ${month}/${dayNum} | ${weekday}`;
}

// Simple greeting (can expand later)
function updateGreeting() {
  const hour = new Date().getHours();
  let greetingText = "Hello!";

  if (hour >= 5 && hour < 12) greetingText = "Good morning!";
  else if (hour >= 12 && hour < 18) greetingText = "Good afternoon!";
  else greetingText = "Good evening!";

  document.getElementById("greeting").textContent = greetingText;
}

// Call immediately and update every minute
updateGreeting();
updateDateTime();
setInterval(updateDateTime, 60000);


// ✅ Dropdown functionality
document.querySelectorAll('.dropdown-btn').forEach(button => {
  button.addEventListener('click', () => {
    const content = button.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  });
});
