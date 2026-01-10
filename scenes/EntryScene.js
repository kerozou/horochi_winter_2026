/**
 * エントリーシーン（最初に表示される画面）
 */
export class EntryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EntryScene' });
    }
    
    create() {
        console.log('EntryScene: create() called');
        
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 背景（黒塗り）
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000); // 黒色
        graphics.fillRect(0, 0, screenWidth, screenHeight);
        
        // タイトルロゴ
        const title = this.add.text(
            centerX,
            centerY - 100,
            'ブラウザプレイ推奨',
            {
                fontSize: '72px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        title.setOrigin(0.5);
        
        // サブタイトル
        const subtitle = this.add.text(
            centerX,
            centerY - 30,
            'マウスで遊べます',
            {
                fontSize: '32px',
                fill: '#ffffff',
                fontStyle: 'italic'
            }
        );
        subtitle.setOrigin(0.5);
        
        // 音量注意の表示
        const volumeWarning = this.add.text(
            centerX,
            centerY + 50,
            '※音量注意',
            {
                fontSize: '24px',
                fill: '#ffeb3b',
                fontStyle: 'bold',
                stroke: '#ff9800',
                strokeThickness: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                padding: { x: 20, y: 10 }
            }
        );
        volumeWarning.setOrigin(0.5);
        
        // 点滅アニメーション（音量注意）
        this.tweens.add({
            targets: volumeWarning,
            alpha: { from: 1, to: 0.5 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // ゲームをプレイボタン
        const playButton = this.createButton(
            centerX,
            centerY + 150,
            'ゲームをプレイ',
            () => {
                console.log('Transitioning to TitleScene...');
                this.transitionToTitle();
            }
        );
        
        // アニメーション効果（タイトル）
        this.tweens.add({
            targets: title,
            scale: { from: 0.8, to: 1.0 },
            duration: 1000,
            ease: 'Back.easeOut'
        });
        
        // フェードイン効果
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
    
    /**
     * ボタンを作成
     */
    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        // ボタン背景
        const bg = this.add.rectangle(0, 0, 400, 70, 0x4ecdc4);
        bg.setStrokeStyle(4, 0xffffff);
        
        // ボタンテキスト
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        
        button.add([bg, buttonText]);
        button.setSize(400, 70);
        button.setInteractive({ useHandCursor: true });
        
        // ホバー効果
        button.on('pointerover', () => {
            bg.setFillStyle(0x3ab5dd);
            this.tweens.add({
                targets: button,
                scale: 1.1,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        button.on('pointerout', () => {
            bg.setFillStyle(0x4ecdc4);
            this.tweens.add({
                targets: button,
                scale: 1.0,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        // クリックイベント
        button.on('pointerdown', () => {
            this.tweens.add({
                targets: button,
                scale: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: callback
            });
        });
        
        return button;
    }
    
    /**
     * タイトルシーンへの遷移（フェードアウト）
     */
    transitionToTitle() {
        const fadeDuration = 500; // フェードアウトの時間（ミリ秒）
        
        // Phaserのカメラをフェードアウト
        this.cameras.main.fadeOut(fadeDuration, 0, 0, 0);
        
        // フェードアウト完了後にシーン遷移
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('TitleScene');
        });
    }
    
    /**
     * シーンが停止する時のクリーンアップ
     */
    shutdown() {
        console.log('EntryScene: shutdown() called');
        // エントリーシーンは静的なUIのみなので、特別なクリーンアップは不要
        // Phaserが自動的にゲームオブジェクトをクリーンアップします
    }
}

