(function() {
    'use strict';
    
    if (window.DiscordQuestPro) {
        console.log('Discord Quest Pro already running!');
        return;
    }
    window.DiscordQuestPro = true;

    // Webpack extraction
    let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
    webpackChunkdiscord_app.pop();

    const Stores = {
        ApplicationStreaming: Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z,
        RunningGame: Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames)?.exports?.ZP,
        Quests: Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest)?.exports?.Z,
        Channel: Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent)?.exports?.Z,
        GuildChannel: Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel)?.exports?.ZP,
        FluxDispatcher: Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue)?.exports?.Z,
        User: Object.values(wpRequire.c).find(x => x?.exports?.default?.getCurrentUser)?.exports?.default,
        api: Object.values(wpRequire.c).find(x => x?.exports?.tn?.get)?.exports?.tn
    };

    const isApp = typeof DiscordNative !== "undefined";

    // Account Manager with Multi-Token Support
    class AccountManager {
        constructor() {
            this.accounts = this.loadAccounts();
            this.currentAccount = null;
            this.loadCurrentAccount();
        }

        loadAccounts() {
            try {
                return JSON.parse(localStorage.getItem('quest_pro_accounts') || '[]');
            } catch {
                return [];
            }
        }

        saveAccounts() {
            localStorage.setItem('quest_pro_accounts', JSON.stringify(this.accounts));
        }

        loadCurrentAccount() {
            const user = Stores.User.getCurrentUser();
            if (user) {
                const token = this.getToken();
                this.currentAccount = {
                    id: user.id,
                    username: user.username,
                    discriminator: user.discriminator,
                    avatar: user.avatar,
                    token: token
                };
                
                const existingIndex = this.accounts.findIndex(a => a.id === user.id);
                if (existingIndex >= 0) {
                    this.accounts[existingIndex] = this.currentAccount;
                } else {
                    this.accounts.push(this.currentAccount);
                }
                this.saveAccounts();
            }
        }

        getToken() {
            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                const token = iframe.contentWindow.localStorage.getItem('token');
                document.body.removeChild(iframe);
                return token?.replace(/"/g, '') || null;
            } catch {
                return null;
            }
        }

        addAccount(token) {
            if (!token || token.length < 50) {
                throw new Error('Invalid token format');
            }
            
            const existingIndex = this.accounts.findIndex(a => a.token === token);
            if (existingIndex >= 0) {
                throw new Error('Account already added');
            }

            this.accounts.push({ token, username: 'Loading...', id: Date.now().toString() });
            this.saveAccounts();
            return true;
        }

        removeAccount(id) {
            this.accounts = this.accounts.filter(a => a.id !== id);
            this.saveAccounts();
        }

        async fetchAccountInfo(token) {
            try {
                const response = await fetch('https://discord.com/api/v9/users/@me', {
                    headers: { 'Authorization': token }
                });
                if (response.ok) {
                    const data = await response.json();
                    return {
                        id: data.id,
                        username: data.username,
                        discriminator: data.discriminator,
                        avatar: data.avatar,
                        token: token
                    };
                }
                return null;
            } catch {
                return null;
            }
        }

        async loadAccountsInfo() {
            const promises = this.accounts.map(async (acc) => {
                if (acc.username === 'Loading...' || !acc.username) {
                    const info = await this.fetchAccountInfo(acc.token);
                    if (info) {
                        acc.id = info.id;
                        acc.username = info.username;
                        acc.discriminator = info.discriminator;
                        acc.avatar = info.avatar;
                    }
                }
                return acc;
            });
            
            this.accounts = await Promise.all(promises);
            this.saveAccounts();
        }
    }

    // Quest Manager Enhanced
    class QuestManager {
        constructor() {
            this.activeQuests = new Map();
            this.completedQuests = new Map();
            this.running = {};
            this.logs = [];
            this.stats = {
                total: 0,
                completed: 0,
                failed: 0,
                rewards: 0
            };
            this.autoMode = false;
        }

        log(message, type = 'info', accountId = 'current') {
            const timestamp = new Date().toLocaleTimeString();
            this.logs.unshift({ timestamp, message, type, accountId });
            if (this.logs.length > 200) this.logs = this.logs.slice(0, 200);
            console.log(`[${timestamp}] ${message}`);
            this.updateUI();
        }

        async loadQuestsForAccount(accountId, token) {
            try {
                const response = await fetch('https://discord.com/api/v9/quests', {
                    headers: { 'Authorization': token }
                });
                
                if (!response.ok) throw new Error('Failed to fetch quests');
                
                const data = await response.json();
                const quests = data.quests.filter(x => 
                    x.id !== "1412491570820812933" && 
                    x.user_status?.enrolled_at && 
                    !x.user_status?.completed_at && 
                    new Date(x.config.expires_at).getTime() > Date.now()
                );
                
                this.activeQuests.set(accountId, quests);
                this.log(`Found ${quests.length} quest(s)`, 'success', accountId);
                return quests;
            } catch (err) {
                this.log(`Failed to load quests: ${err.message}`, 'error', accountId);
                return [];
            }
        }

        async loadQuestsCurrentAccount() {
            const quests = [...Stores.Quests.quests.values()].filter(x => 
                x.id !== "1412491570820812933" && 
                x.userStatus?.enrolledAt && 
                !x.userStatus?.completedAt && 
                new Date(x.config.expiresAt).getTime() > Date.now()
            );
            
            const currentUser = Stores.User.getCurrentUser();
            if (currentUser) {
                this.activeQuests.set(currentUser.id, quests);
                this.log(`Found ${quests.length} quest(s)`, 'success', currentUser.id);
            }
            return quests;
        }

        async claimReward(questId, token = null) {
            try {
                const headers = token ? { 'Authorization': token } : {};
                const url = `https://discord.com/api/v9/quests/${questId}/claim-reward`;
                
                const response = token 
                    ? await fetch(url, { method: 'POST', headers })
                    : await Stores.api.post({ url: `/quests/${questId}/claim-reward` });
                
                this.stats.rewards++;
                this.log(`✅ Reward claimed!`, 'success');
