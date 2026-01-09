/**
 * GIFファイルをスプライトシートに変換するユーティリティ
 * 注意: このスクリプトはNode.js環境で実行する必要があります
 * 必要なパッケージ: npm install gif-frames canvas
 */

// このファイルは参考用です
// 実際の変換は外部ツール（例: TexturePacker、Shoebox、オンラインツール）を使用することを推奨します

/**
 * GIFをスプライトシートに変換する手順:
 * 
 * 1. オンラインツールを使用:
 *    - https://ezgif.com/split (GIFをフレームに分割)
 *    - https://www.codeandweb.com/texturepacker (スプライトシート作成)
 *    - https://www.leshylabs.com/apps/sstool/ (オンラインスプライトシートツール)
 * 
 * 2. 手動で作成:
 *    - GIFをフレームごとに分割
 *    - フレームを1つの画像に配置（横並びまたはグリッド）
 *    - JSONファイルを作成してフレーム情報を定義
 * 
 * 3. JSONファイルの形式（Phaser 3用）:
 * {
 *   "frames": [
 *     {
 *       "filename": "frame_0.png",
 *       "frame": { "x": 0, "y": 0, "w": 100, "h": 100 },
 *       "rotated": false,
 *       "trimmed": false,
 *       "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
 *       "sourceSize": { "w": 100, "h": 100 }
 *     },
 *     ...
 *   ],
 *   "meta": {
 *     "app": "Phaser 3",
 *     "version": "1.0",
 *     "image": "sprite_sheet.png",
 *     "size": { "w": 1000, "h": 100 },
 *     "scale": "1"
 *   }
 * }
 */

export const createSpriteSheetJSON = (frameCount, frameWidth, frameHeight, imageName) => {
    const frames = [];
    for (let i = 0; i < frameCount; i++) {
        frames.push({
            filename: `frame_${i}.png`,
            frame: {
                x: i * frameWidth,
                y: 0,
                w: frameWidth,
                h: frameHeight
            },
            rotated: false,
            trimmed: false,
            spriteSourceSize: {
                x: 0,
                y: 0,
                w: frameWidth,
                h: frameHeight
            },
            sourceSize: {
                w: frameWidth,
                h: frameHeight
            }
        });
    }
    
    return {
        frames: frames,
        meta: {
            app: "Phaser 3",
            version: "1.0",
            image: imageName,
            size: {
                w: frameCount * frameWidth,
                h: frameHeight
            },
            scale: "1"
        }
    };
};

