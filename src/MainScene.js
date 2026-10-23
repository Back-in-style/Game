import Phaser from 'phaser';
import { gameState } from './gameState.js';
import {
  getAtkCost, getCritCost, getSpdCost, getPermAtkCost, getPermSpiritPowerCost,
  getFinalAtk, getFinalCritRate, getFinalAtkSpeed, getMonsterMaxHp,
  getSpiritPowerReward, getRebirthReward
} from './gameRules.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.add.rectangle(200, 140, 400, 280, 0x1e1e24);
    this.add.rectangle(200, 440, 400, 320, 0x2b2d42);
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.lineStyle(1, 0x2a2a35, 0.8);
    graphics.strokeRect(0, 0, 40, 40);
    graphics.generateTexture('bgGrid', 40, 40);
    this.bgTile = this.add.tileSprite(200, 140, 400, 280, 'bgGrid');
    this.add.rectangle(200, 225, 400, 4, 0x3d405b);

    this.versionText = this.add.text(390, 10, gameState.version, { fontSize: '10px', fill: '#888888' }).setOrigin(1, 0);
    this.stageText = this.add.text(200, 15, '', { fontSize: '18px', fill: '#00e676', fontStyle: 'bold' }).setOrigin(0.5);
    this.spiritPowerText = this.add.text(20, 40, '', { fontSize: '15px', fill: '#ffd700', fontStyle: 'bold' });
    this.karmaText = this.add.text(20, 60, '', { fontSize: '15px', fill: '#e040fb', fontStyle: 'bold' });
    this.atkText = this.add.text(20, 82, '', { fontSize: '12px', fill: '#ffffff' });
    this.critText = this.add.text(20, 98, '', { fontSize: '12px', fill: '#ffeb3b' });
    this.spdText = this.add.text(20, 114, '', { fontSize: '12px', fill: '#00e5ff' });

    this.bossTimerText = this.add.text(200, 45, '', { fontSize: '16px', fill: '#ff1744', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false);
    this.bossTimerBg = this.add.rectangle(200, 65, 200, 8, 0x555555).setVisible(false);
    this.bossTimerBar = this.add.rectangle(200, 65, 200, 8, 0xff1744).setVisible(false);
    this.btnRetryBoss = this.button(200, 265, 160, 25, 0xd90429, '⚔️ 보스 재도전', 12).setVisible(false);
    this.btnRetryBoss.on('pointerdown', () => {
      gameState.isBossFailed = false;
      gameState.stage += 1;
      this.startStage();
    });

    this.player = this.add.rectangle(80, 200, 35, 35, 0x29b6f6);
    this.playerLabel = this.add.text(80, 170, '용사', { fontSize: '12px', fill: '#ffffff' }).setOrigin(0.5);
    this.playerBounceTween = this.tweens.add({ targets: [this.player, this.playerLabel], y: '-=4', duration: 200, yoyo: true, repeat: -1 });

    this.panelTitle = this.add.text(200, 302, '', { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.panelPlaceholder = this.add.text(200, 405, '', {
      fontSize: '14px',
      fill: '#b8b8c8',
      align: 'center',
      wordWrap: { width: 340 }
    }).setOrigin(0.5);

    const tabs = [
      { id: 'stats', label: '능력치' },
      { id: 'technique', label: '공법' },
      { id: 'realm', label: '경지' },
      { id: 'artifact', label: '법보' },
      { id: 'rebirth', label: '환생' },
      { id: 'shop', label: '상점' }
    ];
    this.tabButtons = tabs.map((tab, index) => {
      const button = this.button(40 + index * 64, 575, 60, 40, 0x3d405b, tab.label, 11);
      button.on('pointerdown', () => {
        gameState.currentTab = tab.id;
        this.updateUI();
      });
      return { ...tab, button };
    });

    this.btnAtkUpgrade = this.button(200, 365, 360, 40, 0xd90429);
    this.btnCritUpgrade = this.button(200, 415, 360, 40, 0xf77f00);
    this.btnSpdUpgrade = this.button(200, 465, 360, 40, 0x00b4d8);
    this.btnPermAtkUpgrade = this.button(200, 370, 360, 38, 0x7209b7);
    this.btnPermGoldUpgrade = this.button(200, 417, 360, 38, 0x3a0ca3);
    this.btnRebirth = this.button(200, 478, 360, 44, 0xaa00ff);

    this.btnAtkUpgrade.on('pointerdown', () => this.purchaseUpgrade(getAtkCost(gameState), 'spiritPower', 'atkLevel', this.btnAtkUpgrade));
    this.btnCritUpgrade.on('pointerdown', () => {
      if (getFinalCritRate(gameState) < 100) this.purchaseUpgrade(getCritCost(gameState), 'spiritPower', 'critRateLevel', this.btnCritUpgrade);
    });
    this.btnSpdUpgrade.on('pointerdown', () => {
      if (getFinalAtkSpeed(gameState) > 100 && this.purchaseUpgrade(getSpdCost(gameState), 'spiritPower', 'atkSpeedLevel', this.btnSpdUpgrade)) this.startAutoAttackTimer();
    });
    this.btnPermAtkUpgrade.on('pointerdown', () => this.purchaseUpgrade(getPermAtkCost(gameState), 'karma', 'permAtkLevel', this.btnPermAtkUpgrade));
    this.btnPermGoldUpgrade.on('pointerdown', () => this.purchaseUpgrade(getPermSpiritPowerCost(gameState), 'karma', 'permSpiritPowerLevel', this.btnPermGoldUpgrade));
    this.btnRebirth.on('pointerdown', () => this.executeRebirth());

    this.startStage();
    this.startAutoAttackTimer();
  }

  button(x, y, width, height, color, label = '', fontSize = 14) {
    const button = this.add.rectangle(x, y, width, height, color).setInteractive({ useHandCursor: true });
    button.label = this.add.text(x, y, label, { fontSize: `${fontSize}px`, fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    return button;
  }

  purchaseUpgrade(cost, currency, level, button) {
    if (gameState[currency] < cost) return false;
    gameState[currency] -= cost;
    gameState[level] += 1;
    this.updateUI();
    this.playBtnTween(button);
    return true;
  }

  update() {
    if (gameState.playerState === 'WALKING' && this.bgTile) this.bgTile.tilePositionX += 2.5;
  }

  startStage() {
    if (this.bossCountdownTimer) {
      this.bossCountdownTimer.remove(false);
      this.bossCountdownTimer = null;
    }
    if (gameState.stage % 10 === 0 && !gameState.isBossFailed) {
      gameState.isBossStage = true;
      gameState.bossTimeLeft = 30;
      this.bossTimerText.setVisible(true);
      this.bossTimerBg.setVisible(true);
      this.bossTimerBar.setVisible(true);
      this.btnRetryBoss.setVisible(false);
      this.btnRetryBoss.label.setVisible(false);
      this.bossCountdownTimer = this.time.addEvent({ delay: 1000, callback: this.tickBossTimer, callbackScope: this, loop: true });
    } else {
      gameState.isBossStage = false;
      this.bossTimerText.setVisible(false);
      this.bossTimerBg.setVisible(false);
      this.bossTimerBar.setVisible(false);
      this.btnRetryBoss.setVisible(gameState.isBossFailed);
      this.btnRetryBoss.label.setVisible(gameState.isBossFailed);
    }
    this.spawnMonsterWithApproach();
    this.updateUI();
  }

  tickBossTimer() {
    if (!gameState.isBossStage) return;
    gameState.bossTimeLeft -= 1;
    if (gameState.bossTimeLeft <= 0) this.failBossStage();
    else this.updateBossTimerUI();
  }

  updateBossTimerUI() {
    this.bossTimerText.setText(`⚠️ BOSS TIME: ${gameState.bossTimeLeft}초`);
    this.bossTimerBar.width = 200 * (gameState.bossTimeLeft / 30);
  }

  failBossStage() {
    if (this.bossCountdownTimer) {
      this.bossCountdownTimer.remove(false);
      this.bossCountdownTimer = null;
    }
    gameState.isBossStage = false;
    gameState.isBossFailed = true;
    gameState.stage -= 1;
    gameState.killCount = 0;
    this.destroyCurrentMonster();
    const failText = this.add.text(200, 180, '❌ 보스 토벌 실패! 이전 스테이지로 후퇴합니다.', { fontSize: '13px', fill: '#ff1744', fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: failText, y: 150, alpha: 0, duration: 2000, onComplete: () => failText.destroy() });
    this.startStage();
  }

  executeRebirth() {
    const reward = getRebirthReward(gameState.stage);
    if (reward <= 0) {
      alert('환생하려면 최소 10 스테이지 이상 도달해야 합니다!');
      return;
    }
    if (!confirm(`환생하시겠습니까?\n\n[환생 보상]: 환생석 +${reward}개\n* 스테이지, 골드, 일반 강화 레벨이 초기화됩니다.`)) return;

    gameState.karma += reward;
    gameState.spiritPower = 0;
    gameState.atkLevel = 1;
    gameState.critRateLevel = 0;
    gameState.atkSpeedLevel = 0;
    gameState.stage = 1;
    gameState.killCount = 0;
    gameState.isBossFailed = false;
    this.destroyCurrentMonster();
    this.startAutoAttackTimer();
    this.startStage();
    this.playBtnTween(this.btnRebirth);
  }

  destroyCurrentMonster() {
    if (!this.currentMonster) return;
    this.currentMonster.sprite?.destroy();
    this.currentMonster.hpText?.destroy();
    this.currentMonster = null;
  }

  startAutoAttackTimer() {
    this.attackTimer?.remove(false);
    this.attackTimer = this.time.addEvent({ delay: getFinalAtkSpeed(gameState), callback: this.autoAttack, callbackScope: this, loop: true });
  }

  playBtnTween(target) {
    this.tweens.add({ targets: target, scaleX: 0.95, scaleY: 0.95, duration: 50, yoyo: true });
  }

  spawnMonsterWithApproach() {
    gameState.playerState = 'WALKING';
    this.playerBounceTween.resume();
    const isBoss = gameState.isBossStage;
    const hp = getMonsterMaxHp(gameState.stage, isBoss);
    const size = isBoss ? 60 : 40;
    const color = isBoss ? 0x9d0208 : 0xef233c;
    const sprite = this.add.rectangle(450, 200, size, size, color);
    const hpText = this.add.text(450, 160, `HP: ${hp}`, { fontSize: '12px', fill: '#ff8a80' }).setOrigin(0.5);
    this.currentMonster = { sprite, hp, maxHp: hp, hpText, isApproaching: true };
    this.tweens.add({
      targets: [sprite, hpText], x: 280, duration: 500,
      onComplete: () => {
        if (this.currentMonster) this.currentMonster.isApproaching = false;
        gameState.playerState = 'ATTACKING';
        this.playerBounceTween.pause();
      }
    });
  }

  autoAttack() {
    if (!this.currentMonster || this.currentMonster.hp <= 0 || this.currentMonster.isApproaching) return;
    const isCrit = Math.random() * 100 < getFinalCritRate(gameState);
    let damage = getFinalAtk(gameState);
    if (isCrit) damage = Math.floor(damage * (gameState.baseCritDmg / 100));
    const slash = this.add.rectangle(this.player.x + 20, this.player.y, 20, 6, isCrit ? 0xffea00 : 0x00e5ff);
    this.tweens.add({
      targets: slash, x: this.currentMonster.sprite.x, duration: 100,
      onComplete: () => { slash.destroy(); this.damageMonster(damage, isCrit); }
    });
  }

  damageMonster(amount, isCrit) {
    if (!this.currentMonster) return;
    this.currentMonster.hp -= amount;
    const dmgText = this.add.text(
      this.currentMonster.sprite.x + Math.floor(Math.random() * 20 - 10), 130,
      isCrit ? `💥 ${amount}!` : `-${amount}`,
      { fontSize: isCrit ? '22px' : '16px', fill: isCrit ? '#ff1744' : '#ffeb3b', fontStyle: 'bold' }
    ).setOrigin(0.5);
    this.tweens.add({ targets: dmgText, y: 90, alpha: 0, duration: isCrit ? 600 : 400, onComplete: () => dmgText.destroy() });
    if (this.currentMonster.hp > 0) this.currentMonster.hpText.setText(`HP: ${this.currentMonster.hp}`);
    else this.killMonster();
    this.updateUI();
  }

  killMonster() {
    const isBoss = gameState.isBossStage;
    gameState.spiritPower += getSpiritPowerReward(gameState.stage, isBoss, gameState.permSpiritPowerLevel);
    this.destroyCurrentMonster();
    if (isBoss) {
      this.bossCountdownTimer?.remove(false);
      this.bossCountdownTimer = null;
      gameState.stage += 1;
      gameState.killCount = 0;
      this.startStage();
    } else {
      gameState.killCount += 1;
      if (gameState.killCount >= gameState.maxKills) {
        gameState.stage += 1;
        gameState.killCount = 0;
        this.startStage();
      } else {
        this.updateUI();
        this.time.delayedCall(200, () => this.spawnMonsterWithApproach());
      }
    }
  }

  updateUI() {
    if (gameState.isBossStage) {
      this.stageText.setText(`⚠️ STAGE ${gameState.stage} [BOSS] ⚠️`);
      this.updateBossTimerUI();
    } else {
      this.stageText.setText(`STAGE ${gameState.stage} (${gameState.killCount}/${gameState.maxKills})`);
    }
    this.spiritPowerText.setText(`영력: ${gameState.spiritPower.toLocaleString()}`);
    this.karmaText.setText(`업: ${gameState.karma.toLocaleString()}`);
    this.atkText.setText(`공격력: ${getFinalAtk(gameState)} (일반 Lv.${gameState.atkLevel} / 영구 +${gameState.permAtkLevel * 10}%)`);
    this.critText.setText(`치명타: ${getFinalCritRate(gameState)}% (Lv.${gameState.critRateLevel})`);
    this.spdText.setText(`공격속도: ${(1000 / getFinalAtkSpeed(gameState)).toFixed(2)}회/초 (Lv.${gameState.atkSpeedLevel})`);

    const selectedTab = this.tabButtons.find((tab) => tab.id === gameState.currentTab) ?? this.tabButtons[0];
    gameState.currentTab = selectedTab.id;
    for (const tab of this.tabButtons) {
      tab.button.setFillStyle(tab.id === selectedTab.id ? 0x4cc9f0 : 0x3d405b);
    }

    const isStatsTab = selectedTab.id === 'stats';
    const isRebirthTab = selectedTab.id === 'rebirth';
    this.panelTitle.setText(selectedTab.label);
    this.panelPlaceholder.setVisible(!isStatsTab && !isRebirthTab);
    this.panelPlaceholder.setText(
      selectedTab.id === 'shop'
        ? '상점은 추후 구현 예정입니다.'
        : '이 기능은 다음 구현 단계에서 추가됩니다.'
    );
    this.setButtonVisible(this.btnAtkUpgrade, isStatsTab);
    this.setButtonVisible(this.btnCritUpgrade, isStatsTab);
    this.setButtonVisible(this.btnSpdUpgrade, isStatsTab);
    this.setButtonVisible(this.btnPermAtkUpgrade, isRebirthTab);
    this.setButtonVisible(this.btnPermGoldUpgrade, isRebirthTab);
    this.setButtonVisible(this.btnRebirth, isRebirthTab);
    this.btnAtkUpgrade.label.setText(`공격력 강화 - ${getAtkCost(gameState).toLocaleString()} 영력`);
    this.btnCritUpgrade.label.setText(getFinalCritRate(gameState) >= 100 ? '치명타 확률 - MAX' : `치명타 확률 강화 - ${getCritCost(gameState).toLocaleString()} 영력`);
    this.btnSpdUpgrade.label.setText(getFinalAtkSpeed(gameState) <= 100 ? '공격 속도 - MAX' : `공격 속도 강화 - ${getSpdCost(gameState).toLocaleString()} 영력`);
    this.btnPermAtkUpgrade.label.setText(`영구 공격력 (+10%) - ${getPermAtkCost(gameState)} 업 (Lv.${gameState.permAtkLevel})`);
    this.btnPermGoldUpgrade.label.setText(`영구 영력 획득량 (+15%) - ${getPermSpiritPowerCost(gameState)} 업 (Lv.${gameState.permSpiritPowerLevel})`);

    const reward = getRebirthReward(gameState.stage);
    this.btnRebirth.label.setText(reward > 0 ? `🌀 환생하기 (+${reward.toLocaleString()} 업)` : '🌀 환생 불가 (10 스테이지 이상부터 가능)');
    this.btnRebirth.setFillStyle(reward > 0 ? 0xaa00ff : 0x555555);
  }

  setButtonVisible(button, visible) {
    button.setVisible(visible);
    button.label.setVisible(visible);
  }
}