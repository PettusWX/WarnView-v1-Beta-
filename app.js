document.addEventListener("DOMContentLoaded", () => {
    const alertColors = {
      "Tornado Warning": "#ff0000",
      "Severe Thunderstorm Warning": "#ffa500",
      "Flash Flood Warning": "#008000",
      "Winter Weather Advisory": "#ab60f6",
      "Winter Storm Warning": "#fc00ff",
      "Winter Storm Watch": "#0005d1",
      "Blizzard Warning": "#ff7800",
      "Special Weather Statement": "#77c9e9",
      "Tornado Watch": "#ff7a7a",
      "Severe Thunderstorm Watch": "#ecd138",
      "Lake Effect Snow Warning": "#207e8f",
    };
  
    let activeAlerts = [];
    let newAlertsBuffer = [];
    let currentAlertIndex = 0;
  
    // Transition flag to control alert switching
    let transitioning = false;
  
    async function fetchWeatherAlerts() {
      try {
        const response = await fetch("https://api.weather.gov/alerts/active");
        const data = await response.json();
  
        const allowedAlerts = [
          "Tornado Warning",
          "Tornado Watch",
          "Severe Thunderstorm Warning",
          "Severe Thunderstorm Watch",
          "Winter Storm Warning",
          "Winter Storm Watch",
          "Winter Weather Advisory",
          "Blizzard Warning",
          "Flash Flood Warning",
          "Special Weather Statement",
          "Lake Effect Snow Warning",
        ];
  
        const filteredAlerts = data.features.filter((alert) =>
          allowedAlerts.includes(alert.properties.event)
        );
  
        filteredAlerts.forEach((alert) => {
          const eventType = alert.properties.event || "Unknown Event";
          const rawAreas = alert.properties.areaDesc || "Unknown areas";
          const nwsOffice = alert.properties.senderName || "Unknown NWS Office";
          const alertExpires = new Date(alert.properties.expires).toLocaleString() || "Unknown expiration date.";
          const headline = alert.properties.headline || "No headline available.";
          const impacts = alert.properties.description || "No impacts available.";
          const alertColor = alertColors[eventType] || "#444";
  
          const stateAbbreviations = extractStateAbbreviations(alert.properties.affectedZones || []);
          const uniqueStates = [...new Set(stateAbbreviations.filter((state) => state !== "Unknown"))];
          const statesString = uniqueStates.join(", ");
  
          const areasArray = rawAreas.split(";").map((area) => area.trim());
          const formattedAreas = areasArray.map((area, index) => {
            const county = area.replace(" County", "").trim();
            const stateAbbreviation = stateAbbreviations[index] || "Unknown";
            return `${county} County, ${stateAbbreviation}`;
          });
  
          const limitedAreas =
            formattedAreas.length > 7 ? formattedAreas.slice(0, 7).join("; ") + " ..." : formattedAreas.join("; ");
  
          const alertKey = `${eventType}-${limitedAreas}-${alertExpires}`;
          if (!activeAlerts.some((a) => a.key === alertKey)) {
            newAlertsBuffer.push({
              key: alertKey,
              eventType,
              areaDesc: limitedAreas,
              alertExpires,
              alertColor,
              nwsOffice,
              headline,
              impacts,
              statesString,
            });
          }
        });
      } catch (error) {
        console.error("Error fetching weather alerts:", error);
      }
    }
  
    function extractStateAbbreviations(zones) {
      const stateAbbreviations = zones.map((zone) => {
        const stateMatch = zone.match(/^https:\/\/api.weather.gov\/zones\/[^/]+\/([A-Z]{2})/);
        return stateMatch ? stateMatch[1] : "Unknown";
      });
      return stateAbbreviations;
    }
  
    function integrateNewAlerts() {
      if (newAlertsBuffer.length > 0) {
        activeAlerts = [...activeAlerts, ...newAlertsBuffer];
        newAlertsBuffer = [];
        updateWarningList();
        updateAlertCounts();
      }
    }
  
    function updateWarningList() {
      const warningList = document.getElementById("warning-list");
      warningList.innerHTML = ""; // Clear the warning list
  
      activeAlerts.forEach((alert) => {
        const alertDiv = document.createElement("div");
        alertDiv.className = "weather-alert";
        alertDiv.style.backgroundColor = alert.alertColor;
  
        alertDiv.innerHTML = `
          <h3>${alert.eventType}</h3>
          <p><strong>Areas:</strong> ${alert.areaDesc}</p>
          <p><strong>NWS Office:</strong> ${alert.nwsOffice}</p>
          <div class="state-box">LOCATIONS: ${alert.statesString}</div>
        `;
  
        alertDiv.addEventListener("dblclick", () => {
          showPopup(alert);
        });
  
        warningList.appendChild(alertDiv);
      });
    }
  
    function showPopup(alert) {
      const popupOverlay = document.getElementById("popup-overlay");
      const popupContent = document.getElementById("popup-content");
      const popupHeader = document.getElementById("popup-header");
      const popupDetails = document.getElementById("popup-details");
  
      popupContent.style.backgroundColor = alert.alertColor;
  
      popupHeader.innerHTML = `
        <h2>${alert.eventType}</h2>
        <p>EXPIRES: ${alert.alertExpires}</p>
        <p>AREAS: ${alert.areaDesc}</p>
        <p>NWS OFFICE: ${alert.nwsOffice}</p>
      `;
  
      popupDetails.innerHTML = `
        <div class="headline-box">
          <h3>HEADLINE</h3>
          <p>${alert.headline}</p>
        </div>
        <div class="impacts-box">
          <h3>IMPACTS</h3>
          <p>${alert.impacts}</p>
        </div>
      `;
  
      popupOverlay.classList.add("show");
  
      const closeButton = document.getElementById("close-popup");
      closeButton.addEventListener("click", () => {
        popupOverlay.classList.remove("show");
      });
    }
  
    function updateAlertDisplay() {
      if (activeAlerts.length === 0) {
        document.getElementById("alert-expiration").textContent = "No active alerts.";
        document.getElementById("alert-type").textContent = "";
        document.getElementById("alert-areas").textContent = "";
        return;
      }
  
      if (transitioning) return; // Prevent transition if already in progress
  
      const currentAlert = activeAlerts[currentAlertIndex];
      const alertAreasContainer = document.getElementById("alert-areas");
      alertAreasContainer.innerHTML = ""; // Clear previous text
  
      const scrollingText = document.createElement("div");
      scrollingText.className = "scrolling-text";
      scrollingText.textContent = currentAlert.areaDesc;
      alertAreasContainer.appendChild(scrollingText);
  
      const containerWidth = alertAreasContainer.offsetWidth;
      const textWidth = scrollingText.scrollWidth;
  
      if (textWidth > containerWidth) {
        scrollingText.style.transform = `translateX(0)`;
        transitioning = true;
  
        setTimeout(() => {
          const scrollDistance = textWidth - containerWidth + 30; // Adding buffer space
          const scrollDuration = (scrollDistance / 150) * 1000; // Adjust scroll speed based on text length
  
          scrollingText.style.transition = `transform ${scrollDuration}ms linear`;
          scrollingText.style.transform = `translateX(-${scrollDistance}px)`;
  
          setTimeout(() => {
            transitioning = false; // Allow transition to next alert after 2 seconds
            currentAlertIndex = (currentAlertIndex + 1) % activeAlerts.length;
            updateAlertDisplay(); // Proceed to next alert after scrolling
          }, scrollDuration + 2000); // Add 2 seconds for readability
        }, 1000); // Wait 1 second before starting the scroll
      } else {
        setTimeout(() => {
          currentAlertIndex = (currentAlertIndex + 1) % activeAlerts.length;
          updateAlertDisplay();
        }, 5000); // If no scrolling needed, just wait for 5 seconds before switching alerts
      }
  
      document.getElementById("alert-expiration").textContent = `Expires: ${currentAlert.alertExpires}`;
      document.getElementById("alert-type").textContent = currentAlert.eventType;
      document.getElementById("alert-type").style.backgroundColor = currentAlert.alertColor;
    }
  
    function updateAlertCounts() {
      const alertCounts = {
        "Tornado Warning": 0,
        "Severe Thunderstorm Warning": 0,
        "Tornado Watch": 0,
        "Severe Thunderstorm Watch": 0,
        "Flash Flood Warning": 0,
        "Blizzard Warning": 0,
        "Winter Storm Warning": 0,
        "Lake Effect Snow Warning": 0,
        "Winter Storm Watch": 0,
        "Winter Weather Advisory": 0,
        "Special Weather Statement": 0,
      };
  
      activeAlerts.forEach((alert) => {
        if (alertCounts.hasOwnProperty(alert.eventType)) {
          alertCounts[alert.eventType]++;
        }
      });
  
      renderAlertCounts(alertCounts);
    }
  
    function renderAlertCounts(alertCounts) {
      const alertCountsContainer = document.getElementById("alert-counts");
      alertCountsContainer.innerHTML = "";  // Clear the existing boxes
  
      const warningCountBox = document.createElement("div");
      warningCountBox.className = "alert-count-box warning-count-box";
      warningCountBox.innerHTML = "Alert Counts";  // Display "Alert Counts" at the top
      alertCountsContainer.appendChild(warningCountBox);
  
      for (const key in alertCounts) {
        const count = alertCounts[key];
        const box = document.createElement("div");
        box.className = "alert-count-box";
        box.style.backgroundColor = alertColors[key] || "#444";
        box.innerHTML = `${key}: ${count}`;
        alertCountsContainer.appendChild(box);
      }
    }
  
    // Initialize the system
    fetchWeatherAlerts();
    setInterval(fetchWeatherAlerts, 3000);  // Fetch alerts every 3 seconds
    setInterval(integrateNewAlerts, 3000);   // Integrate new alerts every 3 seconds
    setTimeout(updateAlertDisplay, 5000);    // Start alert display after initial delay
  });
  