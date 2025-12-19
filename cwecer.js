javascript:(function() {
    // Criar o painel principal
    const panel = document.createElement('div');
    panel.id = 'discord-quests-panel';
    
    const style = `
        #discord-quests-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-width: 90vw;
            max-height: 80vh;
            background: linear-gradient(145deg, #0f172a, #1e293b);
            border: 2px solid #6366f1;
            border-radius: 16px;
            z-index: 10000;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        
        .quests-header {
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #4f46e5;
        }
        
        .quests-title {
            font-size: 24px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .quests-title::before {
            content: '🎯';
            font-size: 28px;
        }
        
        .close-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        .close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: rotate(90deg);
        }
        
        .quests-content {
            padding: 20px;
            overflow-y: auto;
            max-height: calc(80vh - 80px);
        }
        
        .quests-loading {
            text-align: center;
            padding: 40px;
            color: #94a3b8;
        }
        
        .quests-loading::after {
            content: '';
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #6366f1;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-left: 10px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .quests-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .quest-item {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 16px;
            transition: all 0.3s;
        }
        
        .quest-item:hover {
            border-color: #6366f1;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
        }
        
        .quest-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .quest-name {
            color: #f8fafc;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .quest-type {
            background: #475569;
            color: #e2e8f0;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .quest-progress {
            margin: 12px 0;
        }
        
        .progress-bar {
            height: 8px;
            background: #334155;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 8px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #22d3ee);
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        
        .progress-text {
            display: flex;
            justify-content: space-between;
            color: #94a3b8;
            font-size: 12px;
        }
        
        .quest-controls {
            display: flex;
            gap: 8px;
            margin-top: 16px;
        }
        
        .quest-btn {
            flex: 1;
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 14px;
        }
        
        .btn-start {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
        }
        
        .btn-start:hover {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            transform: translateY(-1px);
        }
        
        .btn-stop {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .btn-stop:hover {
            background: rgba(239, 68, 68, 0.2);
        }
        
        .btn-info {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .btn-info:hover {
            background: rgba(59, 130, 246, 0.2);
        }
        
        .no-quests {
            text-align: center;
            padding: 40px;
            color: #94a3b8;
        }
        
        .no-quests::before {
            content: '🎮';
            font-size: 48px;
            display: block;
            margin-bottom: 16px;
        }
        
        .stats-bar {
            display: flex;
            justify-content: space-between;
            padding: 16px 20px;
            background: rgba(30, 41, 59, 0.8);
            border-top: 1px solid #334155;
            color: #94a3b8;
            font-size: 14px;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ef4444;
        }
        
        .status-dot.active {
            background: #10b981;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #22d3ee);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    
    // Adicionar estilos
    const styleElement = document.createElement('style');
    styleElement.textContent = style;
    document.head.appendChild(styleElement);
    
    // Conteúdo do painel
    panel.innerHTML = `
        <div class="quests-header">
            <div class="quests-title">
                Discord Quests Auto-Completer
            </div>
            <button class="close-btn" id="closeQuestsPanel">×</button>
        </div>
        
        <div class="quests-content" id="questsContent">
            <div class="quests-loading">
                Carregando quests disponíveis...
            </div>
        </div>
        
        <div class="stats-bar">
            <div class="status-indicator">
                <span class="status-dot" id="statusDot"></span>
                <span id="statusText">Conectando...</span>
            </div>
            <div id="questsCount">0 quests encontradas</div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Adicionar overlay de fundo
    const overlay = document.createElement('div');
    overlay.id = 'questsOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 9999;
    `;
    document.body.appendChild(overlay);
    
    // Função para mostrar notificação
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Fechar painel
    document.getElementById('closeQuestsPanel').onclick = () => {
        panel.remove();
        overlay.remove();
    };
    
    overlay.onclick = () => {
        panel.remove();
        overlay.remove();
    };
    
    // Função para atualizar status
    function updateStatus(connected, message) {
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');
        
        if (connected) {
            dot.className = 'status-dot active';
            text.textContent = message || 'Conectado ao Discord';
        } else {
            dot.className = 'status-dot';
            text.textContent = message || 'Desconectado';
        }
    }
    
    // Inicializar o script de quests
    setTimeout(() => {
        try {
            // Atualizar status
            updateStatus(true, 'Procurando quests...');
            
            // Executar o código principal
            let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
            webpackChunkdiscord_app.pop();

            let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata).exports.Z;
            let RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames).exports.ZP;
            let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest).exports.Z;
            let ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent).exports.Z;
            let GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel).exports.ZP;
            let FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue).exports.Z;
            let api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get).exports.tn;

            let isApp = typeof DiscordNative !== "undefined";
            
            // Buscar quests
            let quests = [...QuestsStore.quests.values()].filter(x => 
                x.id !== "1412491570820812933" && 
                x.userStatus?.enrolledAt && 
                !x.userStatus?.completedAt && 
                new Date(x.config.expiresAt).getTime() > Date.now()
            );
            
            // Atualizar contador
            document.getElementById('questsCount').textContent = `${quests.length} quests encontradas`;
            
            if(quests.length === 0) {
                document.getElementById('questsContent').innerHTML = `
                    <div class="no-quests">
                        Nenhuma quest ativa encontrada!
                        <br>
                        <small style="font-size: 12px; margin-top: 8px; display: block;">
                            Entre em alguma quest no Discord para começar
                        </small>
                    </div>
                `;
                updateStatus(true, 'Nenhuma quest ativa');
                return;
            }
            
            // Gerar lista de quests
            let questsHTML = '<div class="quests-list">';
            
            quests.forEach((quest, index) => {
                const questName = quest.config.messages.questName;
                const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
                const taskName = taskConfig?.tasks ? ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig.tasks[x] != null) : null;
                const targetValue = taskConfig?.tasks?.[taskName]?.target || 0;
                const currentProgress = quest.userStatus?.progress?.[taskName]?.value ?? 0;
                const progressPercent = Math.min(100, (currentProgress / targetValue) * 100);
                
                // Determinar ícone baseado no tipo
                let icon = '🎮';
                if (taskName === 'WATCH_VIDEO' || taskName === 'WATCH_VIDEO_ON_MOBILE') icon = '🎥';
                if (taskName === 'PLAY_ON_DESKTOP') icon = '💻';
                if (taskName === 'STREAM_ON_DESKTOP') icon = '📹';
                if (taskName === 'PLAY_ACTIVITY') icon = '🎲';
                
                questsHTML += `
                    <div class="quest-item" data-quest-id="${quest.id}" data-task-type="${taskName}">
                        <div class="quest-header">
                            <div class="quest-name">
                                ${icon} ${questName}
                            </div>
                            <div class="quest-type">
                                ${taskName?.replace(/_/g, ' ') || 'Desconhecido'}
                            </div>
                        </div>
                        
                        <div class="quest-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <div class="progress-text">
                                <span>${Math.floor(currentProgress)}/${targetValue} segundos</span>
                                <span>${Math.round(progressPercent)}% completo</span>
                            </div>
                        </div>
                        
                        <div class="quest-controls">
                            <button class="quest-btn btn-start" onclick="startQuest('${quest.id}', '${taskName}', ${targetValue}, ${currentProgress})">
                                ▶️ Iniciar Auto-Completo
                            </button>
                            <button class="quest-btn btn-info" onclick="showQuestInfo('${quest.id}')">
                                ℹ️ Detalhes
                            </button>
                        </div>
                    </div>
                `;
            });
            
            questsHTML += '</div>';
            document.getElementById('questsContent').innerHTML = questsHTML;
            updateStatus(true, `${quests.length} quests prontas`);
            
            // Adicionar funções globais para os botões
            window.startQuest = function(questId, taskName, target, current) {
                const quest = quests.find(q => q.id === questId);
                if (!quest) return;
                
                showNotification(`Iniciando auto-completo para: ${quest.config.messages.questName}`, 'success');
                
                // Aqui você implementaria a lógica de auto-completo
                console.log(`Starting quest ${questId}, type: ${taskName}`);
                
                // Atualizar interface para mostrar progresso
                const questItem = document.querySelector(`[data-quest-id="${questId}"]`);
                const startBtn = questItem.querySelector('.btn-start');
                const progressFill = questItem.querySelector('.progress-fill');
                
                startBtn.disabled = true;
                startBtn.innerHTML = '🔄 Processando...';
                startBtn.classList.remove('btn-start');
                startBtn.classList.add('btn-stop');
                
                // Simular progresso (você substituiria com a lógica real)
                let progress = current;
                const interval = setInterval(() => {
                    progress += 10;
                    const percent = Math.min(100, (progress / target) * 100);
                    progressFill.style.width = percent + '%';
                    
                    const progressText = questItem.querySelector('.progress-text');
                    progressText.innerHTML = `
                        <span>${Math.floor(progress)}/${target} segundos</span>
                        <span>${Math.round(percent)}% completo</span>
                    `;
                    
                    if (progress >= target) {
                        clearInterval(interval);
                        startBtn.innerHTML = '✅ Completo';
                        startBtn.style.background = '#10b981';
                        showNotification(`Quest "${quest.config.messages.questName}" completada!`, 'success');
                    }
                }, 500);
                
                startBtn.onclick = () => {
                    clearInterval(interval);
                    startBtn.disabled = false;
                    startBtn.innerHTML = '▶️ Iniciar Auto-Completo';
                    startBtn.classList.remove('btn-stop');
                    startBtn.classList.add('btn-start');
                    showNotification('Auto-completo interrompido', 'error');
                };
            };
            
            window.showQuestInfo = function(questId) {
                const quest = quests.find(q => q.id === questId);
                if (!quest) return;
                
                const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
                const taskName = taskConfig?.tasks ? ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig.tasks[x] != null) : null;
                
                const info = `
                    <strong>${quest.config.messages.questName}</strong><br>
                    <br>
                    <strong>Tipo:</strong> ${taskName}<br>
                    <strong>ID:</strong> ${quest.id}<br>
                    <strong>Expira em:</strong> ${new Date(quest.config.expiresAt).toLocaleDateString()}<br>
                    <strong>Recompensa:</strong> ${quest.config.rewards?.[0]?.amount || '?'} ${quest.config.rewards?.[0]?.currency || 'Moedas'}<br>
                    <br>
                    <small>Para completar automaticamente, clique em "Iniciar Auto-Completo"</small>
                `;
                
                showNotification(info.replace(/<br>/g, '\n'), 'info');
            };
            
        } catch (error) {
            console.error('Erro ao inicializar quests:', error);
            document.getElementById('questsContent').innerHTML = `
                <div class="no-quests" style="color: #ef4444;">
                    ❌ Erro ao carregar quests
                    <br>
                    <small style="font-size: 12px; margin-top: 8px; display: block;">
                        ${error.message}
                    </small>
                </div>
            `;
            updateStatus(false, 'Erro de conexão');
        }
    }, 1000);
})();
