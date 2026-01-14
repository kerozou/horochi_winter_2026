/**
 * トロフィーシーン
 */
export class TrophyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TrophyScene' });
    }
    
    init() {
        console.log('TrophyScene: init() called');
    }
    
    preload() {
        // BGMを読み込む（既にロード済みの場合はスキップ）
        if (!this.cache.audio.exists('bgm')) {
            this.load.audio('bgm', 'resources/BGM.mp3');
        }
        
        // ボタンクリック時の効果音を読み込む
        if (!this.cache.audio.exists('deci')) {
            this.load.audio('deci', 'resources/deci.mp3');
        }
    }
    
    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 背景グラデーション
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x667eea, 0x667eea, 0x764ba2, 0x764ba2, 1);
        graphics.fillRect(0, 0, screenWidth, screenHeight);
        
        // チェッカーフラッグ背景パターン
        this.createCheckerboardBackground();
        
        // タイトル
        const title = this.add.text(centerX, 80, 'トロフィー', {
            fontSize: '64px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(100);
        
        // トロフィーデータを取得
        const trophies = this.getTrophyList();
        const unlockedTrophies = this.loadUnlockedTrophies();
        
        // トロフィーグリッドを表示（ロケットエディタのパーツ選択と同じスタイル）
        const gridStartX = 100;
        const gridStartY = 150;
        const cellSize = 80; // セルサイズ
        const gridCols = 5; // 5列
        const gridRows = 2; // 2行
        
        // グリッドタイトル
        this.add.text(gridStartX + (gridCols * cellSize) / 2, gridStartY - 30, 'トロフィー選択', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // ホバー時の説明テキスト用の変数
        this.hoverTooltip = null;
        this.selectedTrophy = null;
        
        // 各トロフィーをグリッドに配置
        trophies.forEach((trophy, index) => {
            const col = index % gridCols;
            const row = Math.floor(index / gridCols);
            const x = gridStartX + col * cellSize;
            const y = gridStartY + row * cellSize;
            
            this.createTrophyGridItem(x, y, trophy, cellSize, unlockedTrophies.includes(trophy.id));
        });
        
        // トロフィー詳細パネルを作成（ロケットエディタのパーツ詳細パネルと同じスタイル）
        this.createTrophyDetailPanel();
        
        // 戻るボタン
        const backButton = this.createButton(centerX, screenHeight - 80, '戻る', () => {
            this.playButtonSound();
            this.scene.start('TitleScene');
        });
        backButton.setScrollFactor(0);
        backButton.setDepth(200);
        
        // BGMを再生
        this.playBGM();
    }
    
    /**
     * チェッカーフラッグ背景を作成
     */
    createCheckerboardBackground() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const tileSize = 50;
        
        const graphics = this.add.graphics();
        
        for (let y = 0; y < screenHeight; y += tileSize) {
            for (let x = 0; x < screenWidth; x += tileSize) {
                const isWhite = ((x / tileSize) + (y / tileSize)) % 2 === 0;
                graphics.fillStyle(isWhite ? 0xffffff : 0x000000, 0.1);
                graphics.fillRect(x, y, tileSize, tileSize);
            }
        }
    }
    
    /**
     * トロフィーリストを取得（10個の実績）
     * GameSceneのgenerateTrophiesForCheck()と対応するIDを使用
     */
    getTrophyList() {
        return [
            {
                id: 'trophy_1',
                name: '初プレイ',
                description: '1回プレイする',
                condition: 'playCount',
                threshold: 1,
                reward: '報酬無し'
            },
            {
                id: 'trophy_2',
                name: '20000m達成',
                description: '飛距離20000mを達成',
                condition: 'distance',
                threshold: 20000,
                reward: 'ランクマッチモード解放'
            },
            {
                id: 'trophy_3',
                name: '30000m達成',
                description: '飛距離30000mを達成',
                condition: 'distance',
                threshold: 30000,
                reward: 'お気に入りダウンロードを開放'
            },
            {
                id: 'trophy_4',
                name: '50000m達成',
                description: '飛距離50000mを達成',
                condition: 'distance',
                threshold: 50000,
                reward: '重力制御の解放'
            },
            {
                id: 'trophy_5',
                name: '10回プレイする',
                description: '10回プレイする',
                condition: 'playCount',
                threshold: 10,
                reward: '赤パーツ開放'
            },
            {
                id: 'trophy_6',
                name: '100回プレイする',
                description: '100回プレイする',
                condition: 'playCount',
                threshold: 100,
                reward: 'ほろっちの嘔吐動画1解放'
            },
            {
                id: 'trophy_7',
                name: 'ランクマッチでメダルを獲得する',
                description: 'ランクマッチでメダルを獲得する',
                condition: 'rankMatchMedal',
                threshold: 3, // 3位以内
                reward: 'ほろっちの嘔吐動画2解放'
            },
            {
                id: 'trophy_8',
                name: '100000m達成',
                description: '飛距離100000mを達成',
                condition: 'distance',
                threshold: 100000,
                reward: 'ほろっちの嘔吐動画3解放'
            },
            {
                id: 'trophy_9',
                name: '-20000m達成',
                description: '飛距離-20000mを達成',
                condition: 'negativeDistance',
                threshold: -20000,
                reward: 'ほろっちの嘔吐動画4解放'
            },
            {
                id: 'trophy_10',
                name: 'ランクマッチで金メダルを獲得する',
                description: 'ランクマッチで金メダルを獲得する',
                condition: 'rankMatchGoldMedal',
                threshold: 1, // 1位
                reward: 'ほろっちの嘔吐動画5解放'
            }
        ];
    }
    
    /**
     * 達成済みトロフィーをロード
     */
    loadUnlockedTrophies() {
        const saved = localStorage.getItem('unlockedTrophies');
        return saved ? JSON.parse(saved) : [];
    }
    
    /**
     * グリッド形式のトロフィーアイテムを作成（ロケットエディタのパーツ選択と同じスタイル）
     */
    createTrophyGridItem(x, y, trophy, cellSize, isUnlocked) {
        // チェッカーフラッグ風の背景色（交互に色を変える）
        const col = Math.floor((x - 100) / cellSize);
        const row = Math.floor((y - 150) / cellSize);
        const isEven = (col + row) % 2 === 0;
        const bgColor = isEven ? 0x34495e : 0x2c3e50;
        
        // セル背景
        const cell = this.add.rectangle(x + cellSize / 2, y + cellSize / 2, cellSize, cellSize, bgColor);
        cell.setStrokeStyle(2, isUnlocked ? 0x00ff00 : 0x7f8c8d);
        cell.setInteractive({ useHandCursor: true });
        cell.setScrollFactor(0);
        cell.setDepth(50);
        
        // 未取得のトロフィーは黒塗りにする
        if (!isUnlocked) {
            const blackOverlay = this.add.rectangle(x + cellSize / 2, y + cellSize / 2, cellSize, cellSize, 0x000000);
            blackOverlay.setAlpha(0.7); // 黒塗り（70%の不透明度）
            blackOverlay.setScrollFactor(0);
            blackOverlay.setDepth(51);
            cell._blackOverlay = blackOverlay;
        }
        
        // トロフィーアイコン
        const iconSize = Math.min(cellSize * 0.4, 32);
        const trophyIcon = this.add.text(x + cellSize / 2, y + cellSize / 2 - 10, isUnlocked ? '🏆' : '🔒', {
            fontSize: iconSize + 'px'
        });
        trophyIcon.setOrigin(0.5);
        trophyIcon.setScrollFactor(0);
        trophyIcon.setDepth(52);
        if (!isUnlocked) {
            trophyIcon.setAlpha(0.3); // 未取得は薄く
        }
        
        // トロフィー名
        const nameFontSize = Math.min(cellSize * 0.12, 12);
        const trophyName = this.add.text(x + cellSize / 2, y + cellSize / 2 + 20, trophy.name, {
            fontSize: nameFontSize + 'px',
            fill: isUnlocked ? '#ffffff' : '#666666',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: cellSize - 10 }
        });
        trophyName.setOrigin(0.5);
        trophyName.setScrollFactor(0);
        trophyName.setDepth(52);
        
        // ホバー効果
        cell.on('pointerover', () => {
            cell.setFillStyle(0x3498db);
            cell.setStrokeStyle(3, 0x5dade2);
            this.updateTrophyDetailPanel(trophy, isUnlocked);
        });
        
        cell.on('pointerout', () => {
            cell.setFillStyle(bgColor);
            cell.setStrokeStyle(2, isUnlocked ? 0x00ff00 : 0x7f8c8d);
        });
        
        // クリックで詳細表示
        cell.on('pointerdown', () => {
            this.playButtonSound();
            this.showTrophyDetail(trophy, isUnlocked);
        });
        
        // トロフィー情報を保存
        cell.trophy = trophy;
        cell._iconText = trophyIcon;
        cell._nameText = trophyName;
    }
    
    /**
     * トロフィー詳細パネルを作成（ロケットエディタのパーツ詳細パネルと同じスタイル）
     */
    createTrophyDetailPanel() {
        const panelX = 100;
        const panelY = 350; // トロフィーグリッドの下に配置
        const panelWidth = 400;
        const panelHeight = 200;
        
        // 背景
        const bg = this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, 0x1a1a1a);
        bg.setStrokeStyle(2, 0x3498db);
        bg.setAlpha(0.9);
        bg.setScrollFactor(0);
        bg.setDepth(100);
        
        // トロフィー名
        const nameText = this.add.text(panelX + 10, panelY + 10, 'トロフィーを選択してください', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        nameText.setScrollFactor(0);
        nameText.setDepth(101);
        
        // 説明
        const descText = this.add.text(panelX + 10, panelY + 40, '', {
            fontSize: '16px',
            fill: '#bdc3c7',
            wordWrap: { width: panelWidth - 20 }
        });
        descText.setScrollFactor(0);
        descText.setDepth(101);
        
        // 報酬
        const rewardText = this.add.text(panelX + 10, panelY + 100, '', {
            fontSize: '16px',
            fill: '#3498db',
            fontStyle: 'bold'
        });
        rewardText.setScrollFactor(0);
        rewardText.setDepth(101);
        
        // 状態
        const statusText = this.add.text(panelX + 10, panelY + 130, '', {
            fontSize: '18px',
            fill: '#00ff00',
            fontStyle: 'bold'
        });
        statusText.setScrollFactor(0);
        statusText.setDepth(101);
        
        // アイコン表示
        const iconText = this.add.text(panelX + 300, panelY + 50, '', {
            fontSize: '60px',
            fill: '#3498db',
            align: 'center'
        });
        iconText.setOrigin(0.5);
        iconText.setScrollFactor(0);
        iconText.setDepth(101);
        
        // パネル要素を保存
        this.detailPanel = {
            bg: bg,
            nameText: nameText,
            descText: descText,
            rewardText: rewardText,
            statusText: statusText,
            iconText: iconText
        };
    }
    
    /**
     * トロフィー詳細パネルを更新
     */
    updateTrophyDetailPanel(trophy, isUnlocked) {
        if (!this.detailPanel) {
            return;
        }
        
        // パネルを表示
        this.detailPanel.bg.setVisible(true);
        this.detailPanel.nameText.setVisible(true);
        this.detailPanel.descText.setVisible(true);
        this.detailPanel.rewardText.setVisible(true);
        this.detailPanel.statusText.setVisible(true);
        this.detailPanel.iconText.setVisible(true);
        
        // 情報を更新
        this.detailPanel.nameText.setText(trophy.name);
        this.detailPanel.descText.setText(trophy.description);
        this.detailPanel.rewardText.setText(`報酬: ${trophy.reward}`);
        this.detailPanel.statusText.setText(isUnlocked ? '✅ 達成済み' : '❌ 未達成');
        this.detailPanel.statusText.setFill(isUnlocked ? '#00ff00' : '#ff0000');
        this.detailPanel.iconText.setText(isUnlocked ? '🏆' : '🔒');
        this.detailPanel.iconText.setAlpha(isUnlocked ? 1.0 : 0.5);
    }
    
    /**
     * トロフィーのツールチップを表示（ホバー時）
     */
    showTrophyTooltip(trophy, x, y, cellSize) {
        // 既存のツールチップを削除
        this.hideTrophyTooltip();
        
        const tooltipPadding = 10;
        const tooltipWidth = 250;
        const tooltipY = y - cellSize / 2 - 50; // セルの上に表示
        
        // ツールチップ背景
        const tooltipBg = this.add.rectangle(x, tooltipY, tooltipWidth, 80, 0x2c3e50);
        tooltipBg.setAlpha(0.95);
        tooltipBg.setStrokeStyle(2, 0xffffff);
        tooltipBg.setScrollFactor(0);
        tooltipBg.setDepth(300);
        
        // トロフィー名
        const tooltipName = this.add.text(x, tooltipY - 20, trophy.name, {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        tooltipName.setOrigin(0.5);
        tooltipName.setScrollFactor(0);
        tooltipName.setDepth(301);
        
        // 説明文
        const tooltipDesc = this.add.text(x, tooltipY + 10, trophy.description, {
            fontSize: '14px',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: tooltipWidth - tooltipPadding * 2 }
        });
        tooltipDesc.setOrigin(0.5);
        tooltipDesc.setScrollFactor(0);
        tooltipDesc.setDepth(301);
        
        // ツールチップコンテナ
        this.hoverTooltip = this.add.container(0, 0);
        this.hoverTooltip.add([tooltipBg, tooltipName, tooltipDesc]);
        this.hoverTooltip.setScrollFactor(0);
        this.hoverTooltip.setDepth(300);
    }
    
    /**
     * トロフィーのツールチップを非表示
     */
    hideTrophyTooltip() {
        if (this.hoverTooltip) {
            this.hoverTooltip.destroy();
            this.hoverTooltip = null;
        }
    }
    
    /**
     * トロフィー詳細を表示
     */
    showTrophyDetail(trophy, isUnlocked) {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 既に表示されている場合は削除
        if (this.trophyDetailOverlay) {
            this.trophyDetailOverlay.destroy();
            this.trophyDetailOverlay = null;
        }
        
        // オーバーレイ背景
        const overlayBg = this.add.rectangle(centerX, centerY, screenWidth, screenHeight, 0x000000, 0.7);
        overlayBg.setInteractive();
        overlayBg.setScrollFactor(0);
        overlayBg.setDepth(200);
        
        // 詳細パネル
        const panelWidth = 500;
        const panelHeight = 400;
        const detailPanel = this.add.container(centerX, centerY);
        detailPanel.setScrollFactor(0);
        detailPanel.setDepth(201);
        
        // パネル背景
        const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x2c3e50);
        panelBg.setStrokeStyle(3, isUnlocked ? 0x00ff00 : 0xffffff);
        
        // トロフィーアイコン
        const icon = this.add.text(0, -120, isUnlocked ? '🏆' : '🔒', {
            fontSize: '80px'
        });
        icon.setOrigin(0.5);
        
        // トロフィー名
        const nameText = this.add.text(0, -20, trophy.name, {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        nameText.setOrigin(0.5);
        
        // 説明文
        const descText = this.add.text(0, 40, trophy.description, {
            fontSize: '20px',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: panelWidth - 40 }
        });
        descText.setOrigin(0.5);
        
        // 報酬
        const rewardText = this.add.text(0, 100, `報酬: ${trophy.reward}`, {
            fontSize: '18px',
            fill: isUnlocked ? '#00ff00' : '#999999',
            fontStyle: 'bold'
        });
        rewardText.setOrigin(0.5);
        
        // 状態
        const statusText = this.add.text(0, 130, isUnlocked ? '✅ 達成済み' : '❌ 未達成', {
            fontSize: '24px',
            fill: isUnlocked ? '#00ff00' : '#ff0000',
            fontStyle: 'bold'
        });
        statusText.setOrigin(0.5);
        
        // 閉じるボタン
        const closeButton = this.add.container(0, 160);
        const closeBg = this.add.rectangle(0, 0, 200, 50, 0x7f8c8d);
        closeBg.setStrokeStyle(2, 0xffffff);
        const closeText = this.add.text(0, 0, '閉じる', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        closeText.setOrigin(0.5);
        closeButton.add([closeBg, closeText]);
        closeButton.setSize(200, 50);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerover', () => {
            closeBg.setFillStyle(0x6c7a7d);
        });
        closeButton.on('pointerout', () => {
            closeBg.setFillStyle(0x7f8c8d);
        });
        closeButton.on('pointerdown', () => {
            this.playButtonSound();
            if (this.trophyDetailOverlay) {
                this.trophyDetailOverlay.destroy();
                this.trophyDetailOverlay = null;
            }
        });
        
        // オーバーレイ背景のクリックでも閉じる
        overlayBg.on('pointerdown', () => {
            if (this.trophyDetailOverlay) {
                this.trophyDetailOverlay.destroy();
                this.trophyDetailOverlay = null;
            }
        });
        
        detailPanel.add([panelBg, icon, nameText, descText, rewardText, statusText, closeButton]);
        
        // 参照を保存
        this.trophyDetailOverlay = this.add.container(0, 0);
        this.trophyDetailOverlay.add([overlayBg, detailPanel]);
        this.trophyDetailOverlay.setScrollFactor(0);
        this.trophyDetailOverlay.setDepth(200);
    }
    
    /**
     * ボタンを作成
     */
    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        // ボタン背景
        const bg = this.add.rectangle(0, 0, 200, 60, 0x4ecdc4);
        bg.setStrokeStyle(3, 0xffffff);
        
        // ボタンテキスト
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        
        button.add([bg, buttonText]);
        button.setSize(200, 60);
        button.setInteractive({ useHandCursor: true });
        
        // ホバー効果
        button.on('pointerover', () => {
            bg.setFillStyle(0x3ab5dd);
        });
        button.on('pointerout', () => {
            bg.setFillStyle(0x4ecdc4);
        });
        
        // クリックイベント
        button.on('pointerdown', () => {
            this.playButtonSound();
            callback();
        });
        
        return button;
    }
    
    /**
     * ボタンクリック時の効果音を再生
     */
    playButtonSound() {
        if (this.cache.audio.exists('deci')) {
            this.sound.play('deci', {
                volume: 0.5
            });
        }
    }
    
    /**
     * BGMを再生
     */
    playBGM() {
        // 既に同じBGMが再生中かチェック
        const existingSound = this.sound.get('bgm');
        if (existingSound && existingSound.isPlaying) {
            this.bgm = existingSound;
            return;
        }
        
        // 既に存在するが停止している場合は再利用
        if (existingSound) {
            this.bgm = existingSound;
            this.bgm.setVolume(0.1);
            this.bgm.play();
            return;
        }
        
        // 新しいBGMを再生
        if (this.cache.audio.exists('bgm')) {
            this.bgm = this.sound.add('bgm', {
                volume: 0.1,
                loop: true
            });
            this.bgm.play();
        }
    }
    
    shutdown() {
        console.log('TrophyScene: shutdown() called');
        
        // トロフィー詳細オーバーレイをクリーンアップ
        if (this.trophyDetailOverlay) {
            this.trophyDetailOverlay.destroy();
            this.trophyDetailOverlay = null;
        }
        
        // ツールチップをクリーンアップ
        this.hideTrophyTooltip();
        
        // BGMは停止しない（TitleSceneと同じBGMを使用）
        this.bgm = null;
    }
}

