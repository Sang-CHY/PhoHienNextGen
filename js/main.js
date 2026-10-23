// =========================================================================
// PHẦN 1: CẤU HÌNH & KHỞI TẠO DỮ LIỆU
// =========================================================================
const ASSETS = {
  logo: "images/logo.png",
  locations: {
    denmau: { image: "images/denmau.jpg" },
    chuagiong: { image: "images/chuagiong.jpg" },
    vanmieu: { image: "images/vanmieu.jpg" },
  },
};

const EARTH_RADIUS_M = 6371008.8; // bán kính trung bình IUGG
const GEOFENCE_RADIUS_M = 100; // vùng nhận mộc
const MAX_ACCEPTABLE_ACCURACY_M = 150; // sai số GPS lớn hơn thì bỏ qua
const MAX_ACCURACY_BONUS_M = 50; // dung sai tối đa cộng thêm theo sai số GPS
const FIX_MAX_AGE_MS = 30000; // fix GPS cũ hơn 30s không tính giờ ở lại
const STAY_REQUIRED_SECONDS = 1800;

// Thông tin tham khảo: nên đối chiếu lại với nguồn chính thức trước khi phát hành
const LOCATIONS = [
  {
    id: "denmau",
    name: "Đền Mẫu",
    desc: "Nơi thờ Dương Quý Phi, kiến trúc cổ kính soi bóng bên hồ bán nguyệt.",
    detail:
      "Đền Mẫu Hưng Yên nổi tiếng linh thiêng, nằm trong quần thể di tích Phố Hiến lâu đời.",
    address: "Khu di tích Phố Hiến, TP. Hưng Yên",
    hours: "Khoảng 6:00 – 18:00 hằng ngày",
    ticket: "Miễn phí",
    duration: "45 – 60 phút",
    bestTime: "Sáng sớm hoặc chiều muộn, ngày rằm và mùng 1 đông người hơn",
    highlights: [
      "Hồ bán nguyệt phía trước đền",
      "Kiến trúc đền cổ trong quần thể Phố Hiến",
      "Không gian tín ngưỡng thờ Mẫu",
    ],
    tips: [
      "Ăn mặc kín đáo, lịch sự khi vào khu thờ tự",
      "Giữ yên lặng trong khu thờ chính",
    ],
    lat: 20.644433786625353,
    lng: 106.05440926370912,
    stamps: [
      { id: "dm1", name: "Mộc Đền Mẫu - Khám Phá", file: "images/dm1.png", type: "checkin" },
      { id: "dm2", name: "Mộc Đền Mẫu - Trải Nghiệm 30P", file: "images/dm2.png", type: "stay" },
    ],
  },
  {
    id: "chuagiong",
    name: "Chùa Chuông",
    desc: '"Phố Hiến đệ nhất danh thắng" – cổng tam quan rêu phong cổ kính.',
    detail:
      "Chùa Chuông lưu giữ nhiều hiện vật giá trị như quả chuông đúc năm 1707 và hàng trăm pho tượng.",
    address: "Chùa Chuông (Kim Chung Tự), TP. Hưng Yên",
    hours: "Khoảng 6:00 – 18:00 hằng ngày",
    ticket: "Miễn phí",
    duration: "45 – 60 phút",
    bestTime: "Buổi sáng, ánh sáng đẹp để chụp cổng tam quan",
    highlights: [
      "Cổng tam quan rêu phong cổ kính",
      "Quả chuông đúc năm 1707",
      "Hàng trăm pho tượng cổ",
    ],
    tips: [
      "Tháo mũ, nón khi vào chánh điện",
      "Hỏi trước khi chụp ảnh trong khu tượng thờ",
    ],
    lat: 20.655011955225113,
    lng: 106.05026360111725,
    stamps: [
      { id: "cc1", name: "Mộc Chùa Chuông - Khám Phá", file: "images/cc1.png", type: "checkin" },
      { id: "cc2", name: "Mộc Chùa Chuông - Trải Nghiệm 30P", file: "images/cc2.png", type: "stay" },
    ],
  },
  {
    id: "vanmieu",
    name: "Văn Miếu Xích Đằng",
    desc: "Biểu tượng văn hiến lâu đời của đất học Hưng Yên.",
    detail:
      "Văn Miếu Xích Đằng là nơi tôn vinh Khổng Tử và các bậc hiền triết tri thức thời xưa.",
    address: "Xích Đằng, TP. Hưng Yên",
    hours: "Khoảng 7:00 – 17:00 hằng ngày",
    ticket: "Miễn phí",
    duration: "40 – 60 phút",
    bestTime: "Sáng các ngày trong tuần, ít khách và yên tĩnh",
    highlights: [
      "Nơi thờ Khổng Tử và các bậc hiền triết",
      "Không gian cổ kính đậm tinh thần hiếu học",
      "Sân vườn rộng, thích hợp chụp ảnh",
    ],
    tips: [
      "Nên đi cuối hành trình vì địa điểm xa nhất so với Đền Mẫu",
      "Mang nước uống nếu đi buổi trưa",
    ],
    lat: 20.6623247752404,
    lng: 106.04916656478785,
    stamps: [
      { id: "vm1", name: "Mộc Văn Miếu - Khám Phá", file: "images/vm1.png", type: "checkin" },
      { id: "vm2", name: "Mộc Văn Miếu - Trải Nghiệm 30P", file: "images/vm2.png", type: "stay" },
    ],
  },
];

let map = null;
let selectedSchedule = [];
let currentItineraryIndex = 0;

let userLocation = null; // { lat, lng, accuracy, time }
let unlockedStamps = safeParse("phoHienStamps", []);
let stayTimers = safeParse("phoHienStayTimers", {});
let lastTickAt = Date.now();
let loadedStampImages = {};

let placedStamps = [];
let draggingStamp = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function injectInfoStyles() {
  if (document.getElementById("phoHienInfoStyles")) return;
  const style = document.createElement("style");
  style.id = "phoHienInfoStyles";
  style.textContent = `
    .info-grid { margin-top: 14px; border: 1px solid #eadfd3; border-radius: 12px; overflow: hidden; background: #fffaf5; }
    .info-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 9px 12px; border-bottom: 1px solid #f0e6da; font-size: 0.85rem; }
    .info-row:last-child { border-bottom: none; }
    .info-label { flex: 0 0 auto; font-weight: 700; color: #8b2323; white-space: nowrap; }
    .info-value { flex: 1 1 auto; text-align: right; color: #3a2d22; line-height: 1.4; }
    .info-section { margin-top: 14px; }
    .info-section h4 { font-size: 0.95rem; color: #2c1d11; margin: 0 0 6px; }
    .info-section ul { margin: 0; padding-left: 20px; list-style: disc; font-size: 0.85rem; line-height: 1.55; color: #444; }
    .info-section ul.stamp-status-list { list-style: none; padding-left: 0; }
  `;
  document.head.appendChild(style);
}

function injectContactFooter() {
  if (document.getElementById("contactFooter")) return;
  const footer = document.createElement("footer");
  footer.id = "contactFooter";
  footer.style.cssText =
    "text-align:center;font-size:0.8rem;color:#6b5a4a;padding:16px 12px 96px;line-height:1.5;";
  footer.innerHTML =
    '📧 Liên hệ góp ý, báo lỗi: <a href="mailto:navis7950@gmail.com" style="color:#8b2323;font-weight:700;text-decoration:none;">navis7950@gmail.com</a>';
  document.body.appendChild(footer);
}

document.addEventListener("DOMContentLoaded", () => {
  injectContactFooter();
  injectInfoStyles();
  preloadStampImages();
  initMap();
  renderLocationButtons();
  renderPOICards();
  renderStampsInventory();
  initCanvasInteraction();
  drawCanvas();

  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        const banner = document.getElementById("gpsPermissionBanner");
        if (banner) banner.classList.add("hidden");
        startWatchingGPS();
      }
    });
  }

  lastTickAt = Date.now();
  setInterval(processStayTimers, 1000);
});

function preloadStampImages() {
  LOCATIONS.forEach((loc) => {
    loc.stamps.forEach((stamp) => {
      const img = new Image();
      img.src = stamp.file;
      loadedStampImages[stamp.id] = img;
    });
  });
}

// =========================================================================
// PHẦN 2: GPS, KHOẢNG CÁCH & NHẬN MỘC
// =========================================================================

function setUserLocation(pos) {
  userLocation = {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy || 0,
    time: Date.now(),
  };
}

function requestGPSPermissionDirectly() {
  if (!navigator.geolocation) {
    alert("Trình duyệt không hỗ trợ GPS.");
    document.getElementById("gpsPermissionBanner").classList.add("hidden");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setUserLocation(pos);
      document.getElementById("gpsPermissionBanner").classList.add("hidden");
      showToastNotification("🟢 Đã bật vị trí GPS thành công!");
      startWatchingGPS();
    },
    (err) => {
      let errMsg = "Không thể lấy vị trí GPS.";
      if (err.code === 1)
        errMsg = "Bạn đã từ chối quyền GPS. Vui lòng bật lại trong cài đặt!";
      alert(errMsg);
      document.getElementById("gpsPermissionBanner").classList.add("hidden");
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

let gpsWatchId = null;
function startWatchingGPS() {
  if (gpsWatchId !== null) return;
  gpsWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      setUserLocation(pos);
      updateGPSStatus(`📡 GPS: Đã kết nối (sai số ±${Math.round(userLocation.accuracy)}m)`);
      checkAutomaticQuests();
      updateLiveDistance();
    },
    () => updateGPSStatus("⚠️ Mất tín hiệu GPS."),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  );
}

function updateGPSStatus(msg) {
  const statusElem = document.getElementById("gpsStatusHeader");
  if (statusElem) statusElem.innerText = msg;
}

// Khoảng cách haversine (mét)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
  return EARTH_RADIUS_M * c;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function distanceToLocation(loc) {
  if (!userLocation) return null;
  return calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng);
}

// Có đang trong vùng nhận mộc không, có tính dung sai theo sai số GPS
function isInsideGeofence(loc) {
  if (!userLocation) return false;
  if (userLocation.accuracy > MAX_ACCEPTABLE_ACCURACY_M) return false;
  const dist = distanceToLocation(loc);
  const bonus = Math.min(userLocation.accuracy, MAX_ACCURACY_BONUS_M);
  return dist - bonus <= GEOFENCE_RADIUS_M;
}

function checkAutomaticQuests() {
  if (!userLocation || selectedSchedule.length === 0) return;

  selectedSchedule.forEach((locId) => {
    const loc = LOCATIONS.find((l) => l.id === locId);
    if (!loc) return;

    const checkinStamp = loc.stamps.find((s) => s.type === "checkin");
    if (isInsideGeofence(loc) && !unlockedStamps.includes(checkinStamp.id)) {
      unlockStamp(
        checkinStamp.id,
        `🎉 Bạn đã tới ${loc.name}! Đã nhận ${checkinStamp.name}.`,
      );
    }
  });

  renderQuestList();
}

// Đếm giờ theo thời gian thực (Date.now), không phụ thuộc nhịp setInterval
function processStayTimers() {
  const now = Date.now();
  const elapsedSeconds = (now - lastTickAt) / 1000;
  lastTickAt = now;

  if (!userLocation || selectedSchedule.length === 0) return;
  if (now - userLocation.time > FIX_MAX_AGE_MS) return;

  let changed = false;
  selectedSchedule.forEach((locId) => {
    const loc = LOCATIONS.find((l) => l.id === locId);
    if (!loc) return;

    const stayStamp = loc.stamps.find((s) => s.type === "stay");
    if (unlockedStamps.includes(stayStamp.id)) return;

    if (isInsideGeofence(loc)) {
      stayTimers[locId] = (stayTimers[locId] || 0) + elapsedSeconds;
      changed = true;

      if (stayTimers[locId] >= STAY_REQUIRED_SECONDS) {
        unlockStamp(
          stayStamp.id,
          `🏆 Chúc mừng! Bạn đã ở lại ${loc.name} đủ 30 phút và nhận ${stayStamp.name}.`,
        );
      }
    }
  });

  if (changed) {
    try {
      localStorage.setItem("phoHienStayTimers", JSON.stringify(stayTimers));
    } catch (err) {
      console.error("Không lưu được bộ đếm:", err);
    }
  }

  renderQuestList();
  updateLiveDistance();
}

function unlockStamp(stampId, message) {
  if (!unlockedStamps.includes(stampId)) {
    unlockedStamps.push(stampId);
    localStorage.setItem("phoHienStamps", JSON.stringify(unlockedStamps));
    showToastNotification(message);
    renderStampsInventory();
    renderQuestList();
    if (document.getElementById("tabItinerary")?.classList.contains("active")) {
      renderItineraryPage();
    }
  }
}

function showToastNotification(message) {
  const toast = document.getElementById("toastNotification");
  const msgElem = document.getElementById("toastMessage");

  msgElem.innerText = message;
  toast.classList.remove("hidden");

  const progressBar = toast.querySelector(".toast-progress-bar");
  progressBar.style.animation = "none";
  progressBar.offsetHeight;
  progressBar.style.animation = "shrinkProgress 4s linear forwards";

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
}

// =========================================================================
// PHẦN 3: BẢN ĐỒ & LỊCH TRÌNH
// =========================================================================

function initMap() {
  map = L.map("map").setView([20.645, 106.053], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  LOCATIONS.forEach((loc) => {
    L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(`<b>${loc.name}</b>`);
  });
}

function renderLocationButtons() {
  const container = document.getElementById("locationButtonsContainer");
  container.innerHTML = LOCATIONS.map((loc) => {
    const orderIndex = selectedSchedule.indexOf(loc.id);
    const isSelected = orderIndex !== -1;
    const badgeHTML = isSelected
      ? `<span class="order-badge">${orderIndex + 1}</span>`
      : "";

    return `
      <button class="location-btn ${isSelected ? "selected" : ""}" onclick="toggleSelectLocation('${loc.id}')">
        ${loc.name}
        ${badgeHTML}
      </button>
    `;
  }).join("");

  const activeTab = document.querySelector(".tab-content.active");
  const stickyBar = document.getElementById("stickyStartContainer");
  if (selectedSchedule.length > 0 && activeTab && activeTab.id === "tab1") {
    stickyBar.classList.remove("hidden");
  } else {
    stickyBar.classList.add("hidden");
  }
}

function toggleSelectLocation(id) {
  const existingIndex = selectedSchedule.indexOf(id);
  if (existingIndex !== -1) {
    selectedSchedule.splice(existingIndex, 1);
  } else {
    selectedSchedule.push(id);
  }
  renderLocationButtons();
}

function renderPOICards() {
  const container = document.getElementById("poiCardContainer");
  container.innerHTML = LOCATIONS.map(
    (loc) => `
    <div class="poi-card-item">
      <div class="poi-icon">🏛️</div>
      <div class="poi-info">
        <h4>${loc.name}</h4>
        <p>${loc.desc}</p>
        <span class="poi-tag">2 Nhiệm vụ mộc</span>
        <span class="poi-tag">${loc.ticket}</span>
      </div>
    </div>
  `,
  ).join("");
}

function confirmAndStartItinerary() {
  if (selectedSchedule.length === 0) return;
  currentItineraryIndex = 0;

  const bubble = document.getElementById("questBubble");
  bubble.classList.remove("hidden");
  bubble.classList.add("active-pulse");

  document.getElementById("questBadgeCount").innerText =
    selectedSchedule.length * 2;

  renderQuestList();

  const itineraryNavBtn = document.querySelectorAll(".bottom-nav .nav-item")[1];
  switchTab("tabItinerary", itineraryNavBtn);
  showToastNotification("🚀 Đã kích hoạt danh sách nhiệm vụ!");
}

// =========================================================================
// PHẦN 4: LỊCH TRÌNH & CHI TIẾT NHIỆM VỤ
// =========================================================================

function liveDistanceText(loc) {
  const d = distanceToLocation(loc);
  if (d === null) return "Đang chờ GPS";
  return `${formatDistance(d)}${d <= GEOFENCE_RADIUS_M ? " (đã trong vùng nhận mộc)" : ""}`;
}

function updateLiveDistance() {
  const el = document.getElementById("liveDistance");
  if (!el || selectedSchedule.length === 0) return;
  const loc = LOCATIONS.find((l) => l.id === selectedSchedule[currentItineraryIndex]);
  if (loc) el.innerText = liveDistanceText(loc);
}

function renderItineraryPage() {
  const container = document.getElementById("itineraryDetailContainer");

  if (selectedSchedule.length === 0) {
    container.innerHTML = `
      <div class="card anim-fade-up" style="text-align: center; padding: 30px;">
        <p>⚠️ Bạn chưa lựa chọn địa điểm nào.</p>
        <p class="sub-text" style="margin-top: 8px;">Vui lòng quay lại mục <b>Bản đồ</b> để chọn lịch trình!</p>
      </div>
    `;
    return;
  }

  const currentLocId = selectedSchedule[currentItineraryIndex];
  const locData = LOCATIONS.find((l) => l.id === currentLocId);
  const totalSteps = selectedSchedule.length;

  const imgUrl = ASSETS.locations[locData.id]?.image;
  const imageHTML = imgUrl
    ? `<img src="${imgUrl}" alt="${locData.name}" class="itinerary-img anim-fade-up anim-delay-2" onerror="this.style.display='none'" />`
    : "";

  // Khoảng cách từ chặng trước
  let legHTML = "";
  if (currentItineraryIndex > 0) {
    const prev = LOCATIONS.find((l) => l.id === selectedSchedule[currentItineraryIndex - 1]);
    const legDist = calculateDistance(prev.lat, prev.lng, locData.lat, locData.lng);
    legHTML = `<div class="info-row"><span class="info-label">🚗 Từ ${prev.name}</span><span class="info-value">${formatDistance(legDist)} theo đường chim bay</span></div>`;
  }

  const stampStatus = locData.stamps
    .map((s) => {
      const done = unlockedStamps.includes(s.id);
      return `<li>${done ? "✅" : "🔒"} ${s.name}</li>`;
    })
    .join("");

  container.innerHTML = `
    <div class="itinerary-card">
      <div class="anim-fade-up" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span class="itinerary-step-badge">Chặng ${currentItineraryIndex + 1} / ${totalSteps}</span>
        <div>
          <button class="btn-step-mini" onclick="changeItineraryStep(-1)" ${currentItineraryIndex === 0 ? "disabled" : ""}>⬅️</button>
          <button class="btn-step-mini" onclick="changeItineraryStep(1)" ${currentItineraryIndex === totalSteps - 1 ? "disabled" : ""}>➡️</button>
        </div>
      </div>

      <h3 class="anim-fade-up anim-delay-1" style="font-size: 1.2rem; color: #2c1d11;">${locData.name}</h3>
      <p class="sub-text anim-fade-up anim-delay-1">${locData.desc}</p>

      ${imageHTML}

      <p class="anim-fade-up anim-delay-3" style="margin-top: 10px; line-height: 1.5; font-size: 0.9rem; color: #444;">${locData.detail}</p>

      <div class="info-grid anim-fade-up anim-delay-3">
        <div class="info-row"><span class="info-label">📍 Cách bạn</span><span class="info-value" id="liveDistance">${liveDistanceText(locData)}</span></div>
        ${legHTML}
        <div class="info-row"><span class="info-label">🏠 Địa chỉ</span><span class="info-value">${locData.address}</span></div>
        <div class="info-row"><span class="info-label">🕒 Giờ mở cửa</span><span class="info-value">${locData.hours}</span></div>
        <div class="info-row"><span class="info-label">🎟️ Vé vào cổng</span><span class="info-value">${locData.ticket}</span></div>
        <div class="info-row"><span class="info-label">⏱️ Tham quan</span><span class="info-value">${locData.duration}</span></div>
        <div class="info-row"><span class="info-label">🌤️ Nên đi lúc</span><span class="info-value">${locData.bestTime}</span></div>
      </div>

      <div class="info-section anim-fade-up anim-delay-3">
        <h4>✨ Điểm nổi bật</h4>
        <ul>${locData.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>
      </div>

      <div class="info-section anim-fade-up anim-delay-3">
        <h4>💡 Lưu ý khi tham quan</h4>
        <ul>${locData.tips.map((t) => `<li>${t}</li>`).join("")}</ul>
      </div>

      <div class="info-section anim-fade-up anim-delay-3">
        <h4>🏵️ Mộc tại địa danh</h4>
        <ul class="stamp-status-list">${stampStatus}</ul>
      </div>

      <p class="sub-text" style="margin-top: 8px; font-size: 0.75rem;">Thông tin mang tính tham khảo, có thể thay đổi theo thực tế.</p>

      <div class="anim-fade-up anim-delay-3" style="margin-top: 15px;">
        <button class="btn-start-itinerary" onclick="openGoogleMaps(${locData.lat}, ${locData.lng})">
          🧭 Chỉ đường tới ${locData.name} (Google Maps)
        </button>
      </div>
    </div>
  `;
}

function changeItineraryStep(direction) {
  const newIndex = currentItineraryIndex + direction;
  if (newIndex >= 0 && newIndex < selectedSchedule.length) {
    currentItineraryIndex = newIndex;
    renderItineraryPage();
  }
}

function openGoogleMaps(lat, lng) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    "_blank",
  );
}

function toggleQuestModal() {
  document.getElementById("questModal").classList.toggle("hidden");
}

function handleModalOverlayClick(e) {
  if (e.target.id === "questModal") toggleQuestModal();
}

function toggleInfoModal() {
  document.getElementById("infoModal").classList.toggle("hidden");
}

function handleInfoOverlayClick(e) {
  if (e.target.id === "infoModal") toggleInfoModal();
}

function renderQuestList() {
  const container = document.getElementById("questListContainer");
  if (selectedSchedule.length === 0) {
    container.innerHTML = `<p class="sub-text">Chưa chọn lịch trình tham quan.</p>`;
    return;
  }

  container.innerHTML = selectedSchedule
    .map((locId, idx) => {
      const loc = LOCATIONS.find((l) => l.id === locId);

      const checkinStamp = loc.stamps.find((s) => s.type === "checkin");
      const isCheckinDone = unlockedStamps.includes(checkinStamp.id);

      const stayStamp = loc.stamps.find((s) => s.type === "stay");
      const isStayDone = unlockedStamps.includes(stayStamp.id);
      const staySeconds = Math.min(stayTimers[locId] || 0, STAY_REQUIRED_SECONDS);
      const stayMinutesLeft = Math.max(0, Math.ceil((STAY_REQUIRED_SECONDS - staySeconds) / 60));

      const d = distanceToLocation(loc);
      const distText = d === null ? "Đang tính vị trí..." : `Cách bạn: ${formatDistance(d)}`;

      return `
      <div style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
        <div style="font-weight: bold; font-size: 0.95rem;">Chặng ${idx + 1}: ${loc.name} (${distText})</div>

        <div class="quest-item ${isCheckinDone ? "completed" : ""}" style="margin-top: 5px;">
          <span class="quest-status-icon">${isCheckinDone ? "✅" : "📍"}</span>
          <div>
            <div class="quest-title">1. Đến vị trí ${loc.name}</div>
            <div class="quest-dist">${isCheckinDone ? "Đã nhận mộc 1" : `Đến gần ${GEOFENCE_RADIUS_M}m để mở mộc`}</div>
          </div>
        </div>

        <div class="quest-item ${isStayDone ? "completed" : ""}" style="margin-top: 5px;">
          <span class="quest-status-icon">${isStayDone ? "✅" : "⏳"}</span>
          <div>
            <div class="quest-title">2. Ở lại 30 phút tại ${loc.name}</div>
            <div class="quest-dist">${isStayDone ? "Đã nhận mộc 2" : `Đã ở lại: ${Math.floor(staySeconds / 60)}/30 phút (Còn ${stayMinutesLeft} phút)`}</div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

// =========================================================================
// PHẦN 5: KHUNG ẢNH & CANVAS MỘC
// =========================================================================

function switchTab(tabId, btn) {
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((b) => b.classList.remove("active"));

  const targetTab = document.getElementById(tabId);
  targetTab.classList.add("active");
  btn.classList.add("active");

  const stickyBar = document.getElementById("stickyStartContainer");
  if (tabId === "tab1" && selectedSchedule.length > 0) {
    stickyBar.classList.remove("hidden");
  } else {
    stickyBar.classList.add("hidden");
  }

  if (tabId === "tabItinerary") renderItineraryPage();
}

const canvas = document.getElementById("photoFrameCanvas");
const ctx = canvas.getContext("2d");

function renderStampsInventory() {
  const container = document.getElementById("stampsInventory");
  let html = "";

  LOCATIONS.forEach((loc) => {
    loc.stamps.forEach((stamp) => {
      const isUnlocked = unlockedStamps.includes(stamp.id);
      const isPlaced = placedStamps.some((s) => s.stampId === stamp.id);

      if (isUnlocked) {
        html += `<div class="stamp-item unlocked ${isPlaced ? "active-stamp" : ""}" onclick="toggleStampToCanvas('${stamp.id}')">${stamp.name}</div>`;
      } else {
        html += `<div class="stamp-item">🔒 ${stamp.name}</div>`;
      }
    });
  });

  container.innerHTML = html;
}

function toggleStampToCanvas(stampId) {
  const index = placedStamps.findIndex((s) => s.stampId === stampId);
  if (index !== -1) {
    placedStamps.splice(index, 1);
  } else {
    placedStamps.push({
      id: Date.now(),
      stampId: stampId,
      img: loadedStampImages[stampId],
      x: canvas.width / 2 + (Math.random() * 40 - 20),
      y: canvas.height / 2 + (Math.random() * 40 - 20),
      size: 80,
    });
  }
  renderStampsInventory();
  drawCanvas();
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const frameX = 50,
    frameY = 50,
    frameW = 400,
    frameH = 550;
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#8b2323";
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  ctx.fillStyle = "#8b2323";
  ctx.fillRect(frameX, frameY + frameH - 45, frameW, 45);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "PHỐ HIẾN NEXT GEN - HÀNH TRÌNH TÂM LINH",
    canvas.width / 2,
    frameY + frameH - 17,
  );

  placedStamps.forEach((stamp) => {
    if (stamp.img && stamp.img.complete) {
      ctx.drawImage(
        stamp.img,
        stamp.x - stamp.size / 2,
        stamp.y - stamp.size / 2,
        stamp.size,
        stamp.size,
      );
    } else {
      ctx.beginPath();
      ctx.arc(stamp.x, stamp.y, stamp.size / 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#8b2323";
      ctx.fill();
    }
  });
}

// =========================================================================
// PHẦN 6: KÉO THẢ MỘC
// =========================================================================

function initCanvasInteraction() {
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function handleStart(e) {
    const pos = getCanvasPos(e);
    for (let i = placedStamps.length - 1; i >= 0; i--) {
      const stamp = placedStamps[i];
      const dist = Math.hypot(pos.x - stamp.x, pos.y - stamp.y);
      if (dist <= stamp.size / 2) {
        draggingStamp = stamp;
        dragOffsetX = pos.x - stamp.x;
        dragOffsetY = pos.y - stamp.y;
        break;
      }
    }
  }

  function handleMove(e) {
    if (!draggingStamp) return;
    if (e.cancelable) e.preventDefault();

    const pos = getCanvasPos(e);
    draggingStamp.x = pos.x - dragOffsetX;
    draggingStamp.y = pos.y - dragOffsetY;
    drawCanvas();
  }

  function handleEnd() {
    draggingStamp = null;
  }

  canvas.addEventListener("mousedown", handleStart);
  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("mouseup", handleEnd);

  canvas.addEventListener("touchstart", handleStart, { passive: false });
  canvas.addEventListener("touchmove", handleMove, { passive: false });
  canvas.addEventListener("touchend", handleEnd);
}

function downloadExportImage() {
  const link = document.createElement("a");
  link.download = "PhoHienNextGen_Frame.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
