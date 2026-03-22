import { RocketDesign } from '../entities/RocketDesign.js';
import { NosePart, BodyPart, WingPart, EnginePart, FuelTankPart, CockpitPart } from '../entities/RocketPart.js';
import { getUnlockedCompositeParts, COMPOSITE_PART_TEMPLATES } from '../entities/CompositeRocketPart.js';

/**
 * ロケットエディタシーン（レゴパズル式）
 */
export class RocketEditorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RocketEditorScene' });
        this.gridSize = 20; // グリッドサイズ
    }
    
    /**
     * シーン初期化（シーンに入るたびに呼ばれる）
     */
    init() {
        console.log('RocketEditorScene: init() called');
        
        try {
            // 配置されたパーツの配列を初期化
            this.placedParts = [];
            
            // ロケット設計データを初期化
            this.rocketDesign = new RocketDesign();
            
            console.log('RocketEditorScene: Ready to create new design');
        } catch (error) {
            console.error('Error in RocketEditorScene.init():', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }
    
    /**
     * 達成済みトロフィーをロード
     */
    async loadUnlockedTrophies() {
        const saved = localStorage.getItem('unlockedTrophies');
        return saved ? JSON.parse(saved) : [];
    }
    
    /**
     * パーツ配置時の効果音を再生
     */
    playPlacementSound() {
        if (this.cache.audio.exists('setti')) {
            this.sound.play('setti', {
                volume: 0.5 // 音量50%
            });
            console.log('Placement sound played');
        } else {
            console.warn('Placement sound not loaded yet');
        }
    }
    
    /**
     * パーツ削除時の効果音を再生
     */
    playCancelSound() {
        if (this.cache.audio.exists('cancel')) {
            this.sound.play('cancel', {
                volume: 0.5 // 音量50%
            });
            console.log('Cancel sound played');
        } else {
            console.warn('Cancel sound not loaded yet');
        }
    }
    
    /**
     * BGMを再生
     */
    playBGM() {
        // 既に同じBGMが再生中かチェック
        const existingSound = this.sound.get('bgm');
        if (existingSound && existingSound.isPlaying) {
            // 既に再生中ならそのまま続ける
            this.bgm = existingSound;
            console.log('BGM already playing, continuing...');
            return;
        }
        
        // 既に存在するが停止している場合は再利用
        if (existingSound) {
            this.bgm = existingSound;
            this.bgm.setVolume(0.1);
            this.bgm.play();
            console.log('BGM resumed');
            return;
        }
        
        // 新しいBGMを再生（音量10%）
        if (this.cache.audio.exists('bgm')) {
            this.bgm = this.sound.add('bgm', {
                volume: 0.1, // 音量10%
                loop: true // ループ再生
            });
            this.bgm.play();
            console.log('BGM started playing');
        } else {
            console.warn('BGM not loaded yet');
        }
    }
    
    /**
     * BGMを停止
     */
    stopBGM() {
        // GameSceneに遷移する場合のみ停止（同じBGMを使うシーン間では停止しない）
        // このメソッドは呼ばれない想定だが、念のため実装
        if (this.bgm && this.bgm.isPlaying) {
            this.bgm.stop();
            console.log('BGM stopped');
        }
    }
    
    /**
     * シーンが停止する時のクリーンアップ
     */
    shutdown() {
        console.log('RocketEditorScene: shutdown() called - cleaning up');
        
        // バックグラウンドビデオをクリーンアップ
        if (this.backgroundVideo) {
            if (this.backgroundVideo.parentNode) {
                this.backgroundVideo.pause();
                this.backgroundVideo.src = '';
                this.backgroundVideo.load();
                this.backgroundVideo.parentNode.removeChild(this.backgroundVideo);
            }
            this.backgroundVideo = null;
        }
        
        // 会話パネルの音声読み上げを中断（すべてのシーン遷移で確実に中断）
        this.stopDialogue();
        
        // 同じBGMを使うシーン（TitleScene）に遷移する場合は停止しない
        // GameSceneに遷移する場合は、GameScene側で停止される
        // ここでは参照のみクリア
        this.bgm = null;
        
        // すべての配置されたパーツを削除
        if (this.placedParts && this.placedParts.length > 0) {
            this.placedParts.forEach(p => {
                if (p.sprite && p.sprite.active) {
                    p.sprite.destroy();
                }
            });
            this.placedParts = [];
        }
        
        // 情報パネルをクリア
        this.infoText = null;
        
        console.log('RocketEditorScene: Cleanup complete');
    }
    
    preload() {
        // コックピット画像を読み込む（既にロード済みの場合はスキップ）
        if (!this.textures.exists('horochi')) {
            this.load.image('horochi', 'resources/horochi.png');
        }
        
        // BGMを読み込む
        if (!this.cache.audio.exists('bgm')) {
            this.load.audio('bgm', 'resources/BGM.mp3');
        }
        
        // パーツ配置時の効果音を読み込む
        if (!this.cache.audio.exists('setti')) {
            this.load.audio('setti', 'resources/setti.mp3');
        }
        
        // パーツ削除時の効果音を読み込む
        if (!this.cache.audio.exists('cancel')) {
            this.load.audio('cancel', 'resources/cancel.mp3');
        }
        
        // ボタンクリック時の効果音を読み込む
        if (!this.cache.audio.exists('deci')) {
            this.load.audio('deci', 'resources/deci.mp3');
        }
        
        // 発射画面遷移時の効果音を読み込む
        if (!this.cache.audio.exists('scratch2')) {
            this.load.audio('scratch2', 'resources/scratch2.mp3');
        }
        
        // パーツ数制限アラート時の効果音を読み込む
        if (!this.cache.audio.exists('ng')) {
            this.load.audio('ng', 'resources/ng.mp3');
        }
        
        // cv.jsonを読み込む
        if (!this.cache.json.exists('cv')) {
            this.load.json('cv', 'resources/cv.json');
        }
    }
    
    async create() {
        try {
            console.log('RocketEditorScene: create() called');
            
            // 達成済みトロフィーをロード
            const unlockedTrophies = await this.loadUnlockedTrophies();
            console.log('Unlocked trophies:', unlockedTrophies.length);
            
            // すべての通常パーツを取得（レアパーツ除外）
            // COMPOSITE_PART_TEMPLATESから直接取得して、すべての通常パーツを表示
            this.availableCompositeParts = COMPOSITE_PART_TEMPLATES.filter(cp => {
                // レアパーツかどうかを判定
                const hasRare = cp.parts.some(p => {
                    const partType = typeof p === 'object' ? p.type : p;
                    // weightは通常パーツとして使用可能にする
                    return ['superengine', 'ultralightengine', 'microengine', 'dualengine', 
                            'ultralightnose', 'reinforcedbody', 'megafueltank', 
                            'largewing', 'stabilizer'].includes(partType);
                });
                // レアパーツは除外
                return !hasRare;
            });
            
            // コックピットを取得（自動配置用）
            const allParts = getUnlockedCompositeParts(unlockedTrophies);
            this.cockpitPart = allParts[0]; // 最初はコックピット
            
            // 制限なし - すべての通常パーツを表示
            console.log('Available composite parts (excluding rare):', this.availableCompositeParts.length, 'parts');
            console.log('Part names:', this.availableCompositeParts.map(p => p.name));
            console.log('Cockpit part saved:', this.cockpitPart?.name);
            
            const centerX = this.cameras.main.width / 2;
            
            // 背景
            this.cameras.main.setBackgroundColor('#2c3e50');
            
            // // バックグラウンドビデオを一番下のレイヤーに表示（UIの裏側）
            // const screenWidth = this.cameras.main.width;
            // const screenHeight = this.cameras.main.height;
            // this.backgroundVideo = this.createVideoElement(
            //     'resources/space_bg-1.mp4',
            //     0,
            //     0,
            //     screenWidth,
            //     screenHeight,
            //     {
            //         autoplay: true,
            //         loop: true,
            //         muted: true,
            //         volume: 1.0,
            //         controls: false,
            //         playsInline: true,
            //         zIndex: -1 // UIの裏側に表示
            //     }
            // );
            
            // // タイトル
            // const title = this.add.text(
            //     centerX,
            //     20,
            //     '🛠️ ロケットエディタ（テトリミノ風）',
            //     {
            //         fontSize: '40px',
            //         fill: '#ffffff',
            //         fontStyle: 'bold'
            //     }
            // );
            // title.setOrigin(0.5);
            
            // 操作説明
            const instructions = this.add.text(
                centerX,
                35,
                'コックピットにパーツを追加してロケットを組み立てよう！ | ドラッグで移動 | 右クリックで削除（コックピットは削除不可）',
                {
                    fontSize: '14px',
                    fill: '#bdc3c7',
                    align: 'center'
                }
            );
            instructions.setOrigin(0.5);
            
            // 組み立てエリアを作成
            this.createBuildArea();
            
            // コックピットを最初から中央に配置
            this.placeInitialCockpit();
            
            // パーツパレットを作成
            this.createPartsPalette();
            
            // 情報パネル
            this.createInfoPanel();
            
            // ボタン
            this.createButtons();
            
            // ドラッグ中のパーツ
            this.draggingPart = null;
            
            // BGMを再生
            this.playBGM();
            
            // フェードイン効果
            this.cameras.main.fadeIn(500, 0, 0, 0);
            
            
            console.log('RocketEditorScene: create() completed successfully');
        } catch (error) {
            console.error('Error in RocketEditorScene.create():', error);
            console.error('Error stack:', error.stack);
            
            // エラーが発生してもフェードインして画面を表示
            this.cameras.main.fadeIn(500, 0, 0, 0);
            
            // エラーメッセージを画面に表示
            const errorText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                'エラーが発生しました\nコンソールを確認してください',
                {
                    fontSize: '32px',
                    fill: '#ff0000',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: { x: 20, y: 20 },
                    align: 'center'
                }
            );
            errorText.setOrigin(0.5);
            
            throw error;
        }
    }
    
    /**
     * 組み立てエリアを作成
     */
    createBuildArea() {
        this.updateBuildArea();
    }
    
    /**
     * 組み立てエリアを更新（モードに応じて）
     */
    updateBuildArea() {
        // 既存の組み立てエリアを削除
        if (this.buildAreaGraphics) {
            this.buildAreaGraphics.destroy();
        }
        if (this.buildAreaBg) {
            this.buildAreaBg.destroy();
        }
        if (this.buildAreaCenterLine) {
            this.buildAreaCenterLine.destroy();
        }
        
        const areaX = 150;
        const areaY = 100;
        const areaWidth = 500;
        const areaHeight = 600;
        const gridCellSize = this.gridSize;
        
        // 背景
        this.buildAreaBg = this.add.rectangle(
            areaX + areaWidth / 2,
            areaY + areaHeight / 2,
            areaWidth,
            areaHeight,
            0x34495e
        );
        this.buildAreaBg.setStrokeStyle(3, 0xffffff);
        
        // グリッド線を描画
        this.buildAreaGraphics = this.add.graphics();
        this.buildAreaGraphics.lineStyle(1, 0x7f8c8d, 0.3);
        
        for (let x = areaX; x <= areaX + areaWidth; x += gridCellSize) {
            this.buildAreaGraphics.lineBetween(x, areaY, x, areaY + areaHeight);
        }
        for (let y = areaY; y <= areaY + areaHeight; y += gridCellSize) {
            this.buildAreaGraphics.lineBetween(areaX, y, areaX + areaWidth, y);
        }
        this.buildAreaGraphics.strokePath();
        
        // 組み立てエリアの境界を保存
        this.buildArea = {
            x: areaX,
            y: areaY,
            width: areaWidth,
            height: areaHeight,
            gridCellSize: gridCellSize,
            gridCols: Math.floor(areaWidth / gridCellSize),
            gridRows: Math.floor(areaHeight / gridCellSize)
        };
        
        // 中心線を描画（上向き基準を示す）
        this.buildAreaCenterLine = this.add.graphics();
        this.buildAreaCenterLine.lineStyle(2, 0xe74c3c, 0.5);
        const centerX = areaX + areaWidth / 2;
        this.buildAreaCenterLine.lineBetween(centerX, areaY, centerX, areaY + areaHeight);
        this.buildAreaCenterLine.strokePath();
        
        // 矢印（上向き = 発射方向）
        this.buildAreaCenterLine.fillStyle(0xe74c3c, 0.7);
        this.buildAreaCenterLine.fillTriangle(
            centerX, areaY + 30,
            centerX - 10, areaY + 50,
            centerX + 10, areaY + 50
        );
        
        // ラベル
        const labelText = '組み立てエリア（↑が発射方向）';
        this.add.text(areaX + areaWidth / 2, areaY - 25, labelText, {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }
    
    /**
     * 最初からコックピットを中央に配置
     */
    placeInitialCockpit() {
        console.log('placeInitialCockpit() called');
        console.log('this.cockpitPart:', this.cockpitPart);
        console.log('this.buildArea:', this.buildArea);
        
        if (!this.cockpitPart) {
            console.error('Cockpit part not found!');
            return;
        }
        
        if (!this.buildArea) {
            console.error('Build area not initialized!');
            return;
        }
        
        try {
            // 組み立てエリアの中心位置
            const centerX = this.buildArea.x + this.buildArea.width / 2;
            const centerY = this.buildArea.y + this.buildArea.height / 2;
            
            console.log('Placing cockpit at:', centerX, centerY);
            
            // コックピット複合パーツを実体化
            const compositeData = this.cockpitPart.instantiate(centerX, centerY);
            const { groupId, parts, compositeName } = compositeData;
            
            console.log('Cockpit instantiated:', compositeName, 'with', parts.length, 'parts');
            
            // グループ全体を1つのコンテナとして作成
            const groupContainer = this.createCompositePartSprite(parts, groupId, compositeName);
            
            // コックピットには特別なマーク（削除不可）
            groupContainer.setData('isDeletable', false);
            
            // グループ情報を保存
            this.placedParts.push({
                isComposite: true,
                groupId: groupId,
                parts: parts,
                sprite: groupContainer,
                compositeName: compositeName
            });
            
            // 各パーツを設計データに追加
            parts.forEach(part => {
                this.rocketDesign.addPart(part);
            });
            
            // 情報を更新
            this.updateInfoPanel();
            
            console.log('Initial cockpit placed successfully at center:', centerX, centerY);
        } catch (error) {
            console.error('Error placing initial cockpit:', error);
            console.error('Error stack:', error.stack);
        }
    }
    
    /**
     * パーツパレットを作成（碁盤の目状のチェッカーフラッグ形式）
     */
    createPartsPalette() {
        const startX = 700;
        const startY = 100;
        const cellSize = 50; // セルサイズを少し小さく
        const gridCols = 6; // 6列のグリッド
        
        // パレットタイトル
        this.partsPaletteTitle = this.add.text(startX + gridCols * cellSize / 2, startY - 20, 'パーツ選択', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        this.partsPaletteTitle.setOrigin(0.5);
        
        // パーツパレットコンテナ（表示/非表示を切り替えるため）
        this.partsPaletteContainer = this.add.container(0, 0);
        this.partsPaletteContainer.setScrollFactor(0);
        this.partsPaletteContainer.setDepth(50);
        
        // 初期表示（通常パーツ）
        this.updatePartsPalette();
        
        // パーツ詳細パネルを作成（ホバー時に表示）
        this.createPartDetailPanel();
    }
    
    /**
     * パーツパレットを更新（表示モードに応じて）
     */
    updatePartsPalette() {
        // 既存のパレットアイテムを削除
        if (this.partsPaletteContainer) {
            this.partsPaletteContainer.removeAll(true);
        }
        
        const startX = 700;
        const startY = 100;
        const cellSize = 50;
        const gridCols = 6;
        
        // タイトルを更新
        if (this.partsPaletteTitle) {
            this.partsPaletteTitle.setText('パーツ選択');
        }
        
        // 通常パーツを表示
        this.availableCompositeParts.forEach((compositePart, index) => {
            const col = index % gridCols;
            const row = Math.floor(index / gridCols);
            const x = startX + col * cellSize;
            const y = startY + row * cellSize;
            
            const item = this.createGridPaletteItem(x, y, compositePart, cellSize);
            this.partsPaletteContainer.add(item);
        });
    }
    
    /**
     * グリッド形式のパレットアイテムを作成
     */
    createGridPaletteItem(x, y, compositePart, cellSize) {
        // チェッカーフラッグ風の背景色（交互に色を変える）
        const col = Math.floor((x - 700) / cellSize);
        const row = Math.floor((y - 100) / cellSize);
        const isEven = (col + row) % 2 === 0;
        const bgColor = isEven ? 0x34495e : 0x2c3e50;
        
        // コンテナを作成
        const container = this.add.container(x + cellSize / 2, y + cellSize / 2);
        
        // セル背景
        const cell = this.add.rectangle(0, 0, cellSize, cellSize, bgColor);
        cell.setStrokeStyle(2, 0x3498db);
        cell.setInteractive({ useHandCursor: true });
        
        // アイコン
        const iconText = this.add.text(0, 0, compositePart.icon, {
            fontSize: '20px',
            fill: '#3498db',
            align: 'center',
            lineSpacing: -5
        });
        iconText.setOrigin(0.5);
        
        // ホバー効果
        cell.on('pointerover', () => {
            cell.setFillStyle(0x3498db);
            cell.setStrokeStyle(3, 0x5dade2);
            this.updatePartDetailPanel(compositePart);
        });
        
        cell.on('pointerout', () => {
            cell.setFillStyle(bgColor);
            cell.setStrokeStyle(2, 0x3498db);
        });
        
        // クリックで選択
        cell.on('pointerdown', () => {
            this.addCompositePartToBuildArea(compositePart);
        });
        
        // パーツ情報を保存
        cell.compositePart = compositePart;
        cell._iconText = iconText; // アイコンテキストへの参照を保存
        
        container.add([cell, iconText]);
        return container;
    }
    
    /**
     * 赤パーツのパレットアイテムを作成（廃止予定）
     */
    createRedPartPaletteItem(x, y, redPart, name, description, cellSize) {
        // コンテナを作成
        const container = this.add.container(x + cellSize / 2, y + cellSize / 2);
        
        // 赤色の背景
        const cell = this.add.rectangle(0, 0, cellSize, cellSize, 0x8b0000);
        cell.setStrokeStyle(3, 0xe74c3c); // 赤い枠線
        cell.setInteractive({ useHandCursor: true });
        
        // アイコン（赤色の記号）
        const iconText = this.add.text(0, 0, '🔴', {
            fontSize: '24px',
            fill: '#e74c3c',
            align: 'center'
        });
        iconText.setOrigin(0.5);
        
        // ホバー効果
        cell.on('pointerover', () => {
            cell.setFillStyle(0xa00000);
            cell.setStrokeStyle(4, 0xff0000);
            this.updateRedPartDetailPanel(redPart, name, description);
        });
        
        cell.on('pointerout', () => {
            cell.setFillStyle(0x8b0000);
            cell.setStrokeStyle(3, 0xe74c3c);
        });
        
        // クリックで選択
        cell.on('pointerdown', () => {
            this.addRedPartToBuildArea(redPart, name);
        });
        
        // パーツ情報を保存
        cell.redPart = redPart;
        cell.redPartName = name;
        cell._iconText = iconText;
        
        container.add([cell, iconText]);
        return container;
    }
    
    /**
     * 赤パーツ詳細パネルを更新
     */
    updateRedPartDetailPanel(redPart, name, description) {
        if (!this.detailPanel) return;
        
        const panelX = 700;
        const panelY = 250;
        const panelWidth = 300;
        
        // パネルを表示
        this.detailPanel.bg.setVisible(true);
        
        // パーツ情報を更新
        this.detailPanel.nameText.setText(name);
        this.detailPanel.descText.setText(description);
        this.detailPanel.iconText.setText('🔴');
        
        // パーツの詳細情報を表示
        let infoText = '';
        if (redPart.type === 'redengine') {
            infoText = `質量: ${redPart.mass} | 推力: ${redPart.thrust} | 1個のみ使用可能`;
        } else if (redPart.type === 'redbody') {
            infoText = `質量: ${redPart.mass} | 1個のみ使用可能`;
        } else if (redPart.type === 'rednose') {
            infoText = `質量: ${redPart.mass} | 推力: ${redPart.thrust} | 1個のみ使用可能`;
        }
        
        if (!this.detailPanel.infoText) {
            this.detailPanel.infoText = this.add.text(panelX + 10, panelY + 120, '', {
                fontSize: '12px',
                fill: '#95a5a6',
                wordWrap: { width: panelWidth - 20 }
            });
        }
        this.detailPanel.infoText.setText(infoText);
    }
    
    /**
     * 赤パーツを組み立てエリアに追加
     */
    addRedPartToBuildArea(redPart, partName) {
        // 1個ずつしか使用できない制限チェック
        const existingRedPartCount = this.rocketDesign.parts.filter(p => p.type === redPart.type).length;
        if (existingRedPartCount >= 1) {
            this.showErrorMessage(`${partName}は1個までしか配置できません！`);
            return;
        }
        
        // 総パーツ数の制限チェック（30個まで）
        const currentPartCount = this.rocketDesign.parts.length;
        if (currentPartCount + 1 > 30) {
            this.showPartLimitAlert(currentPartCount, 1);
            return;
        }
        
        // 中心位置
        const centerX = this.buildArea.x + this.buildArea.width / 2;
        const centerY = this.buildArea.y + this.buildArea.height / 2;
        
        // 赤パーツを実体化
        const part = new (redPart.constructor)(centerX, centerY);
        
        // パーツのスプライトを作成
        const partSprite = this.createSinglePartSprite(part);
        
        // パーツ情報を保存
        this.placedParts.push({
            isComposite: false,
            parts: [part],
            sprite: partSprite,
            redPartName: partName,
            partId: part.id
        });
        
        // 設計データに追加
        this.rocketDesign.addPart(part);
        
        // 情報を更新
        this.updateInfoPanel();
        
        // パーツ配置時の効果音を再生
        this.playPlacementSound();
        
        console.log('Red part added:', partName, 'Type:', part.type);
    }
    
    /**
     * 単一パーツのスプライトを作成
     */
    createSinglePartSprite(part) {
        const graphics = this.add.graphics();
        graphics.fillStyle(part.color);
        
        switch (part.type) {
            case 'redengine':
                // エンジン（円形）
                graphics.fillCircle(part.x, part.y, part.width / 2);
                // 噴射口を追加
                graphics.fillStyle(0xff4500);
                graphics.fillTriangle(
                    part.x, part.y + part.width / 2,
                    part.x - part.width / 4, part.y + part.width / 2 + 20,
                    part.x + part.width / 4, part.y + part.width / 2 + 20
                );
                break;
            case 'redbody':
                // ボディ（四角形）
                graphics.fillRect(part.x - part.width / 2, part.y - part.height / 2, part.width, part.height);
                break;
            case 'rednose':
                // ノーズ（三角形）
                graphics.fillTriangle(
                    part.x, part.y - part.height / 2,
                    part.x - part.width / 2, part.y + part.height / 2,
                    part.x + part.width / 2, part.y + part.height / 2
                );
                // 推進力を示す矢印
                graphics.fillStyle(0xff4500);
                graphics.fillTriangle(
                    part.x, part.y - part.height / 2 - 10,
                    part.x - part.width / 4, part.y - part.height / 2,
                    part.x + part.width / 4, part.y - part.height / 2
                );
                break;
        }
        
        // 枠線を追加（赤色）
        graphics.lineStyle(3, 0xe74c3c);
        if (part.type === 'redengine') {
            graphics.strokeCircle(part.x, part.y, part.width / 2);
        } else if (part.type === 'redbody') {
            graphics.strokeRect(part.x - part.width / 2, part.y - part.height / 2, part.width, part.height);
        } else if (part.type === 'rednose') {
            graphics.strokeTriangle(
                part.x, part.y - part.height / 2,
                part.x - part.width / 2, part.y + part.height / 2,
                part.x + part.width / 2, part.y + part.height / 2
            );
        }
        
        // コンテナを作成してドラッグ可能にする
        const container = this.add.container(part.x, part.y);
        container.add(graphics);
        
        // グラフィックスをクリアして、コンテナ相対座標で再描画
        graphics.clear();
        graphics.x = 0;
        graphics.y = 0;
        
        // コンテナ内でグラフィックスを再描画
        graphics.fillStyle(part.color);
        switch (part.type) {
            case 'redengine':
                graphics.fillCircle(0, 0, part.width / 2);
                graphics.fillStyle(0xff4500);
                graphics.fillTriangle(0, part.width / 2, -part.width / 4, part.width / 2 + 20, part.width / 4, part.width / 2 + 20);
                break;
            case 'redbody':
                graphics.fillRect(-part.width / 2, -part.height / 2, part.width, part.height);
                break;
            case 'rednose':
                graphics.fillTriangle(0, -part.height / 2, -part.width / 2, part.height / 2, part.width / 2, part.height / 2);
                graphics.fillStyle(0xff4500);
                graphics.fillTriangle(0, -part.height / 2 - 10, -part.width / 4, -part.height / 2, part.width / 4, -part.height / 2);
                break;
        }
        
        // 枠線を追加（赤色）
        graphics.lineStyle(3, 0xe74c3c);
        if (part.type === 'redengine') {
            graphics.strokeCircle(0, 0, part.width / 2);
        } else if (part.type === 'redbody') {
            graphics.strokeRect(-part.width / 2, -part.height / 2, part.width, part.height);
        } else if (part.type === 'rednose') {
            graphics.strokeTriangle(0, -part.height / 2, -part.width / 2, part.height / 2, part.width / 2, part.height / 2);
        }
        
        container.setSize(part.width, part.height);
        container.setInteractive({ draggable: true, useHandCursor: true });
        
        // ドラッグイベント
        container.on('drag', (pointer, dragX, dragY) => {
            // グリッドにスナップ
            const snappedX = Math.round(dragX / this.gridSize) * this.gridSize;
            const snappedY = Math.round(dragY / this.gridSize) * this.gridSize;
            
            // 組み立てエリア内に制限
            const clampedX = Phaser.Math.Clamp(
                snappedX,
                this.buildArea.x + part.width / 2,
                this.buildArea.x + this.buildArea.width - part.width / 2
            );
            const clampedY = Phaser.Math.Clamp(
                snappedY,
                this.buildArea.y + part.height / 2,
                this.buildArea.y + this.buildArea.height - part.height / 2
            );
            
            container.x = clampedX;
            container.y = clampedY;
            
            // パーツの位置を更新
            part.x = clampedX;
            part.y = clampedY;
            
            this.rocketDesign.updatePhysics();
            this.updateInfoPanel();
        });
        
        // 右クリックで削除
        container.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                this.removeRedPartFromBuildArea(part.id);
            }
        });
        
        // ホバー効果
        container.on('pointerover', () => {
            container.setAlpha(0.8);
        });
        
        container.on('pointerout', () => {
            container.setAlpha(1.0);
        });
        
        return graphics;
    }
    
    /**
     * 赤パーツを組み立てエリアから削除
     */
    removeRedPartFromBuildArea(partId) {
        const index = this.placedParts.findIndex(p => 
            !p.isComposite && p.parts && p.parts[0] && p.parts[0].id === partId
        );
        if (index !== -1) {
            const redPartItem = this.placedParts[index];
            
            // スプライトを破棄
            if (redPartItem.sprite) {
                redPartItem.sprite.destroy();
            }
            
            // 設計データからパーツを削除
            redPartItem.parts.forEach(part => {
                this.rocketDesign.removePart(part.id);
            });
            
            // リストから削除
            this.placedParts.splice(index, 1);
            
            // 情報パネルを更新
            this.updateInfoPanel();
            
            // パーツ削除時の効果音を再生
            this.playCancelSound();
            
            console.log('Red part removed:', redPartItem.redPartName, 'Part ID:', partId);
        } else {
            // partIdで直接検索（データ構造が異なる場合）
            const indexById = this.placedParts.findIndex(p => p.partId === partId);
            if (indexById !== -1) {
                const redPartItem = this.placedParts[indexById];
                
                // スプライトを破棄
                if (redPartItem.sprite) {
                    redPartItem.sprite.destroy();
                }
                
                // 設計データからパーツを削除
                if (redPartItem.parts) {
                    redPartItem.parts.forEach(part => {
                        this.rocketDesign.removePart(part.id);
                    });
                }
                
                // リストから削除
                this.placedParts.splice(indexById, 1);
                
                // 情報パネルを更新
                this.updateInfoPanel();
                
                // パーツ削除時の効果音を再生
                this.playCancelSound();
                
                console.log('Red part removed by partId:', partId);
            }
        }
    }
    
    /**
     * パーツ詳細パネルを作成
     */
    createPartDetailPanel() {
        const panelX = 700;
        const panelY = 250; // パーツグリッドの下に配置
        const panelWidth = 300;
        const panelHeight = 140;
        
        // 背景
        const bg = this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, 0x1a1a1a);
        bg.setStrokeStyle(2, 0x3498db);
        bg.setAlpha(0.9);
        bg.setVisible(false); // 初期状態は非表示
        
        // パーツ名
        const nameText = this.add.text(panelX + 10, panelY + 10, '', {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        
        // 説明
        const descText = this.add.text(panelX + 10, panelY + 35, '', {
            fontSize: '14px',
            fill: '#bdc3c7',
            wordWrap: { width: panelWidth - 20 }
        });
        
        // アイコン表示
        const iconText = this.add.text(panelX + 200, panelY + 30, '', {
            fontSize: '24px',
            fill: '#3498db',
            align: 'center',
            lineSpacing: -5
        });
        
        // パネル要素を保存
        this.detailPanel = {
            bg: bg,
            nameText: nameText,
            descText: descText,
            iconText: iconText
        };
        
        // パーツ説明ウィンドウの下にhorochi_mv_2.mp4を表示
        const videoX = panelX - 78;
        const videoY = panelY + panelHeight + 10; // パネルの下に10pxのマージン
        const videoWidth = panelWidth;
        const videoHeight = 200; // 動画の高さ
        
        // 0.9倍に縮小するため、実際のサイズを計算
        const scaledWidth = videoWidth * 0.7;
        const scaledHeight = videoHeight * 0.7;
        
        // 中央揃えのためのオフセットを計算
        const offsetX = (videoWidth - scaledWidth) / 2;
        const offsetY = (videoHeight - scaledHeight) / 2;
        
        this.videoElement = this.createVideoElement(
            'resources/horochi_mv_2.mp4',
            videoX + offsetX,
            videoY + offsetY,
            scaledWidth,
            scaledHeight,
            {
                autoplay: true,
                loop: true,
                muted: true,
                volume: 1.0,
                controls: false,
                playsInline: true,
                zIndex: 10 // Phaserの要素より上に表示
            }
        );
        
        // 動画の下にテキスト表示エリアを作成
        const dialogueX = videoX + offsetX;
        const dialogueY = videoY + offsetY + scaledHeight + 10; // 動画の下に10pxのマージン
        this.createDialoguePanel(dialogueX, dialogueY, scaledWidth + 300, scaledHeight);
    }
    
    /**
     * 会話パネルを作成（動画の下）
     */
    createDialoguePanel(x, y, width, height) {
        // 背景
        const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x1a1a1a);
        bg.setStrokeStyle(2, 0x3498db);
        bg.setAlpha(0.9);
        
        // テキスト表示
        const textArea = this.add.text(x + 10, y + 10, '', {
            fontSize: '14px',
            fill: '#ffffff',
            wordWrap: { width: width - 20 },
            lineSpacing: 5
        });
        
        // 会話パネル要素を保存
        this.dialoguePanel = {
            bg: bg,
            textArea: textArea,
            currentIndex: 0,
            cvData: null,
            currentSound: null,
            typewriterTimer: null,
            fullText: '',
            displayedText: '',
            isStopped: false
        };
        
        // cv.jsonが読み込まれている場合、会話を開始
        if (this.cache.json.exists('cv')) {
            this.dialoguePanel.cvData = this.cache.json.get('cv');
            this.startDialogue();
        } else {
            // まだ読み込まれていない場合、読み込み完了を待つ
            this.load.once('filecomplete-json-cv', () => {
                this.dialoguePanel.cvData = this.cache.json.get('cv');
                this.startDialogue();
            });
        }
    }
    
    /**
     * 会話を開始（001から順番に再生）
     */
    startDialogue() {
        if (!this.dialoguePanel || !this.dialoguePanel.cvData) return;
        
        this.dialoguePanel.currentIndex = 0;
        this.playNextDialogue();
    }
    
    /**
     * 次の会話を再生
     */
    playNextDialogue() {
        if (!this.dialoguePanel || !this.dialoguePanel.cvData) return;
        
        // 現在の音声を停止
        if (this.dialoguePanel.currentSound && this.dialoguePanel.currentSound.isPlaying) {
            this.dialoguePanel.currentSound.stop();
        }
        
        // インデックスを3桁の文字列に変換（001, 002, ...）
        const indexStr = String(this.dialoguePanel.currentIndex + 1).padStart(3, '0');
        
        // 該当するデータを取得
        const dialogue = this.dialoguePanel.cvData[indexStr];
        if (!dialogue) {
            console.log('Dialogue finished');
            return; // すべての会話が終了
        }
        
        // テキストを保存（タイプライター表示用）
        this.dialoguePanel.fullText = dialogue.text;
        this.dialoguePanel.displayedText = '';
        
        // 音声を再生
        const soundKey = `voice_${indexStr}`;
        
        // 音声ファイルがまだ読み込まれていない場合は読み込む
        if (!this.cache.audio.exists(soundKey)) {
            this.load.audio(soundKey, dialogue.se);
            this.load.once(`filecomplete-audio-${soundKey}`, () => {
                this.playDialogueSound(soundKey, indexStr, dialogue.text);
            });
            this.load.start();
        } else {
            this.playDialogueSound(soundKey, indexStr, dialogue.text);
        }
    }
    
    /**
     * 会話の音声を再生
     */
    playDialogueSound(soundKey, indexStr, text) {
        if (!this.dialoguePanel) return;
        
        // 既存のタイプライタータイマーをクリア
        if (this.dialoguePanel.typewriterTimer) {
            this.dialoguePanel.typewriterTimer.remove();
            this.dialoguePanel.typewriterTimer = null;
        }
        
        this.dialoguePanel.currentSound = this.sound.add(soundKey, {
            volume: 0.2 // 音量20%
        });
        
        // currentSoundが正しく作成されたか確認
        if (!this.dialoguePanel.currentSound) {
            console.error('Failed to create sound:', soundKey);
            return;
        }
        
        // 音声を再生
        this.dialoguePanel.currentSound.play();
        
        // タイプライター効果で1文字ずつ表示（20msごと）
        this.startTypewriter(text, 20);
        
        // 音声が終了したら次の会話を再生
        if (this.dialoguePanel.currentSound) {
            this.dialoguePanel.currentSound.once('complete', () => {
            // タイプライタータイマーをクリア
            if (this.dialoguePanel.typewriterTimer) {
                this.dialoguePanel.typewriterTimer.remove();
                this.dialoguePanel.typewriterTimer = null;
            }
            
            // テキストを完全に表示
            if (this.dialoguePanel && this.dialoguePanel.textArea) {
                this.dialoguePanel.textArea.setText(text);
            }
            
            if (this.dialoguePanel && !this.dialoguePanel.isStopped) {
                this.dialoguePanel.currentIndex++;
                this.playNextDialogue();
            }
            });
        }
        
        // エラーハンドリング
        if (this.dialoguePanel.currentSound) {
            this.dialoguePanel.currentSound.once('looped', () => {
            // ループしないようにする
            if (this.dialoguePanel.currentSound) {
                this.dialoguePanel.currentSound.stop();
            }
            });
        }
    }
    
    /**
     * タイプライター効果でテキストを1文字ずつ表示
     */
    startTypewriter(text, charDelay) {
        if (!this.dialoguePanel || this.dialoguePanel.isStopped) return;
        
        this.dialoguePanel.displayedText = '';
        let currentIndex = 0;
        
        // タイマーイベントを作成
        this.dialoguePanel.typewriterTimer = this.time.addEvent({
            delay: charDelay,
            callback: () => {
                if (this.dialoguePanel && !this.dialoguePanel.isStopped && currentIndex < text.length) {
                    this.dialoguePanel.displayedText += text[currentIndex];
                    this.dialoguePanel.textArea.setText(this.dialoguePanel.displayedText);
                    currentIndex++;
                } else {
                    // タイマーを停止
                    if (this.dialoguePanel.typewriterTimer) {
                        this.dialoguePanel.typewriterTimer.remove();
                        this.dialoguePanel.typewriterTimer = null;
                    }
                }
            },
            repeat: text.length - 1
        });
    }
    
    /**
     * 会話パネルの音声読み上げを中断
     */
    stopDialogue() {
        if (!this.dialoguePanel) return;
        
        // 中断フラグを設定
        this.dialoguePanel.isStopped = true;
        
        // タイプライタータイマーを停止
        if (this.dialoguePanel.typewriterTimer) {
            this.dialoguePanel.typewriterTimer.remove();
            this.dialoguePanel.typewriterTimer = null;
        }
        
        // 現在再生中の音声を停止
        if (this.dialoguePanel.currentSound) {
            if (this.dialoguePanel.currentSound.isPlaying) {
                this.dialoguePanel.currentSound.stop();
            }
            // イベントリスナーを削除
            this.dialoguePanel.currentSound.removeAllListeners();
            this.dialoguePanel.currentSound = null;
        }
        
        console.log('Dialogue stopped');
    }
    
    /**
     * パーツ詳細パネルを更新
     */
    updatePartDetailPanel(compositePart) {
        if (!this.detailPanel) return;
        
        const panelX = 700;
        const panelY = 250;
        const panelWidth = 300;
        
        // パネルを表示
        this.detailPanel.bg.setVisible(true);
        
        // パーツ情報を更新
        this.detailPanel.nameText.setText(compositePart.name);
        this.detailPanel.descText.setText(compositePart.description);
        this.detailPanel.iconText.setText(compositePart.icon);
        
        // パーツの構成を表示
        const partsInfo = compositePart.parts.map(p => {
            const partType = typeof p === 'object' ? p.type : p;
            const partNames = {
                'nose': 'ノーズ',
                'body': 'ボディ',
                'wing': 'ウィング',
                'engine': 'エンジン',
                'fueltank': '燃料タンク',
                'cockpit': 'コックピット'
            };
            return partNames[partType] || partType;
        }).join('、');
        
        const infoText = `構成: ${partsInfo}`;
        if (!this.detailPanel.infoText) {
            this.detailPanel.infoText = this.add.text(panelX + 10, panelY + 120, '', {
                fontSize: '12px',
                fill: '#95a5a6',
                wordWrap: { width: panelWidth - 20 }
            });
        }
        this.detailPanel.infoText.setText(infoText);
    }
    
    /**
     * 複合パーツを組み立てエリアに追加
     */
    addCompositePartToBuildArea(compositePart) {
        // 総パーツ数の制限チェック（30個まで）
        const currentPartCount = this.rocketDesign.parts.length;
        const newPartCount = compositePart.parts.length;
        
        if (currentPartCount + newPartCount > 30) {
            this.showPartLimitAlert(currentPartCount, newPartCount);
            return;
        }
        
        // コックピットの制限チェック
        const hasCockpit = compositePart.parts.some(p => p.type === 'cockpit');
        if (hasCockpit) {
            // 既にコックピットが配置されているかチェック
            const existingCockpitCount = this.rocketDesign.parts.filter(p => p.type === 'cockpit').length;
            if (existingCockpitCount > 0) {
                alert('コックピットは1つまでしか配置できません！');
                return;
            }
        }
        
        // 中心位置
        const centerX = this.buildArea.x + this.buildArea.width / 2;
        const centerY = this.buildArea.y + this.buildArea.height / 2;
        
        // 複合パーツを実体化
        const compositeData = compositePart.instantiate(centerX, centerY);
        const { groupId, parts, compositeName } = compositeData;
        
        // グループ全体を1つのコンテナとして作成
        const groupContainer = this.createCompositePartSprite(parts, groupId, compositeName);
        
        // グループ情報を保存
        this.placedParts.push({
            isComposite: true,
            groupId: groupId,
            parts: parts,
            sprite: groupContainer,
            compositeName: compositeName
        });
        
        // 各パーツを設計データに追加
        parts.forEach(part => {
            this.rocketDesign.addPart(part);
        });
        
        // 情報を更新
        this.updateInfoPanel();
        
        // パーツ配置時の効果音を再生
        this.playPlacementSound();
        
        console.log('Composite part added:', compositeName, '(', parts.length, 'parts) as group:', groupId);
    }
    
    /**
     * 複合パーツスプライト（グループコンテナ）を作成
     */
    createCompositePartSprite(parts, groupId, compositeName) {
        // グループ全体のコンテナ
        const groupContainer = this.add.container(0, 0);
        
        // グループの中心座標を計算
        const avgX = parts.reduce((sum, p) => sum + p.x, 0) / parts.length;
        const avgY = parts.reduce((sum, p) => sum + p.y, 0) / parts.length;
        
        groupContainer.x = avgX;
        groupContainer.y = avgY;
        
        // 各パーツのグラフィックを作成してグループコンテナに追加
        parts.forEach(part => {
            const graphics = this.add.graphics();
            graphics.fillStyle(part.color);
            
            // パーツの相対位置
            const relativeX = part.x - avgX;
            const relativeY = part.y - avgY;
            
            switch (part.type) {
                case 'nose':
                    graphics.fillTriangle(
                        relativeX, relativeY - part.height/2,
                        relativeX - part.width/2, relativeY + part.height/2,
                        relativeX + part.width/2, relativeY + part.height/2
                    );
                    break;
                case 'body':
                case 'fueltank':
                    graphics.fillRect(
                        relativeX - part.width/2,
                        relativeY - part.height/2,
                        part.width,
                        part.height
                    );
                    break;
                case 'wing':
                    if (part.side === 'left') {
                        graphics.fillTriangle(
                            relativeX - part.width, relativeY,
                            relativeX, relativeY - part.height/2,
                            relativeX, relativeY + part.height/2
                        );
                    } else {
                        graphics.fillTriangle(
                            relativeX + part.width, relativeY,
                            relativeX, relativeY - part.height/2,
                            relativeX, relativeY + part.height/2
                        );
                    }
                    break;
                case 'engine':
                    // エンジン本体
                    graphics.fillRect(
                        relativeX - part.width/2,
                        relativeY - part.height/2,
                        part.width,
                        part.height
                    );
                    
                    // 噴射口（炎の三角形）
                    graphics.fillStyle(0xf39c12);
                    graphics.fillTriangle(
                        relativeX, relativeY + part.height/2,
                        relativeX - part.width/3, relativeY + part.height/2 + 15,
                        relativeX + part.width/3, relativeY + part.height/2 + 15
                    );
                    
                    // 推進方向の矢印（噴射の逆方向）
                    graphics.fillStyle(0xffff00);
                    graphics.fillTriangle(
                        relativeX, relativeY - part.height/2,
                        relativeX - part.width/4, relativeY - part.height/2 + 10,
                        relativeX + part.width/4, relativeY - part.height/2 + 10
                    );
                    break;
                // レアパーツ（エンジン系）
                case 'superengine':
                    graphics.fillRect(relativeX - part.width/2, relativeY - part.height/2, part.width, part.height);
                    graphics.fillStyle(0xff4500);
                    graphics.fillTriangle(relativeX - part.width/4, relativeY + part.height/2, relativeX - part.width/4 - 8, relativeY + part.height/2 + 18, relativeX - part.width/4 + 8, relativeY + part.height/2 + 18);
                    graphics.fillTriangle(relativeX + part.width/4, relativeY + part.height/2, relativeX + part.width/4 - 8, relativeY + part.height/2 + 18, relativeX + part.width/4 + 8, relativeY + part.height/2 + 18);
                    graphics.fillStyle(0xffff00);
                    graphics.fillTriangle(relativeX, relativeY - part.height/2, relativeX - part.width/3, relativeY - part.height/2 + 12, relativeX + part.width/3, relativeY - part.height/2 + 12);
                    break;
                case 'ultralightengine':
                    graphics.fillRect(relativeX - part.width/2, relativeY - part.height/2, part.width, part.height);
                    graphics.fillStyle(0x00ffff);
                    graphics.fillTriangle(relativeX, relativeY + part.height/2, relativeX - part.width/4, relativeY + part.height/2 + 10, relativeX + part.width/4, relativeY + part.height/2 + 10);
                    break;
                case 'microengine':
                    graphics.fillRect(relativeX - part.width/2, relativeY - part.height/2, part.width, part.height);
                    graphics.fillStyle(0xff6b6b);
                    graphics.fillTriangle(relativeX, relativeY + part.height/2, relativeX - part.width/3, relativeY + part.height/2 + 8, relativeX + part.width/3, relativeY + part.height/2 + 8);
                    break;
                case 'dualengine':
                    graphics.fillRect(relativeX - part.width/2, relativeY - part.height/2, part.width, part.height);
                    graphics.fillStyle(0x9b59b6);
                    graphics.fillTriangle(relativeX - part.width/3, relativeY + part.height/2, relativeX - part.width/3 - 10, relativeY + part.height/2 + 15, relativeX - part.width/3 + 10, relativeY + part.height/2 + 15);
                    graphics.fillTriangle(relativeX + part.width/3, relativeY + part.height/2, relativeX + part.width/3 - 10, relativeY + part.height/2 + 15, relativeX + part.width/3 + 10, relativeY + part.height/2 + 15);
                    break;
                case 'weight':
                    graphics.fillRect(relativeX - part.width/2, relativeY - part.height/2, part.width, part.height);
                    graphics.lineStyle(2, 0x1a1a1a, 0.5);
                    for (let i = -part.width/2; i < part.width/2; i += 8) {
                        graphics.lineBetween(relativeX + i, relativeY - part.height/2, relativeX + i + part.height, relativeY + part.height/2);
                    }
                    break;
                case 'ultralightnose':
                    graphics.fillTriangle(relativeX, relativeY - part.height/2 - 5, relativeX - part.width/2, relativeY + part.height/2, relativeX + part.width/2, relativeY + part.height/2);
                    graphics.fillStyle(0xffd700, 0.3);
                    graphics.fillTriangle(relativeX, relativeY - part.height/2, relativeX - part.width/4, relativeY, relativeX + part.width/4, relativeY);
                    break;
                case 'reinforcedbody':
                    graphics.fillRect(relativeX - part.width/2, relativeY - part.height/2, part.width, part.height);
                    graphics.fillStyle(0x5a6266);
                    for (let y = relativeY - part.height/2 + 10; y < relativeY + part.height/2; y += 15) {
                        graphics.fillCircle(relativeX - part.width/2 + 8, y, 2);
                        graphics.fillCircle(relativeX + part.width/2 - 8, y, 2);
                    }
                    break;
                case 'megafueltank':
                    graphics.fillRect(relativeX - part.width/2, relativeY - part.height/2, part.width, part.height);
                    graphics.fillStyle(0x1abc9c);
                    graphics.fillRect(relativeX - part.width/2, relativeY - part.height/2, part.width, 10);
                    graphics.fillRect(relativeX - part.width/2, relativeY + part.height/2 - 10, part.width, 10);
                    break;
                case 'largewing':
                    graphics.fillTriangle(relativeX - part.width, relativeY, relativeX + part.width, relativeY, relativeX, relativeY - part.height/2);
                    graphics.fillTriangle(relativeX - part.width, relativeY, relativeX + part.width, relativeY, relativeX, relativeY + part.height/2);
                    graphics.lineStyle(3, 0xff8c00, 0.7);
                    graphics.strokeTriangle(relativeX - part.width, relativeY, relativeX + part.width, relativeY, relativeX, relativeY - part.height/2);
                    break;
                case 'stabilizer':
                    graphics.fillRect(relativeX - part.width/2, relativeY - part.height/2, part.width, part.height);
                    graphics.fillStyle(0x3498db);
                    graphics.fillTriangle(relativeX - part.width/2, relativeY - part.height/2, relativeX - part.width/2 + 15, relativeY, relativeX - part.width/2, relativeY + part.height/2);
                    graphics.fillTriangle(relativeX + part.width/2, relativeY - part.height/2, relativeX + part.width/2 - 15, relativeY, relativeX + part.width/2, relativeY + part.height/2);
                    break;
                case 'cockpit':
                    // コックピットは画像を使用するのでグラフィックスは描画しない
                    // 代わりに画像スプライトを追加
                    const cockpitSprite = this.add.sprite(relativeX, relativeY, part.imageKey || 'horochi');
                    cockpitSprite.setDisplaySize(part.width, part.height);
                    groupContainer.add(cockpitSprite);
                    
                    // 枠線をコックピット用に描画
                    graphics.lineStyle(2, 0xffd93d, 0.8); // 金色の枠線
                    graphics.strokeRect(
                        relativeX - part.width/2,
                        relativeY - part.height/2,
                        part.width,
                        part.height
                    );
                    break;
            }
            
            // 枠線（コックピット以外）
            if (part.type !== 'cockpit') {
                graphics.lineStyle(2, 0xffffff, 0.8);
                graphics.strokeRect(
                    relativeX - part.width/2,
                    relativeY - part.height/2,
                    part.width,
                    part.height
                );
            }
            
            groupContainer.add(graphics);
        });
        
        // グループの境界ボックスを計算
        const minX = Math.min(...parts.map(p => p.x - p.width / 2));
        const maxX = Math.max(...parts.map(p => p.x + p.width / 2));
        const minY = Math.min(...parts.map(p => p.y - p.height / 2));
        const maxY = Math.max(...parts.map(p => p.y + p.height / 2));
        const groupWidth = maxX - minX;
        const groupHeight = maxY - minY;
        
        // レアパーツは既にフィルタリングで除外されているため、常に通常パーツとして扱う
        const borderColor = 0x3498db; // 通常は青
        const hoverColor = 0x5dade2; // ホバー時の色
        
        // グループ全体の枠線を描画（複合パーツであることを示す）
        const groupBorder = this.add.graphics();
        groupBorder.lineStyle(3, borderColor, 0.8);
        groupBorder.strokeRoundedRect(
            -groupWidth / 2,
            -groupHeight / 2,
            groupWidth,
            groupHeight,
            5
        );
        
        // レアパーツ用にデータを保存
        groupBorder.setData('borderColor', borderColor);
        groupBorder.setData('hoverColor', hoverColor);
        groupContainer.add(groupBorder);
        
        // 複合パーツ名のラベル
        const nameLabel = this.add.text(0, -groupHeight / 2 - 15, compositeName, {
            fontSize: '12px',
            fill: '#3498db',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: { x: 5, y: 2 }
        });
        nameLabel.setOrigin(0.5);
        groupContainer.add(nameLabel);
        
        groupContainer.setSize(groupWidth, groupHeight);
        groupContainer.setInteractive({ draggable: true, useHandCursor: true });
        
        // グループIDとパーツ情報を保存
        groupContainer.setData('groupId', groupId);
        groupContainer.setData('isComposite', true);
        groupContainer.setData('compositeName', compositeName);
        
        // ドラッグイベント
        groupContainer.on('drag', (pointer, dragX, dragY) => {
            // グリッドにスナップ
            const snappedX = Math.round(dragX / this.gridSize) * this.gridSize;
            const snappedY = Math.round(dragY / this.gridSize) * this.gridSize;
            
            // 組み立てエリア内に制限
            const clampedX = Phaser.Math.Clamp(
                snappedX,
                this.buildArea.x + groupWidth / 2,
                this.buildArea.x + this.buildArea.width - groupWidth / 2
            );
            const clampedY = Phaser.Math.Clamp(
                snappedY,
                this.buildArea.y + groupHeight / 2,
                this.buildArea.y + this.buildArea.height - groupHeight / 2
            );
            
            // コンテナ位置を更新
            const deltaX = clampedX - groupContainer.x;
            const deltaY = clampedY - groupContainer.y;
            groupContainer.x = clampedX;
            groupContainer.y = clampedY;
            
            // 各パーツのデータ位置も更新
            parts.forEach(part => {
                part.x += deltaX;
                part.y += deltaY;
            });
            
            this.rocketDesign.updatePhysics();
            this.updateInfoPanel();
        });
        
        // 右クリックで削除
        groupContainer.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                this.removeCompositePartFromBuildArea(groupId);
            }
        });
        
        // ホバー効果
        groupContainer.on('pointerover', () => {
            const hColor = groupBorder.getData('hoverColor');
            const hexColor = '#' + hColor.toString(16).padStart(6, '0');
            groupBorder.clear();
            groupBorder.lineStyle(4, hColor, 1); // ホバー時の色
            groupBorder.strokeRoundedRect(
                -groupWidth / 2,
                -groupHeight / 2,
                groupWidth,
                groupHeight,
                5
            );
            nameLabel.setStyle({ fill: hexColor, backgroundColor: 'rgba(0, 0, 0, 0.9)' });
        });
        
        groupContainer.on('pointerout', () => {
            const bColor = groupBorder.getData('borderColor');
            const hexColor = '#' + bColor.toString(16).padStart(6, '0');
            groupBorder.clear();
            groupBorder.lineStyle(3, bColor, 0.8); // 通常の色
            groupBorder.strokeRoundedRect(
                -groupWidth / 2,
                -groupHeight / 2,
                groupWidth,
                groupHeight,
                5
            );
            nameLabel.setStyle({ fill: hexColor, backgroundColor: 'rgba(0, 0, 0, 0.7)' });
        });
        
        return groupContainer;
    }
    
    /**
     * パーツスプライトを作成
     */
    createPartSprite(part) {
        const container = this.add.container(part.x, part.y);
        
        // パーツの形状を描画
        const graphics = this.add.graphics();
        graphics.fillStyle(part.color);
        
        switch (part.type) {
            case 'nose':
                graphics.fillTriangle(0, -part.height/2, -part.width/2, part.height/2, part.width/2, part.height/2);
                break;
            case 'body':
            case 'fueltank':
                graphics.fillRect(-part.width/2, -part.height/2, part.width, part.height);
                break;
            case 'wing':
                if (part.side === 'left') {
                    graphics.fillTriangle(-part.width, 0, 0, -part.height/2, 0, part.height/2);
                } else {
                    graphics.fillTriangle(part.width, 0, 0, -part.height/2, 0, part.height/2);
                }
                break;
            case 'engine':
                // エンジン本体
                graphics.fillRect(-part.width/2, -part.height/2, part.width, part.height);
                
                // 噴射口（炎の三角形）- デフォルトは下向き
                graphics.fillStyle(0xf39c12);
                graphics.fillTriangle(0, part.height/2, -part.width/3, part.height/2 + 15, part.width/3, part.height/2 + 15);
                
                // 推進方向の矢印（噴射の逆方向）
                graphics.fillStyle(0xffff00);
                graphics.fillTriangle(0, -part.height/2, -part.width/4, -part.height/2 + 10, part.width/4, -part.height/2 + 10);
                break;
            // レアパーツ
            case 'superengine':
                // 超強力エンジン - 大きくて赤い
                graphics.fillRect(-part.width/2, -part.height/2, part.width, part.height);
                // 2つの噴射口
                graphics.fillStyle(0xff4500);
                graphics.fillTriangle(-part.width/4, part.height/2, -part.width/4 - 8, part.height/2 + 18, -part.width/4 + 8, part.height/2 + 18);
                graphics.fillTriangle(part.width/4, part.height/2, part.width/4 - 8, part.height/2 + 18, part.width/4 + 8, part.height/2 + 18);
                // 強力さを示す矢印
                graphics.fillStyle(0xffff00);
                graphics.fillTriangle(0, -part.height/2, -part.width/3, -part.height/2 + 12, part.width/3, -part.height/2 + 12);
                break;
            case 'ultralightengine':
                // 超軽量エンジン - 小さくてシアン
                graphics.fillRect(-part.width/2, -part.height/2, part.width, part.height);
                graphics.fillStyle(0x00ffff);
                graphics.fillTriangle(0, part.height/2, -part.width/4, part.height/2 + 10, part.width/4, part.height/2 + 10);
                break;
            case 'microengine':
                // 超小型エンジン - とても小さい
                graphics.fillRect(-part.width/2, -part.height/2, part.width, part.height);
                graphics.fillStyle(0xff6b6b);
                graphics.fillTriangle(0, part.height/2, -part.width/3, part.height/2 + 8, part.width/3, part.height/2 + 8);
                break;
            case 'dualengine':
                // 複合エンジン - ワイドで2つのノズル
                graphics.fillRect(-part.width/2, -part.height/2, part.width, part.height);
                graphics.fillStyle(0x9b59b6);
                graphics.fillTriangle(-part.width/3, part.height/2, -part.width/3 - 10, part.height/2 + 15, -part.width/3 + 10, part.height/2 + 15);
                graphics.fillTriangle(part.width/3, part.height/2, part.width/3 - 10, part.height/2 + 15, part.width/3 + 10, part.height/2 + 15);
                break;
            case 'weight':
                // おもり - 重そうな見た目
                graphics.fillRect(-part.width/2, -part.height/2, part.width, part.height);
                // クロスハッチング模様
                graphics.lineStyle(2, 0x1a1a1a, 0.5);
                for (let i = -part.width/2; i < part.width/2; i += 8) {
                    graphics.lineBetween(i, -part.height/2, i + part.height, part.height/2);
                }
                break;
            case 'ultralightnose':
                // 超軽量ノーズ - 鋭い形状
                graphics.fillTriangle(0, -part.height/2 - 5, -part.width/2, part.height/2, part.width/2, part.height/2);
                // 光沢
                graphics.fillStyle(0xffd700, 0.3);
                graphics.fillTriangle(0, -part.height/2, -part.width/4, 0, part.width/4, 0);
                break;
            case 'reinforcedbody':
                // 強化ボディ - リベット模様
                graphics.fillRect(-part.width/2, -part.height/2, part.width, part.height);
                graphics.fillStyle(0x5a6266);
                for (let y = -part.height/2 + 10; y < part.height/2; y += 15) {
                    graphics.fillCircle(-part.width/2 + 8, y, 2);
                    graphics.fillCircle(part.width/2 - 8, y, 2);
                }
                break;
            case 'megafueltank':
                // 巨大燃料タンク - 大きくて目立つ
                graphics.fillRect(-part.width/2, -part.height/2, part.width, part.height);
                // ストライプ模様
                graphics.fillStyle(0x1abc9c);
                graphics.fillRect(-part.width/2, -part.height/2, part.width, 10);
                graphics.fillRect(-part.width/2, part.height/2 - 10, part.width, 10);
                break;
            case 'largewing':
                // 大型ウィング - 大きい三角形
                graphics.fillTriangle(-part.width, 0, part.width, 0, 0, -part.height/2);
                graphics.fillTriangle(-part.width, 0, part.width, 0, 0, part.height/2);
                // エッジ強調
                graphics.lineStyle(3, 0xff8c00, 0.7);
                graphics.strokeTriangle(-part.width, 0, part.width, 0, 0, -part.height/2);
                break;
            case 'stabilizer':
                // 安定化装置 - 平たい形状
                graphics.fillRect(-part.width/2, -part.height/2, part.width, part.height);
                // フィン模様
                graphics.fillStyle(0x3498db);
                graphics.fillTriangle(-part.width/2, -part.height/2, -part.width/2 + 15, 0, -part.width/2, part.height/2);
                graphics.fillTriangle(part.width/2, -part.height/2, part.width/2 - 15, 0, part.width/2, part.height/2);
                break;
        }
        
        // 枠線
        graphics.lineStyle(2, 0xffffff, 0.8);
        graphics.strokeRect(-part.width/2, -part.height/2, part.width, part.height);
        
        container.add(graphics);
        container.setSize(part.width, part.height);
        container.setInteractive({ draggable: true, useHandCursor: true });
        
        // パーツIDを保存
        container.setData('partId', part.id);
        
        // ドラッグイベント
        container.on('drag', (pointer, dragX, dragY) => {
            // グリッドにスナップ
            const snappedX = Math.round(dragX / this.gridSize) * this.gridSize;
            const snappedY = Math.round(dragY / this.gridSize) * this.gridSize;
            
            // 組み立てエリア内に制限
            const clampedX = Phaser.Math.Clamp(
                snappedX,
                this.buildArea.x + part.width / 2,
                this.buildArea.x + this.buildArea.width - part.width / 2
            );
            const clampedY = Phaser.Math.Clamp(
                snappedY,
                this.buildArea.y + part.height / 2,
                this.buildArea.y + this.buildArea.height - part.height / 2
            );
            
            container.x = clampedX;
            container.y = clampedY;
            part.x = clampedX;
            part.y = clampedY;
        });
        
        // 左クリックでエンジンを回転、右クリックで削除
        container.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                // 右クリック: 削除
                this.removePartFromBuildArea(part.id);
            } else if (this.isEngineType(part.type) && !this.input.dragState) {
                // 左クリック（ドラッグ開始前）: エンジンを90度回転
                this.rotateEngine(part, container);
            }
        });
        
        return container;
    }
    
    /**
     * パーツがエンジンタイプかどうかを判定
     */
    isEngineType(type) {
        return ['engine', 'superengine', 'ultralightengine', 'microengine', 'dualengine'].includes(type);
    }
    
    /**
     * エンジンを回転（90度ずつ）
     */
    rotateEngine(part, container) {
        if (!this.isEngineType(part.type)) return;
        
        // 90度回転
        part.angle = (part.angle + Math.PI / 2) % (Math.PI * 2);
        
        // コンテナを回転
        container.setRotation(part.angle);
        
        // 方向を表示
        const directions = ['右噴射→', '下噴射↓', '左噴射←', '上噴射↑'];
        const index = Math.round((part.angle / (Math.PI / 2))) % 4;
        console.log('Engine rotated:', directions[index], 'angle:', part.angle);
        
        // 情報パネルを更新
        this.updateInfoPanel();
    }
    
    /**
     * 複合パーツを削除
     */
    removeCompositePartFromBuildArea(groupId) {
        const index = this.placedParts.findIndex(p => p.groupId === groupId);
        if (index !== -1) {
            const compositeItem = this.placedParts[index];
            
            // コックピットは削除できない
            if (compositeItem.compositeName === 'コックピット') {
                console.log('Cannot remove cockpit - it is required!');
                return;
            }
            
            // スプライトを破棄
            compositeItem.sprite.destroy();
            
            // 設計データから全パーツを削除
            compositeItem.parts.forEach(part => {
                this.rocketDesign.removePart(part.id);
            });
            
            // リストから削除
            this.placedParts.splice(index, 1);
            
            // 情報パネルを更新
            this.updateInfoPanel();
            
            // パーツ削除時の効果音を再生
            this.playCancelSound();
            
            console.log('Composite part removed:', compositeItem.compositeName, 'groupId:', groupId);
        }
    }
    
    /**
     * パーツを削除
     */
    removePartFromBuildArea(partId) {
        const index = this.placedParts.findIndex(p => p.part && p.part.id === partId);
        if (index !== -1) {
            this.placedParts[index].sprite.destroy();
            this.placedParts.splice(index, 1);
            this.rocketDesign.removePart(partId);
            this.updateInfoPanel();
            
            // パーツ削除時の効果音を再生
            this.playCancelSound();
            
            console.log('Part removed:', partId);
        }
    }
    
    /**
     * 情報パネルを作成
     */
    createInfoPanel() {
        // 右下に配置（パーツパレットの下）
        const panelX = 990;
        const panelY = 460;
        
        const panelTitle = this.add.text(panelX, panelY - 30, 'ロケット情報', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        panelTitle.setOrigin(0.5, 0);
        
        this.infoText = this.add.text(panelX, panelY, this.getInfoText(), {
            fontSize: '17px',
            fill: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: { x: 20, y: 15 },
            align: 'left'
        });
        this.infoText.setOrigin(0.5, 0);
    }
    
    /**
     * 情報テキストを取得
     */
    getInfoText() {
        const parts = this.rocketDesign.parts;
        const compositeCount = this.placedParts.filter(p => p.isComposite).length;
        const totalCount = this.placedParts.length;
        
        return `配置数: ${totalCount} (複合: ${compositeCount})\n` +
               `パーツ数: ${parts.length}\n` +
               `総質量: ${parts.reduce((s, p) => s + p.mass, 0).toFixed(1)} kg\n` +
               `推進力: ${parts.filter(p => p.type === 'engine').reduce((s, p) => s + p.thrust, 0)} N\n` +
               `最大速度: ${this.rocketDesign.physics.maxSpeed.toFixed(0)} m/s`;
    }
    
    /**
     * 情報パネルを更新
     */
    updateInfoPanel() {
        if (this.infoText) {
            this.infoText.setText(this.getInfoText());
        }
    }
    
    /**
     * ボタンを作成
     */
    createButtons() {
        const centerX = this.cameras.main.width / 2;
        
        // クリアボタン（コックピット以外を削除）
        this.createButton(centerX - 400, 750, '🗑️ クリア', () => {
            // コックピット以外のパーツを削除
            const partsToRemove = this.placedParts.filter(p => p.compositeName !== 'コックピット');
            partsToRemove.forEach(p => {
                p.sprite.destroy();
                // 設計データから削除
                if (p.parts) {
                    p.parts.forEach(part => {
                        this.rocketDesign.removePart(part.id);
                    });
                }
            });
            
            // コックピットだけを残す
            this.placedParts = this.placedParts.filter(p => p.compositeName === 'コックピット');
            
            this.updateInfoPanel();
            console.log('Cleared all parts except cockpit');
        }, 0xc0392b);
        
        // テスト発射ボタン
        this.createButton(centerX - 200, 750, '🚀 テスト発射', () => {
            if (this.rocketDesign.parts.length === 0) {
                alert('パーツを配置してください！');
                return;
            }
            
            // コックピットが必須
            const cockpitCount = this.rocketDesign.parts.filter(p => p.type === 'cockpit').length;
            if (cockpitCount === 0) {
                alert('コックピットを1つ配置してください！\nコックピットがないと発射できません。');
                return;
            }
            
            const designData = this.rocketDesign.toJSON();
            console.log('Launching with design:', designData);
            
            // 発射画面遷移時の効果音を再生
            this.playTransitionSound();
            
            // トランジション効果を追加してシーン遷移（動画も含めてフェードアウト）
            this.transitionToGameScene(designData);
        }, 0x27ae60);
        
        // タイトルに戻る
        this.createButton(centerX, 750, '◀ 戻る', () => {
            // トランジション効果を追加してシーン遷移（動画も含めてフェードアウト）
            this.transitionToTitleScene();
        }, 0x7f8c8d);
        
        // お気に入りボタン
        this.createButton(centerX + 200, 750, '⭐ お気に入り', () => {
            this.playButtonSound();
            this.showFavoritesMenu();
        }, 0xf39c12);
    }
    
    /**
     * ボタンを作成
     */
    createButton(x, y, text, callback, color) {
        const button = this.add.text(x, y, text, {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#' + color.toString(16).padStart(6, '0'),
            padding: { x: 15, y: 10 },
            fontStyle: 'bold'
        });
        button.setOrigin(0.5);
        button.setInteractive({ useHandCursor: true });
        
        button.on('pointerover', () => {
            button.setScale(1.1);
        });
        
        button.on('pointerout', () => {
            button.setScale(1.0);
        });
        
        button.on('pointerdown', () => {
            // ボタンクリック時の効果音を再生
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
                volume: 0.5 // 音量50%
            });
            console.log('Button sound played');
        } else {
            console.warn('Button sound not loaded yet');
        }
    }
    
    /**
     * 発射画面遷移時の効果音を再生
     */
    playTransitionSound() {
        if (this.cache.audio.exists('scratch2')) {
            this.sound.play('scratch2', {
                volume: 0.2 // 音量50%
            });
            console.log('Transition sound (scratch2) played');
        } else {
            console.warn('Transition sound not loaded yet');
        }
    }
    
    /**
     * ゲームシーンへの遷移（動画も含めてフェードアウト）
     */
    transitionToGameScene(designData) {
        const fadeDuration = 500; // フェードアウトの時間（ミリ秒）
        
        // 会話パネルの音声読み上げを中断
        this.stopDialogue();
        
        // Phaserのカメラをフェードアウト
        this.cameras.main.fadeOut(fadeDuration, 0, 0, 0);
        
        // 動画要素もフェードアウト
        if (this.videoElement) {
            this.videoElement.style.transition = `opacity ${fadeDuration}ms ease-out`;
            this.videoElement.style.opacity = '0';
        }
        
        // フェードアウト完了後にシーン遷移
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { rocketDesign: designData });
        });
    }
    
    /**
     * タイトルシーンへの遷移（動画も含めてフェードアウト）
     */
    transitionToTitleScene() {
        const fadeDuration = 500; // フェードアウトの時間（ミリ秒）
        
        // 会話パネルの音声読み上げを中断
        this.stopDialogue();
        
        // Phaserのカメラをフェードアウト
        this.cameras.main.fadeOut(fadeDuration, 0, 0, 0);
        
        // 動画要素もフェードアウト
        if (this.videoElement) {
            this.videoElement.style.transition = `opacity ${fadeDuration}ms ease-out`;
            this.videoElement.style.opacity = '0';
        }
        
        // フェードアウト完了後にシーン遷移
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('TitleScene');
        });
    }
    
    /**
     * お気に入りメニューを表示
     */
    showFavoritesMenu() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 既に表示されている場合は何もしない
        if (this.favoritesOverlay) {
            return;
        }
        
        // 動画を非表示にする
        if (this.videoElement) {
            this.videoElement.style.transition = 'opacity 300ms ease-out';
            this.videoElement.style.opacity = '0';
            this.videoElement.style.visibility = 'hidden';
        }
        
        // お気に入りデータを取得（非同期）
        this.loadFavorites().then(favorites => {
            this.showFavoritesMenuWithData(favorites, centerX, centerY, screenWidth, screenHeight);
        });
    }
    
    /**
     * お気に入りメニューを表示（データ取得後）
     */
    showFavoritesMenuWithData(favorites, centerX, centerY, screenWidth, screenHeight) {
        
        // オーバーレイ背景（半透明の黒）
        const overlayBg = this.add.rectangle(
            centerX,
            centerY,
            screenWidth,
            screenHeight,
            0x000000,
            0.8
        );
        overlayBg.setInteractive();
        overlayBg.setDepth(2000);
        
        // メニューパネル
        const panelWidth = 800;
        const panelHeight = 600;
        const menuPanel = this.add.container(centerX, centerY);
        menuPanel.setDepth(2001);
        
        // パネル背景
        const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x2c3e50);
        panelBg.setStrokeStyle(3, 0xffffff);
        
        // タイトル
        const titleText = this.add.text(0, -250, 'お気に入り', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5);
        
        // お気に入り一覧
        const favoritesList = this.add.container(0, -50);
        
        if (favorites.length === 0) {
            const emptyText = this.add.text(0, 0, 'お気に入りがありません\n\n下部の「💾 保存」ボタンから\n現在のロケット構成を保存できます', {
                fontSize: '24px',
                fill: '#ffffff',
                align: 'center',
                wordWrap: { width: panelWidth - 100 }
            });
            emptyText.setOrigin(0.5);
            favoritesList.add(emptyText);
        } else {
            // 各お気に入り項目をボタンとして表示
            const itemButtons = [];
            favorites.forEach((fav, index) => {
                const date = new Date(fav.date || fav.createdAt || Date.now());
                const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                const yPos = -150 + (index * 70);
                
                // お気に入り項目コンテナ
                const itemContainer = this.add.container(0, yPos);
                
                // 項目ボタン（読み込み用）
                const itemButton = this.add.container(-100, 0);
                const itemBg = this.add.rectangle(0, 0, 500, 50, 0x3498db);
                itemBg.setStrokeStyle(2, 0xffffff);
                const itemText = this.add.text(0, 0, `${index + 1}. ${fav.name || '無題'} (${dateStr})`, {
                    fontSize: '20px',
                    fill: '#ffffff',
                    fontStyle: 'bold'
                });
                itemText.setOrigin(0.5);
                itemButton.add([itemBg, itemText]);
                itemButton.setSize(500, 50);
                itemButton.setInteractive({ useHandCursor: true });
                itemButton.on('pointerover', () => {
                    itemBg.setFillStyle(0x2980b9);
                });
                itemButton.on('pointerout', () => {
                    itemBg.setFillStyle(0x3498db);
                });
                itemButton.on('pointerdown', () => {
                    this.playButtonSound();
                    this.loadFavorite(fav.favoriteId || fav.id);
                });
                
                // 削除ボタン
                const deleteButton = this.add.container(250, 0);
                const deleteBg = this.add.rectangle(0, 0, 80, 50, 0xe74c3c);
                deleteBg.setStrokeStyle(2, 0xffffff);
                const deleteText = this.add.text(0, 0, '🗑️', {
                    fontSize: '24px',
                    fill: '#ffffff',
                    fontStyle: 'bold'
                });
                deleteText.setOrigin(0.5);
                deleteButton.add([deleteBg, deleteText]);
                deleteButton.setSize(80, 50);
                deleteButton.setInteractive({ useHandCursor: true });
                deleteButton.on('pointerover', () => {
                    deleteBg.setFillStyle(0xc0392b);
                });
                deleteButton.on('pointerout', () => {
                    deleteBg.setFillStyle(0xe74c3c);
                });
                deleteButton.on('pointerdown', () => {
                    this.playButtonSound();
                    this.showDeleteConfirmDialog(fav.favoriteId || fav.id, fav.name || '無題');
                });
                
                itemContainer.add([itemButton, deleteButton]);
                itemButtons.push(itemContainer);
            });
            
            favoritesList.add(itemButtons);
        }
        
        // ボタンコンテナ
        const buttonsContainer = this.add.container(0, 200);
        
        // 保存ボタン
        const saveButton = this.add.container(-200, 0);
        const saveBg = this.add.rectangle(0, 0, 200, 60, 0x27ae60);
        saveBg.setStrokeStyle(2, 0xffffff);
        const saveText = this.add.text(0, 0, '💾 保存', {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        saveText.setOrigin(0.5);
        saveButton.add([saveBg, saveText]);
        saveButton.setSize(200, 60);
        saveButton.setInteractive({ useHandCursor: true });
        saveButton.on('pointerover', () => {
            saveBg.setFillStyle(0x229954);
        });
        saveButton.on('pointerout', () => {
            saveBg.setFillStyle(0x27ae60);
        });
        saveButton.on('pointerdown', () => {
            this.playButtonSound();
            this.showSaveFavoriteDialog();
        });
        
        // 閉じるボタン
        const closeButton = this.add.container(200, 0);
        const closeBg = this.add.rectangle(0, 0, 200, 60, 0x7f8c8d);
        closeBg.setStrokeStyle(2, 0xffffff);
        const closeText = this.add.text(0, 0, '閉じる', {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        closeText.setOrigin(0.5);
        closeButton.add([closeBg, closeText]);
        closeButton.setSize(200, 60);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerover', () => {
            closeBg.setFillStyle(0x6c7a7d);
        });
        closeButton.on('pointerout', () => {
            closeBg.setFillStyle(0x7f8c8d);
        });
        closeButton.on('pointerdown', () => {
            this.playButtonSound();
            this.closeFavoritesMenu();
        });
        
        // オーバーレイ背景のクリックでも閉じる
        overlayBg.on('pointerdown', () => {
            this.closeFavoritesMenu();
        });
        
        const buttons = [saveButton, closeButton];
        buttonsContainer.add(buttons);
        
        menuPanel.add([panelBg, titleText, favoritesList, buttonsContainer]);
        
        // 参照を保存
        this.favoritesOverlay = {
            overlayBg: overlayBg,
            menuPanel: menuPanel
        };
    }
    
    /**
     * お気に入りメニューを閉じる
     */
    closeFavoritesMenu() {
        if (!this.favoritesOverlay) {
            return;
        }
        
        this.favoritesOverlay.menuPanel.destroy();
        this.favoritesOverlay.overlayBg.destroy();
        this.favoritesOverlay = null;
        
        // 動画を復活させる
        if (this.videoElement) {
            this.videoElement.style.transition = 'opacity 300ms ease-in';
            this.videoElement.style.visibility = 'visible';
            this.videoElement.style.opacity = '1';
        }
    }
    
    /**
     * お気に入り保存ダイアログを表示
     */
    showSaveFavoriteDialog() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 既に表示されている場合は何もしない
        if (this.saveFavoriteDialog) {
            return;
        }
        
        // パーツが配置されていない場合は警告
        if (this.rocketDesign.parts.length === 0) {
            this.showErrorMessage('パーツを配置してから保存してください！');
            return;
        }
        
        // オーバーレイ背景（パネル外のクリックを無効化）
        const overlayBg = this.add.rectangle(
            centerX,
            centerY,
            screenWidth,
            screenHeight,
            0x000000,
            0.5
        );
        overlayBg.setInteractive();
        overlayBg.setDepth(2099);
        // オーバーレイ背景のクリックは何もしない（パネル外の操作を無効化）
        overlayBg.on('pointerdown', () => {
            // 何もしない（パネル外のクリックを無効化）
        });
        
        // ダイアログパネル
        const dialogWidth = 600;
        const dialogHeight = 300;
        const dialogPanel = this.add.container(centerX, centerY);
        dialogPanel.setDepth(2100);
        
        // パネル背景
        const dialogBg = this.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x34495e);
        dialogBg.setStrokeStyle(3, 0xffffff);
        
        // タイトル
        const titleText = this.add.text(0, -100, 'お気に入りに保存', {
            fontSize: '36px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5);
        
        // 説明文
        const instructionText = this.add.text(0, -20, '名前を入力してください（最大20文字）', {
            fontSize: '20px',
            fill: '#ffffff'
        });
        instructionText.setOrigin(0.5);
        
        // HTMLのinput要素を作成
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const canvasRect = this.game.canvas.getBoundingClientRect();
            const containerRect = gameContainer.getBoundingClientRect();
            
            const scaleX = this.game.scale.displaySize.width / this.game.scale.gameSize.width;
            const scaleY = this.game.scale.displaySize.height / this.game.scale.gameSize.height;
            const canvasOffsetX = canvasRect.left - containerRect.left;
            const canvasOffsetY = canvasRect.top - containerRect.top;
            
            const inputX = canvasOffsetX + (centerX - 200) * scaleX;
            const inputY = canvasOffsetY + (centerY + 30) * scaleY;
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.maxLength = 20;
            nameInput.style.position = 'absolute';
            nameInput.style.left = inputX + 'px';
            nameInput.style.top = inputY + 'px';
            nameInput.style.width = (400 * scaleX) + 'px';
            nameInput.style.height = (40 * scaleY) + 'px';
            nameInput.style.fontSize = (20 * scaleX) + 'px';
            nameInput.style.textAlign = 'center';
            nameInput.style.border = '3px solid #ffffff';
            nameInput.style.borderRadius = '5px';
            nameInput.style.backgroundColor = '#1a1a2e';
            nameInput.style.color = '#ffffff';
            nameInput.style.zIndex = '2101';
            nameInput.placeholder = 'お気に入り名';
            
            gameContainer.appendChild(nameInput);
            nameInput.focus();
            
            // 保存ボタン（左側）
            const saveButton = this.add.container(-120, 100);
            const saveBg = this.add.rectangle(0, 0, 200, 50, 0x27ae60);
            saveBg.setStrokeStyle(2, 0xffffff);
            const saveText = this.add.text(0, 0, '保存', {
                fontSize: '24px',
                fill: '#ffffff',
                fontStyle: 'bold'
            });
            saveText.setOrigin(0.5);
            saveButton.add([saveBg, saveText]);
            saveButton.setSize(200, 50);
            saveButton.setInteractive({ useHandCursor: true });
            saveButton.on('pointerover', () => {
                saveBg.setFillStyle(0x229954);
            });
            saveButton.on('pointerout', () => {
                saveBg.setFillStyle(0x27ae60);
            });
            saveButton.on('pointerdown', () => {
                this.playButtonSound();
                const name = nameInput.value.trim() || '無題';
                this.saveFavorite(name);
                if (nameInput.parentNode) {
                    nameInput.parentNode.removeChild(nameInput);
                }
                if (overlayBg) {
                    overlayBg.destroy();
                }
                dialogPanel.destroy();
                this.saveFavoriteDialog = null;
                this.closeFavoritesMenu();
                this.showFavoritesMenu(); // 更新された一覧を表示
            });
            
            // キャンセルボタン（右側）
            const cancelButton = this.add.container(120, 100);
            const cancelBg = this.add.rectangle(0, 0, 200, 50, 0x7f8c8d);
            cancelBg.setStrokeStyle(2, 0xffffff);
            const cancelText = this.add.text(0, 0, 'キャンセル', {
                fontSize: '24px',
                fill: '#ffffff',
                fontStyle: 'bold'
            });
            cancelText.setOrigin(0.5);
            cancelButton.add([cancelBg, cancelText]);
            cancelButton.setSize(200, 50);
            cancelButton.setInteractive({ useHandCursor: true });
            cancelButton.on('pointerover', () => {
                cancelBg.setFillStyle(0x6c7a7d);
            });
            cancelButton.on('pointerout', () => {
                cancelBg.setFillStyle(0x7f8c8d);
            });
            cancelButton.on('pointerdown', () => {
                this.playButtonSound();
                if (nameInput.parentNode) {
                    nameInput.parentNode.removeChild(nameInput);
                }
                if (overlayBg) {
                    overlayBg.destroy();
                }
                dialogPanel.destroy();
                this.saveFavoriteDialog = null;
            });
            
            // Enterキーで保存
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.playButtonSound();
                    const name = nameInput.value.trim() || '無題';
                    this.saveFavorite(name);
                    if (nameInput.parentNode) {
                        nameInput.parentNode.removeChild(nameInput);
                    }
                    if (overlayBg) {
                        overlayBg.destroy();
                    }
                    dialogPanel.destroy();
                    this.saveFavoriteDialog = null;
                    this.closeFavoritesMenu();
                    this.showFavoritesMenu(); // 更新された一覧を表示
                }
            });
            
            dialogPanel.add([dialogBg, titleText, instructionText, saveButton, cancelButton]);
            
            // 参照を保存
            this.saveFavoriteDialog = {
                overlayBg: overlayBg,
                dialogPanel: dialogPanel,
                nameInput: nameInput
            };
        }
    }
    
    /**
     * お気に入りを保存
     */
    async saveFavorite(name) {
        try {
            // 配置されたパーツの位置情報を保存
            const placedPartsData = this.placedParts.map(p => ({
                isComposite: p.isComposite,
                groupId: p.groupId,
                compositeName: p.compositeName,
                x: p.sprite ? p.sprite.x : 0,
                y: p.sprite ? p.sprite.y : 0,
                parts: p.parts ? p.parts.map(part => ({
                    id: part.id,
                    type: part.type,
                    x: part.x,
                    y: part.y,
                    width: part.width,
                    height: part.height,
                    color: part.color,
                    mass: part.mass
                })) : []
            }));
            
            // 現在のロケット設計を保存
            const favoriteData = {
                name: name,
                design: this.rocketDesign.toJSON(),
                placedParts: placedPartsData
            };
            
            this.saveFavoriteLocal(name, favoriteData);
            
            this.showSuccessMessage(`「${name}」をお気に入りに保存しました！`);
        } catch (error) {
            console.error('Error saving favorite:', error);
            this.showErrorMessage('お気に入りの保存に失敗しました。');
        }
    }
    
    /**
     * お気に入りをローカルストレージに保存（フォールバック用）
     */
    saveFavoriteLocal(name, favoriteData) {
        const favorites = JSON.parse(localStorage.getItem('rocketFavorites') || '[]');
        const favorite = {
            id: Date.now().toString(),
            ...favoriteData,
            date: new Date().toISOString()
        };
        
        favorites.push(favorite);
        
        // 最大10件まで保存
        if (favorites.length > 10) {
            favorites.shift(); // 古いものから削除
        }
        
        localStorage.setItem('rocketFavorites', JSON.stringify(favorites));
        console.log('Favorite saved to local:', name);
    }
    
    /**
     * お気に入りを読み込み
     */
    async loadFavorite(favoriteId) {
        try {
            const favorites = await this.loadFavorites();
            const favorite = favorites.find(f => (f.favoriteId || f.id) === favoriteId);
            
            if (!favorite) {
                this.showErrorMessage('お気に入りが見つかりませんでした。');
                return;
            }
            
            // 現在のパーツをすべて削除（コックピットも含めて）
            this.placedParts.forEach(p => {
                if (p.sprite) {
                    p.sprite.destroy();
                }
                // 設計データからも削除
                if (p.parts) {
                    p.parts.forEach(part => {
                        this.rocketDesign.removePart(part.id);
                    });
                }
            });
            this.placedParts = [];
            this.rocketDesign = new RocketDesign();
            
            // 情報パネルを更新
            this.updateInfoPanel();
            
            // お気に入りからロケット設計を復元
            this.rocketDesign = RocketDesign.fromJSON(favorite.design);
            
            // 配置されたパーツを復元（表示用の位置情報のみ）
            // 注意: 設計データは既にRocketDesign.fromJSON()で復元されているため、
            // パーツを再度追加する必要はありません。ここでは表示用のスプライトのみを作成します。
            if (favorite.placedParts && favorite.placedParts.length > 0) {
                favorite.placedParts.forEach(placedPartData => {
                    // 設計データから対応するパーツを取得（IDでマッチング）
                    const designParts = placedPartData.parts.map(partData => {
                        return this.rocketDesign.parts.find(p => p.id === partData.id);
                    }).filter(p => p !== null && p !== undefined);
                    
                    if (designParts.length === 0) {
                        console.warn('No matching parts found in design for placedPart:', placedPartData.compositeName);
                        return;
                    }
                    
                    // グループコンテナを作成
                    const groupContainer = this.createCompositePartSprite(
                        designParts,
                        placedPartData.groupId,
                        placedPartData.compositeName
                    );
                    
                    // 位置を復元
                    groupContainer.x = placedPartData.x;
                    groupContainer.y = placedPartData.y;
                    
                    // グループ情報を保存
                    this.placedParts.push({
                        isComposite: placedPartData.isComposite,
                        groupId: placedPartData.groupId,
                        parts: designParts,
                        sprite: groupContainer,
                        compositeName: placedPartData.compositeName
                    });
                });
            }
            
            // コックピットが復元されていない場合は、初期コックピットを配置
            const hasCockpit = this.rocketDesign.parts.some(p => p.type === 'cockpit');
            if (!hasCockpit) {
                this.placeInitialCockpit();
            }
            
            // 情報を更新
            this.updateInfoPanel();
            
            this.closeFavoritesMenu();
            this.showSuccessMessage(`「${favorite.name}」を読み込みました！`);
        } catch (error) {
            console.error('Error loading favorite:', error);
            this.showErrorMessage('お気に入りの読み込みに失敗しました。');
        }
    }
    
    /**
     * パーツタイプからパーツクラスを取得
     */
    getPartClass(type) {
        switch (type) {
            case 'nose':
                return NosePart;
            case 'body':
                return BodyPart;
            case 'wing':
                return WingPart;
            case 'engine':
                return EnginePart;
            case 'fuelTank':
                return FuelTankPart;
            case 'cockpit':
                return CockpitPart;
            default:
                return null;
        }
    }
    
    /**
     * お気に入り読み込みダイアログを表示（削除予定）
     */
    showLoadFavoriteDialog(favorites) {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 既に表示されている場合は何もしない
        if (this.loadFavoriteDialog) {
            return;
        }
        
        // ダイアログパネル
        const dialogWidth = 700;
        const dialogHeight = 500;
        const dialogPanel = this.add.container(centerX, centerY);
        dialogPanel.setDepth(2100);
        
        // パネル背景
        const dialogBg = this.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x34495e);
        dialogBg.setStrokeStyle(3, 0xffffff);
        
        // タイトル
        const titleText = this.add.text(0, -200, 'お気に入りから読み込み', {
            fontSize: '36px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5);
        
        // お気に入り一覧
        const listContainer = this.add.container(0, 0);
        const buttons = [];
        
        favorites.forEach((fav, index) => {
            const date = new Date(fav.date);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            const yPos = -100 + (index * 60);
            
            const favButton = this.add.container(0, yPos);
            const favBg = this.add.rectangle(0, 0, 600, 50, 0x3498db);
            favBg.setStrokeStyle(2, 0xffffff);
            const favText = this.add.text(0, 0, `${fav.name || '無題'} (${dateStr})`, {
                fontSize: '24px',
                fill: '#ffffff',
                fontStyle: 'bold'
            });
            favText.setOrigin(0.5);
            favButton.add([favBg, favText]);
            favButton.setSize(600, 50);
            favButton.setInteractive({ useHandCursor: true });
            favButton.on('pointerover', () => {
                favBg.setFillStyle(0x2980b9);
            });
            favButton.on('pointerout', () => {
                favBg.setFillStyle(0x3498db);
            });
            favButton.on('pointerdown', () => {
                this.playButtonSound();
                this.loadFavorite(fav.id);
                dialogPanel.destroy();
                this.loadFavoriteDialog = null;
            });
            
            buttons.push(favButton);
        });
        
        listContainer.add(buttons);
        
        // キャンセルボタン
        const cancelButton = this.add.container(0, 200);
        const cancelBg = this.add.rectangle(0, 0, 200, 50, 0x7f8c8d);
        cancelBg.setStrokeStyle(2, 0xffffff);
        const cancelText = this.add.text(0, 0, 'キャンセル', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        cancelText.setOrigin(0.5);
        cancelButton.add([cancelBg, cancelText]);
        cancelButton.setSize(200, 50);
        cancelButton.setInteractive({ useHandCursor: true });
        cancelButton.on('pointerover', () => {
            cancelBg.setFillStyle(0x6c7a7d);
        });
        cancelButton.on('pointerout', () => {
            cancelBg.setFillStyle(0x7f8c8d);
        });
        cancelButton.on('pointerdown', () => {
            this.playButtonSound();
            dialogPanel.destroy();
            this.loadFavoriteDialog = null;
        });
        
        dialogPanel.add([dialogBg, titleText, listContainer, cancelButton]);
        
        // 参照を保存
        this.loadFavoriteDialog = {
            dialogPanel: dialogPanel
        };
    }
    
    /**
     * お気に入りを読み込む
     */
    async loadFavorites() {
        const saved = localStorage.getItem('rocketFavorites');
        return saved ? JSON.parse(saved) : [];
    }
    
    /**
     * お気に入り削除確認ダイアログを表示
     */
    showDeleteConfirmDialog(favoriteId, favoriteName) {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 既に表示されている場合は何もしない
        if (this.deleteConfirmDialog) {
            return;
        }
        
        // ダイアログパネル
        const dialogWidth = 500;
        const dialogHeight = 250;
        const dialogPanel = this.add.container(centerX, centerY);
        dialogPanel.setDepth(2200);
        
        // パネル背景
        const dialogBg = this.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x34495e);
        dialogBg.setStrokeStyle(3, 0xffffff);
        
        // メッセージ
        const messageText = this.add.text(0, -50, `「${favoriteName}」を削除しますか？`, {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: dialogWidth - 40 }
        });
        messageText.setOrigin(0.5);
        
        // 削除ボタン
        const deleteButton = this.add.container(-100, 50);
        const deleteBg = this.add.rectangle(0, 0, 150, 50, 0xe74c3c);
        deleteBg.setStrokeStyle(2, 0xffffff);
        const deleteText = this.add.text(0, 0, '削除', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        deleteText.setOrigin(0.5);
        deleteButton.add([deleteBg, deleteText]);
        deleteButton.setSize(150, 50);
        deleteButton.setInteractive({ useHandCursor: true });
        deleteButton.on('pointerover', () => {
            deleteBg.setFillStyle(0xc0392b);
        });
        deleteButton.on('pointerout', () => {
            deleteBg.setFillStyle(0xe74c3c);
        });
        deleteButton.on('pointerdown', () => {
            this.playButtonSound();
            this.deleteFavorite(favoriteId);
            dialogPanel.destroy();
            this.deleteConfirmDialog = null;
            // お気に入りメニューを更新
            this.closeFavoritesMenu();
            this.showFavoritesMenu();
        });
        
        // キャンセルボタン
        const cancelButton = this.add.container(100, 50);
        const cancelBg = this.add.rectangle(0, 0, 150, 50, 0x7f8c8d);
        cancelBg.setStrokeStyle(2, 0xffffff);
        const cancelText = this.add.text(0, 0, 'キャンセル', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        cancelText.setOrigin(0.5);
        cancelButton.add([cancelBg, cancelText]);
        cancelButton.setSize(150, 50);
        cancelButton.setInteractive({ useHandCursor: true });
        cancelButton.on('pointerover', () => {
            cancelBg.setFillStyle(0x6c7a7d);
        });
        cancelButton.on('pointerout', () => {
            cancelBg.setFillStyle(0x7f8c8d);
        });
        cancelButton.on('pointerdown', () => {
            this.playButtonSound();
            dialogPanel.destroy();
            this.deleteConfirmDialog = null;
        });
        
        dialogPanel.add([dialogBg, messageText, deleteButton, cancelButton]);
        
        // 参照を保存
        this.deleteConfirmDialog = {
            dialogPanel: dialogPanel
        };
    }
    
    /**
     * お気に入りを削除
     */
    async deleteFavorite(favoriteId) {
        try {
            this.deleteFavoriteLocal(favoriteId);
            this.showSuccessMessage('お気に入りを削除しました！');
        } catch (error) {
            console.error('Error deleting favorite:', error);
            this.showErrorMessage('お気に入りの削除に失敗しました。');
        }
    }
    
    /**
     * お気に入りをローカルストレージから削除（フォールバック用）
     */
    deleteFavoriteLocal(favoriteId) {
        const favorites = JSON.parse(localStorage.getItem('rocketFavorites') || '[]');
        const filteredFavorites = favorites.filter(f => f.id !== favoriteId && f.favoriteId !== favoriteId);
        localStorage.setItem('rocketFavorites', JSON.stringify(filteredFavorites));
        console.log('Favorite deleted from local:', favoriteId);
    }
    
    /**
     * 成功メッセージを表示
     */
    showSuccessMessage(message) {
        this.showMessage(message, 0x27ae60); // 緑色
    }
    
    /**
     * エラーメッセージを表示
     */
    showErrorMessage(message) {
        this.showMessage(message, 0xe74c3c); // 赤色
    }
    
    /**
     * メッセージウィンドウを表示
     */
    showMessage(message, color) {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 既存のメッセージがあれば削除
        if (this.messageOverlay) {
            this.messageOverlay.panel.destroy();
            this.messageOverlay = null;
        }
        
        // メッセージパネル
        const panelWidth = 500;
        const panelHeight = 200;
        const messagePanel = this.add.container(centerX, centerY);
        messagePanel.setDepth(2200);
        
        // パネル背景
        const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, color);
        panelBg.setStrokeStyle(3, 0xffffff);
        panelBg.setAlpha(0.95);
        
        // メッセージテキスト
        const messageText = this.add.text(0, 0, message, {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: panelWidth - 40 }
        });
        messageText.setOrigin(0.5);
        
        messagePanel.add([panelBg, messageText]);
        
        // 参照を保存
        this.messageOverlay = {
            panel: messagePanel
        };
        
        // 2秒後に自動的に消える
        this.time.delayedCall(2000, () => {
            if (this.messageOverlay && this.messageOverlay.panel) {
                // フェードアウトアニメーション
                this.tweens.add({
                    targets: messagePanel,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        if (this.messageOverlay && this.messageOverlay.panel) {
                            this.messageOverlay.panel.destroy();
                            this.messageOverlay = null;
                        }
                    }
                });
            }
        });
    }
    
    /**
     * MP4ファイルを再生するためのビデオ要素を作成
     * @param {string} videoPath - ビデオファイルのパス
     * @param {number} x - X座標（Phaser座標系）
     * @param {number} y - Y座標（Phaser座標系）
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {object} options - オプション（autoplay, loop, muted, volume等）
     * @returns {HTMLVideoElement} ビデオ要素
     */
    createVideoElement(videoPath, x, y, width, height, options = {}) {
        const {
            autoplay = true,
            loop = true,
            muted = false,
            volume = 1.0,
            controls = false,
            playsInline = true,
            zIndex = 10
        } = options;
        
        // ビデオ要素を作成
        const video = document.createElement('video');
        video.src = videoPath;
        video.autoplay = autoplay;
        video.loop = loop;
        video.muted = muted;
        video.volume = volume;
        video.controls = controls;
        video.playsInline = playsInline;
        video.style.position = 'absolute';
        video.style.pointerEvents = 'none'; // Phaserのイベントを妨げないように
        video.style.zIndex = zIndex.toString();
        video.style.margin = '0';
        video.style.padding = '0';
        // 位置計算が完了するまで非表示にする
        video.style.opacity = '0';
        video.style.visibility = 'hidden';
        // フェードインのトランジション効果を設定
        video.style.transition = 'opacity 0.5s ease-in';
        
        // 動画要素の位置とサイズを更新する関数
        const updateVideoPosition = () => {
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) return;
            
            const game = this.game;
            
            if (game && game.scale && game.canvas) {
                // Phaserのスケール情報を取得
                const scaleX = game.scale.displaySize.width / game.scale.gameSize.width;
                const scaleY = game.scale.displaySize.height / game.scale.gameSize.height;
                
                // キャンバスの位置を基準に計算（game-container内での相対位置）
                const canvasRect = game.canvas.getBoundingClientRect();
                const containerRect = gameContainer.getBoundingClientRect();
                
                // game-container内でのキャンバスの相対位置
                const canvasOffsetX = canvasRect.left - containerRect.left;
                const canvasOffsetY = canvasRect.top - containerRect.top;
                
                // Phaser座標系での位置を、game-container内の相対位置に変換
                // これにより、ブラウザサイズが変わってもゲーム画面内の同じ位置（Phaser座標系）に表示される
                video.style.left = (canvasOffsetX + x * scaleX) + 'px';
                video.style.top = (canvasOffsetY + y * scaleY) + 'px';
                video.style.width = (width * scaleX) + 'px';
                video.style.height = (height * scaleY) + 'px';
                
                // 位置計算が完了したら表示する（次のフレームでトランジション開始）
                requestAnimationFrame(() => {
                    video.style.visibility = 'visible';
                    requestAnimationFrame(() => {
                        video.style.opacity = '1';
                    });
                });
            } else {
                // Phaserのスケール情報が取得できない場合は従来の方法
                video.style.left = x + 'px';
                video.style.top = y + 'px';
                video.style.width = width + 'px';
                video.style.height = height + 'px';
                
                // 位置計算が完了したら表示する（次のフレームでトランジション開始）
                requestAnimationFrame(() => {
                    video.style.visibility = 'visible';
                    requestAnimationFrame(() => {
                        video.style.opacity = '1';
                    });
                });
            }
        };
        
        // 初回配置
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            // z-indexが負の値の場合は、game-containerの前に配置（UIの裏側）
            if (zIndex < 0) {
                // game-containerの親要素に追加し、game-containerの前に配置
                if (gameContainer.parentNode) {
                    gameContainer.parentNode.insertBefore(video, gameContainer);
                } else {
                    document.body.insertBefore(video, gameContainer);
                }
            } else {
                gameContainer.appendChild(video);
            }
            // 少し遅延させてPhaserのスケールが確定してから位置を計算
            setTimeout(updateVideoPosition, 100);
            // リサイズイベントに対応
            window.addEventListener('resize', updateVideoPosition);
            // リサイズリスナーを保存（クリーンアップ用）
            video._resizeHandler = updateVideoPosition;
        } else {
            // game-containerが見つからない場合はbodyに追加
            document.body.appendChild(video);
            video.style.left = x + 'px';
            video.style.top = y + 'px';
            video.style.width = width + 'px';
            video.style.height = height + 'px';
        }
        
        // エラーハンドリング
        video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            console.error('Video path:', videoPath);
        });
        
        // 再生開始
        const startPlayback = () => {
            if (autoplay) {
                video.play().catch(err => {
                    console.warn('Video autoplay failed:', err);
                    // 自動再生が失敗した場合（ブラウザのポリシー）、ユーザー操作後に再生
                    video.muted = true; // ミュートにすると自動再生できる場合がある
                    video.play().catch(e => console.error('Video play failed:', e));
                });
            }
        };
        
        // 動画の読み込みが完了してから再生を試みる
        if (video.readyState >= 2) {
            // 既に読み込まれている場合はすぐに再生
            startPlayback();
        } else {
            // 読み込み完了を待つ
            video.addEventListener('loadeddata', () => {
                console.log('Video loaded, starting playback:', videoPath);
                startPlayback();
            }, { once: true });
            
            // フォールバック: 一定時間後に再生を試みる
            setTimeout(() => {
                if (video.readyState >= 2) {
                    console.log('Video ready after timeout, starting playback:', videoPath);
                    startPlayback();
                }
            }, 1000);
        }
        
        // シーン終了時にクリーンアップ
        this.events.once('shutdown', () => {
            if (video.parentNode) {
                // リサイズリスナーを削除
                if (video._resizeHandler) {
                    window.removeEventListener('resize', video._resizeHandler);
                }
                video.pause();
                video.src = '';
                video.load();
                video.parentNode.removeChild(video);
            }
        });
        
        return video;
    }
    
    /**
     * パーツ数制限のアラートを表示
     */
    showPartLimitAlert(currentCount, newCount) {
        // 既存のアラートがあれば削除
        if (this.partLimitAlert) {
            this.partLimitAlert.destroy();
            this.partLimitAlert = null;
        }
        
        // アラート表示時の効果音を再生
        this.playAlertSound();
        
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2 - 200;
        const centerY = screenHeight / 2;
        
        // 背景パネル
        const panelWidth = 500;
        const panelHeight = 250;
        const bg = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a1a);
        bg.setStrokeStyle(3, 0xe74c3c);
        bg.setAlpha(0.95);
        bg.setDepth(1000);
        
        // タイトル
        const title = this.add.text(centerX, centerY - 80, '', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        title.setDepth(1001);
        
        // メッセージ
        const message = this.add.text(centerX, centerY - 20, 
            `総パーツ数は30個までです！\n\n現在: ${currentCount}個\n追加しようとしている: ${newCount}個\n\n`, {
            fontSize: '20px',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 8
        });
        message.setOrigin(0.5);
        message.setDepth(1001);
        
        // OKボタン
        const okButton = this.add.rectangle(centerX, centerY + 70, 150, 50, 0x3498db);
        okButton.setStrokeStyle(2, 0xffffff);
        okButton.setInteractive({ useHandCursor: true });
        okButton.setDepth(1001);
        
        const okText = this.add.text(centerX, centerY + 70, 'OK', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        okText.setOrigin(0.5);
        okText.setDepth(1002);
        
        // ホバー効果
        okButton.on('pointerover', () => {
            okButton.setFillStyle(0x2980b9);
        });
        
        okButton.on('pointerout', () => {
            okButton.setFillStyle(0x3498db);
        });
        
        // クリックで閉じる
        okButton.on('pointerdown', () => {
            if (this.partLimitAlert) {
                this.partLimitAlert.destroy();
                this.partLimitAlert = null;
            }
        });
        
        // アラート要素をグループ化して保存
        this.partLimitAlert = this.add.container(0, 0, [bg, title, message, okButton, okText]);
        this.partLimitAlert.setDepth(1000);
    }
    
    /**
     * アラート表示時の効果音を再生
     */
    playAlertSound() {
        if (this.cache.audio.exists('ng')) {
            this.sound.play('ng', {
                volume: 0.5 // 音量50%
            });
            console.log('Alert sound (ng) played');
        } else {
            console.warn('Alert sound not loaded yet');
        }
    }
}
