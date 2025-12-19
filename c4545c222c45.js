(function() { 'use strict'; if (window.DiscordQuestPro) { console.log('Discord Quest Pro already running!'); return; } window.DiscordQuestPro = true; // Webpack extraction let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]); webpackChunkdiscord_app.pop();
const Stores = { ApplicationStreaming: Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z, RunningGame: Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames)?.exports?.ZP, Quests:
Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest)?.exports?.Z, Channel: Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent)?.exports?.Z, GuildChannel: Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel)?.exports?.ZP,
FluxDispatcher: Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue)?.exports?.Z, User: Object.values(wpRequire.c).find(x => x?.exports?.default?.getCurrentUser)?.exports?.default, api: Object.values(wpRequire.c).find(x => x?.exports?.tn?.get)?.exports?.tn
}; const isApp = typeof DiscordNative !== "undefined"; // Account Manager with Multi-Token Support class AccountManager { constructor() { this.accounts = this.loadAccounts(); this.currentAccount = null; this.loadCurrentAccount(); } loadAccounts() { try
{ return JSON.parse(localStorage.getItem('quest_pro_accounts') || '[]'); } catch { return []; } } saveAccounts() { localStorage.setItem('quest_pro_accounts', JSON.stringify(this.accounts)); } loadCurrentAccount() { const user = Stores.User.getCurrentUser();
if (user) { const token = this.getToken(); this.currentAccount = { id: user.id, username: user.username, discriminator: user.discriminator, avatar: user.avatar, token: token }; const existingIndex = this.accounts.findIndex(a => a.id === user.id); if (existingIndex
>= 0) { this.accounts[existingIndex] = this.currentAccount; } else { this.accounts.push(this.currentAccount); } this.saveAccounts(); } } getToken() { try { const iframe = document.createElement('iframe'); iframe.style.display = 'none'; document.body.appendChild(iframe);
const token = iframe.contentWindow.localStorage.getItem('token'); document.body.removeChild(iframe); return token?.replace(/"/g, '') || null; } catch { return null; } } addAccount(token) { if (!token || token.length
< 50) { throw new Error(
'Invalid token format'); } const existingIndex=t his.accounts.findIndex(a=> a.token === token); if (existingIndex >= 0) { throw new Error('Account already added'); } this.accounts.push({ token, username: 'Loading...', id: Date.now().toString() }); this.saveAccounts(); return true; } removeAccount(id) { this.accounts = this.accounts.filter(a
    => a.id !== id); this.saveAccounts(); } async fetchAccountInfo(token) { try { const response = await fetch('https://discord.com/api/v9/users/@me', { headers: { 'Authorization': token } }); if (response.ok) { const data = await response.json(); return
    { id: data.id, username: data.username, discriminator: data.discriminator, avatar: data.avatar, token: token }; } return null; } catch { return null; } } async loadAccountsInfo() { const promises = this.accounts.map(async (acc) => { if (acc.username
    === 'Loading...' || !acc.username) { const info = await this.fetchAccountInfo(acc.token); if (info) { acc.id = info.id; acc.username = info.username; acc.discriminator = info.discriminator; acc.avatar = info.avatar; } } return acc; }); this.accounts
    = await Promise.all(promises); this.saveAccounts(); } } // Quest Manager Enhanced class QuestManager { constructor() { this.activeQuests = new Map(); this.completedQuests = new Map(); this.running = {}; this.logs = []; this.stats = { total: 0, completed:
    0, failed: 0, rewards: 0 }; this.autoMode = false; } log(message, type = 'info', accountId = 'current') { const timestamp = new Date().toLocaleTimeString(); this.logs.unshift({ timestamp, message, type, accountId }); if (this.logs.length > 200) this.logs
    = this.logs.slice(0, 200); console.log(`[${timestamp}] ${message}`); this.updateUI(); } async loadQuestsForAccount(accountId, token) { try { const response = await fetch('https://discord.com/api/v9/quests', { headers: { 'Authorization': token } });
    if (!response.ok) throw new Error('Failed to fetch quests'); const data = await response.json(); const quests = data.quests.filter(x => x.id !== "1412491570820812933" && x.user_status?.enrolled_at && !x.user_status?.completed_at && new Date(x.config.expires_at).getTime()
    > Date.now() ); this.activeQuests.set(accountId, quests); this.log(`Found ${quests.length} quest(s)`, 'success', accountId); return quests; } catch (err) { this.log(`Failed to load quests: ${err.message}`, 'error', accountId); return []; } } async
    loadQuestsCurrentAccount() { const quests = [...Stores.Quests.quests.values()].filter(x => x.id !== "1412491570820812933" && x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now() ); const currentUser
    = Stores.User.getCurrentUser(); if (currentUser) { this.activeQuests.set(currentUser.id, quests); this.log(`Found ${quests.length} quest(s)`, 'success', currentUser.id); } return quests; } async claimReward(questId, token = null) { try { const headers
    = token ? { 'Authorization': token } : {}; const url = `https://discord.com/api/v9/quests/${questId}/claim-reward`; const response = token ? await fetch(url, { method: 'POST', headers }) : await Stores.api.post({ url: `/quests/${questId}/claim-reward`
    }); this.stats.rewards++; this.log(`✅ Reward claimed!`, 'success'); return true; } catch (err) { this.log(`❌ Failed to claim reward: ${err.message}`, 'error'); return false; } } async completeVideoQuest(quest, accountId, token = null) { const taskName
    = ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE"].find(x => quest.config?.taskConfig?.tasks?.[x] || quest.config?.taskConfigV2?.tasks?.[x] ); const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2; const secondsNeeded = taskConfig.tasks[taskName]?.target
    || 0; let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? quest.user_status?.progress?.[taskName]?.value ?? 0; this.log(`📹 ${quest.config.messages.questName} - Starting...`, 'info', accountId); const maxFuture = 10, speed = 7, interval
    = 1; const enrolledAt = new Date(quest.userStatus?.enrolledAt || quest.user_status?.enrolled_at).getTime(); while(secondsDone
    < secondsNeeded) { const maxAllowed=M ath.floor((Date.now() - enrolledAt)/1000) + maxFuture; const diff=m axAllowed - secondsDone;
    const timestamp=s econdsDone + speed; if(diff>= speed) { try { const url = `https://discord.com/api/v9/quests/${quest.id}/video-progress`; const body = {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}; const response = token ? await fetch(url, { method: 'POST', headers: { 'Authorization':
        token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) : await Stores.api.post({ url: `/quests/${quest.id}/video-progress`, body }); const resData = token ? await response.json() : response.body; secondsDone = Math.min(secondsNeeded,
        timestamp); if (secondsDone % 30 === 0) { this.log(`Progress: ${secondsDone}/${secondsNeeded}s`, 'info', accountId); } if(resData.completed_at != null) { this.stats.completed++; this.log(`✅ Quest completed!`, 'success', accountId); await this.claimReward(quest.id,
        token); return true; } } catch (err) { this.log(`⚠️ API Error: ${err.message}`, 'error', accountId); this.stats.failed++; return false; } } await new Promise(resolve => setTimeout(resolve, interval * 1000)); } try { const url = `https://discord.com/api/v9/quests/${quest.id}/video-progress`;
        const body = {timestamp: secondsNeeded}; token ? await fetch(url, { method: 'POST', headers: { 'Authorization': token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) : await Stores.api.post({ url: `/quests/${quest.id}/video-progress`,
        body }); this.stats.completed++; this.log(`✅ Quest completed!`, 'success', accountId); await this.claimReward(quest.id, token); return true; } catch (err) { this.stats.failed++; this.log(`❌ Failed: ${err.message}`, 'error', accountId); return
        false; } } async autoCompleteQuest(quest, accountId, token = null) { const taskConfig = quest.config?.taskConfig ?? quest.config?.taskConfigV2; if (!taskConfig?.tasks) { this.log(`❌ No valid task config`, 'error', accountId); return false; } const
        taskName = ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY"] .find(x => taskConfig.tasks[x] != null); if (!taskName) { this.log(`❌ Unsupported task type`, 'error', accountId); return false; } this.running[quest.id]
        = true; this.stats.total++; try { if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") { await this.completeVideoQuest(quest, accountId, token); } else if (!token) { // Desktop tasks only work on current account this.log(`⚠️
        Desktop tasks require current account`, 'warning', accountId); } } finally { delete this.running[quest.id]; this.updateUI(); } } async autoCompleteAllForAccount(accountId, token = null) { const quests = this.activeQuests.get(accountId) || [];
        this.log(`🚀 Starting auto-complete for ${quests.length} quests`, 'info', accountId); for (const quest of quests) { if (!this.autoMode) break; await this.autoCompleteQuest(quest, accountId, token); await new Promise(r => setTimeout(r, 2000));
        } this.log(`✅ Auto-complete finished!`, 'success', accountId); } updateUI() { if (window.updateQuestProUI) { window.updateQuestProUI(); } } } const accountManager = new AccountManager(); const questManager = new QuestManager(); window.accountManager
        = accountManager; window.questManager = questManager; // Create Advanced UI const styles = ` * { box-sizing: border-box; } #quest-pro-ui { position: fixed; top: 20px; right: 20px; width: 900px; height: 700px; background: #2b2d31; border-radius:
        12px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); color: #fff; font-family: 'gg sans', 'Noto Sans', sans-serif; z-index: 99999; display: flex; flex-direction: column; overflow: hidden; } #quest-pro-header { background: linear-gradient(90deg, #5865f2
        0%, #7289da 100%); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none; } #quest-pro-header h2 { margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center;
        gap: 10px; } .header-controls { display: flex; gap: 10px; align-items: center; } .minimize-btn, .close-btn { background: rgba(255,255,255,0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size:
        18px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; } .minimize-btn:hover, .close-btn:hover { background: rgba(255,255,255,0.2); } #quest-pro-tabs { background: #1e1f22; display: flex; border-bottom: 2px solid
        #383a40; } .tab { flex: 1; padding: 14px 20px; background: none; border: none; color: #b5bac1; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; position: relative; } .tab:hover { background: rgba(255,255,255,0.05); color:
        #fff; } .tab.active { color: #fff; background: #2b2d31; } .tab.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: #5865f2; } #quest-pro-content { flex: 1; overflow-y: auto; padding: 20px;
        } .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; } .stat-card { background: linear-gradient(135deg, #383a40 0%, #2b2d31 100%); padding: 16px; border-radius: 8px; text-align: center; border:
        1px solid #404249; } .stat-card h3 { margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #5865f2; } .stat-card p { margin: 0; font-size: 12px; color: #b5bac1; text-transform: uppercase; letter-spacing: 0.5px; } .account-card { background:
        #383a40; padding: 16px; border-radius: 8px; margin-bottom: 12px; display: flex; align-items: center; gap: 12px; border: 2px solid transparent; transition: all 0.2s; } .account-card:hover { border-color: #5865f2; background: #404249; } .account-card.current
        { border-color: #43b581; background: rgba(67, 181, 129, 0.1); } .account-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #5865f2, #7289da); display: flex; align-items: center; justify-content: center;
        font-size: 24px; font-weight: 700; flex-shrink: 0; } .account-info { flex: 1; min-width: 0; } .account-info h4 { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .account-info
        p { margin: 0; font-size: 12px; color: #b5bac1; } .account-actions { display: flex; gap: 8px; } .quest-card { background: #383a40; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #5865f2; } .quest-card.running {
        border-left-color: #faa61a; background: rgba(250, 166, 26, 0.05); } .quest-card.completed { border-left-color: #43b581; background: rgba(67, 181, 129, 0.05); opacity: 0.7; } .quest-header { display: flex; justify-content: space-between; align-items:
        start; margin-bottom: 12px; } .quest-header h4 { margin: 0; font-size: 15px; font-weight: 600; flex: 1; } .quest-type { background: rgba(88, 101, 242, 0.2); color: #5865f2; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight:
        600; text-transform: uppercase; letter-spacing: 0.5px; } .quest-meta { display: flex; gap: 16px; margin-bottom: 12px; font-size: 13px; color: #b5bac1; } .quest-meta span { display: flex; align-items: center; gap: 6px; } .quest-actions { display:
        flex; gap: 8px; } .btn { padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 6px; } .btn-primary { background: #5865f2; color:
        #fff; } .btn-primary:hover { background: #4752c4; transform: translateY(-1px); } .btn-success { background: #43b581; color: #fff; } .btn-success:hover { background: #3ba55d; } .btn-danger { background: #ed4245; color: #fff; } .btn-danger:hover
        { background: #c03537; } .btn-secondary { background: #4e5058; color: #fff; } .btn-secondary:hover { background: #5d5f67; } .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; } .btn-icon { width: 36px; height: 36px;
        padding: 0; display: flex; align-items: center; justify-content: center; } #logs-container { background: #1e1f22; border-radius: 8px; padding: 16px; height: 500px; overflow-y: auto; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px;
        } .log-entry { padding: 6px 0; border-bottom: 1px solid #2b2d31; display: flex; gap: 10px; } .log-time { color: #72767d; min-width: 80px; } .log-message { flex: 1; } .log-info .log-message { color: #00aff4; } .log-success .log-message { color:
        #43b581; } .log-warning .log-message { color: #faa61a; } .log-error .log-message { color: #f04747; } .input-group { display: flex; gap: 10px; margin-bottom: 16px; } .input-group input { flex: 1; background: #1e1f22; border: 2px solid #383a40;
        color: #fff; padding: 12px 16px; border-radius: 6px; font-size: 14px; transition: all 0.2s; } .input-group input:focus { outline: none; border-color: #5865f2; } .section-header { display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 16px; } .section-header h3 { margin: 0; font-size: 16px; font-weight: 600; } .empty-state { text-align: center; padding: 60px 20px; color: #72767d; } .empty-state-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.3; } .empty-state
        h3 { margin: 0 0 8px 0; font-size: 18px; color: #b5bac1; } .empty-state p { margin: 0; font-size: 14px; } ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #1e1f22; } ::-webkit-scrollbar-thumb { background: #4e5058; border-radius:
        4px; } ::-webkit-scrollbar-thumb:hover { background: #5d5f67; } .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; } .badge-success { background: rgba(67, 181, 129,
        0.2); color: #43b581; } .badge-warning { background: rgba(250, 166, 26, 0.2); color: #faa61a; } .toggle-switch { position: relative; display: inline-block; width: 48px; height: 26px; } .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #4e5058; transition: .3s; border-radius: 26px; } .toggle-slider:before { position: absolute; content: ""; height: 20px; width: 20px;
        left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; } input:checked + .toggle-slider { background-color: #43b581; } input:checked + .toggle-slider:before { transform: translateX(22px); } `; const styleEl = document.createElement('style');
        styleEl.textContent = styles; document.head.appendChild(styleEl); const ui = document.createElement('div'); ui.id = 'quest-pro-ui'; ui.innerHTML = `
        <div id="quest-pro-header">
            <h2>
                <span>⚡</span>
                <span>Discord Quest Pro</span>
                <span class="badge badge-success">v2.0</span>
            </h2>
            <div class="header-controls">
                <button class="minimize-btn" onclick="document.getElementById('quest-pro-ui').style.display='none'">−</button>
                <button class="close-btn" id="quest-pro-close">×</button>
            </div>
        </div>

        <div id="quest-pro-tabs">
            <button class="tab active" data-tab="dashboard">📊 Dashboard</button>
            <button class="tab" data-tab="accounts">👥 Accounts</button>
            <button class="tab" data-tab="quests">🎯 Quests</button>
            <button class="tab" data-tab="logs">📝 Logs</button>
            <button class="tab" data-tab="settings">⚙️ Settings</button>
        </div>

        <div id="quest-pro-content"></div>
        `; document.body.appendChild(ui); // Tab System const tabs = { dashboard: () => `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>${accountManager.accounts.length}</h3>
                <p>👥 Accounts</p>
            </div>
            <div class="stat-card">
                <h3>${Array.from(questManager.activeQuests.values()).reduce((a,b) => a + b.length, 0)}</h3>
                <p>🎯 Active Quests</p>
            </div>
            <div class="stat-card">
                <h3>${questManager.stats.completed}</h3>
                <p>✅ Completed</p>
            </div>
            <div class="stat-card">
                <h3>${questManager.stats.rewards}</h3>
                <p>🎁 Rewards</p>
            </div>
        </div>

        <div class="section-header">
            <h3>Quick Actions</h3>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
            <button class="btn btn-success" onclick="window.autoCompleteAll()" style="flex: 1;">
                ▶️ Auto Complete All
            </button>
            <button class="btn btn-danger" onclick="window.stopAllQuests()" style="flex: 1;">
                ⏹️ Stop All
            </button>
        </div>

        <div class="section-header">
            <h3>Recent Activity</h3>
        </div>

        <div id="recent-logs">
            ${questManager.logs.slice(0, 10).map(log => `
            <div class="log-entry log-${log.type}">
                <span class="log-time">${log.timestamp}</span>
                <span class="log-message">${log.message}</span>
            </div>
            `).join('') || '
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No Activity Yet</h3>
                <p>Start completing quests to see activity here</p>
            </div>'}
        </div>
        `, accounts: () => `
        <div class="input-group">
            <input type="text" id="token-input" placeholder="Paste Discord token here..." autocomplete="off">
            <button class="btn btn-primary" onclick="window.addAccountToken()">
                ➕ Add Account
            </button>
        </div>

        <div class="section-header">
            <h3>Accounts (${accountManager.accounts.length})</h3>
            <button class="btn btn-secondary btn-icon" onclick="window.refreshAccountsInfo()">
                🔄
            </button>
        </div>

        <div id="accounts-list">
            ${accountManager.accounts.length === 0 ? `
            <div class="empty-state">
                <div class="empty-state-icon">👤</div>
                <h3>No Accounts Added</h3>
                <p>Add your first account token above to get started</p>
            </div>
            ` : accountManager.accounts.map(acc => { const isCurrent = accountManager.currentAccount?.id === acc.id; const quests = questManager.activeQuests.get(acc.id) || []; return `
            <div class="account-card ${isCurrent ? 'current' : ''}">
                <div class="account-avatar">
                    ${acc.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div class="account-info">
                    <h4>${acc.username || 'Loading...'}${acc.discriminator ? '#' + acc.discriminator : ''}</h4>
                    <p>
                        ${quests.length} active quest${quests.length !== 1 ? 's' : ''} ${isCurrent ? ' • <span class="badge badge-success">Current</span>' : ''}
                    </p>
                </div>
                <div class="account-actions">
                    <button class="btn btn-primary btn-icon" onclick="window.loadQuestsForAccount('${acc.id}')" title="Load Quests">
                        🔄
                    </button>
                    <button class="btn btn-success btn-icon" onclick="window.autoCompleteAccountQuests('${acc.id}')" title="Auto Complete">
                        ▶️
                    </button>
                    ${!isCurrent ? `
                    <button class="btn btn-danger btn-icon" onclick="window.removeAccount('${acc.id}')" title="Remove">
                        🗑️
                    </button>
                    ` : ''}
                </div>
            </div>
            `; }).join('')}
        </div>
        `, quests: () => { const allQuests = Array.from(questManager.activeQuests.entries()); return `
        <div class="section-header">
            <h3>All Quests (${allQuests.reduce((a,b) => a + b[1].length, 0)})</h3>
            <button class="btn btn-primary" onclick="window.refreshAllQuests()">
                🔄 Refresh All
            </button>
        </div>

        ${allQuests.length === 0 ? `
        <div class="empty-state">
            <div class="empty-state-icon">🎯</div>
            <h3>No Quests Found</h3>
            <p>Load quests from your accounts in the Accounts tab</p>
        </div>
        ` : allQuests.map(([accountId, quests]) => { const account = accountManager.accounts.find(a => a.id === accountId); return `
        <div style="margin-bottom: 24px;">
            <h4 style="margin: 0 0 12px 0; color: #b5bac1; font-size: 14px;">
                                👤 ${account?.username || accountId}
                            </h4> ${quests.map(quest => { const taskConfig = quest.config?.taskConfig ?? quest.config?.taskConfigV2; const taskName = ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY"] .find(x => taskConfig?.tasks?.[x]
            != null); const isRunning = questManager.running[quest.id]; const target = taskConfig?.tasks?.[taskName]?.target || 0; const progress = quest.userStatus?.progress?.[taskName]?.value || quest.user_status?.progress?.[taskName]?.value || 0; const
            reward = quest.config?.rewardCode?.skuId ? '🎁 Reward Available' : 'No Reward'; return `
            <div class="quest-card ${isRunning ? 'running' : ''}">
                <div class="quest-header">
                    <h4>${quest.config.messages.questName}</h4>
                    <span class="quest-type">${taskName || 'Unknown'}</span>
                </div>
                <div class="quest-meta">
                    <span>📊 ${Math.floor(progress)}/${target}s</span>
                    <span>${reward}</span>
                    <span>🆔 ${quest.id.slice(0, 8)}...</span>
                </div>
                <div class="quest-actions">
                    <button class="btn btn-success" onclick="window.startQuest('${quest.id}', '${accountId}')" ${isRunning ? 'disabled' : ''}>
                        ${isRunning ? '⏳ Running...' : '▶️ Start'}
                    </button>
                </div>
            </div>
            `; }).join('')}
        </div>
        `; }).join('')} `; }, logs: () => `
        <div class="section-header">
            <h3>Activity Logs</h3>
            <button class="btn btn-danger btn-icon" onclick="window.clearLogs()">
                🗑️
            </button>
        </div>

        <div id="logs-container">
            ${questManager.logs.map(log => `
            <div class="log-entry log-${log.type}">
                <span class="log-time">${log.timestamp}</span>
                <span class="log-message">${log.message}</span>
            </div>
            `).join('') || '
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No Logs Yet</h3></div>'}
        </div>
        `, settings: () => `
        <div class="section-header">
            <h3>Settings</h3>
        </div>

        <div style="background: #383a40; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                    <h4 style="margin: 0 0 4px 0;">Auto Mode</h4>
                    <p style="margin: 0; font-size: 13px; color: #b5bac1;">Automatically complete quests when loaded</p>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" id="auto-mode-toggle" ${questManager.autoMode ? 'checked' : ''} onchange="window.toggleAutoMode()">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </div>

        <div style="background: #383a40; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
            <h4 style="margin: 0 0 12px 0;">Statistics</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 13px;">
                <div>
                    <span style="color: #b5bac1;">Total Quests:</span>
                    <strong style="float: right;">${questManager.stats.total}</strong>
                </div>
                <div>
                    <span style="color: #b5bac1;">Completed:</span>
                    <strong style="float: right; color: #43b581;">${questManager.stats.completed}</strong>
                </div>
                <div>
                    <span style="color: #b5bac1;">Failed:</span>
                    <strong style="float: right; color: #f04747;">${questManager.stats.failed}</strong>
                </div>
                <div>
                    <span style="color: #b5bac1;">Rewards:</span>
                    <strong style="float: right; color: #5865f2;">${questManager.stats.rewards}</strong>
                </div>
            </div>
        </div>

        <div style="background: #383a40; padding: 20px; border-radius: 8px;">
            <h4 style="margin: 0 0 12px 0;">Danger Zone</h4>
            <button class="btn btn-danger" style="width: 100%;" onclick="window.resetAllData()">
                🗑️ Clear All Data & Accounts
            </button>
        </div>
        ` }; // Tab Navigation document.querySelectorAll('.tab').forEach(tab => { tab.addEventListener('click', () => { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); const tabName = tab.dataset.tab;
        document.getElementById('quest-pro-content').innerHTML = tabs[tabName](); }); }); // Initialize Dashboard document.getElementById('quest-pro-content').innerHTML = tabs.dashboard(); // Window Functions window.updateQuestProUI = () => { const activeTab
        = document.querySelector('.tab.active').dataset.tab; document.getElementById('quest-pro-content').innerHTML = tabs[activeTab](); }; window.addAccountToken = async () => { const input = document.getElementById('token-input'); const token = input.value.trim();
        if (!token) { questManager.log('❌ Please enter a token', 'error'); return; } try { accountManager.addAccount(token); input.value = ''; questManager.log('✅ Account added! Loading info...', 'success'); await accountManager.loadAccountsInfo(); window.updateQuestProUI();
        } catch (err) { questManager.log(`❌ ${err.message}`, 'error'); } }; window.removeAccount = (id) => { if (confirm('Remove this account?')) { accountManager.removeAccount(id); questManager.activeQuests.delete(id); questManager.log('Account removed',
        'info'); window.updateQuestProUI(); } }; window.refreshAccountsInfo = async () => { questManager.log('🔄 Refreshing account info...', 'info'); await accountManager.loadAccountsInfo(); window.updateQuestProUI(); }; window.loadQuestsForAccount =
        async (accountId) => { const account = accountManager.accounts.find(a => a.id === accountId); if (!account) return; questManager.log(`🔄 Loading quests for ${account.username}...`, 'info', accountId); if (accountManager.currentAccount?.id ===
        accountId) { await questManager.loadQuestsCurrentAccount(); } else { await questManager.loadQuestsForAccount(accountId, account.token); } window.updateQuestProUI(); }; window.refreshAllQuests = async () => { questManager.log('🔄 Refreshing all
        quests...', 'info'); for (const account of accountManager.accounts) { if (accountManager.currentAccount?.id === account.id) { await questManager.loadQuestsCurrentAccount(); } else { await questManager.loadQuestsForAccount(account.id, account.token);
        } } window.updateQuestProUI(); }; window.startQuest = async (questId, accountId) => { const quests = questManager.activeQuests.get(accountId) || []; const quest = quests.find(q => q.id === questId); if (!quest) return; const account = accountManager.accounts.find(a
        => a.id === accountId); const token = accountManager.currentAccount?.id === accountId ? null : account?.token; await questManager.autoCompleteQuest(quest, accountId, token); }; window.autoCompleteAccountQuests = async (accountId) => { const account
        = accountManager.accounts.find(a => a.id === accountId); const token = accountManager.currentAccount?.id === accountId ? null : account?.token; await questManager.autoCompleteAllForAccount(accountId, token); }; window.autoCompleteAll = async ()
        => { questManager.autoMode = true; for (const account of accountManager.accounts) { const token = accountManager.currentAccount?.id === account.id ? null : account.token; await questManager.autoCompleteAllForAccount(account.id, token); } questManager.autoMode
        = false; }; window.stopAllQuests = () => { questManager.autoMode = false; questManager.running = {}; questManager.log('⏹️ Stopped all quests', 'warning'); window.updateQuestProUI(); }; window.clearLogs = () => { questManager.logs = []; window.updateQuestProUI();
        }; window.toggleAutoMode = () => { questManager.autoMode = document.getElementById('auto-mode-toggle').checked; questManager.log(`Auto mode: ${questManager.autoMode ? 'ON' : 'OFF'}`, 'info'); }; window.resetAllData = () => { if (confirm('⚠️ This
        will delete all accounts and data. Continue?')) { localStorage.removeItem('quest_pro_accounts'); accountManager.accounts = []; questManager.activeQuests.clear(); questManager.logs = []; questManager.stats = { total: 0, completed: 0, failed: 0,
        rewards: 0 }; questManager.log('🗑️ All data cleared', 'warning'); window.updateQuestProUI(); } }; // Draggable let isDragging = false, currentX, currentY, initialX, initialY; const header = document.getElementById('quest-pro-header'); header.addEventListener('mousedown',
        (e) => { if (e.target.closest('.header-controls')) return; isDragging = true; initialX = e.clientX - ui.offsetLeft; initialY = e.clientY - ui.offsetTop; }); document.addEventListener('mousemove', (e) => { if (isDragging) { e.preventDefault();
        currentX = e.clientX - initialX; currentY = e.clientY - initialY; ui.style.left = currentX + 'px'; ui.style.top = currentY + 'px'; ui.style.right = 'auto'; } }); document.addEventListener('mouseup', () => isDragging = false); // Close document.getElementById('quest-pro-close').addEventListener('click',
        () => { if (confirm('Close Discord Quest Pro?')) { ui.remove(); styleEl.remove(); delete window.DiscordQuestPro; delete window.accountManager; delete window.questManager; } }); // Auto load current account accountManager.loadAccountsInfo().then(async
        () => { await questManager.loadQuestsCurrentAccount(); window.updateQuestProUI(); }); questManager.log('🚀 Discord Quest Pro v2.0 loaded!', 'success'); console.log('%c⚡ Discord Quest Pro v2.0', 'font-size: 24px; font-weight: bold; color: #5865f2;');
        console.log('%cMulti-account quest automation ready!', 'font-size: 14px; color: #43b581;'); })();-primary" onclick="window.refreshAllQuests()" style="flex: 1;"> 🔄 Refresh All Quests
        </button>
        <button class="btn btn<button class=" btn btn-primary " onclick="window.refreshAllQuests() " style="flex: 1; ">
                    🔄 Refresh All Quests
                </button>
                <button class="btn btn-success " onclick="window.autoCompleteAll() " style="flex: 1; ">
                    ▶️ Auto Complete All
                </button>
                <button class="btn btn-danger " onclick="window.stopAllQuests() " style="flex: 1; ">
                    ⏹️ Stop All
                </button>
            </div>
            
            <div class="section-header ">
                <h3>Recent Activity</h3>
            </div>
            
            <div id="recent-logs ">
                ${questManager.logs.slice(0, 10).map(log => `
                    <div class="log-entry log-${log.type} ">
                        <span class="log-time ">${log.timestamp}</span>
                        <span class="log-message ">${log.message}</span>
                    </div>
        `).join('') || '<div class="empty-state "><div class="empty-state-icon ">📭</div><h3>No Activity Yet</h3><p>Start completing quests to see activity here</p></div>'}
            </div>
        `,
        
        accounts: () => `
            <div class="input-group ">
                <input type="text " id="token-input " placeholder="Paste Discord token here... " autocomplete="off ">
                <button class="btn btn-primary " onclick="window.addAccountToken() ">
                    ➕ Add Account
                </button>
            </div>
            
            <div class="section-header ">
                <h3>Accounts (${accountManager.accounts.length})</h3>
                <button class="btn btn-secondary btn-icon " onclick="window.refreshAccountsInfo() ">
                    🔄
                </button>
            </div>
            
            <div id="accounts-list ">
                ${accountManager.accounts.length === 0 ? `
                    <div class="empty-state ">
                        <div class="empty-state-icon ">👤</div>
                        <h3>No Accounts Added</h3>
                        <p>Add your first account token above to get started</p>
                    </div>
                ` : accountManager.accounts.map(acc => {
                    const isCurrent = accountManager.currentAccount?.id === acc.id;
                    const quests = questManager.activeQuests.get(acc.id) || [];
                    return `
                        <div class="account-card ${isCurrent ? 'current' : ''} ">
                            <div class="account-avatar ">
                                ${acc.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div class="account-info ">
                                <h4>${acc.username || 'Loading...'}${acc.discriminator ? '#' + acc.discriminator : ''}</h4>
                                <p>
                                    ${quests.length} active quest${quests.length !== 1 ? 's' : ''}
                                    ${isCurrent ? ' • <span class="badge badge-success ">Current</span>' : ''}
                                </p>
                            </div>
                            <div class="account-actions ">
                                <button class="btn btn-primary btn-icon " onclick="window.loadQuestsForAccount( '${acc.id}') " title="Load Quests ">
                                    🔄
                                </button>
                                <button class="btn btn-success btn-icon " onclick="window.autoCompleteAccountQuests( '${acc.id}') " title="Auto Complete ">
                                    ▶️
                                </button>
                                ${!isCurrent ? `
                                    <button class="btn btn-danger btn-icon " onclick="window.removeAccount( '${acc.id}') " title="Remove ">
                                        🗑️
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `,
        
        quests: () => {
            const allQuests = Array.from(questManager.activeQuests.entries());
            return `
                <div class="section-header ">
                    <h3>All Quests (${allQuests.reduce((a,b) => a + b[1].length, 0)})</h3>
                    <button class="btn btn-primary " onclick="window.refreshAllQuests() ">
                        🔄 Refresh All
                    </button>
                </div>
                
                ${allQuests.length === 0 ? `
                    <div class="empty-state ">
                        <div class="empty-state-icon ">🎯</div>
                        <h3>No Quests Found</h3>
                        <p>Load quests from your accounts in the Accounts tab</p>
                    </div>
                ` : allQuests.map(([accountId, quests]) => {
                    const account = accountManager.accounts.find(a => a.id === accountId);
                    return `
                        <div style="margin-bottom: 24px; ">
                            <h4 style="margin: 0 0 12px 0; color: #b5bac1; font-size: 14px; ">
                                👤 ${account?.username || accountId}
                            </h4>
                            ${quests.map(quest => {
                                const taskConfig = quest.config?.taskConfig ?? quest.config?.taskConfigV2;
                                const taskName = ["WATCH_VIDEO ", "WATCH_VIDEO_ON_MOBILE ", "PLAY_ON_DESKTOP ", "STREAM_ON_DESKTOP ", "PLAY_ACTIVITY "]
                                    .find(x => taskConfig?.tasks?.[x] != null);
                                const isRunning = questManager.running[quest.id];
                                const target = taskConfig?.tasks?.[taskName]?.target || 0;
                                const progress = quest.userStatus?.progress?.[taskName]?.value || quest.user_status?.progress?.[taskName]?.value || 0;
                                const reward = quest.config?.rewardCode?.skuId ? '🎁 Reward Available' : 'No Reward';
                                
                                return `
                                    <div class="quest-card ${isRunning ? 'running' : ''} ">
                                        <div class="quest-header ">
                                            <h4>${quest.config.messages.questName}</h4>
                                            <span class="quest-type ">${taskName || 'Unknown'}</span>
                                        </div>
                                        <div class="quest-meta ">
                                            <span>📊 ${Math.floor(progress)}/${target}s</span>
                                            <span>${reward}</span>
                                            <span>🆔 ${quest.id.slice(0, 8)}...</span>
                                        </div>
                                        <div class="quest-actions ">
                                            <button class="btn btn-success " onclick="window.startQuest( '${quest.id}', '${accountId}') " ${isRunning ? 'disabled' : ''}>
                                                ${isRunning ? '⏳ Running...' : '▶️ Start'}
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }).join('')}
            `;
        },
        
        logs: () => `
            <div class="section-header ">
                <h3>Activity Logs</h3>
                <button class="btn btn-danger btn-icon " onclick="window.clearLogs() ">
                    🗑️
                </button>
            </div>
            
            <div id="logs-container ">
                ${questManager.logs.map(log => `
                    <div class="log-entry log-${log.type} ">
                        <span class="log-time ">${log.timestamp}</span>
                        <span class="log-message ">${log.message}</span>
                    </div>
                `).join('') || '<div class="empty-state "><div class="empty-state-icon ">📭</div><h3>No Logs Yet</h3></div>'}
            </div>
        `,
        
        settings: () => `
            <div class="section-header ">
                <h3>Settings</h3>
            </div>
            
            <div style="background: #383a40; padding: 20px; border-radius: 8px; margin-bottom: 16px; ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; ">
                    <div>
                        <h4 style="margin: 0 0 4px 0; ">Auto Mode</h4>
                        <p style="margin: 0; font-size: 13px; color: #b5bac1; ">Automatically complete quests when loaded</p>
                    </div>
                    <label class="toggle-switch ">
                        <input type="checkbox " id="auto-mode-toggle " ${questManager.autoMode ? 'checked' : ''} onchange="window.toggleAutoMode() ">
                        <span class="toggle-slider "></span>
                    </label>
                </div>
            </div>
            
            <div style="background: #383a40; padding: 20px; border-radius: 8px; margin-bottom: 16px; ">
                <h4 style="margin: 0 0 12px 0; ">Statistics</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 13px; ">
                    <div>
                        <span style="color: #b5bac1; ">Total Quests:</span>
                        <strong style="float: right; ">${questManager.stats.total}</strong>
                    </div>
                    <div>
                        <span style="color: #b5bac1; ">Completed:</span>
                        <strong style="float: right; color: #43b581; ">${questManager.stats.completed}</strong>
                    </div>
                    <div>
                        <span style="color: #b5bac1; ">Failed:</span>
                        <strong style="float: right; color: #f04747; ">${questManager.stats.failed}</strong>
                    </div>
                    <div>
                        <span style="color: #b5bac1; ">Rewards:</span>
                        <strong style="float: right; color: #5865f2; ">${questManager.stats.rewards}</strong>
                    </div>
                </div>
            </div>
            
  <div style="background: #383a40; padding: 20px; border-radius: 8px; ">
                <h4 style="margin: 0 0 12px 0; ">Danger Zone</h4>
                <button class="btn btn-danger " style="width: 100%; " onclick="window.resetAllData() ">
                    🗑️ Clear All Data & Accounts
                </button>
            </div>
        
    };

    // Tab Navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById('quest-pro-content').innerHTML = tabs[tabName]();
        });
    });

    // Initialize Dashboard
    document.getElementById('quest-pro-content').innerHTML = tabs.dashboard();

    // Window Functions
    window.updateQuestProUI = () => {
        const activeTab = document.querySelector('.tab.active').dataset.tab;
        document.getElementById('quest-pro-content').innerHTML = tabs[activeTab]();
    };

    window.addAccountToken = async () => {
        const input = document.getElementById('token-input');
        const token = input.value.trim();
        
        if (!token) {
            questManager.log('❌ Please enter a token', 'error');
            return;
        }
        
        try {
            accountManager.addAccount(token);
            input.value = '';
            questManager.log('✅ Account added! Loading info...', 'success');
            await accountManager.loadAccountsInfo();
            window.updateQuestProUI();
        } catch (err) {
            questManager.log(`❌ ${err.message}`, 'error');
        }
    };

    window.removeAccount = (id) => {
        if (confirm('Remove this account?')) {
            accountManager.removeAccount(id);
            questManager.activeQuests.delete(id);
            questManager.log('Account removed', 'info');
            window.updateQuestProUI();
        }
    };

    window.refreshAccountsInfo = async () => {
        questManager.log('🔄 Refreshing account info...', 'info');
        await accountManager.loadAccountsInfo();
        window.updateQuestProUI();
    };

    window.loadQuestsForAccount = async (accountId) => {
        const account = accountManager.accounts.find(a => a.id === accountId);
        if (!account) return;
        
        questManager.log(`🔄 Loading quests for ${account.username}...`, 'info', accountId);
        
        if (accountManager.currentAccount?.id === accountId) {
            await questManager.loadQuestsCurrentAccount();
        } else {
            await questManager.loadQuestsForAccount(accountId, account.token);
        }
        
        window.updateQuestProUI();
    };

    window.refreshAllQuests = async () => {
        questManager.log('🔄 Refreshing all quests...', 'info');
        
        for (const account of accountManager.accounts) {
            if (accountManager.currentAccount?.id === account.id) {
                await questManager.loadQuestsCurrentAccount();
            } else {
                await questManager.loadQuestsForAccount(account.id, account.token);
            }
        }
        
        window.updateQuestProUI();
    };

    window.startQuest = async (questId, accountId) => {
        const quests = questManager.activeQuests.get(accountId) || [];
        const quest = quests.find(q => q.id === questId);
        if (!quest) return;
        
        const account = accountManager.accounts.find(a => a.id === accountId);
        const token = accountManager.currentAccount?.id === accountId ? null : account?.token;
        
        await questManager.autoCompleteQuest(quest, accountId, token);
    };

    window.autoCompleteAccountQuests = async (accountId) => {
        const account = accountManager.accounts.find(a => a.id === accountId);
        const token = accountManager.currentAccount?.id === accountId ? null : account?.token;
        
        await questManager.autoCompleteAllForAccount(accountId, token);
    };

    window.autoCompleteAll = async () => {
        questManager.autoMode = true;
        
        for (const account of accountManager.accounts) {
            const token = accountManager.currentAccount?.id === account.id ? null : account.token;
            await questManager.autoCompleteAllForAccount(account.id, token);
        }
        
        questManager.autoMode = false;
    };

    window.stopAllQuests = () => {
        questManager.autoMode = false;
        questManager.running = {};
        questManager.log('⏹️ Stopped all quests', 'warning');
        window.updateQuestProUI();
    };

    window.clearLogs = () => {
        questManager.logs = [];
        window.updateQuestProUI();
    };

    window.toggleAutoMode = () => {
        questManager.autoMode = document.getElementById('auto-mode-toggle').checked;
        questManager.log(`Auto mode: ${questManager.autoMode ? 'ON' : 'OFF'}`, 'info');
    };

    window.resetAllData = () => {
        if (confirm('⚠️ This will delete all accounts and data. Continue?')) {
            localStorage.removeItem('quest_pro_accounts');
            accountManager.accounts = [];
            questManager.activeQuests.clear();
            questManager.logs = [];
            questManager.stats = { total: 0, completed: 0, failed: 0, rewards: 0 };
            questManager.log('🗑️ All data cleared', 'warning');
            window.updateQuestProUI();
        }
    };

    // Draggable
    let isDragging = false, currentX, currentY, initialX, initialY;
    const header = document.getElementById('quest-pro-header');
    
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.header-controls')) return;
        isDragging = true;
        initialX = e.clientX - ui.offsetLeft;
        initialY = e.clientY - ui.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            ui.style.left = currentX + 'px';
            ui.style.top = currentY + 'px';
            ui.style.right = 'auto';
        }
    });
    
    document.addEventListener('mouseup', () => isDragging = false);

    // Close
    document.getElementById('quest-pro-close').addEventListener('click', () => {
        if (confirm('Close Discord Quest Pro?')) {
            ui.remove();
            styleEl.remove();
            delete window.DiscordQuestPro;
            delete window.accountManager;
            delete window.questManager;
        }
    });

    // Auto load current account
    accountManager.loadAccountsInfo().then(async () => {
        await questManager.loadQuestsCurrentAccount();
        window.updateQuestProUI();
    });

    questManager.log('🚀 Discord Quest Pro v2.0 loaded!', 'success');
    console.log('%c⚡ Discord Quest Pro v2.0', 'font-size: 24px; font-weight: bold; color: #5865f2;');
    console.log('%cMulti-account quest automation ready!', 'font-size: 14px; color: #43b581;');
})();
