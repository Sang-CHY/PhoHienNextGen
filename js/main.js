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

// 3 Địa danh chính
const LOCATIONS = [
  {
    id: "denmau",
    name: "Đền Mẫu",
    desc: "Nơi thờ Dương Quý Phi, kiến trúc cổ kính soi bóng bên hồ bán nguyệt.",
    detail:
      "Đền Mẫu Hưng Yên nổi tiếng linh thiêng, nằm trong quần thể di tích Phố Hiến lâu đời.",
    lat: 20.644433786625353,
    lng: 106.05440926370912,
    stamps: [
      {
        id: "dm1",
        name: "Mộc Đền Mẫu - Khám Phá",
        file: "images/dm1.png",
        type: "checkin",
      },
      {
        id: "dm2",
        name: "Mộc Đền Mẫu - Trải Nghiệm 30P",
        file: "images/dm2.png",
        type: "stay",
      },
    ],
  },
  {
    id: "chuagiong",
    name: "Chùa Chuông",
    desc: '"Phố Hiến đệ nhất danh thắng" – cổng tam quan rêu phong cổ kính.',
    detail:
      "Chùa Chuông lưu giữ nhiều hiện vật giá trị như quả chuông đúc năm 1707 và hàng trăm pho tượng.",
    lat: 20.655011955225113,
    lng: 106.05026360111725,
    stamps: [
      {
        id: "cc1",
        name: "Mộc Chùa Chuông - Khám Phá",
        file: "images/cc1.png",
        type: "checkin",
      },
      {
        id: "cc2",
        name: "Mộc Chùa Chuông - Trải Nghiệm 30P",
        file: "images/cc2.png",
        type: "stay",
      },
    ],
  },
  {
    id: "vanmieu",
    name: "Văn Miếu Xích Đằng",
    desc: "Biểu tượng văn hiến lâu đời của đất học Hưng Yên.",
    detail:
      "Văn Miếu Xích Đằng là nơi tôn vinh Khổng Tử và các bậc hiền triết tri thức thời xưa.",
    lat: 20.6623247752404,
    lng: 106.04916656478785,
    stamps: [
      {
        id: "vm1",
        name: "Mộc Văn Miếu - Khám Phá",
        file: "images/vm1.png",
        type: "checkin",
      },
      {
        id: "vm2",
        name: "Mộc Văn Miếu - Trải Nghiệm 30P",
        file: "images/vm2.png",
        type: "stay",
      },
    ],
  },
];

let map = null;
let selectedSchedule = [];
let currentItineraryIndex = 0;

// Trạng thái GPS, đếm thời gian & Mộc
let userLocation = null;
let unlockedStamps = JSON.parse(localStorage.getItem("phoHienStamps")) || []; // Chứa danh sách stamp id (dm1, dm2, ...)
let stayTimers = {}; // Lưu thời gian ở lại (tính bằng giây) cho từng địa danh
let loadedStampImages = {}; // Preload các ảnh mộc

// Quản lý mộc được đặt trên Canvas (kéo thả tự do)
let placedStamps = []; // Cấu trúc: { id, stampId, img, x, y, size: 70 }
let draggingStamp = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

document.addEventListener("DOMContentLoaded", () => {
  preloadStampImages();
  initMap();
  renderLocationButtons();
  renderPOICards();
  renderStampsInventory();
  initCanvasInteraction();
  drawCanvas();

  // Kiểm tra quyền GPS nếu đã cấp trước đó
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        const banner = document.getElementById("gpsPermissionBanner");
        if (banner) banner.classList.add("hidden");
        startWatchingGPS();
      }
    });
  }

  // Tự động đếm thời gian ở lại mỗi giây
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
// PHẦN 2: XỬ LÝ GPS & TỰ ĐỘNG ĐẮM/LƯU MỘC & ĐẾM NGHỈ 30 PHÚT
// =========================================================================

function requestGPSPermissionDirectly() {
  if (!navigator.geolocation) {
    alert("Trình duyệt không hỗ trợ GPS.");
    document.getElementById("gpsPermissionBanner").classList.add("hidden");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
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

function startWatchingGPS() {
  navigator.geolocation.watchPosition(
    (pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      updateGPSStatus("📡 GPS: Đã kết nối vị trí thực");
      checkAutomaticQuests();
    },
    () => {
      updateGPSStatus("⚠️ Mất tín hiệu GPS.");
    },
    { enableHighAccuracy: true },
  );
}

function updateGPSStatus(msg) {
  const statusElem = document.getElementById("gpsStatusHeader");
  if (statusElem) statusElem.innerText = msg;
}

function checkAutomaticQuests() {
  if (!userLocation || selectedSchedule.length === 0) return;

  selectedSchedule.forEach((locId) => {
    const loc = LOCATIONS.find((l) => l.id === locId);
    if (!loc) return;

    const dist = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      loc.lat,
      loc.lng,
    );

    // Nhiệm vụ 1: Đặt chân đến địa danh (Khoảng cách <= 100m)
    const checkinStamp = loc.stamps.find((s) => s.type === "checkin");
    if (dist <= 100 && !unlockedStamps.includes(checkinStamp.id)) {
      unlockStamp(
        checkinStamp.id,
        `🎉 Bạn đã tới ${loc.name}! Đã nhận ${checkinStamp.name}.`,
      );
    }
  });

  renderQuestList();
}

// Xử lý đếm ngược 30 phút (1800 giây)
function processStayTimers() {
  if (!userLocation || selectedSchedule.length === 0) return;

  selectedSchedule.forEach((locId) => {
    const loc = LOCATIONS.find((l) => l.id === locId);
    if (!loc) return;

    const stayStamp = loc.stamps.find((s) => s.type === "stay");
    if (unlockedStamps.includes(stayStamp.id)) return; // Đã nhận mộc 30p rồi thì bỏ qua

    const dist = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      loc.lat,
      loc.lng,
    );

    // Nếu người dùng đang ở trong bán kính 100m của địa điểm
    if (dist <= 100) {
      stayTimers[locId] = (stayTimers[locId] || 0) + 1;

      // Đủ 30 phút = 1800 giây
      if (stayTimers[locId] >= 1800) {
        unlockStamp(
          stayStamp.id,
          `🏆 Chúc mừng! Bạn đã ở lại ${loc.name} đủ 30 phút và nhận ${stayStamp.name}.`,
        );
      }
    }
  });

  renderQuestList();
}

function unlockStamp(stampId, message) {
  if (!unlockedStamps.includes(stampId)) {
    unlockedStamps.push(stampId);
    localStorage.setItem("phoHienStamps", JSON.stringify(unlockedStamps));
    showToastNotification(message);
    renderStampsInventory();
    renderQuestList();
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
// PHẦN 4: LỊCH TRÌNH & CHI TIẾT NHIỆM VỤ MODAL
// =========================================================================

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

      // Check-in Quest
      const checkinStamp = loc.stamps.find((s) => s.type === "checkin");
      const isCheckinDone = unlockedStamps.includes(checkinStamp.id);

      // Stay 30m Quest
      const stayStamp = loc.stamps.find((s) => s.type === "stay");
      const isStayDone = unlockedStamps.includes(stayStamp.id);
      const staySeconds = stayTimers[locId] || 0;
      const stayMinutesLeft = Math.max(0, Math.ceil((1800 - staySeconds) / 60));

      let distText = "Đang tính vị trí...";
      if (userLocation) {
        const d = Math.round(
          calculateDistance(
            userLocation.lat,
            userLocation.lng,
            loc.lat,
            loc.lng,
          ),
        );
        distText = `Cách bạn: ${d}m`;
      }

      return `
      <div style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
        <div style="font-weight: bold; font-size: 0.95rem;">Chặng ${idx + 1}: ${loc.name} (${distText})</div>
        
        <!-- NV 1: Đến nơi -->
        <div class="quest-item ${isCheckinDone ? "completed" : ""}" style="margin-top: 5px;">
          <span class="quest-status-icon">${isCheckinDone ? "✅" : "📍"}</span>
          <div>
            <div class="quest-title">1. Đến vị trí ${loc.name}</div>
            <div class="quest-dist">${isCheckinDone ? "Đã nhận mộc 1" : "Đến gần <=100m để mở mộc"}</div>
          </div>
        </div>

        <!-- NV 2: Ở lại 30 phút -->
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
// PHẦN 5: KHUNG ẢNH & CANVAS MỘC HÌNH ẢNH (DỒN TỰ DO)
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
    const imgObj = loadedStampImages[stampId];
    placedStamps.push({
      id: Date.now(),
      stampId: stampId,
      img: imgObj,
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

  // Khung ảnh nền
  const frameX = 50,
    frameY = 50,
    frameW = 400,
    frameH = 550;
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#8b2323";
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  // Thanh tiêu đề dưới khung
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

  // Vẽ các file mộc PNG được kéo thả tự do
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
      // Nếu hình ảnh chưa kịp nạp xong thì vẽ hình tròn dự phòng
      ctx.beginPath();
      ctx.arc(stamp.x, stamp.y, stamp.size / 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#8b2323";
      ctx.fill();
    }
  });
}

// =========================================================================
// PHẦN 6: KÉO THẢ TỰ DO MỘC HÌNH ẢNH
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

