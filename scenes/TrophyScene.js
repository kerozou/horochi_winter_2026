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
        
        // shibou.jsonを読み込む
        if (!this.cache.json.exists('shibou')) {
            this.load.json('shibou', 'resources/shibou.json');
        }
        
        // 画像を読み込む
        if (!this.textures.exists('iei')) {
            this.load.image('iei', 'resources/iei.png');
        }
        if (!this.textures.exists('horonbia')) {
            this.load.image('horonbia', 'resources/horonbia.jpg');
        }
    }
    
    async create() {
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
        // ローディング表示
        const loadingText = this.add.text(centerX, centerY, 'サーバーに問い合わせ中...', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        loadingText.setOrigin(0.5);
        loadingText.setDepth(200);
        
        // APIからトロフィー情報を取得
        const unlockedTrophies = await this.loadUnlockedTrophies();
        
        // ローディング表示を削除
        loadingText.destroy();
        
        // トロフィーグリッドを表示（12×12の碁盤目状）
        const gridStartX = 50;
        const gridStartY = 120;
        const cellSize = Math.min((screenWidth - 100) / 12, (screenHeight - 250) / 12); // セルサイズ
        const gridCols = 12; // 12列
        const gridRows = 12; // 12行
        
        // グリッドタイトル（非表示）
        // this.add.text(gridStartX + (gridCols * cellSize) / 2, gridStartY - 30, 'トロフィー選択', {
        //     fontSize: '24px',
        //     fill: '#ffffff',
        //     fontStyle: 'bold'
        // }).setOrigin(0.5);
        
        // ホバー時の説明テキスト用の変数
        this.hoverTooltip = null;
        this.selectedTrophy = null;
        
        // 右上に画像表示領域を作成
        const imageX = screenWidth - 300;
        const imageY = 290;
        this.trophyImage = this.add.image(imageX, imageY, 'iei');
        this.trophyImage.setScrollFactor(0);
        this.trophyImage.setDepth(150);
        this.trophyImage.setOrigin(0.5);
        this.trophyImage.setScale(0.5);
        this.trophyImage.setVisible(false); // 初期状態では非表示
        
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
     * トロフィーリストを取得（144個：12×12）
     * 達成条件：飛距離、shibou.jsonのメッセージ回収、プレイ回数、ランク上位達成
     */
    getTrophyList() {
        const trophies = [];
        
        // 飛距離トロフィー（56個）
        // 1000m刻みで50000mまで（50個）
        for (let i = 1; i <= 50; i++) {
            const distance = i * 1000;
            trophies.push({
                id: `trophy_distance_${distance}`,
                name: `${distance}m達成`,
                description: `飛距離${distance}mを達成`,
                condition: 'distance',
                threshold: distance
            });
        }
        
        // 10000m刻みで100000mまで（6個：60000, 70000, 80000, 90000, 100000）
        for (let i = 6; i <= 10; i++) {
            const distance = i * 10000;
            trophies.push({
                id: `trophy_distance_${distance}`,
                name: `${distance}m達成`,
                description: `飛距離${distance}mを達成`,
                condition: 'distance',
                threshold: distance
            });
        }
        
        // shibou.jsonのメッセージ回収トロフィー（30個）
        for (let i = 1; i <= 30; i++) {
            trophies.push({
                id: `trophy_shibou_${i}`,
                name: `メッセージ${i}回収`,
                description: `着陸メッセージ${i}を回収`,
                condition: 'shibou',
                shibouNum: i
            });
        }
        
        // プレイ回数トロフィー（10個：10回刻みで100回まで）
        for (let i = 1; i <= 10; i++) {
            const count = i * 10;
            trophies.push({
                id: `trophy_playcount_${count}`,
                name: `${count}回プレイ`,
                description: `${count}回プレイする`,
                condition: 'playCount',
                threshold: count
            });
        }
        
        // ランク上位達成トロフィー（3個：1位、2位、3位各1回）
        trophies.push({
            id: 'trophy_rank_1_1',
            name: '1位達成',
            description: 'ランクマッチで1位を達成',
            condition: 'rankMatch',
            rank: 1,
            threshold: 1
        });
        trophies.push({
            id: 'trophy_rank_2_1',
            name: '2位達成',
            description: 'ランクマッチで2位を達成',
            condition: 'rankMatch',
            rank: 2,
            threshold: 1
        });
        trophies.push({
            id: 'trophy_rank_3_1',
            name: '3位達成',
            description: 'ランクマッチで3位を達成',
            condition: 'rankMatch',
            rank: 3,
            threshold: 1
        });
        
        // マイナス飛距離トロフィー（32個）
        // -1000m刻みで-30000mまで（30個）
        for (let i = 1; i <= 30; i++) {
            const distance = -i * 1000;
            trophies.push({
                id: `trophy_negative_distance_${Math.abs(distance)}`,
                name: `${distance}m達成`,
                description: `飛距離${distance}mを達成`,
                condition: 'negativeDistance',
                threshold: distance
            });
        }
        
        // -10000m刻みで-50000mまで（2個：-40000, -50000）
        for (let i = 4; i <= 5; i++) {
            const distance = -i * 10000;
            trophies.push({
                id: `trophy_negative_distance_${Math.abs(distance)}`,
                name: `${distance}m達成`,
                description: `飛距離${distance}mを達成`,
                condition: 'negativeDistance',
                threshold: distance
            });
        }
        
        return trophies;
    }
    
    /**
     * 達成済みトロフィーをロード（API呼び出し）
     */
    async loadUnlockedTrophies() {
        try {
            const { getApiClient } = await import('../utils/apiClient.js');
            const apiClient = getApiClient();
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                // トークンがない場合はローカルストレージから取得
                return this.loadUnlockedTrophiesLocal();
            }
            
            // APIからトロフィー情報を取得
            const response = await apiClient.getTrophies(authToken);
            const trophyData = response.data || {};
            
            // ローカルストレージにも保存（オフライン対応）
            if (trophyData.unlockedTrophies) {
                localStorage.setItem('unlockedTrophies', JSON.stringify(trophyData.unlockedTrophies));
            }
            if (trophyData.collectedShibou) {
                localStorage.setItem('collectedShibou', JSON.stringify(trophyData.collectedShibou));
            }
            if (trophyData.playCount !== undefined) {
                localStorage.setItem('playCount', trophyData.playCount.toString());
            }
            
            // 達成状況を再チェック（最新のゲームデータに基づいて）
            const unlockedList = await this.checkTrophyAchievements(trophyData);
            
            return unlockedList;
        } catch (error) {
            console.error('Error loading trophies from API:', error);
            // エラー時はローカルストレージから取得
            return this.loadUnlockedTrophiesLocal();
        }
    }
    
    /**
     * 達成済みトロフィーをロード（ローカルストレージ、フォールバック用）
     */
    loadUnlockedTrophiesLocal() {
        const saved = localStorage.getItem('unlockedTrophies');
        const unlockedList = saved ? JSON.parse(saved) : [];
        
        // 飛距離トロフィーの達成状況をチェック
        const personalBest = parseInt(localStorage.getItem('personalBest') || '0');
        const playCount = parseInt(localStorage.getItem('playCount') || '0');
        
        // ランクマッチの順位達成回数をカウント
        const rankCounts = { 1: 0, 2: 0, 3: 0 };
        // すべてのランクマッチランキングを確認
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('rankMatchRanking_')) {
                const ranking = JSON.parse(localStorage.getItem(key) || '[]');
                // 各日付のランキングで1位、2位、3位をカウント（各日付で1回ずつ）
                if (ranking.length > 0) rankCounts[1]++;
                if (ranking.length > 1) rankCounts[2]++;
                if (ranking.length > 2) rankCounts[3]++;
            }
        }
        
        const trophies = this.getTrophyList();
        trophies.forEach(trophy => {
            if (trophy.condition === 'distance' && personalBest >= trophy.threshold) {
                if (!unlockedList.includes(trophy.id)) {
                    unlockedList.push(trophy.id);
                }
            } else if (trophy.condition === 'shibou') {
                // shibou.jsonのメッセージ回収状況をチェック
                const collectedShibou = JSON.parse(localStorage.getItem('collectedShibou') || '[]');
                if (collectedShibou.includes(trophy.shibouNum)) {
                    if (!unlockedList.includes(trophy.id)) {
                        unlockedList.push(trophy.id);
                    }
                }
            } else if (trophy.condition === 'playCount' && playCount >= trophy.threshold) {
                if (!unlockedList.includes(trophy.id)) {
                    unlockedList.push(trophy.id);
                }
            } else if (trophy.condition === 'rankMatch' && rankCounts[trophy.rank] >= trophy.threshold) {
                if (!unlockedList.includes(trophy.id)) {
                    unlockedList.push(trophy.id);
                }
            } else if (trophy.condition === 'negativeDistance' && personalBest <= trophy.threshold) {
                // マイナス飛距離トロフィー（personalBestがthreshold以下）
                if (!unlockedList.includes(trophy.id)) {
                    unlockedList.push(trophy.id);
                }
            }
        });
        
        // 更新されたリストを保存
        localStorage.setItem('unlockedTrophies', JSON.stringify(unlockedList));
        
        return unlockedList;
    }
    
    /**
     * トロフィー達成状況をチェック（最新のゲームデータに基づいて）
     */
    async checkTrophyAchievements(trophyData) {
        const unlockedList = [...(trophyData.unlockedTrophies || [])];
        const personalBest = parseInt(localStorage.getItem('personalBest') || '0');
        const playCount = trophyData.playCount || parseInt(localStorage.getItem('playCount') || '0');
        const rankCounts = trophyData.rankCounts || { 1: 0, 2: 0, 3: 0 };
        const collectedShibou = trophyData.collectedShibou || JSON.parse(localStorage.getItem('collectedShibou') || '[]');
        
        const trophies = this.getTrophyList();
        trophies.forEach(trophy => {
            if (trophy.condition === 'distance' && personalBest >= trophy.threshold) {
                if (!unlockedList.includes(trophy.id)) {
                    unlockedList.push(trophy.id);
                }
            } else if (trophy.condition === 'shibou' && collectedShibou.includes(trophy.shibouNum)) {
                if (!unlockedList.includes(trophy.id)) {
                    unlockedList.push(trophy.id);
                }
            } else if (trophy.condition === 'playCount' && playCount >= trophy.threshold) {
                if (!unlockedList.includes(trophy.id)) {
                    unlockedList.push(trophy.id);
                }
            } else if (trophy.condition === 'rankMatch' && rankCounts[trophy.rank] >= trophy.threshold) {
                if (!unlockedList.includes(trophy.id)) {
                    unlockedList.push(trophy.id);
                }
            } else if (trophy.condition === 'negativeDistance' && personalBest <= trophy.threshold) {
                if (!unlockedList.includes(trophy.id)) {
                    unlockedList.push(trophy.id);
                }
            }
        });
        
        return unlockedList;
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
        
        // 未取得のトロフィーはグレーアウト
        if (!isUnlocked) {
            cell.setFillStyle(0x555555); // グレーアウト
            cell.setAlpha(0.5); // 透明度を下げる
        }
        
        // トロフィーアイコンは非表示
        // const iconSize = Math.min(cellSize * 0.4, 32);
        // const trophyIcon = this.add.text(x + cellSize / 2, y + cellSize / 2 - 10, isUnlocked ? '🏆' : '🔒', {
        //     fontSize: iconSize + 'px'
        // });
        // trophyIcon.setOrigin(0.5);
        // trophyIcon.setScrollFactor(0);
        // trophyIcon.setDepth(52);
        // if (!isUnlocked) {
        //     trophyIcon.setAlpha(0.3); // 未取得は薄く
        // }
        
        // トロフィー名（小さく表示）
        const nameFontSize = Math.min(cellSize * 0.15, 10);
        const trophyName = this.add.text(x + cellSize / 2, y + cellSize / 2, trophy.name, {
            fontSize: nameFontSize + 'px',
            fill: isUnlocked ? '#ffffff' : '#888888',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: cellSize - 4 }
        });
        trophyName.setOrigin(0.5);
        trophyName.setScrollFactor(0);
        trophyName.setDepth(52);
        
        // ホバー効果
        cell.on('pointerover', () => {
            cell.setFillStyle(0x3498db);
            cell.setStrokeStyle(3, 0x5dade2);
            this.updateTrophyDetailPanel(trophy, isUnlocked);
            // 右上の画像を更新
            this.updateTrophyImage(isUnlocked);
        });
        
        cell.on('pointerout', () => {
            cell.setFillStyle(bgColor);
            cell.setStrokeStyle(2, isUnlocked ? 0x00ff00 : 0x7f8c8d);
            // 画像を非表示
            if (this.trophyImage) {
                this.trophyImage.setVisible(false);
            }
        });
        
        // クリックで詳細表示
        cell.on('pointerdown', () => {
            this.playButtonSound();
            this.showTrophyDetail(trophy, isUnlocked);
        });
        
        // トロフィー情報を保存
        cell.trophy = trophy;
        // cell._iconText = trophyIcon;
        cell._nameText = trophyName;
    }
    
    /**
     * トロフィー詳細パネルを作成（ロケットエディタのパーツ詳細パネルと同じスタイル）
     */
    createTrophyDetailPanel() {
        const panelX = 700;
        const panelY = 460; // トロフィーグリッドの下に配置
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
     * 右上のトロフィー画像を更新
     */
    updateTrophyImage(isUnlocked) {
        if (!this.trophyImage) {
            return;
        }
        
        // 達成状況に応じて画像を変更
        if (isUnlocked) {
            // 達成済み：horonbia.jpg
            if (this.textures.exists('horonbia')) {
                this.trophyImage.setTexture('horonbia');
                this.trophyImage.setScale(0.35);
            }
        } else {
            // 未達成：iei.png
            if (this.textures.exists('iei')) {
                this.trophyImage.setTexture('iei');
                this.trophyImage.setScale(1);
            }
        }
        
        this.trophyImage.setVisible(true);
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
        
        // shibouトロフィーで達成済みの場合、descriptionの後ろにメッセージ内容を追加
        let displayDescription = trophy.description;
        if (trophy.condition === 'shibou' && isUnlocked && trophy.shibouNum) {
            const shibouData = this.cache.json.get('shibou');
            if (shibouData) {
                const shibouMessage = shibouData.find(item => item.num === trophy.shibouNum);
                if (shibouMessage && shibouMessage.text) {
                    displayDescription = `${trophy.description}\n${shibouMessage.text}`;
                }
            }
        }
        
        this.detailPanel.descText.setText(displayDescription);
        // 報酬は非表示
        // this.detailPanel.rewardText.setText(`報酬: ${trophy.reward}`);
        this.detailPanel.rewardText.setVisible(false);
        this.detailPanel.statusText.setText(isUnlocked ? '✅ 達成済み' : '❌ 未達成');
        this.detailPanel.statusText.setFill(isUnlocked ? '#00ff00' : '#ff0000');
        // アイコンは非表示
        // this.detailPanel.iconText.setText(isUnlocked ? '🏆' : '🔒'); 
        // this.detailPanel.iconText.setAlpha(isUnlocked ? 1.0 : 0.5);
        this.detailPanel.iconText.setVisible(false);
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
        // 達成済みかどうかを確認（ツールチップでは未達成でも表示するため、ここでは常にメッセージを追加しない）
        // ただし、達成済みの場合のみメッセージを追加する
        const unlockedTrophies = this.loadUnlockedTrophies();
        const isUnlocked = unlockedTrophies.includes(trophy.id);
        let tooltipDescription = trophy.description;
        if (trophy.condition === 'shibou' && isUnlocked && trophy.shibouNum) {
            const shibouData = this.cache.json.get('shibou');
            if (shibouData) {
                const shibouMessage = shibouData.find(item => item.num === trophy.shibouNum);
                if (shibouMessage && shibouMessage.text) {
                    tooltipDescription = `${trophy.description}\n${shibouMessage.text}`;
                }
            }
        }
        
        const tooltipDesc = this.add.text(x, tooltipY + 10, tooltipDescription, {
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
        
        // トロフィーアイコンは非表示
        // const icon = this.add.text(0, -120, isUnlocked ? '🏆' : '🔒', {
        //     fontSize: '80px'
        // });
        // icon.setOrigin(0.5);
        
        // トロフィー名
        const nameText = this.add.text(0, -60, trophy.name, {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        nameText.setOrigin(0.5);
        
        // 説明文
        // shibouトロフィーで達成済みの場合、descriptionの後ろにメッセージ内容を追加
        let displayDescription = trophy.description;
        if (trophy.condition === 'shibou' && isUnlocked && trophy.shibouNum) {
            const shibouData = this.cache.json.get('shibou');
            if (shibouData) {
                const shibouMessage = shibouData.find(item => item.num === trophy.shibouNum);
                if (shibouMessage && shibouMessage.text) {
                    displayDescription = `${trophy.description}\n${shibouMessage.text}`;
                }
            }
        }
        
        const descText = this.add.text(0, 0, displayDescription, {
            fontSize: '20px',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: panelWidth - 40 }
        });
        descText.setOrigin(0.5);
        
        // 報酬は非表示
        // const rewardText = this.add.text(0, 100, `報酬: ${trophy.reward}`, {
        //     fontSize: '18px',
        //     fill: isUnlocked ? '#00ff00' : '#999999',
        //     fontStyle: 'bold'
        // });
        // rewardText.setOrigin(0.5);
        
        // 状態
        const statusText = this.add.text(0, 60, isUnlocked ? '✅ 達成済み' : '❌ 未達成', {
            fontSize: '24px',
            fill: isUnlocked ? '#00ff00' : '#ff0000',
            fontStyle: 'bold'
        });
        statusText.setOrigin(0.5);
        
        // 閉じるボタン
        const closeButton = this.add.container(0, 120);
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
        
        detailPanel.add([panelBg, nameText, descText, statusText, closeButton]);
        
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

