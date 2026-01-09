import { TitleScene } from './scenes/TitleScene.js';
import { RocketEditorScene } from './scenes/RocketEditorScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameConfig } from './config/gameConfig.js';

/**
 * ゲームのエントリーポイント
 */
(function() {
    try {
        console.log('Initializing game...');
        
        // Phaserが読み込まれているか確認
        if (typeof Phaser === 'undefined') {
            throw new Error('Phaser is not loaded! Please check if the script is loaded correctly.');
        }
        console.log('Phaser version:', Phaser.VERSION);
        
        // ゲームコンテナが存在するか確認
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            throw new Error('Game container element not found!');
        }
        console.log('Game container found');
        
        // 設定が正しく読み込まれているか確認
        if (!GameConfig) {
            throw new Error('GameConfig is not loaded!');
        }
        if (!GameScene) {
            throw new Error('GameScene is not loaded!');
        }
        console.log('Modules loaded successfully');
        console.log('GameConfig:', GameConfig);
        
        const config = {
            type: Phaser.AUTO,
            width: GameConfig.width,
            height: GameConfig.height,
            parent: 'game-container',
            backgroundColor: GameConfig.backgroundColor,
            physics: GameConfig.physics,
            scene: [TitleScene, RocketEditorScene, GameScene] // シーンの配列
        };
        
        console.log('Game config:', config);
        
        // ゲームインスタンスを作成
        const game = new Phaser.Game(config);
        
        console.log('Game instance created successfully');
        
        // エラーハンドリング
        if (game.events) {
            game.events.on('error', (error) => {
                console.error('Phaser game error:', error);
            });
        }
        
        // グローバルにエラーハンドラーを設定
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            showError(event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            showError(event.reason);
        });
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        console.error('Error stack:', error.stack);
        showError(error);
    }
    
    function showError(error) {
        // エラーメッセージを画面に表示
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: red; color: white; padding: 20px; border-radius: 10px; z-index: 10000; max-width: 80%;';
        errorDiv.innerHTML = `
            <h2>ゲームの初期化に失敗しました</h2>
            <p><strong>エラー:</strong> ${error.message || error}</p>
            <p>ブラウザのコンソール（F12）で詳細を確認してください。</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 10px; background: white; color: red; border: none; border-radius: 5px; cursor: pointer;">再読み込み</button>
        `;
        document.body.appendChild(errorDiv);
    }
})();

// デバッグ用: トロフィーを解除するヘルパー関数
window.unlockTestTrophies = function() {
    const testTrophies = [
        'trophy_0',   // 5回プレイ → 超推進ユニット
        'trophy_11',  // 安定飛行500m → 軽量高速機
        'trophy_22',  // エンジン6個以下で400m → バランス調整機
        'trophy_33',  // ノーズなしで300m → 安定飛行ユニット
        'trophy_44',  // ソフトランディング200m → ツインターボ
    ];
    
    const existing = localStorage.getItem('unlockedTrophies');
    const unlocked = existing ? JSON.parse(existing) : [];
    
    testTrophies.forEach(id => {
        if (!unlocked.includes(id)) {
            unlocked.push(id);
        }
    });
    
    localStorage.setItem('unlockedTrophies', JSON.stringify(unlocked));
    console.log('✅ Test trophies unlocked:', testTrophies);
    console.log('Total unlocked:', unlocked.length);
    console.log('🔄 Reload the page and go to editor to see rare parts!');
};

// デバッグ用: トロフィーをリセット
window.resetTrophies = function() {
    localStorage.removeItem('unlockedTrophies');
    console.log('🔄 Trophies reset. Reload the page to apply.');
};
