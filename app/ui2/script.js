// --- DOM Elements (Đã cập nhật) ---
const loginView = document.getElementById('login-view'), 
      appView = document.getElementById('app-view'),
      contentArea = document.getElementById('content-area'),
      dashboardView = document.getElementById('dashboard-view'), 
      detailView = document.getElementById('detail-view'),
      productGrid = document.getElementById('product-grid'), 
      loginForm = document.getElementById('login-form'),
      loginError = document.getElementById('login-error'),
      logoutBtn = document.getElementById('logout-btn'), 
      welcomeUser = document.getElementById('welcome-user'),
      backToDashboardBtn = document.getElementById('back-to-dashboard-btn'),
      treeName = document.getElementById('tree-name'),
      addProductModal = document.getElementById('add-product-modal'), 
      addProductBtn = document.getElementById('add-product-btn'),
      addProductForm = document.getElementById('add-product-form'), 
      addProductCancelBtn = document.getElementById('add-product-cancel-btn'),
      loader = document.getElementById('loader'),
      realtimeVideo = document.getElementById('realtime-video'),
      overlayCanvas = document.getElementById('overlay-canvas'),
      streamStatus = document.getElementById('stream-status'),
      viewModeNormalBtn = document.getElementById('view-mode-normal'),
      viewModeAiBtn = document.getElementById('view-mode-ai'),
      videoContainer = document.getElementById('video-container'), 
      detectionContainer = document.getElementById('detection-container');
// === DOM CHO ANALYTICS ===
const analyticsView = document.getElementById('analytics-view'),
      analyticsPlantGridView = document.getElementById('analytics-plant-grid-view'),
      analyticsProductGrid = document.getElementById('analytics-product-grid'),
      analyticsHistoryView = document.getElementById('analytics-history-view'),
      analyticsBackBtn = document.getElementById('analytics-back-btn'),
      analyticsHistoryTitle = document.getElementById('analytics-history-title'),
      historyTimeline = document.getElementById('history-timeline');
// === DOM TỪ V18 ===
const floatingSidebar = document.getElementById('floating-sidebar'),
      sidebarToggleBtn = document.getElementById('sidebar-toggle-btn'),
      mainNav = document.getElementById('main-nav'),
      viewTitle = document.getElementById('view-title'),
      plantTimeEl = document.getElementById('plant-time'),
      plantWeatherEl = document.getElementById('plant-weather'),
      plantTempEl = document.getElementById('plant-temp'),
      plantHumidityEl = document.getElementById('plant-humidity'),
      plantLightEl = document.getElementById('plant-light'),
      plantWaterEl = document.getElementById('plant-water'),
      plantLocationEl = document.getElementById('plant-location'),
      aiResultsContent = document.getElementById('ai-results-content');
// === DOM CHO NÚT HÀNH ĐỘNG & TOAST ===
const waterPlantBtn = document.getElementById('water-plant-btn');
const fertilizePlantBtn = document.getElementById('fertilize-plant-btn');
const harvestPlantBtn = document.getElementById('harvest-plant-btn');
const fillWaterBtn = document.getElementById('fill-water-btn');
const toast = document.getElementById('toast-notification');
let toastTimeout = null;

// --- THÊM MỚI: DOM CHO SOUND DETECT ---
const soundView = document.getElementById('sound-view');
const soundCanvas = document.getElementById('sound-canvas');
const soundLabel = document.getElementById('sound-label');
const alertModal = document.getElementById('alert-modal');
const alertMessage = document.getElementById('alert-message');
const alertCloseBtn = document.getElementById('alert-close-btn');

// --- API Configuration ---
const API_BASE_URL = "http://localhost:8000"; 
const WEBRTC_URL_BASE_WS = `wss://ce2cb578c3d6.ngrok-free.app/stream/ws`; 
const WORKFLOW_WATERING_URL = "https://workflow.emg.edu.vn:5678/webhook/watering-plants";
const WORKFLOW_FILL_WATER_URL = "https://workflow.emg.edu.vn:5678/webhook/fillwater"; 

// --- State Management ---
let state = {
    isLoggedIn: false,
    currentUser: null,
    token: null,
    products: [],
    selectedProductId: null,
    isAiDetectionActive: false,
    
    // --- THÊM MỚI: State cho Âm thanh ---
    audioContext: null,
    analyserNode: null,
    audioStream: null,
    speechRecognition: null,
    visualizationFrameId: null, // Để dừng/bắt đầu vẽ
    currentSoundLabel: "...", // Label hiện tại của âm thanh
};

let clockInterval = null; 
let dataFetchInterval = null; 

// --- WebRTC Service (Không đổi) ---
const WebRTCService = {
    ws: null,
    pc: null,
    videoElement: null,
    canvasContext: null,
    lastDetections: {},
    WEBSOCKET_URL_BASE: WEBRTC_URL_BASE_WS, 

    connect: function(roomName, videoEl, canvasEl) {
        this.videoElement = videoEl;
        this.canvasContext = canvasEl.getContext('2d');
        const clientId = `viewer_${crypto.randomUUID()}`;
        const fullUrl = `${this.WEBSOCKET_URL_BASE}/${roomName}/${clientId}`;
        streamStatus.textContent = `Connecting to room '${roomName}'...`;
        
        try {
            this.ws = new WebSocket(fullUrl);
        } catch (error) {
            console.error("WebSocket connection error:", error);
            streamStatus.textContent = "Failed to connect. (Check URL or network)";
            return;
        }

        this.ws.onopen = () => {
            streamStatus.textContent = "Connected, requesting video...";
            this.ws.send(JSON.stringify({ type: 'join_as_viewer' }));
        };
        this.ws.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'offer') this.handleOffer(message.sdp);
                else if (message.error) {
                    streamStatus.textContent = `Server Error: ${message.error}`;
                    this.disconnect();
                }
            } catch (e) {
                console.warn("Received non-JSON WebSocket message:", event.data);
            }
        };
        this.ws.onclose = () => { streamStatus.textContent = "Connection lost."; this.cleanup(); };
        this.ws.onerror = (err) => { 
            console.error("WebSocket Error:", err);
            streamStatus.textContent = "Connection error."; 
            this.cleanup(); 
        };
    },

    handleOffer: async function(offerSdp) {
        try {
            if (this.pc) this.pc.close();
            this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            this.pc.ontrack = (event) => {
                if (this.videoElement.srcObject !== event.streams[0]) {
                    this.videoElement.srcObject = event.streams[0];
                    streamStatus.style.display = 'none';
                }
            };
            this.pc.onicecandidate = (event) => {
                if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate.toJSON() }));
                }
            };
            await this.pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'answer', sdp: this.pc.localDescription.toJSON() }));
            }
        } catch (error) {
            console.error("Error handling offer:", error);
            streamStatus.textContent = "Error setting up video stream.";
        }
    },
    
    renderStaticDetections: function(detectionData) {
        if (!this.canvasContext || !detectionData || !detectionData.detections) return;
        const { detections, orig_shape } = detectionData;
        const canvas = this.canvasContext.canvas;
        if (!orig_shape) return;
        const scaleX = canvas.width / orig_shape[1];
        const scaleY = canvas.height / orig_shape[0];
        detections.forEach(det => {
            // (Code vẽ box V13 đã bị comment out, giữ nguyên)
        });
    },
    
    cleanup: function() {
        if (this.pc) { this.pc.close(); this.pc = null; }
        if (this.videoElement) { this.videoElement.srcObject = null; }
        if(this.canvasContext) this.canvasContext.clearRect(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);
        streamStatus.style.display = 'flex';
        streamStatus.textContent = "Waiting for video stream...";
        this.lastDetections = {};
    },
    
    disconnect: function() {
        if (this.ws) { this.ws.close(); this.ws = null; }
        this.cleanup();
    }
};

// --- UI Functions (Đã cập nhật) ---
const showLoader = () => loader.classList.remove('view-hidden');
const hideLoader = () => loader.classList.add('view-hidden');
const showAddProductModal = () => { addProductForm.reset(); addProductModal.classList.add('modal-visible'); };
const hideAddProductModal = () => { addProductModal.classList.remove('modal-visible'); };

// THÊM MỚI: Hàm hiển thị/ẩn Alert
const showAlert = (animal) => {
    alertMessage.textContent = `Phát hiện ${animal === 'Giọng chim' ? 'tiếng chim' : 'tiếng chuột'} ở trong vườn của bạn!`;
    alertModal.classList.add('modal-visible');
};
const hideAlert = () => {
    alertModal.classList.remove('modal-visible');
    // Reset lại label sau khi tắt alert
    updateSoundLabel(""); 
};

// Hàm Toast (Không đổi)
const showToast = (message, type = 'success') => {
    toast.textContent = message;
    toast.className = 'show';
    toast.classList.add(type);
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.className = '';
    }, 3000);
};

// Hàm Navigation (Đã cập nhật)
const handleNavigation = (viewId) => {
    // Ẩn tất cả các view
    contentArea.querySelectorAll('main').forEach(view => view.classList.add('view-hidden'));
    
    // Dừng vẽ sóng âm nếu rời khỏi sound-view
    if (state.visualizationFrameId) {
        cancelAnimationFrame(state.visualizationFrameId);
        state.visualizationFrameId = null;
    }

    const activeView = document.getElementById(`${viewId}-view`);
    if (activeView) {
        activeView.classList.remove('view-hidden');
        // Nếu là sound-view, bắt đầu vẽ
        if (viewId === 'sound') {
            startSoundVisualization();
        }
    } else if (viewId === 'login') {
        loginView.classList.remove('view-hidden');
        appView.classList.add('view-hidden');
    } else {
        loginView.classList.add('view-hidden');
        appView.classList.remove('view-hidden');
        if (!activeView) { 
            document.getElementById('dashboard-view').classList.remove('view-hidden');
            viewId = 'dashboard';
        }
    }
    
    mainNav.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === viewId) {
            link.classList.add('active');
        }
    });
    
    const activeLink = mainNav.querySelector(`.nav-link[data-view="${viewId}"]`);
    viewTitle.textContent = activeLink ? activeLink.querySelector('span').textContent : "Login";
    
    // Dọn dẹp WebRTC khi rời detail view (Không đổi)
    if (viewId !== 'detail' && (clockInterval || dataFetchInterval)) {
        WebRTCService.disconnect();
        if (clockInterval) clearInterval(clockInterval);
        if (dataFetchInterval) clearInterval(dataFetchInterval);
        clockInterval = null;
        dataFetchInterval = null;
    }
};

// --- Main Logic (Không đổi, chỉ thêm hàm mới) ---
const renderDashboard = () => { 
    if (state.products.length === 0) {
        productGrid.innerHTML = `<p class="text-gray-400 col-span-full text-center">Không tìm thấy cây nào. Hãy thêm cây mới.</p>`;
        return;
    }
    productGrid.innerHTML = state.products.map(product => `
        <div class="card p-4 flex flex-col justify-between" data-product-id="${product.productID}">
            <div class="cursor-pointer product-card-main-area">
                <div class="flex justify-between items-start">
                    <h3 class="text-lg font-bold text-white">${product.name}</h3>
                    <span class="text-xs font-bold px-2 py-1 rounded ${product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">${product.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
                <p class="text-sm mt-2 text-gray-300">${product.description}</p>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-600 flex gap-2">
                <button class="btn ${product.isActive ? 'btn-warning' : 'btn-success'} btn-toggle-active text-sm py-1 px-3 w-full" data-product-id="${product.productID}" data-current-status="${product.isActive}">
                    ${product.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>`).join('');
};

const authenticatedFetch = async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (state.token) {
        headers.append('Authorization', `Bearer ${state.token}`);
    }
    headers.append('ngrok-skip-browser-warning', 'true');
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        showToast("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", "error");
        handleLogout();
        throw new Error('Unauthorized');
    }
    return response;
};

const fetchTrees = async () => {
    showLoader();
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/trees/`);
        if (!response.ok) throw new Error('Failed to fetch trees');
        const apiData = await response.json();
        state.products = apiData.map(tree => ({
            productID: tree.tree_id,
            name: tree.name,
            description: `Loài: ${tree.species || 'N/A'} | Vị trí: ${tree.location || 'N/A'}`,
            isActive: tree.is_active
        }));
        renderDashboard();
        renderAnalyticsGrid();
    } catch (error) {
        if (error.message !== 'Unauthorized') {
            console.error("Error fetching trees:", error);
            showToast("Không thể tải danh sách cây.", "error");
        }
    } finally {
        hideLoader();
    }
};

const updateTreeStatus = async (treeId, newStatus) => {
    showLoader();
    try {
        const product = state.products.find(p => p.productID == treeId);
        if (!product) throw new Error('Product not found in state');
        const descParts = product.description.split(' | ');
        const species = descParts[0].replace('Loài: ', '');
        const location = descParts[1].replace('Vị trí: ', '');
        const response = await authenticatedFetch(`${API_BASE_URL}/api/trees/${treeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: product.name,
                species: species,
                location: location,
                planting_date: new Date().toISOString().split('T')[0],
                is_active: newStatus 
            })
        });
        if (!response.ok) throw new Error('Failed to update status');
        const updatedTree = await response.json();
        product.isActive = updatedTree.is_active;
        renderDashboard();
        renderAnalyticsGrid();
        showToast(`Cập nhật trạng thái cây ${product.name} thành công.`, 'success');
    } catch (error) {
        console.error("Error updating tree status:", error);
        showToast("Lỗi khi cập nhật trạng thái cây.", 'error');
    } finally {
        hideLoader();
    }
};

// --- HÀM LOGIN (Đã cập nhật) ---
const handleLogin = async (e) => {
    e.preventDefault();
    showLoader();
    loginError.classList.add('view-hidden');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginData = { username: username, password: password };
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(loginData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }
        const data = await response.json();
        state.isLoggedIn = true;
        state.currentUser = { name: username };
        state.token = data.access_token;
        welcomeUser.textContent = `Welcome, ${state.currentUser.name}`;
        await fetchTrees();
        loginView.classList.add('view-hidden');
        appView.classList.remove('view-hidden');
        handleNavigation('dashboard');

        // --- THÊM MỚI: Tự động khởi động nhận diện âm thanh ---
        try {
            await startSoundDetection();
            showToast("Hệ thống âm thanh đã được kích hoạt.", "success");
        } catch (err) {
            console.error("Mic access failed on login:", err);
            showToast("Không thể tự động kích hoạt micro. Bạn cần cho phép trong cài đặt trình duyệt.", "error");
        }
        // --- KẾT THÚC THÊM MỚI ---

    } catch (error) {
        console.error("Login error:", error);
        loginError.textContent = `Lỗi đăng nhập: ${error.message}`;
        loginError.classList.remove('view-hidden');
    } finally {
        hideLoader();
    }
};

// --- HÀM LOGOUT (Đã cập nhật) ---
const handleLogout = () => {
    // --- THÊM MỚI: Dừng hệ thống âm thanh ---
    stopSoundDetection();
    // --- KẾT THÚC THÊM MỚI ---

    handleNavigation('dashboard'); 
    showAnalyticsGrid(); 
    state.isLoggedIn = false; 
    state.currentUser = null;
    state.token = null;
    state.products = [];
    appView.classList.add('view-hidden'); 
    loginView.classList.remove('view-hidden'); 
    handleNavigation('login');
};

// --- Detail View (Không đổi) ---
const showDetailView = (productId) => {
    const product = state.products.find(p => p.productID == productId);
    if (!product) return;
    
    state.selectedProductId = productId;
    treeName.textContent = `Live Analysis: ${product.name}`;
    
    resetDetectionInfo(); 
    handleNavigation('detail'); 
    
    WebRTCService.connect(productId, realtimeVideo, overlayCanvas);
    
    updateLiveTime(); 
    clockInterval = setInterval(updateLiveTime, 1000); 
    
    fetchTreeDetails(productId);
    fetchLatestReading(productId);
    dataFetchInterval = setInterval(() => {
        fetchLatestReading(productId);
    }, 10000); 
};

const hideFruitDetails = () => { 
    const details = document.getElementById('fruit-details-container');
    if (details) {
        details.classList.remove('visible');
        setTimeout(() => details.remove(), 300);
    }
};

const updateLiveTime = () => {
    if (plantTimeEl) {
        plantTimeEl.textContent = new Date().toLocaleTimeString('vi-VN');
    }
};

const updatePlantInfoUI = (data, location = null) => {
    let weatherText = data.weather_info || '--';
    if (weatherText === '--' || weatherText.trim() === '') {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) weatherText = 'Buổi sáng, trời trong';
        else if (hour >= 12 && hour < 18) weatherText = 'Buổi chiều, có nắng';
        else weatherText = 'Buổi tối, trời mát';
    }
    plantWeatherEl.textContent = weatherText;
    plantTempEl.textContent = `${data.temperature_c.toFixed(1)} °C`;
    plantHumidityEl.textContent = `${data.humidity_pct.toFixed(0)} %`;
    plantLightEl.textContent = `${data.light_lux.toLocaleString('vi-VN')} lux`;
    plantWaterEl.textContent = `${data.water_level_pct.toFixed(0)} %`;
    
    if (location) {
        plantLocationEl.textContent = location;
    }
};

const fetchLatestReading = async (treeId = null) => {
    const id = treeId || state.selectedProductId;
    if (!id) return;
    try {
        const product = state.products.find(p => p.productID == id);
        const location = product ? product.description.split(' | ')[1].replace('Vị trí: ', '') : '--';
        const response = await authenticatedFetch(`${API_BASE_URL}/api/trees/${id}/readings/?skip=0&limit=1`);
        if (!response.ok) throw new Error('Failed to fetch readings');
        const readings = await response.json();
        
        if (readings && readings.length > 0) {
            updatePlantInfoUI(readings[0], location);
        } else {
            updatePlantInfoUI({
                temperature_c: 0,
                humidity_pct: 0,
                light_lux: 0,
                water_level_pct: 0,
                weather_info: ''
            }, location);
        }
    } catch (error) {
        console.error("Error fetching plant readings:", error);
    }
};

const fetchTreeDetails = (treeId) => {
    // Gộp trong fetchLatestReading
};

// --- Control & Log (Không đổi) ---
const callWorkflowAPI = async (url, treeId) => {
    if (!treeId) {
        showToast("Lỗi: Không xác định được ID cây.", 'error');
        return; 
    }
    try {
        const response = await fetch(url, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ "tree_id": treeId })
        });
        if (!response.ok) {
            let errorDetail = `Workflow API request failed (Status: ${response.status})`;
            try {
                const errorJson = await response.json();
                errorDetail = errorJson.detail || errorDetail;
            } catch (e) {}
            throw new Error(errorDetail);
        }
        const resultText = await response.text();
        showToast(resultText || "Yêu cầu thành công!", 'success');
    } catch (error) {
        console.error("Error calling workflow API:", error);
        showToast(`Lỗi API điều khiển: ${error.message}`, 'error');
    }
};

const logControlAction = async (commandType, commandValue) => {
    if (!state.selectedProductId) return;
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/trees/${state.selectedProductId}/control_history/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                command_type: commandType,
                command_value: commandValue,
                status: "Hoàn thành"
            })
        });
        if (!response.ok) throw new Error('Failed to log action');
        await response.json();
        showToast(`Đã ghi nhận: ${commandType}`, 'success');
    } catch (error) {
        console.error("Error logging control action:", error);
        showToast(`Lỗi khi ghi nhận ${commandType}`, 'error');
    }
};

// --- Analytics View (Không đổi) ---
const showAnalyticsGrid = () => {
    analyticsHistoryView.classList.add('view-hidden');
    analyticsPlantGridView.classList.remove('view-hidden');
    renderAnalyticsGrid(); 
};

const renderAnalyticsGrid = () => {
    if (state.products.length === 0) {
        analyticsProductGrid.innerHTML = `<p class="text-gray-400 col-span-full text-center">Không tìm thấy cây nào.</p>`;
        return;
    }
    analyticsProductGrid.innerHTML = state.products.map(product => `
        <div class="card p-4 flex flex-col justify-between" data-product-id="${product.productID}">
            <div class="cursor-pointer product-card-main-area-analytics">
                <div class="flex justify-between items-start">
                    <h3 class="text-lg font-bold text-white">${product.name}</h3>
                    <span class="text-xs font-bold px-2 py-1 rounded ${product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">${product.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
                <p class="text-sm mt-2 text-gray-300">${product.description}</p>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-600 flex gap-2">
                <button class="btn ${product.isActive ? 'btn-warning' : 'btn-success'} btn-toggle-active text-sm py-1 px-3 w-full" data-product-id="${product.productID}" data-current-status="${product.isActive}">
                    ${product.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>`).join('');
};

const showAnalyticsHistory = async (productId) => {
    const product = state.products.find(p => p.productID == productId);
    if (!product) return;
    analyticsPlantGridView.classList.add('view-hidden');
    analyticsHistoryView.classList.remove('view-hidden');
    analyticsHistoryTitle.textContent = `Lịch sử chăm sóc: ${product.name}`;
    historyTimeline.innerHTML = '';
    showLoader();
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/trees/${productId}/control_history/`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const historyData = await response.json();
        renderHistoryTimeline(historyData);
    } catch (error) {
        console.error("Error fetching history:", error);
        showToast("Không thể tải lịch sử.", "error");
        historyTimeline.innerHTML = `<p class="text-gray-400">Lỗi khi tải dữ liệu lịch sử.</p>`;
    } finally {
        hideLoader();
    }
};

const renderHistoryTimeline = (historyData) => {
    if (!historyData || historyData.length === 0) {
        historyTimeline.innerHTML = `<p class="text-gray-400">Không có dữ liệu lịch sử cho cây này.</p>`;
        return;
    }
    historyTimeline.innerHTML = historyData.map(item => {
        const commandTime = new Date(item.command_time).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const valueText = item.command_value ? `<p class="text-sm text-gray-400">Giá trị: <span class="text-white">${item.command_value}</span></p>` : '';
        const statusText = item.status ? `<p class="text-sm text-gray-400">Trạng thái: <span class="text-white">${item.status}</span></p>` : '';
        return `
            <li class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-card">
                    <p class="text-xs text-gray-400 mb-1">${commandTime} (User ID: ${item.user_id})</p>
                    <h4 class="text-lg font-semibold text-primary-accent mb-1">${item.command_type}</h4>
                    ${valueText}
                    ${statusText}
                </div>
            </li>
        `;
    }).join('');
};

// --- AI/Detection Info (Không đổi) ---
const updateDetectionInfo = (detections) => {
    if (!detections || detections.length === 0) {
        aiResultsContent.innerHTML = '<p>Không phát hiện đối tượng nào.</p>';
        return;
    }
    const counts = detections.reduce((acc, d) => {
        acc[d.label] = (acc[d.label] || 0) + 1;
        return acc;
    }, {});
    const summaryHtml = Object.entries(counts)
        .map(([label, count]) => `<p>Phát hiện: <span class="font-semibold text-white">${count} ${label}</span></p>`)
        .join('');
    aiResultsContent.innerHTML = summaryHtml;
};

const resetDetectionInfo = () => {
    if (aiResultsContent) {
        aiResultsContent.innerHTML = '<p>Chưa có dữ liệu.</p>';
    }
};

// --- THÊM MỚI: CÁC HÀM XỬ LÝ ÂM THANH ---

/**
 * Bắt đầu nhận diện âm thanh và giọng nói (chạy ngầm)
 */
const startSoundDetection = async () => {
    // 1. Kiểm tra hỗ trợ
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!SpeechRecognition || !AudioContext) {
        showToast("Trình duyệt không hỗ trợ API âm thanh hoặc giọng nói.", "error");
        return Promise.reject("Unsupported browser");
    }

    // 2. Lấy quyền truy cập Micro
    // (Phải được gọi từ một sự kiện do người dùng khởi xướng như 'click')
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.audioStream = stream;

    // 3. Thiết lập Web Audio API (để vẽ sóng)
    state.audioContext = new AudioContext();
    const source = state.audioContext.createMediaStreamSource(stream);
    state.analyserNode = state.audioContext.createAnalyser();
    state.analyserNode.fftSize = 2048; // Kích thước mẫu
    source.connect(state.analyserNode);

    // 4. Thiết lập Web Speech API (để nhận diện giọng nói)
    state.speechRecognition = new SpeechRecognition();
    state.speechRecognition.lang = 'vi-VN';
    state.speechRecognition.continuous = true; // Chạy liên tục
    state.speechRecognition.interimResults = true; // Trả kết quả tạm thời

    // 4.1. Xử lý khi có kết quả
    state.speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        // Ưu tiên chuỗi cuối cùng (final) nếu có
        const detectedText = finalTranscript || interimTranscript;
        updateSoundLabel(detectedText);
    };

    // 4.2. Tự động khởi động lại khi kết thúc
    state.speechRecognition.onend = () => {
        if (state.isLoggedIn) { // Chỉ khởi động lại nếu vẫn đang đăng nhập
            state.speechRecognition.start();
        }
    };
    
    // 4.3. Xử lý lỗi
    state.speechRecognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'no-speech') {
            // Bỏ qua lỗi không có giọng nói, nó sẽ tự khởi động lại
        }
    };

    // 5. Bắt đầu nhận diện
    state.speechRecognition.start();
    
    // 6. Cập nhật label mặc định ban đầu
    if (soundLabel) {
        soundLabel.textContent = "Đang lắng nghe...";
        soundLabel.classList.remove('detected');
    }
};

/**
 * Dừng hệ thống âm thanh khi logout
 */
const stopSoundDetection = () => {
    if (state.speechRecognition) {
        state.speechRecognition.stop();
        state.speechRecognition = null;
    }
    if (state.audioStream) {
        state.audioStream.getTracks().forEach(track => track.stop());
        state.audioStream = null;
    }
    if (state.audioContext) {
        state.audioContext.close();
        state.audioContext = null;
    }
    if (state.visualizationFrameId) {
        cancelAnimationFrame(state.visualizationFrameId);
        state.visualizationFrameId = null;
    }
};

/**
 * Cập nhật Label âm thanh và kiểm tra trigger
 */
const updateSoundLabel = (transcript) => {
    let label = "People talking"; // Mặc định
    let isDetected = false;
    
    // Kiểm tra trigger "chíp"
    if (transcript.toLowerCase().includes("chíp")) {
        // Random giữa chim và chuột
        const randomAnimal = Math.random() < 0.5 ? "Giọng chim" : "Giọng chuột";
        label = randomAnimal;
        isDetected = true;
    }

    state.currentSoundLabel = label;

    if (soundLabel) {
        soundLabel.textContent = label;
        if (isDetected) {
            soundLabel.classList.add('detected');
            // Chỉ hiển thị alert nếu modal đang không bật
            if (!alertModal.classList.contains('modal-visible')) {
                showAlert(label);
            }
        } else {
            soundLabel.classList.remove('detected');
        }
    }
};

/**
 * Bắt đầu vẽ sóng âm (chỉ khi ở tab Sound Detect)
 */
const startSoundVisualization = () => {
    if (!state.analyserNode || !soundCanvas) return;
    if (state.visualizationFrameId) return; // Đã đang vẽ rồi

    const canvasCtx = soundCanvas.getContext('2d');
    const bufferLength = state.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
        state.visualizationFrameId = requestAnimationFrame(draw);

        state.analyserNode.getByteTimeDomainData(dataArray); // Lấy data sóng âm

        // Lấy kích thước thật của canvas
        const width = soundCanvas.clientWidth;
        const height = soundCanvas.clientHeight;
        soundCanvas.width = width;
        soundCanvas.height = height;

        // Xóa canvas
        canvasCtx.fillStyle = '#1f2937'; // Màu nền (card-color)
        canvasCtx.fillRect(0, 0, width, height);

        // Bắt đầu vẽ
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#22c55e'; // Màu sóng (primary-accent)
        canvasCtx.beginPath();

        const sliceWidth = width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // Giá trị từ 0.0 -> 2.0
            const y = v * height / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(width, height / 2);
        canvasCtx.stroke();
    };

    draw();
};

// --- Event Listeners (Đã cập nhật) ---
document.addEventListener('DOMContentLoaded', () => {
    // Listeners (Không đổi)
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    sidebarToggleBtn.addEventListener('click', () => {
        floatingSidebar.classList.toggle('is-hidden');
    });

    mainNav.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (link && link.dataset.view) {
            e.preventDefault();
            if (link.dataset.view === 'analytics') {
                showAnalyticsGrid();
            }
            handleNavigation(link.dataset.view);
            floatingSidebar.classList.add('is-hidden');
        }
    });
    
    document.addEventListener('click', (event) => {
        const isSidebarVisible = !floatingSidebar.classList.contains('is-hidden');
        const isClickOnToggle = event.target.closest('#sidebar-toggle-btn');
        const isClickInSidebar = event.target.closest('#floating-sidebar');
        if (isSidebarVisible && !isClickOnToggle && !isClickInSidebar) {
            floatingSidebar.classList.add('is-hidden');
        }
    });
    
    backToDashboardBtn.addEventListener('click', () => {
        WebRTCService.disconnect();
        if (clockInterval) clearInterval(clockInterval);
        if (dataFetchInterval) clearInterval(dataFetchInterval);
        clockInterval = null;
        dataFetchInterval = null;
        showAnalyticsGrid(); 
        handleNavigation('dashboard');
    });

    addProductBtn.addEventListener('click', showAddProductModal);
    addProductCancelBtn.addEventListener('click', hideAddProductModal);
    
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();
        const name = document.getElementById('productName').value;
        const species = document.getElementById('productSpecies').value;
        const location = document.getElementById('productLocation').value;
        const planting_date = new Date().toISOString().split('T')[0];
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/trees/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, species, location, planting_date })
            });
            if (!response.ok) throw new Error('Failed to create plant');
            showToast("Thêm cây mới thành công!", 'success');
            hideAddProductModal();
            await fetchTrees();
        } catch (error) {
            console.error("Error adding product:", error);
            showToast("Lỗi khi thêm cây.", 'error');
        } finally {
            hideLoader();
        }
    });

    productGrid.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.btn-toggle-active');
        if (toggleBtn) {
            e.stopPropagation();
            const productId = toggleBtn.dataset.productId;
            const currentStatus = toggleBtn.dataset.currentStatus === 'true';
            updateTreeStatus(productId, !currentStatus);
            return;
        }
        const card = e.target.closest('.product-card-main-area');
        if (card) {
            const productId = card.closest('[data-product-id]').dataset.productId;
            showDetailView(productId);
        }
    });
    
    detectionContainer.addEventListener('click', hideFruitDetails);

    const renderDetections = (detections) => {
        detectionContainer.innerHTML = '';
        const staticImage = overlayCanvas; 
        const { clientWidth, clientHeight } = videoContainer;
        const naturalWidth = realtimeVideo.videoWidth;
        const naturalHeight = realtimeVideo.videoHeight;
        if (!naturalWidth || !naturalHeight) return;

        const imageAspect = naturalWidth / naturalHeight;
        const containerAspect = clientWidth / clientHeight;
        let scale, offsetX = 0, offsetY = 0;

        if (imageAspect > containerAspect) {
            scale = clientWidth / naturalWidth;
            offsetY = (clientHeight - naturalHeight * scale) / 2;
        } else {
            scale = clientHeight / naturalHeight;
            offsetX = (clientWidth - naturalWidth * scale) / 2;
        }

        const allowedFruits = ['apple', 'orange', 'fruit', 'tomato', 'grape']; 
        const fruitDetections = detections.filter(d => allowedFruits.includes(d.label));

        fruitDetections.forEach((det) => {
            const [x1, y1, x2, y2] = det.box;
            const centerX = ((x1 + x2) / 2) * scale + offsetX;
            const centerY = ((y1 + y2) / 2) * scale + offsetY;

            const marker = document.createElement('div');
            marker.className = 'detection-marker';
            marker.style.left = `${centerX}px`;
            marker.style.top = `${centerY}px`;

            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                hideFruitDetails();

                const sunExposure = Math.round(85 - (centerY / clientHeight) * 20);
                const qualityValue = (det.box[0] + det.box[1]) % 2 === 0 ? 'Good' : 'Avg';
                const harvestValue = `${Math.round((det.box[2] % 10) + 5)} days`;
                const details = [
                    { label: 'Type', value: det.label.charAt(0).toUpperCase() + det.label.slice(1) },
                    { label: 'Quality', value: qualityValue },
                    { label: 'Harvest in', value: harvestValue },
                    { label: 'Sunlight', value: `${sunExposure}%` },
                    { label: 'Confidence', value: `${(det.confidence * 100).toFixed(0)}%` }
                ];
                
                const detailsContainer = document.createElement('div');
                detailsContainer.id = 'fruit-details-container';
                detailsContainer.style.left = `${centerX}px`;
                detailsContainer.style.top = `${centerY}px`;
                const isNearHorizontalEdge = centerX < 160 || centerX > clientWidth - 160;
                const isNearVerticalEdge = centerY < 160 || centerY > clientHeight - 160;
                const baseAngle = isNearHorizontalEdge ? (centerX < 160 ? -90 : 90) : (isNearVerticalEdge ? (centerY < 160 ? 0 : 180) : 0);
                const angleSpan = (isNearHorizontalEdge || isNearVerticalEdge) ? 180 : 360;
                const angleIncrement = angleSpan / details.length;

                details.forEach((item, i) => {
                    const angle = (baseAngle + i * angleIncrement) * (Math.PI / 180);
                    const ringX = 160 + Math.cos(angle) * 120;
                    const ringY = 160 + Math.sin(angle) * 120;
                    detailsContainer.innerHTML += `
                        <div class="info-ring" style="left: ${ringX - 40}px; top: ${ringY - 40}px;">
                            <svg class="info-ring-svg" width="80" height="80" viewBox="0 0 90 90" style="animation-delay: ${i * 0.1}s"><circle cx="45" cy="45" r="35"/></svg>
                            <span class="info-value">${item.value}</span><span class="info-label">${item.label}</span>
                        </div>
                        <svg class="absolute inset-0 w-full h-full"><line class="connector-line" x1="160" y1="160" x2="${ringX}" y2="${ringY}" /></svg>
                    `;
                });
                detectionContainer.appendChild(detailsContainer);
                setTimeout(() => detailsContainer.classList.add('visible'), 50);
            });
            detectionContainer.appendChild(marker);
        });
    };

    viewModeNormalBtn.addEventListener('click', () => {
        state.isAiDetectionActive = false;
        detectionContainer.innerHTML = '';
        hideFruitDetails();
        resetDetectionInfo();
        WebRTCService.canvasContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        overlayCanvas.style.opacity = 0;
        realtimeVideo.style.opacity = 1;
        viewModeNormalBtn.classList.replace('btn-secondary', 'btn-primary');
        viewModeAiBtn.classList.replace('btn-primary', 'btn-secondary');
    });

    viewModeAiBtn.addEventListener('click', async () => {
        if (state.isAiDetectionActive) return;
        showLoader();

        const video = realtimeVideo;
        const canvas = overlayCanvas;
        const ctx = canvas.getContext('2d');
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        if (videoWidth === 0 || videoHeight === 0) {
            showToast("Không thể chụp ảnh, video chưa sẵn sàng.", "error");
            hideLoader();
            return;
        }

        canvas.width = videoWidth;
        canvas.height = videoHeight;
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        
        canvas.toBlob(async (blob) => {
            if (!blob) {
                showToast("Không thể tạo ảnh từ video.", "error");
                hideLoader();
                return;
            }

            const formData = new FormData();
            formData.append('file', blob, 'snapshot.png');

            try {
                const response = await fetch('/predict/image', { 
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
                const results = await response.json();
                
                if (results && results.detections && results.detections.length > 0) {
                    state.isAiDetectionActive = true;
                    video.style.opacity = 0;
                    canvas.style.opacity = 1;
                    viewModeAiBtn.classList.replace('btn-secondary', 'btn-primary');
                    viewModeNormalBtn.classList.replace('btn-primary', 'btn-secondary');
                    
                    renderDetections(results.detections);
                    WebRTCService.renderStaticDetections(results);
                    updateDetectionInfo(results.detections);
                    
                    try {
                        const captureFormData = new FormData();
                        captureFormData.append('file', blob, 'snapshot.png');
                        const allowedFruits = ['apple', 'orange', 'fruit', 'tomato', 'grape'];
                        const fruitCount = results.detections.filter(d => allowedFruits.includes(d.label)).length;
                        captureFormData.append('total_fruit_count', fruitCount);

                        const captureResponse = await authenticatedFetch(`${API_BASE_URL}/api/trees/${state.selectedProductId}/captures/`, {
                            method: 'POST',
                            body: captureFormData
                        });
                        
                        if (!captureResponse.ok) throw new Error('Failed to save capture');
                        
                        const captureData = await captureResponse.json();
                        showToast(`Đã lưu ảnh chụp (ID: ${captureData.capture_id}) với ${fruitCount} trái.`, 'success');
                        
                    } catch (captureError) {
                        console.error("Error saving capture:", captureError);
                        showToast("Phân tích AI thành công, nhưng lỗi khi lưu ảnh.", "error");
                    }
                } else {
                    showToast("Không phát hiện đối tượng nào.", "success");
                    updateDetectionInfo([]);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            } catch (error) {
                console.error("AI analysis error:", error);
                showToast("Lỗi trong quá trình phân tích ảnh.", "error");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } finally {
                hideLoader();
            }
        }, 'image/png');
    });
    
    analyticsProductGrid.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.btn-toggle-active');
        if (toggleBtn) {
            e.stopPropagation();
            const productId = toggleBtn.dataset.productId;
            const currentStatus = toggleBtn.dataset.currentStatus === 'true';
            updateTreeStatus(productId, !currentStatus);
            return;
        }
        const card = e.target.closest('.product-card-main-area-analytics');
        if (card) {
            const productId = card.closest('[data-product-id]').dataset.productId;
            showAnalyticsHistory(productId);
        }
    });

    analyticsBackBtn.addEventListener('click', showAnalyticsGrid);
    
    waterPlantBtn.addEventListener('click', async () => {
        showLoader();
        try {
            await callWorkflowAPI(WORKFLOW_WATERING_URL, state.selectedProductId);
            await logControlAction('tưới cây', '100ml');
        } catch (error) {
            console.error("Watering action failed:", error);
        } finally {
            hideLoader();
        }
    });
    
    fertilizePlantBtn.addEventListener('click', async () => {
        showLoader();
        try {
            await logControlAction('bón phân', '10g');
        } catch (error) {
            console.error("Fertilizing action failed:", error);
        } finally {
            hideLoader();
        }
    });

    harvestPlantBtn.addEventListener('click', async () => {
        showLoader();
         try {
            await logControlAction('thu hoạch', '');
        } catch (error) {
            console.error("Harvesting action failed:", error);
        } finally {
            hideLoader();
        }
    });
    
    fillWaterBtn.addEventListener('click', async () => {
        showLoader();
        try {
            await callWorkflowAPI(WORKFLOW_FILL_WATER_URL, state.selectedProductId);
            await logControlAction('đổ đầy bình chứa', '');
        } catch (error) {
            console.error("Fill water action failed:", error);
        } finally {
            hideLoader();
        }
    });

    // --- THÊM MỚI: Listener cho nút đóng Alert ---
    alertCloseBtn.addEventListener('click', hideAlert);

    // Khởi động app
    handleNavigation('login'); 
    viewModeNormalBtn.click(); 
    showAnalyticsGrid(); 
});