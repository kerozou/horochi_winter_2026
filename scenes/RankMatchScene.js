import { RocketDesign } from '../entities/RocketDesign.js';
import { getUnlockedCompositeParts } from '../entities/CompositeRocketPart.js';
import { COMPOSITE_PART_TEMPLATES } from '../entities/CompositeRocketPart.js';

/**
 * ランクマッチシーン
 * その日の0:00~23:59まで固定の5パーツだけでロケットを作成して飛ばすモード
 */
export class RankMatchScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RankMatchScene' });
        this.gridSize = 20; // グリッドサイズ
    }
    
    init() {
        console.log('RankMatchScene: init() called');
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
        
        // パーツ配置時の効果音を読み込む
        if (!this.cache.audio.exists('setti')) {
            this.load.audio('setti', 'resources/setti.mp3');
        }
        
        // パーツ削除時の効果音を読み込む
        if (!this.cache.audio.exists('cancel')) {
            this.load.audio('cancel', 'resources/cancel.mp3');
        }
        
        // コックピット画像を読み込む
        if (!this.textures.exists('horochi')) {
            this.load.image('horochi', 'resources/horochi.png');
        }
    }
    
    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        
        // 背景
        this.cameras.main.setBackgroundColor('#2c3e50');
        
        // タイトル
        const title = this.add.text(centerX, 50, '⚔️ ランクマッチ', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(100);
        
        // 説明文
        const description = this.add.text(centerX, 100, 'その日の固定パーツでロケットを作成して飛ばそう！', {
            fontSize: '20px',
            fill: '#bdc3c7',
            align: 'center'
        });
        description.setOrigin(0.5);
        description.setScrollFactor(0);
        description.setDepth(100);
        
        // 日付を取得（YYYY-MM-DD形式）
        const today = this.getTodayDateString();
        
        // その日のパーツセットを取得（5パーツ、うち1つはエンジン）
        const dailyParts = this.getDailyParts(today);
        
        // パーツパレットを作成
        this.createPartsPalette(dailyParts);
        
        // 組み立てエリアを作成
        this.createBuildArea();
        
        // コックピットを最初から中央に配置
        this.placeInitialCockpit();
        
        // 情報パネル
        this.createInfoPanel(today);
        
        // ボタン
        this.createButtons();
        
        // ドラッグ中のパーツ
        this.draggingPart = null;
        
        // その日のパーツセットを保存
        this.dailyParts = dailyParts;
        
        // BGMを再生
        this.playBGM();
        
        // フェードイン効果
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
    
    /**
     * 今日の日付を文字列で取得（YYYY-MM-DD形式）
     */
    getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * その日のパーツセットを取得（5パーツ、うち1つはエンジン）
     * 日付をシードとして使用してランダムに選択
     */
    getDailyParts(dateString) {
        // 既に保存されているパーツセットを確認
        const savedKey = `rankMatchParts_${dateString}`;
        const saved = localStorage.getItem(savedKey);
        if (saved) {
            try {
                const partsData = JSON.parse(saved);
                // パーツ名からCompositeRocketPartを復元
                const allParts = COMPOSITE_PART_TEMPLATES;
                return partsData.map(name => {
                    return allParts.find(p => p.name === name);
                }).filter(p => p !== undefined);
            } catch (e) {
                console.warn('Failed to load saved parts:', e);
            }
        }
        
        // 新しいパーツセットを生成
        const allParts = COMPOSITE_PART_TEMPLATES;
        
        // エンジン種のみを含むパーツを抽出（エンジン以外のパーツを含まない）
        const engineOnlyParts = allParts.filter(part => {
            const hasEngine = part.parts.some(p => {
                const partType = typeof p === 'object' ? p.type : p;
                return ['engine', 'superengine', 'ultralightengine', 'microengine', 'dualengine'].includes(partType);
            });
            const hasNonEngine = part.parts.some(p => {
                const partType = typeof p === 'object' ? p.type : p;
                return !['engine', 'superengine', 'ultralightengine', 'microengine', 'dualengine'].includes(partType);
            });
            return hasEngine && !hasNonEngine; // エンジンのみを含む
        });
        
        // エンジンを含まないパーツを抽出
        const nonEngineParts = allParts.filter(part => {
            return !part.parts.some(p => {
                const partType = typeof p === 'object' ? p.type : p;
                return ['engine', 'superengine', 'ultralightengine', 'microengine', 'dualengine'].includes(partType);
            });
        });
        
        // 日付をシードとして使用した疑似乱数生成器
        const seed = this.stringToSeed(dateString);
        const random = this.seededRandom(seed);
        
        // エンジン種のみのパーツから1つ選択（必須）
        if (engineOnlyParts.length === 0) {
            console.error('No engine-only parts found!');
            return [];
        }
        const selectedEngineOnlyPart = engineOnlyParts[Math.floor(random() * engineOnlyParts.length)];
        
        // エンジン以外のパーツから4つ選択
        const selectedNonEngineParts = [];
        const availableNonEngineParts = [...nonEngineParts];
        for (let i = 0; i < 4 && availableNonEngineParts.length > 0; i++) {
            const index = Math.floor(random() * availableNonEngineParts.length);
            selectedNonEngineParts.push(availableNonEngineParts.splice(index, 1)[0]);
        }
        
        // 5パーツを組み合わせ（エンジン種のみ1つ + その他4つ）
        const dailyParts = [selectedEngineOnlyPart, ...selectedNonEngineParts];
        
        // パーツ名を保存
        const partsNames = dailyParts.map(p => p.name);
        localStorage.setItem(savedKey, JSON.stringify(partsNames));
        
        console.log('Daily parts for', dateString, ':', partsNames);
        
        return dailyParts;
    }
    
    /**
     * 文字列をシード値に変換
     */
    stringToSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
    
    /**
     * シード付き疑似乱数生成器
     */
    seededRandom(seed) {
        let value = seed;
        return function() {
            value = (value * 9301 + 49297) % 233280;
            return value / 233280;
        };
    }
    
    /**
     * 組み立てエリアを作成（ロケットエディタと同じスタイル）
     */
    createBuildArea() {
        const areaX = 150;
        const areaY = 100;
        const areaWidth = 500;
        const areaHeight = 600;
        
        // 背景
        const bg = this.add.rectangle(
            areaX + areaWidth / 2,
            areaY + areaHeight / 2,
            areaWidth,
            areaHeight,
            0x34495e
        );
        bg.setStrokeStyle(3, 0xffffff);
        
        // グリッド線を描画
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x7f8c8d, 0.3);
        
        for (let x = areaX; x <= areaX + areaWidth; x += this.gridSize) {
            gridGraphics.lineBetween(x, areaY, x, areaY + areaHeight);
        }
        for (let y = areaY; y <= areaY + areaHeight; y += this.gridSize) {
            gridGraphics.lineBetween(areaX, y, areaX + areaWidth, y);
        }
        gridGraphics.strokePath();
        
        // 組み立てエリアの境界を保存
        this.buildArea = {
            x: areaX,
            y: areaY,
            width: areaWidth,
            height: areaHeight
        };
        
        // 中心線を描画（上向き基準を示す）
        const centerLine = this.add.graphics();
        centerLine.lineStyle(2, 0xe74c3c, 0.5);
        const centerX = areaX + areaWidth / 2;
        centerLine.lineBetween(centerX, areaY, centerX, areaY + areaHeight);
        centerLine.strokePath();
        
        // 矢印（上向き = 発射方向）
        centerLine.fillStyle(0xe74c3c, 0.7);
        centerLine.fillTriangle(
            centerX, areaY + 30,
            centerX - 10, areaY + 50,
            centerX + 10, areaY + 50
        );
        
        // ラベル
        this.add.text(areaX + areaWidth / 2, areaY - 25, '組み立てエリア（↑が発射方向）', {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 配置されたパーツの配列を初期化
        this.placedParts = [];
        
        // ロケット設計データを初期化
        this.rocketDesign = new RocketDesign();
    }
    
    /**
     * 最初からコックピットを中央に配置
     */
    placeInitialCockpit() {
        // コックピットを取得
        const unlockedTrophies = this.loadUnlockedTrophies();
        const allParts = getUnlockedCompositeParts(unlockedTrophies);
        this.cockpitPart = allParts[0]; // 最初はコックピット
        
        if (!this.cockpitPart || !this.buildArea) {
            console.error('Cockpit part or build area not found!');
            return;
        }
        
        try {
            // 組み立てエリアの中心位置
            const centerX = this.buildArea.x + this.buildArea.width / 2;
            const centerY = this.buildArea.y + this.buildArea.height / 2;
            
            // コックピット複合パーツを実体化
            const compositeData = this.cockpitPart.instantiate(centerX, centerY);
            const { groupId, parts, compositeName } = compositeData;
            
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
        } catch (error) {
            console.error('Error placing initial cockpit:', error);
        }
    }
    
    /**
     * パーツパレットを作成
     */
    createPartsPalette(parts) {
        const startX = 700;
        const startY = 200;
        const cellSize = 80;
        const gridCols = 5;
        
        // パレットセルを保存する配列
        this.paletteCells = [];
        
        // パレットタイトル
        this.add.text(startX + (gridCols * cellSize) / 2, startY - 30, '今日のパーツ', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 各パーツをグリッドに配置
        parts.forEach((compositePart, index) => {
            const col = index % gridCols;
            const row = Math.floor(index / gridCols);
            const x = startX + col * cellSize;
            const y = startY + row * cellSize;
            
            this.createGridPaletteItem(x, y, compositePart, cellSize, index);
        });
        
        // パーツ詳細パネルを作成
        this.createPartDetailPanel();
    }
    
    /**
     * グリッド形式のパレットアイテムを作成
     */
    createGridPaletteItem(x, y, compositePart, cellSize, index) {
        // チェッカーフラッグ風の背景色
        const col = Math.floor((x - 700) / cellSize);
        const row = Math.floor((y - 200) / cellSize);
        const isEven = (col + row) % 2 === 0;
        const bgColor = isEven ? 0x34495e : 0x2c3e50;
        
        // セル背景
        const cell = this.add.rectangle(x + cellSize / 2, y + cellSize / 2, cellSize, cellSize, bgColor);
        cell.setStrokeStyle(2, 0x3498db);
        cell.setInteractive({ useHandCursor: true });
        cell.setScrollFactor(0);
        cell.setDepth(50);
        
        // アイコン
        const iconText = this.add.text(x + cellSize / 2, y + cellSize / 2, compositePart.icon, {
            fontSize: '30px',
            fill: '#3498db',
            align: 'center'
        });
        iconText.setOrigin(0.5);
        iconText.setScrollFactor(0);
        iconText.setDepth(51);
        
        // ホバー効果
        cell.on('pointerover', () => {
            if (!cell._isUsed) {
                cell.setFillStyle(0x3498db);
                cell.setStrokeStyle(3, 0x5dade2);
            }
            this.updatePartDetailPanel(compositePart);
        });
        
        cell.on('pointerout', () => {
            if (!cell._isUsed) {
                cell.setFillStyle(bgColor);
                cell.setStrokeStyle(2, 0x3498db);
            }
        });
        
        // クリックで選択
        cell.on('pointerdown', () => {
            if (!cell._isUsed) {
                this.addCompositePartToBuildArea(compositePart, index);
            }
        });
        
        // パーツ情報を保存
        cell.compositePart = compositePart;
        cell._iconText = iconText;
        cell._bgColor = bgColor;
        cell._isUsed = false;
        cell._index = index;
        
        // パレットセルを保存
        this.paletteCells[index] = cell;
    }
    
    /**
     * パレットセルをグレーアウト
     */
    setPartUsed(index, used) {
        const cell = this.paletteCells[index];
        if (!cell) return;
        
        cell._isUsed = used;
        if (used) {
            cell.setFillStyle(0x555555);
            cell.setStrokeStyle(2, 0x666666);
            cell._iconText.setStyle({ fill: '#666666' });
        } else {
            cell.setFillStyle(cell._bgColor);
            cell.setStrokeStyle(2, 0x3498db);
            cell._iconText.setStyle({ fill: '#3498db' });
        }
    }
    
    /**
     * パーツ詳細パネルを作成
     */
    createPartDetailPanel() {
        const panelX = 700;
        const panelY = 400;
        const panelWidth = 400;
        const panelHeight = 150;
        
        // 背景
        const bg = this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, 0x1a1a1a);
        bg.setStrokeStyle(2, 0x3498db);
        bg.setAlpha(0.9);
        bg.setVisible(false);
        bg.setScrollFactor(0);
        bg.setDepth(100);
        
        // パーツ名
        const nameText = this.add.text(panelX + 10, panelY + 10, '', {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        nameText.setScrollFactor(0);
        nameText.setDepth(101);
        
        // 説明
        const descText = this.add.text(panelX + 10, panelY + 35, '', {
            fontSize: '14px',
            fill: '#bdc3c7',
            wordWrap: { width: panelWidth - 20 }
        });
        descText.setScrollFactor(0);
        descText.setDepth(101);
        
        // アイコン表示
        const iconText = this.add.text(panelX + 300, panelY + 50, '', {
            fontSize: '40px',
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
            iconText: iconText
        };
    }
    
    /**
     * パーツ詳細パネルを更新
     */
    updatePartDetailPanel(compositePart) {
        if (!this.detailPanel) {
            return;
        }
        
        this.detailPanel.bg.setVisible(true);
        this.detailPanel.nameText.setVisible(true);
        this.detailPanel.descText.setVisible(true);
        this.detailPanel.iconText.setVisible(true);
        
        this.detailPanel.nameText.setText(compositePart.name);
        this.detailPanel.descText.setText(compositePart.description);
        this.detailPanel.iconText.setText(compositePart.icon);
    }
    
    /**
     * 複合パーツを組み立てエリアに追加
     */
    addCompositePartToBuildArea(compositePart, paletteIndex) {
        // 組み立てエリアの中心位置
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
            compositeName: compositeName,
            paletteIndex: paletteIndex
        });
        
        // パレットセルをグレーアウト
        if (paletteIndex !== undefined) {
            this.setPartUsed(paletteIndex, true);
        }
        
        // 各パーツを設計データに追加
        parts.forEach(part => {
            this.rocketDesign.addPart(part);
        });
        
        // 情報を更新
        this.updateInfoPanel();
        
        // パーツ配置時の効果音を再生
        this.playPlacementSound();
    }
    
    /**
     * 複合パーツのスプライトを作成（RocketEditorSceneと同じ実装）
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
                    graphics.fillRect(
                        relativeX - part.width/2,
                        relativeY - part.height/2,
                        part.width,
                        part.height
                    );
                    graphics.fillStyle(0xf39c12);
                    graphics.fillTriangle(
                        relativeX, relativeY + part.height/2,
                        relativeX - part.width/3, relativeY + part.height/2 + 15,
                        relativeX + part.width/3, relativeY + part.height/2 + 15
                    );
                    graphics.fillStyle(0xffff00);
                    graphics.fillTriangle(
                        relativeX, relativeY - part.height/2,
                        relativeX - part.width/4, relativeY - part.height/2 + 10,
                        relativeX + part.width/4, relativeY - part.height/2 + 10
                    );
                    break;
                case 'cockpit':
                    const cockpitSprite = this.add.sprite(relativeX, relativeY, part.imageKey || 'horochi');
                    cockpitSprite.setDisplaySize(part.width, part.height);
                    groupContainer.add(cockpitSprite);
                    graphics.lineStyle(2, 0xffd93d, 0.8);
                    graphics.strokeRect(
                        relativeX - part.width/2,
                        relativeY - part.height/2,
                        part.width,
                        part.height
                    );
                    break;
            }
            
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
        
        const groupBorder = this.add.graphics();
        groupBorder.lineStyle(3, 0x3498db, 0.8);
        groupBorder.strokeRoundedRect(
            -groupWidth / 2,
            -groupHeight / 2,
            groupWidth,
            groupHeight,
            5
        );
        groupContainer.add(groupBorder);
        
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
        groupContainer.setData('groupId', groupId);
        groupContainer.setData('isComposite', true);
        groupContainer.setData('isDeletable', true);
        groupContainer.setData('compositeName', compositeName);
        
        // ドラッグイベント
        groupContainer.on('drag', (pointer, dragX, dragY) => {
            const snappedX = Math.round(dragX / this.gridSize) * this.gridSize;
            const snappedY = Math.round(dragY / this.gridSize) * this.gridSize;
            
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
            
            const deltaX = clampedX - groupContainer.x;
            const deltaY = clampedY - groupContainer.y;
            groupContainer.x = clampedX;
            groupContainer.y = clampedY;
            
            parts.forEach(part => {
                part.x += deltaX;
                part.y += deltaY;
            });
            
            this.rocketDesign.updatePhysics();
            this.updateInfoPanel();
        });
        
        // 右クリックで削除
        groupContainer.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown() && groupContainer.getData('isDeletable')) {
                this.removeCompositePart(groupContainer);
            }
        });
        
        return groupContainer;
    }
    
    /**
     * 複合パーツを削除
     */
    removeCompositePart(groupContainer) {
        const groupId = groupContainer.getData('groupId');
        
        // 配置されたパーツから削除
        const index = this.placedParts.findIndex(p => p.groupId === groupId);
        if (index !== -1) {
            const placedPart = this.placedParts[index];
            
            // パレットセルを再度有効化
            if (placedPart.paletteIndex !== undefined) {
                this.setPartUsed(placedPart.paletteIndex, false);
            }
            
            // 設計データからも削除
            placedPart.parts.forEach(part => {
                this.rocketDesign.removePart(part.id);
            });
            
            // 配列から削除
            this.placedParts.splice(index, 1);
        }
        
        // スプライトを削除
        groupContainer.destroy();
        
        // 情報を更新
        this.updateInfoPanel();
        
        // パーツ削除時の効果音を再生
        this.playCancelSound();
    }
    
    /**
     * 情報パネルを作成
     */
    createInfoPanel(today) {
        const panelX = 700;
        const panelY = 580;
        const panelWidth = 400;
        const panelHeight = 120;
        
        // 背景
        const bg = this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, 0x1a1a1a);
        bg.setStrokeStyle(2, 0x3498db);
        bg.setScrollFactor(0);
        bg.setDepth(100);
        
        // 日付表示
        const dateText = this.add.text(panelX + 10, panelY + 10, `日付: ${today}`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        dateText.setScrollFactor(0);
        dateText.setDepth(101);
        
        // パーツ数表示
        const partsCountText = this.add.text(panelX + 10, panelY + 35, 'パーツ数: 0', {
            fontSize: '16px',
            fill: '#bdc3c7'
        });
        partsCountText.setScrollFactor(0);
        partsCountText.setDepth(101);
        
        // 重量表示
        const weightText = this.add.text(panelX + 10, panelY + 60, '重量: 0', {
            fontSize: '16px',
            fill: '#bdc3c7'
        });
        weightText.setScrollFactor(0);
        weightText.setDepth(101);
        
        // 情報パネル要素を保存
        this.infoPanel = {
            bg: bg,
            dateText: dateText,
            partsCountText: partsCountText,
            weightText: weightText
        };
    }
    
    /**
     * 情報パネルを更新
     */
    updateInfoPanel() {
        if (!this.infoPanel) {
            return;
        }
        
        const partsCount = this.rocketDesign.parts.length;
        const totalWeight = this.rocketDesign.parts.reduce((sum, part) => sum + (part.mass || 1), 0);
        
        this.infoPanel.partsCountText.setText(`パーツ数: ${partsCount}`);
        this.infoPanel.weightText.setText(`重量: ${totalWeight.toFixed(1)}`);
    }
    
    /**
     * 当日のランクマッチランキングを表示（左側）
     */
    createRankMatchRanking(dateString) {
        const panelX = 50;
        const panelY = 200;
        const panelWidth = 400;
        const panelHeight = 500;
        
        // パネル背景
        const bg = this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, 0x2c3e50);
        bg.setStrokeStyle(3, 0xffffff);
        bg.setScrollFactor(0);
        bg.setDepth(100);
        
        // タイトル
        const title = this.add.text(panelX + panelWidth / 2, panelY + 20, '今日のランキング', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(101);
        
        // 日付表示
        const dateText = this.add.text(panelX + panelWidth / 2, panelY + 50, dateString, {
            fontSize: '16px',
            fill: '#bdc3c7'
        });
        dateText.setOrigin(0.5);
        dateText.setScrollFactor(0);
        dateText.setDepth(101);
        
        // ランキングデータを取得
        const rankingKey = `rankMatchRanking_${dateString}`;
        const ranking = JSON.parse(localStorage.getItem(rankingKey) || '[]');
        
        // 上位5位まで表示
        const top5 = ranking.slice(0, 5);
        
        // ランキング項目を表示
        const startY = panelY + 100;
        const itemHeight = 80;
        const itemSpacing = 10;
        
        if (top5.length === 0) {
            // 記録がない場合
            const noRecordText = this.add.text(panelX + panelWidth / 2, panelY + panelHeight / 2, 'まだ記録がありません', {
                fontSize: '20px',
                fill: '#bdc3c7',
                align: 'center'
            });
            noRecordText.setOrigin(0.5);
            noRecordText.setScrollFactor(0);
            noRecordText.setDepth(101);
        } else {
            top5.forEach((record, index) => {
                const rank = index + 1;
                const y = startY + (index * (itemHeight + itemSpacing));
                
                // メダルマーク（1,2,3位のみ）
                let medalMark = '';
                if (rank === 1) {
                    medalMark = '🥇';
                } else if (rank === 2) {
                    medalMark = '🥈';
                } else if (rank === 3) {
                    medalMark = '🥉';
                } else {
                    medalMark = `${rank}位`;
                }
                
                // ランク表示
                const rankText = this.add.text(panelX + 30, y, medalMark, {
                    fontSize: '32px',
                    fill: '#ffffff',
                    fontStyle: 'bold'
                });
                rankText.setOrigin(0, 0.5);
                rankText.setScrollFactor(0);
                rankText.setDepth(101);
                
                // ユーザー名
                const nameText = this.add.text(panelX + 100, y - 15, record.name || 'AAA', {
                    fontSize: '24px',
                    fill: '#ffffff',
                    fontStyle: 'bold'
                });
                nameText.setOrigin(0, 0.5);
                nameText.setScrollFactor(0);
                nameText.setDepth(101);
                
                // 飛距離
                const distanceText = this.add.text(panelX + 100, y + 15, `${Math.round(record.distance)}m`, {
                    fontSize: '20px',
                    fill: '#3498db',
                    fontStyle: 'bold'
                });
                distanceText.setOrigin(0, 0.5);
                distanceText.setScrollFactor(0);
                distanceText.setDepth(101);
                
                // 区切り線
                if (index < top5.length - 1) {
                    const divider = this.add.graphics();
                    divider.lineStyle(1, 0x7f8c8d, 0.5);
                    divider.lineBetween(panelX + 20, y + itemHeight / 2, panelX + panelWidth - 20, y + itemHeight / 2);
                    divider.setScrollFactor(0);
                    divider.setDepth(101);
                }
            });
        }
        
        // ランキングパネル要素を保存（更新用）
        this.rankMatchRankingPanel = {
            bg: bg,
            title: title,
            dateText: dateText
        };
    }
    
    /**
     * ボタンを作成
     */
    createButtons() {
        const centerX = this.cameras.main.width / 2;
        const buttonY = 750;
        
        // クリアボタン
        this.createButton(centerX - 200, buttonY, '🗑️ クリア', () => {
            this.clearRocket();
        }, 0xc0392b);
        
        // テスト発射ボタン
        this.createButton(centerX, buttonY, '🚀 テスト発射', () => {
            this.launchRocket();
        }, 0x27ae60);
        
        // 戻るボタン
        this.createButton(centerX + 200, buttonY, '◀ 戻る', () => {
            this.playButtonSound();
            this.scene.start('TitleScene');
        }, 0x7f8c8d);
    }
    
    /**
     * ボタンを作成
     */
    createButton(x, y, text, callback, color = 0x4ecdc4) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 180, 50, color);
        bg.setStrokeStyle(2, 0xffffff);
        
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        
        button.add([bg, buttonText]);
        button.setSize(180, 50);
        button.setInteractive({ useHandCursor: true });
        button.setScrollFactor(0);
        button.setDepth(100);
        
        button.on('pointerover', () => {
            bg.setFillStyle(color + 0x202020);
        });
        
        button.on('pointerout', () => {
            bg.setFillStyle(color);
        });
        
        button.on('pointerdown', () => {
            this.playButtonSound();
            callback();
        });
        
        return button;
    }
    
    /**
     * ロケットをクリア
     */
    clearRocket() {
        // コックピット以外を削除
        this.placedParts.forEach(placedPart => {
            if (placedPart.sprite.getData('isDeletable')) {
                this.removeCompositePart(placedPart.sprite);
            }
        });
        
        // コックピットを再配置
        this.placeInitialCockpit();
    }
    
    /**
     * ロケットを発射
     */
    launchRocket() {
        // ロケット設計データをJSONに変換
        const rocketDesignData = this.rocketDesign.toJSON();
        
        // GameSceneに遷移
        this.scene.start('GameScene', {
            rocketDesign: rocketDesignData,
            isRankMatch: true,
            dateString: this.getTodayDateString()
        });
    }
    
    /**
     * 達成済みトロフィーをロード
     */
    loadUnlockedTrophies() {
        const saved = localStorage.getItem('unlockedTrophies');
        return saved ? JSON.parse(saved) : [];
    }
    
    /**
     * パーツ配置時の効果音を再生
     */
    playPlacementSound() {
        if (this.cache.audio.exists('setti')) {
            this.sound.play('setti', { volume: 0.5 });
        }
    }
    
    /**
     * パーツ削除時の効果音を再生
     */
    playCancelSound() {
        if (this.cache.audio.exists('cancel')) {
            this.sound.play('cancel', { volume: 0.5 });
        }
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
        const existingSound = this.sound.get('bgm');
        if (existingSound && existingSound.isPlaying) {
            this.bgm = existingSound;
            return;
        }
        
        if (existingSound) {
            this.bgm = existingSound;
            this.bgm.setVolume(0.1);
            this.bgm.play();
            return;
        }
        
        if (this.cache.audio.exists('bgm')) {
            this.bgm = this.sound.add('bgm', {
                volume: 0.1,
                loop: true
            });
            this.bgm.play();
        }
    }
    
    shutdown() {
        console.log('RankMatchScene: shutdown() called');
        this.bgm = null;
    }
}

