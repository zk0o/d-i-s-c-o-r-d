(function() {
  'use strict';
  if (window.DiscordQuestPro) {
    console.log('Discord Quest Pro already running!');
    return;
  }
  window.DiscordQuestPro = true;
  // Webpack extraction
  let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r =>
    r]);
  webpackChunkdiscord_app.pop();
  
  const Stores = {
    ApplicationStreaming: Object.values(wpRequire.c).find(x =>
      x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z,
    RunningGame: Object.values(wpRequire.c).find(x =>
      x?.exports?.ZP?.getRunningGames)?.exports?.ZP,
    Quests: Object.values(wpRequire.c).find(x =>
      x?.exports?.Z?.__proto__?.getQuest)?.exports?.Z,
    Channel: Object.values(wpRequire.c).find(x =>
      x?.exports?.Z?.__proto__?.getAllThreadsForParent)?.exports?.Z,
    GuildChannel: Object.values(wpRequire.c).find(x =>
      x?.exports?.ZP?.getSFWDefaultChannel)?.exports?.ZP,
    FluxDispatcher: Object.values(wpRequire.c).find(x =>
      x?.exports?.Z?.__proto__?.flushWaitQueue)?.exports?.Z,
    User: Object.values(wpRequire.c).find(x =>
      x?.exports?.default?.getCurrentUser)?.exports?.default,
    api: Object.values(wpRequire.c).find(x =>
      x?.exports?.tn?.get)?.exports?.tn
  };
  const isApp = typeof DiscordNative !== "undefined";

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
        const existingIndex = this.accounts.findIndex(a =>
          a.id === user.id);
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
        return token?.replace(/\"/g, '') || null;
      } catch {
        return null;
      }
    }
    addAccount(token) {
      if (!token || token.length < 50) {
        throw new Error('Invalid token format');
      }
      const existingIndex = this.accounts.findIndex(a =>
        a.token === token);
      if (existingIndex >= 0) {
        throw new Error('Account already added');
      }
      this.accounts.push({ token, username: 'Loading...', id: Date.now().toString() });
      this.saveAccounts();
      return true;
    }
    removeAccount(id) {
      this.accounts = this.accounts.filter(a =>
        a.id !== id);
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
          new Date(x.config.expires_at).getTime() >
          Date.now()
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
        new Date(x.config.expiresAt).getTime() >
        Date.now()
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
        return true;
      } catch (err) {
        this.log(`❌ Failed to claim reward: ${err.message}`, 'error');
        return false;
      }
    }
    async completeVideoQuest(quest, accountId, token = null) {
      const taskName = ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE"].find(x =>
        quest.config?.taskConfig?.tasks?.[x] || quest.config?.taskConfigV2?.tasks?.[x]
      );
      const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
      const secondsNeeded = taskConfig.tasks[taskName]?.target || 0;
      let secondsDone = quest.userStatus?.progress?.[taskName]?.value ??
        quest.user_status?.progress?.[taskName]?.value ?? 0;
      this.log(`📹 ${quest.config.messages.questName} - Starting...`, 'info', accountId);
      const maxFuture = 10, speed = 7, interval = 1;
      const enrolledAt = new Date(quest.userStatus?.enrolledAt || quest.user_status?.enrolled_at).getTime();
      while (secondsDone < secondsNeeded) {
        const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
        const diff = maxAllowed - secondsDone;
        const timestamp = secondsDone + speed;
        if (diff >= speed) {
          try {
            const url = `https://discord.com/api/v9/quests/${quest.id}/video-progress`;
            const body = { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) };
            const response = token
              ? await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              })
              : await Stores.api.post({ url: `/quests/${quest.id}/video-progress`, body });
            const resData = token ? await response.json() : response.body;
            secondsDone = Math.min(secondsNeeded, timestamp);
            if (secondsDone % 30 === 0) {
              this.log(`Progress: ${secondsDone}/${secondsNeeded}s`, 'info', accountId);
            }
            if (resData.completed_at != null) {
              this.stats.completed++;
              this.log(`✅ Quest completed!`, 'success', accountId);
              await this.claimReward(quest.id, token);
              return true;
            }
          } catch (err) {
            this.log(`⚠️ API Error: ${err.message}`, 'error', accountId);
            this.stats.failed++;
            return false;
          }
        }
        await new Promise(resolve =>
          setTimeout(resolve, interval * 1000));
      }
      try {
        const url = `https://discord.com/api/v9/quests/${quest.id}/video-progress`;
        const body = { timestamp: secondsNeeded };
        token
          ? await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })
          : await Stores.api.post({ url: `/quests/${quest.id}/video-progress`, body });
        this.stats.completed++;
        this.log(`✅ Quest completed!`, 'success', accountId);
        await this.claimReward(quest.id, token);
        return true;
      } catch (err) {
        this.stats.failed++;
        this.log(`❌ Failed: ${err.message}`, 'error', accountId);
        return false;
      }
    }
    async autoCompleteQuest(quest, accountId, token = null) {
      const taskConfig = quest.config?.taskConfig ?? quest.config?.taskConfigV2;
      if (!taskConfig?.tasks) {
        this.log(`❌ No valid task config`, 'error', accountId);
        return false;
      }
      const taskName = ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY"]
        .find(x =>
          taskConfig.tasks[x] != null);
      if (!taskName) {
        this.log(`❌ Unsupported task type`, 'error', accountId);
        return false;
      }
      this.running[quest.id] = true;
      this.stats.total++;
      try {
        if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
          await this.completeVideoQuest(quest, accountId, token);
        } else if (!token) {
          this.log(`⚠️ Desktop tasks require current account`, 'warning', accountId);
        }
      } finally {
        delete this.running[quest.id];
        this.updateUI();
      }
    }
    async autoCompleteAllForAccount(accountId, token = null) {
      const quests = this.activeQuests.get(accountId) || [];
      this.log(`🚀 Starting auto-complete for ${quests.length} quests`, 'info', accountId);
      for (const quest of quests) {
        if (!this.autoMode) break;
        await this.autoCompleteQuest(quest, accountId, token);
        await new Promise(r =>
          setTimeout(r, 2000));
      }
      this.log(`✅ Auto-complete finished!`, 'success', accountId);
    }
    updateUI() {
      if (window.updateQuestProUI) {
        window.updateQuestProUI();
      }
    }
  }

  const accountManager = new AccountManager();
  const questManager = new QuestManager();
  window.accountManager = accountManager;
  window.questManager = questManager;

  // Styles injected dynamically for UI
  const styles = `...`; // (Use your long CSS here wrapped by backticks)
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // Create container element
  const ui = document.createElement('div');
  ui.id = 'quest-pro-ui';
  ui.style.position = 'fixed';
  ui.style.top = '20px';
  ui.style.right = '20px';
  ui.style.width = '900px';
  ui.style.height = '700px';
  ui.style.background = '#2b2d31';
  ui.style.color = '#fff';
  ui.style.zIndex = 99999;
  ui.style.borderRadius = '12px';
  ui.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
  ui.style.fontFamily = "'gg sans', 'Noto Sans', sans-serif";
  ui.style.display = 'flex';
  ui.style.flexDirection = 'column';
  ui.style.overflow = 'hidden';

  // You can inject your entire UI HTML here, or rebuild it programmatically
  ui.innerHTML = `
    <!-- Your UI HTML from the original code here, cleaned -->
  `;

  document.body.appendChild(ui);

  // ... all your other code to handle tabs, events, etc ...

  // Load current accounts and quests, then update UI
  accountManager.loadAccountsInfo().then(async () => {
    await questManager.loadQuestsCurrentAccount();
    window.updateQuestProUI();
  });

  questManager.log('🚀 Discord Quest Pro v2.0 loaded!', 'success');
  console.log('%c⚡ Discord Quest Pro v2.0', 'font-size: 24px; font-weight: bold; color: #5865f2;');
  console.log('%cMulti-account quest automation ready!', 'font-size: 14px; color: #43b581;');
})();
