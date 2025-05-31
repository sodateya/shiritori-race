// Steam統合機能
class SteamIntegration {
    constructor() {
      this.steamworks = null;
      this.isInitialized = false;
      this.achievements = {
        'FIRST_CLEAR': 'しりとり初心者',
        'SPEED_DEMON': 'スピードマスター',
        'PERFECT_RUN': 'パーフェクト',
        'HARD_MODE': 'エキスパート',
        'TIME_ATTACK': 'タイムアタッカー'
      };
      
      this.leaderboards = {
        'EASY_TIME': 'かんたんモード最速',
        'NORMAL_TIME': 'ふつうモード最速',
        'HARD_TIME': 'むずかしいモード最速'
      };
    }
  
    // Steam初期化
    async initialize() {
      try {
        // Steamworks SDKが利用可能かチェック
        if (typeof require !== 'undefined') {
          const steamworks = require('steamworks.js');
          
          if (steamworks.init(/* your_app_id */)) {
            this.steamworks = steamworks;
            this.isInitialized = true;
            console.log('Steam初期化成功');
            return true;
          }
        }
      } catch (error) {
        console.log('Steam初期化失敗 (スタンドアロンモードで実行):', error);
      }
      return false;
    }
  
    // 実績解除
    unlockAchievement(achievementId) {
      if (!this.isInitialized || !this.steamworks) return;
      
      try {
        this.steamworks.achievement.activate(achievementId);
        console.log(`実績解除: ${this.achievements[achievementId]}`);
      } catch (error) {
        console.error('実績解除エラー:', error);
      }
    }
  
    // リーダーボードにスコア送信
    submitScore(leaderboardId, score, difficulty) {
      if (!this.isInitialized || !this.steamworks) return;
      
      try {
        // スコアは秒単位を1000倍してint値で送信
        const scoreInt = Math.round(score * 1000);
        this.steamworks.leaderboards.uploadScore(leaderboardId, scoreInt);
        console.log(`スコア送信: ${difficulty}モード ${score}秒`);
      } catch (error) {
        console.error('スコア送信エラー:', error);
      }
    }
  
    // リーダーボード取得
    async getLeaderboard(leaderboardId, start = 0, end = 10) {
      if (!this.isInitialized || !this.steamworks) return [];
      
      try {
        const entries = await this.steamworks.leaderboards.downloadScores(
          leaderboardId, start, end
        );
        return entries.map(entry => ({
          rank: entry.rank,
          score: entry.score / 1000, // int値を秒に戻す
          playerName: entry.playerName
        }));
      } catch (error) {
        console.error('リーダーボード取得エラー:', error);
        return [];
      }
    }
  
    // ゲーム統計更新
    updateStats(difficulty, time, isCleared) {
      if (!this.isInitialized || !this.steamworks) return;
      
      try {
        // プレイ回数
        this.steamworks.stats.setInt('games_played', 
          this.steamworks.stats.getInt('games_played') + 1
        );
        
        // クリア回数
        if (isCleared) {
          this.steamworks.stats.setInt('games_cleared',
            this.steamworks.stats.getInt('games_cleared') + 1
          );
          
          // 難易度別クリア回数
          const difficultyKey = `${difficulty}_cleared`;
          this.steamworks.stats.setInt(difficultyKey,
            this.steamworks.stats.getInt(difficultyKey) + 1
          );
          
          // 最速記録更新チェック
          const bestTimeKey = `best_time_${difficulty}`;
          const currentBest = this.steamworks.stats.getFloat(bestTimeKey);
          if (currentBest === 0 || time < currentBest) {
            this.steamworks.stats.setFloat(bestTimeKey, time);
          }
        }
        
        // 統計をSteamに送信
        this.steamworks.stats.store();
        
        // 実績チェック
        this.checkAchievements(difficulty, time, isCleared);
        
      } catch (error) {
        console.error('統計更新エラー:', error);
      }
    }
  
    // 実績チェック
    checkAchievements(difficulty, time, isCleared) {
      if (!isCleared) return;
      
      // 初回クリア
      if (this.steamworks.stats.getInt('games_cleared') === 1) {
        this.unlockAchievement('FIRST_CLEAR');
      }
      
      // スピード実績
      if (time < 30) {
        this.unlockAchievement('SPEED_DEMON');
      }
      
      // タイムアタック実績
      if (time < 60) {
        this.unlockAchievement('TIME_ATTACK');
      }
      
      // 難易度別実績
      if (difficulty === 'hard' && this.steamworks.stats.getInt('hard_cleared') >= 1) {
        this.unlockAchievement('HARD_MODE');
      }
      
      // パーフェクト実績（連続クリア）
      const totalCleared = this.steamworks.stats.getInt('games_cleared');
      if (totalCleared >= 10) {
        this.unlockAchievement('PERFECT_RUN');
      }
    }
  
    // Steam オーバーレイ表示
    showLeaderboards() {
      if (!this.isInitialized || !this.steamworks) return;
      
      try {
        this.steamworks.overlay.activateToWebPage('steam://url/GameHub/' + /* your_app_id */);
      } catch (error) {
        console.error('オーバーレイ表示エラー:', error);
      }
    }
  
    // Steam フレンドとスコア共有
    shareScore(difficulty, time) {
      if (!this.isInitialized || !this.steamworks) return;
      
      try {
        const message = `しりとりレースで${difficulty}モードを${time.toFixed(1)}秒でクリア！`;
        // Steam Activity Feed に投稿
        this.steamworks.overlay.activateToWebPage(
          `steam://friends/status/${encodeURIComponent(message)}`
        );
      } catch (error) {
        console.error('スコア共有エラー:', error);
      }
    }
  }
  
  // 使用例
  const steamIntegration = new SteamIntegration();
  
  // ゲーム開始時に初期化
  steamIntegration.initialize();
  
  // ゲーム終了時に使用
  function onGameComplete(difficulty, time, isCleared) {
    // Steam統計更新
    steamIntegration.updateStats(difficulty, time, isCleared);
    
    // リーダーボードにスコア送信
    if (isCleared) {
      const leaderboardId = `${difficulty.toUpperCase()}_TIME`;
      steamIntegration.submitScore(leaderboardId, time, difficulty);
    }
  }
  
  // モジュールとしてエクスポート
  if (typeof module !== 'undefined') {
    module.exports = SteamIntegration;
  }