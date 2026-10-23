import Phaser from 'phaser';
import MainScene from './MainScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 400,
  height: 600,
  backgroundColor: '#0d0d11',
  scene: MainScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);