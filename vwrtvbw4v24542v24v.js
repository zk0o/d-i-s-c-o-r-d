(function() {
    'use strict';

    // Previne execução duplicada
    if (window.DiscordQuestAutomation) {
        console.log('Discord Quest Automation já está rodando!');
        return;
    }
    window.DiscordQuestAutomation = true;

    const APP = {
        version: "1.0.0",
        
        theme: {
            name: "Quest Automation",
            colors: {
                primary: "#667eea",
                secondary: "#764ba2",
                accent: "#a78bfa",
                bg: "#0f0f0f",
                cardBg: "#1a1a1a",
                text: "#ffffff"
            }
        },
        
        cfg: {
            autoStart: false,
            notifications: true
        }
    };

    // Função para criar notificações
    function showNotification(message, duration = 3000) {
        if (!APP.cfg.notifications) return;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, ${APP.theme.colors.primary} 0%, ${APP.theme.colors.secondary} 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
            z-index: 999999;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // Criar a UI
    function createUI() {
        // Remove UI anterior se existir
        const existing = document.getElementById('discord-quest-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'discord-quest-panel';
        
        panel.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                #discord-quest-panel * {
                    box-sizing: border-box;
                    font-family: 'Inter', sans-serif;
                }
                
                #discord-quest-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 420px;
                    max-width: calc(100vw - 40px);
                    background: ${APP.theme.colors.bg};
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    z-index: 999999;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                #discord-quest-panel.collapsed {
                    height: 80px;
                    overflow: hidden;
                }
                
                .quest-header {
                    background: linear-gradient(135deg, ${APP.theme.colors.primary} 0%, ${APP.theme.colors.secondary} 100%);
                    padding: 20px;
                    cursor: pointer;
                    user-select: none;
                    position: relative;
                    overflow: hidden;
                }
                
                .quest-header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    animation: pulse 4s ease-in-out infinite;
                }
                
                .header-content {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .header-icon {
                    font-size: 24px;
                }
                
                .header-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: white;
                    margin: 0;
                }
                
                .header-version {
                    font-size: 11px;
                    opacity: 0.8;
                    color: white;
                }
                
                .header-collapse {
                    color: white;
                    font-size: 20px;
                    transition: transform 0.3s ease;
                }
                
                #discord-quest-panel.collapsed .header-collapse {
                    transform: rotate(180deg);
                }
                
                .quest-content {
                    padding: 20px;
                    max-height: calc(90vh - 120px);
                    overflow-y: auto;
                }
                
                .quest-content::-webkit-scrollbar {
                    width: 6px;
                }
                
                .quest-content::-webkit-scrollbar-track {
                    background: ${APP.theme.colors.bg};
                }
                
                .quest-content::-webkit-scrollbar-thumb {
                    background: ${APP.theme.colors.primary};
                    border-radius: 3px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .stat-card {
                    background: ${APP.theme.colors.cardBg};
                    padding: 15px;
                    border-radius: 12px;
                    border: 1px solid #2a2a2a;
                }
                
                .stat-icon {
                    font-size: 20px;
                    margin-bottom: 8px;
                }
                
                .stat-label {
                    font-size: 11px;
                    color: #888;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                
                .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    background: linear-gradient(135deg, ${APP.theme.colors.primary} 0%, ${APP.theme.colors.secondary} 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .section-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .section-title::before {
                    content: '';
                    width: 3px;
                    height: 16px;
                    background: linear-gradient(135deg, ${APP.theme.colors.primary} 0%, ${APP.theme.colors.secondary} 100%);
                    border-radius: 2px;
                }
                
                .control-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 15px;
                    background: ${APP.theme.colors.cardBg};
                    border-radius: 10px;
                    border: 1px solid #2a2a2a;
                    margin-bottom: 10px;
                }
                
                .control-label {
                    font-size: 13px;
                    color: white;
                    font-weight: 500;
                }
                
                .toggle-switch {
                    position: relative;
                    width: 50px;
                    height: 26px;
                }
                
                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: #2a2a2a;
                    border-radius: 26px;
                    transition: 0.3s;
                }
                
                .toggle-slider::before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 3px;
                    bottom: 3px;
                    background: white;
                    border-radius: 50%;
                    transition: 0.3s;
                }
                
                input:checked + .toggle-slider {
                    background: linear-gradient(135deg, ${APP.theme.colors.primary} 0%, ${APP.theme.colors.secondary} 100%);
                }
                
                input:checked + .toggle-slider::before {
                    transform: translateX(24px);
                }
                
                .quest-card {
                    background: ${APP.theme.colors.cardBg};
                    border-radius: 15px;
                    padding: 18px;
                    border: 1px solid #2a2a2a;
                    margin-bottom: 12px;
                    position: relative;
                    overflow: hidden;
                }
                
                .quest-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: linear-gradient(90deg, ${APP.theme.colors.primary} 0%, ${APP.theme.colors.secondary} 100%);
                }
                
                .quest-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 12px;
                }
                
                .quest-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 5px;
                }
                
                .quest-type {
                    font-size: 10px;
                    color: ${APP.theme.colors.accent};
                    background: rgba(102, 126, 234, 0.1);
                    padding: 4px 8px;
                    border-radius: 6px;
                    text-transform: uppercase;
                }
                
                .quest-status {
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                }
                
                .status-pending { background: rgba(136, 136, 136, 0.2); color: #888; }
                .status-active { background: rgba(102, 126, 234, 0.2); color: ${APP.theme.colors.primary}; }
                .status-completed { background: rgba(72, 187, 120, 0.2); color: #48bb78; }
                
                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 12px;
                }
                
                .progress-label { color: #888; }
                .progress-value { color: white; font-weight: 600; }
                
                .progress-bar {
                    height: 6px;
                    background: #2a2a2a;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 12px;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, ${APP.theme.colors.primary} 0%, ${APP.theme.colors.secondary} 100%);
                    border-radius: 10px;
                    transition: width 0.5s ease;
                    position: relative;
                }
                
                .progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: shimmer 2s infinite;
                }
                
                .quest-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .btn {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, ${APP.theme.colors.primary} 0%, ${APP.theme.colors.secondary} 100%);
                    color: white;
                }
                
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                }
                
                .btn-secondary {
                    background: transparent;
                    color: #888;
                    border: 1px solid #2a2a2a;
                }
                
                .btn-secondary:hover {
                    border-color: ${APP.theme.colors.primary};
                    color: ${APP.theme.colors.primary};
                }
                
                .main-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .btn-large {
                    padding: 14px;
                    font-size: 14px;
                }
                
                @media (max-width: 768px) {
                    #discord-quest-panel {
                        width: calc(100vw - 40px);
                    }
                }
            </style>
            
            <div class="quest-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-icon">🎮</div>
                        <div>
                            <div class="header-title">${APP.theme.name}</div>
                            <div class="header-version">v${APP.version}</div>
                        </div>
                    </div>
                    <div class="header-collapse">▼</div>
                </div>
            </div>
            
            <div class="quest-content">
                <!-- Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📋</div>
                        <div class="stat-label">Total</div>
                        <div class="stat-value" id="totalQuests">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-label">Completas</div>
                        <div class="stat-value" id="completedQuests">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-label">Ativas</div>
                        <div class="stat-value" id="activeQuests">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-label">Tempo</div>
                        <div class="stat-value" id="totalTime">0m</div>
                    </div>
                </div>
                
                <!-- Controls -->
                <div style="margin-bottom: 20px;">
                    <div class="section-title">Configurações</div>
                    <div class="control-item">
                        <span class="control-label">Auto Start</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="autoStartToggle">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="control-item">
                        <span class="control-label">Notificações</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="notificationsToggle" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <!-- Quests List -->
                <div class="section-title">Quests Disponíveis</div>
                <div id="questsList">
                    <div style="text-align: center; color: #888; padding: 20px;">
                        Carregando quests...
                    </div>
                </div>
                
                <!-- Main Actions -->
                <div class="main-actions">
                    <button class="btn btn-primary btn-large" id="startAllBtn">🚀 Iniciar Todas</button>
                    <button class="btn btn-secondary btn-large" id="reloadBtn">🔄 Recarregar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Event Listeners
        setupEventListeners();
        
        // Carregar quests de exemplo (aqui você vai buscar do Discord)
        loadExampleQuests();
        
        showNotification('🎮 Quest Automation carregado!');
    }

    function setupEventListeners() {
        // Collapse/Expand
        const header = document.querySelector('.quest-header');
        const panel = document.getElementById('discord-quest-panel');
        
        header.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
        });
        
        // Toggles
        document.getElementById('autoStartToggle').addEventListener('change', (e) => {
            APP.cfg.autoStart = e.target.checked;
            showNotification(e.target.checked ? '✅ Auto Start Ativado' : '❌ Auto Start Desativado');
        });
        
        document.getElementById('notificationsToggle').addEventListener('change', (e) => {
            APP.cfg.notifications = e.target.checked;
            showNotification(e.target.checked ? '🔔 Notificações Ativadas' : '🔕 Notificações Desativadas');
        });
        
        // Main Actions
        document.getElementById('startAllBtn').addEventListener('click', () => {
            showNotification('🚀 Iniciando todas as quests...');
            // Aqui você vai adicionar a lógica real
        });
        
        document.getElementById('reloadBtn').addEventListener('click', () => {
            showNotification('🔄 Recarregando quests...');
            loadExampleQuests();
        });
    }

    function loadExampleQuests() {
        // Exemplo de quests - você vai substituir pela lógica real do Discord
        const exampleQuests = [
            {
                id: '1',
                name: 'Watch Gaming Content',
                type: 'WATCH_VIDEO',
                progress: 45,
                target: 180,
                status: 'active'
            },
            {
                id: '2',
                name: 'Play League of Legends',
                type: 'PLAY_ON_DESKTOP',
                progress: 120,
                target: 900,
                status: 'active'
            },
            {
                id: '3',
                name: 'Stream Gameplay',
                type: 'STREAM_ON_DESKTOP',
                progress: 0,
                target: 600,
                status: 'pending'
            }
        ];
        
        renderQuests(exampleQuests);
        updateStats(exampleQuests);
    }

    function renderQuests(quests) {
        const questsList = document.getElementById('questsList');
        
        if (quests.length === 0) {
            questsList.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">Nenhuma quest encontrada</div>';
            return;
        }
        
        questsList.innerHTML = quests.map(quest => {
            const percentage = Math.round((quest.progress / quest.target) * 100);
            const statusClass = `status-${quest.status}`;
            const statusText = quest.status === 'active' ? '● Ativa' : 
                              quest.status === 'completed' ? '✓ Completa' : 
                              '○ Pendente';
            
            return `
                <div class="quest-card">
                    <div class="quest-card-header">
                        <div>
                            <div class="quest-name">${quest.name}</div>
                            <span class="quest-type">${formatQuestType(quest.type)}</span>
                        </div>
                        <span class="quest-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="progress-info">
                        <span class="progress-label">Progresso</span>
                        <span class="progress-value">${quest.progress}s / ${quest.target}s (${percentage}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="quest-actions">
                        <button class="btn btn-primary" onclick="window.DiscordQuestAutomation.startQuest('${quest.id}')">▶ Iniciar</button>
                        <button class="btn btn-secondary" onclick="window.DiscordQuestAutomation.pauseQuest('${quest.id}')">⏸ Pausar</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function formatQuestType(type) {
        const types = {
            'WATCH_VIDEO': 'Watch Video',
            'PLAY_ON_DESKTOP': 'Play Desktop',
            'STREAM_ON_DESKTOP': 'Stream Desktop',
            'PLAY_ACTIVITY': 'Play Activity',
            'WATCH_VIDEO_ON_MOBILE': 'Watch Mobile'
        };
        return types[type] || type;
    }

    function updateStats(quests) {
        const total = quests.length;
        const completed = quests.filter(q => q.status === 'completed').length;
        const active = quests.filter(q => q.status === 'active').length;
        const totalTime = Math.ceil(quests.reduce((sum, q) => sum + (q.target - q.progress), 0) / 60);
        
        document.getElementById('totalQuests').textContent = total;
        document.getElementById('completedQuests').textContent = completed;
        document.getElementById('activeQuests').textContent = active;
        document.getElementById('totalTime').textContent = totalTime + 'm';
    }

    // API Pública
    window.DiscordQuestAutomation = {
        version: APP.version,
        startQuest: (id) => {
            showNotification(`▶ Iniciando quest ${id}...`);
            // Aqui você adiciona a lógica real
        },
        pauseQuest: (id) => {
            showNotification(`⏸ Pausando quest ${id}...`);
            // Aqui você adiciona a lógica real
        },
        reload: () => {
            createUI();
        }
    };

    // Inicializar
    createUI();
    console.log(`%c🎮 Discord Quest Automation v${APP.version}`, 'color: #667eea; font-size: 16px; font-weight: bold;');
    console.log('%cScript carregado com sucesso!', 'color: #48bb78;');

})();
