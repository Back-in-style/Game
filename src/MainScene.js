import Phaser from 'phaser';
import { gameState } from './gameState.js';
import {
  getAtkCost, getCritCost, getHealthCost, getRecoveryCost, getRecoveryAmount,
  getCritDamageCost, getSpdCost, getMoveSpeedCost,
  getPermAtkCost, getPermSpiritPowerCost,
  getConstitution, getConstitutionCost, CONSTITUTIONS,
  getTechnique, getTechniqueUpgradeCost, getTechniqueEvolutionForRealm, getTechniqueEffectMultiplier,
  TECHNIQUES, MAX_TECHNIQUE_LEVEL,
  ARTIFACTS, ARTIFACT_TIERS, getArtifact, getArtifactBonuses, getArtifactDrop, getArtifactDropRate,
  ROUND_MONSTER_COUNT, MONSTER_SPAWN_COUNT, BOSS_SPAWN_COUNT,
  MONSTER_ATTACK_RANGE, BOSS_MONSTER_ATTACK_RANGE, getMonsterFormationLaneIndexes,
  getMonsterFormationAssignments, getMonsterLaneX, getPlayerAttackRange,
  MONSTER_GROUP_ENTRY_OFFSET, MONSTER_GROUP_ENTRY_DURATION, MONSTER_FORMATION_SHIFT_DURATION,
  formatNumberShort,
  getFinalAtk, getFinalCritRate, getFinalCritDamage, getFinalMaxHealth, getFinalAtkSpeed,
  getRealmPromotionRound, getMonsterApproachDuration, getMonsterMaxHp, getMonsterAttackDamage,
  REALM_NAMES, REALM_MULTIPLIERS,
  getSpiritPowerReward, getProgressAfterMonsterDefeat, getRebirthResetState, getDeathRecoveryState
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
    this.playerHealthText = this.add.text(20, 132, '', { fontSize: '12px', fill: '#ff8a80' });
    this.playerHealthBarBg = this.add.rectangle(155, 140, 225, 8, 0x555555).setOrigin(0, 0.5);
    this.playerHealthBar = this.add.rectangle(155, 140, 225, 8, 0x4caf50).setOrigin(0, 0.5);

    this.player = this.add.rectangle(80, 200, 35, 35, 0x29b6f6);
    this.playerLabel = this.add.text(80, 170, '플레이어', { fontSize: '12px', fill: '#ffffff' }).setOrigin(0.5);

    this.panelTitle = this.add.text(200, 302, '', { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.panelPlaceholder = this.add.text(200, 405, '', {
      fontSize: '14px',
      fill: '#b8b8c8',
      align: 'center',
      wordWrap: { width: 340 }
    }).setOrigin(0.5);
    this.techniqueInfo = this.add.text(200, 335, '', {
      fontSize: '12px',
      fill: '#d8d8e8',
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: 350 }
    }).setOrigin(0.5).setVisible(false);
    this.realmInfo = this.add.text(200, 400, '', {
      fontSize: '14px',
      fill: '#d8d8e8',
      align: 'center',
      lineSpacing: 10,
      wordWrap: { width: 340 }
    }).setOrigin(0.5).setVisible(false);
    this.artifactInfo = this.add.text(200, 425, '', {
      fontSize: '12px',
      fill: '#d8d8e8',
      align: 'left',
      lineSpacing: 8,
      wordWrap: { width: 340 }
    }).setOrigin(0.5).setVisible(false);
    this.statsScrollHint = this.add.text(200, 326, '휠 또는 드래그하여 스크롤', {
      fontSize: '10px',
      fill: '#9292a5'
    }).setOrigin(0.5);
    this.statsScrollTrack = this.add.rectangle(376, 441, 4, 194, 0x171820).setVisible(false);
    this.statsScrollThumb = this.add.rectangle(376, 390, 4, 90, 0x74748a).setVisible(false);

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

    this.statsViewport = { left: 20, right: 380, top: 340, bottom: 542 };
    const statsViewportGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    statsViewportGraphics.fillStyle(0xffffff);
    statsViewportGraphics.fillRect(
      this.statsViewport.left,
      this.statsViewport.top,
      this.statsViewport.right - this.statsViewport.left,
      this.statsViewport.bottom - this.statsViewport.top
    );
    this.statsPanel = this.add.container(0, 0);
    this.statsPanel.setMask(statsViewportGraphics.createGeometryMask());
    this.statsUpgradeButtons = [
      { key: 'atkLevel', cost: getAtkCost, color: 0xd90429, y: 360 },
      { key: 'healthLevel', cost: getHealthCost, color: 0x43a047, y: 406 },
      { key: 'recoveryLevel', cost: getRecoveryCost, color: 0x8bc34a, y: 452 },
      { key: 'critRateLevel', cost: getCritCost, color: 0xf77f00, y: 498 },
      { key: 'critDamageLevel', cost: getCritDamageCost, color: 0xe53935, y: 544 },
      { key: 'atkSpeedLevel', cost: getSpdCost, color: 0x00b4d8, y: 590 },
      { key: 'moveSpeedLevel', cost: getMoveSpeedCost, color: 0x00897b, y: 636 }
    ].map((stat) => {
      const button = this.button(198, stat.y, 330, 38, stat.color);
      this.statsPanel.add([button, button.label]);
      button.on('pointerup', (pointer) => {
        if (this.statsDragMoved || !this.isWithinStatsViewport(pointer)) return;
        this.purchaseStatUpgrade(stat, button);
      });
      return { ...stat, button };
    });

    this.btnPermAtkUpgrade = this.button(200, 370, 360, 38, 0x7209b7);
    this.btnPermGoldUpgrade = this.button(200, 420, 360, 38, 0x3a0ca3);
    this.btnRebirth = this.button(200, 485, 360, 44, 0xaa00ff);
    this.btnRebirthUpgradesTab = this.button(110, 345, 170, 30, 0x3d405b, '영구 강화·환생', 11);
    this.btnConstitutionTab = this.button(290, 345, 170, 30, 0x3d405b, '체질', 11);
    this.constitutionInfo = this.add.text(200, 375, '', {
      fontSize: '12px',
      fill: '#d8d8e8',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
    this.constitutionButtons = CONSTITUTIONS.map((constitution, index) => {
      const button = this.button(200, 414 + index * 44, 360, 36, 0x7209b7, '', 11);
      button.on('pointerdown', () => this.purchaseConstitution(constitution.id, button));
      return { ...constitution, button };
    });
    this.techniqueChoiceButtons = TECHNIQUES.map((technique, index) => {
      const button = this.button(200, 376 + index * 44, 360, 36, 0x3d405b, '', 11);
      button.on('pointerdown', () => this.chooseTechniqueForRebirth(technique.id, button));
      return { ...technique, button };
    });
    this.btnTechniqueUpgrade = this.button(200, 490, 360, 40, 0x7209b7);
    this.btnTechniqueUpgrade.on('pointerdown', () => this.purchaseTechniqueUpgrade());
    this.btnCancelRebirth = this.button(200, 525, 170, 30, 0x555555, '환생 취소', 11);
    this.btnCancelRebirth.on('pointerdown', () => this.cancelRebirthSelection());
    this.rebirthSubTab = 'upgrades';
    this.rebirthSelectionPending = false;
    this.pendingAutomaticRebirth = false;
    this.rebirthPausedCombat = false;
    this.activeMonsters = [];
    this.monsterAttackTimers = [];
    this.spawnGroupOffset = 0;

    this.btnPermAtkUpgrade.on('pointerdown', () => this.purchaseUpgrade(getPermAtkCost(gameState), 'karma', 'permAtkLevel', this.btnPermAtkUpgrade));
    this.btnPermGoldUpgrade.on('pointerdown', () => this.purchaseUpgrade(getPermSpiritPowerCost(gameState), 'karma', 'permSpiritPowerLevel', this.btnPermGoldUpgrade));
    this.btnRebirth.on('pointerdown', () => this.executeRebirth());
    this.btnRebirthUpgradesTab.on('pointerdown', () => {
      this.rebirthSubTab = 'upgrades';
      this.updateUI();
    });
    this.btnConstitutionTab.on('pointerdown', () => {
      this.rebirthSubTab = 'constitution';
      this.updateUI();
    });

    this.input.on('wheel', this.handleStatsWheel, this);
    this.input.on('pointerdown', this.beginStatsScroll, this);
    this.input.on('pointermove', this.moveStatsScroll, this);
    this.input.on('pointerup', this.endStatsScroll, this);
    this.input.on('pointerupoutside', this.endStatsScroll, this);

    this.createDeveloperPanel();
    this.input.keyboard.on('keydown-F2', this.toggleDeveloperPanel, this);
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.devPanelOpen) this.setDeveloperPanelOpen(false);
    });

    this.startStage();
    this.startAutoAttackTimer();
  }

  createDeveloperPanel() {
    this.devPanel = this.add.container(0, 0).setDepth(100).setVisible(false);
    this.devPanel.add(
      this.add.rectangle(200, 300, 400, 600, 0x090a10, 0.96).setInteractive()
    );
    this.devPanel.add(
      this.add.text(200, 30, '테스트 조정 도구', {
        fontSize: '20px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5)
    );
    this.devPanel.add(
      this.add.text(200, 58, 'F2 또는 닫기로 돌아가기 · 변경값은 새로고침 시 초기화', {
        fontSize: '10px',
        fill: '#b8b8c8'
      }).setOrigin(0.5)
    );

    const closeButton = this.button(355, 30, 70, 28, 0x555555, '닫기', 11);
    closeButton.on('pointerdown', () => this.setDeveloperPanelOpen(false));
    this.devPanel.add([closeButton, closeButton.label]);

    this.devRows = [
      { key: 'spiritPower', label: '영력', step: 10000, min: 0, max: Number.MAX_SAFE_INTEGER },
      { key: 'karma', label: '업', step: 10, min: 0, max: Number.MAX_SAFE_INTEGER },
      { key: 'stage', label: '스테이지', step: 1, min: 1, max: 1000 },
      { key: 'round', label: '라운드', step: 1, min: 1, max: 25 },
      { key: 'atkLevel', label: '공격력 Lv', step: 1, min: 1, max: 10000 },
      { key: 'healthLevel', label: '체력 Lv', step: 1, min: 0, max: 10000 },
      { key: 'recoveryLevel', label: '회복 Lv', step: 1, min: 0, max: 10000 },
      { key: 'critRateLevel', label: '치명타 확률 Lv', step: 1, min: 0, max: 600 },
      { key: 'critDamageLevel', label: '치명타 피해 Lv', step: 1, min: 0, max: 350 },
      { key: 'atkSpeedLevel', label: '공격속도 Lv', step: 1, min: 0, max: 1000 },
      { key: 'moveSpeedLevel', label: '이동속도 Lv', step: 1, min: 0, max: 1000 }
    ].map((row, index) => {
      const y = 105 + index * 37;
      const label = this.add.text(35, y, row.label, {
        fontSize: '12px',
        fill: '#d8d8e8'
      }).setOrigin(0, 0.5);
      const value = this.add.text(240, y, '', {
        fontSize: '12px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      const decrease = this.button(300, y, 38, 26, 0x555555, '−', 15);
      const increase = this.button(355, y, 38, 26, 0x3d405b, '+', 15);
      decrease.on('pointerdown', () => this.adjustDeveloperValue(row, -1));
      increase.on('pointerdown', () => this.adjustDeveloperValue(row, 1));
      this.devPanel.add([label, value, decrease, decrease.label, increase, increase.label]);
      return { ...row, value };
    });

    const healButton = this.button(110, 493, 160, 34, 0x2e7d32, '체력 회복', 12);
    healButton.on('pointerdown', () => {
      gameState.currentHealth = getFinalMaxHealth(gameState);
      this.updateUI();
    });
    const rebirthButton = this.button(290, 493, 180, 34, 0x6a1b9a, '', 11);
    rebirthButton.on('pointerdown', () => {
      gameState.rebirthUnlocked = !gameState.rebirthUnlocked;
      this.updateUI();
    });
    const restartButton = this.button(200, 540, 340, 34, 0x3d405b, '현재 스테이지에서 전투 재시작', 12);
    restartButton.on('pointerdown', () => this.restartTestCombat());
    this.devPanel.add([
      healButton, healButton.label,
      rebirthButton, rebirthButton.label,
      restartButton, restartButton.label
    ]);
    this.devRebirthButton = rebirthButton;
    this.updateDeveloperPanel();
  }

  toggleDeveloperPanel() {
    this.setDeveloperPanelOpen(!this.devPanelOpen);
  }

  setDeveloperPanelOpen(isOpen) {
    this.devPanelOpen = isOpen;
    this.devPanel.setVisible(isOpen);
    if (!isOpen) this.updateUI();
  }

  updateDeveloperPanel() {
    if (!this.devRows) return;
    for (const row of this.devRows) {
      row.value.setText(formatNumberShort(gameState[row.key]));
    }
    this.devRebirthButton.label.setText(
      `환생 ${gameState.rebirthUnlocked ? '해금됨' : '잠김'} · 토글`
    );
  }

  adjustDeveloperValue(row, direction) {
    const nextValue = Phaser.Math.Clamp(
      gameState[row.key] + row.step * direction,
      row.min,
      row.max
    );
    if (nextValue === gameState[row.key]) return;
    gameState[row.key] = nextValue;

    if (row.key === 'stage' || row.key === 'round') {
      gameState.roundMonsterKills = 0;
      gameState.isBossStage = false;
      this.restartTestCombat();
      return;
    }

    if (row.key === 'healthLevel') {
      gameState.currentHealth = Math.min(gameState.currentHealth, getFinalMaxHealth(gameState));
    }
    if (row.key === 'atkSpeedLevel') this.startAutoAttackTimer();
    if (row.key === 'moveSpeedLevel') this.restartTestCombat();
    this.updateUI();
  }

  restartTestCombat() {
    this.rebirthSelectionPending = false;
    this.pendingAutomaticRebirth = false;
    this.rebirthPausedCombat = false;
    gameState.isPlayerAlive = true;
    gameState.playerState = 'WALKING';
    gameState.currentHealth = getFinalMaxHealth(gameState);
    gameState.roundMonsterKills = 0;
    gameState.isBossStage = false;
    this.destroyCurrentMonster();
    this.startAutoAttackTimer();
    this.startStage();
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

  purchaseStatUpgrade(stat, button) {
    const cost = stat.cost(gameState);
    const maxed = this.isStatMaxed(stat.key);
    if (maxed || !this.purchaseUpgrade(cost, 'spiritPower', stat.key, button)) return;

    if (stat.key === 'healthLevel') {
      gameState.currentHealth = Math.min(
        getFinalMaxHealth(gameState),
        gameState.currentHealth + 20
      );
    } else if (stat.key === 'atkSpeedLevel') {
      this.startAutoAttackTimer();
    }
    this.updateUI();
  }

  purchaseConstitution(constitutionId, button) {
    if (gameState.constitution) return false;
    const cost = getConstitutionCost(constitutionId);
    if (gameState.karma < cost) return false;

    gameState.karma -= cost;
    gameState.constitution = constitutionId;
    gameState.currentHealth = Math.min(gameState.currentHealth, getFinalMaxHealth(gameState));
    this.updateUI();
    this.playBtnTween(button);
    return true;
  }

  purchaseTechniqueUpgrade() {
    if (!gameState.technique || gameState.techniqueLevel >= MAX_TECHNIQUE_LEVEL) return false;
    const cost = getTechniqueUpgradeCost(gameState);
    if (gameState.spiritPower < cost) return false;

    gameState.spiritPower -= cost;
    gameState.techniqueLevel += 1;
    this.updateUI();
    this.playBtnTween(this.btnTechniqueUpgrade);
    return true;
  }

  isStatMaxed(statKey) {
    if (statKey === 'critRateLevel') return gameState.critRateLevel >= 600;
    if (statKey === 'critDamageLevel') return getFinalCritDamage(gameState) >= 500;
    if (statKey === 'atkSpeedLevel') return getFinalAtkSpeed(gameState) <= 100;
    if (statKey === 'moveSpeedLevel') return getMonsterApproachDuration(gameState) <= 150;
    return false;
  }

  isWithinStatsViewport(pointer) {
    const { left, right, top, bottom } = this.statsViewport;
    return pointer.worldX >= left && pointer.worldX <= right
      && pointer.worldY >= top && pointer.worldY <= bottom;
  }

  handleStatsWheel(pointer, _gameObjects, _deltaX, deltaY) {
    if (gameState.currentTab !== 'stats' || !this.isWithinStatsViewport(pointer)) return;
    this.scrollStatsBy(deltaY * 0.5);
  }

  beginStatsScroll(pointer) {
    if (gameState.currentTab !== 'stats' || !this.isWithinStatsViewport(pointer)) return;
    this.statsDragging = true;
    this.statsDragMoved = false;
    this.statsDragStartY = pointer.worldY;
    this.statsDragStartOffset = this.statsScrollOffset ?? 0;
  }

  moveStatsScroll(pointer) {
    if (!this.statsDragging || !pointer.isDown) return;
    const delta = pointer.worldY - this.statsDragStartY;
    if (Math.abs(delta) > 6) this.statsDragMoved = true;
    if (this.statsDragMoved) this.setStatsScrollOffset(this.statsDragStartOffset - delta);
  }

  endStatsScroll() {
    this.statsDragging = false;
  }

  scrollStatsBy(amount) {
    this.setStatsScrollOffset((this.statsScrollOffset ?? 0) + amount);
  }

  setStatsScrollOffset(offset) {
    const contentBottom = this.statsUpgradeButtons.at(-1).button.y + 19;
    const maxOffset = Math.max(0, contentBottom - this.statsViewport.bottom);
    this.statsScrollOffset = Phaser.Math.Clamp(offset, 0, maxOffset);
    this.statsPanel.y = -this.statsScrollOffset;

    const trackHeight = this.statsViewport.bottom - this.statsViewport.top - 8;
    const contentHeight = contentBottom - this.statsViewport.top;
    const thumbHeight = Math.max(34, trackHeight * (trackHeight / contentHeight));
    const thumbTravel = trackHeight - thumbHeight;
    const thumbProgress = maxOffset === 0 ? 0 : this.statsScrollOffset / maxOffset;
    this.statsScrollThumb.setSize(4, thumbHeight);
    this.statsScrollThumb.setPosition(
      376,
      this.statsViewport.top + 4 + thumbHeight / 2 + thumbTravel * thumbProgress
    );
  }

  update(_time, delta) {
    if (gameState.isPlayerAlive) {
      this.updatePlayerMovement(delta);
      this.updateMonsterApproach(delta);
    }
    if (gameState.playerState === 'WALKING' && this.bgTile) this.bgTile.tilePositionX += 2.5;
  }

  updatePlayerMovement() {
    this.player.x = 80;
    this.player.y = 200;
    this.playerLabel.y = 170;

    const aliveMonsters = this.activeMonsters.filter((monster) =>
      monster && monster.hp > 0 && monster.sprite && !monster.sprite.destroyed
    );
    if (!aliveMonsters.length) {
      gameState.playerState = 'WALKING';
      return;
    }

    const nearestMonster = aliveMonsters.reduce((best, monster) => {
      const distance = Math.abs(this.player.x - monster.sprite.x);
      if (!best || distance < best.distance) return { monster, distance };
      return best;
    }, null);

    if (!nearestMonster) {
      gameState.playerState = 'WALKING';
      return;
    }

    if (this.activeMonsters.some((monster) => monster.isMoving)) {
      gameState.playerState = 'WALKING';
      return;
    }

    const nearest = nearestMonster.monster;
    gameState.playerState = Math.abs(this.player.x - nearest.sprite.x) <= getPlayerAttackRange(nearest.isBoss)
      ? 'ATTACKING'
      : 'WALKING';
  }

  updateMonsterApproach(delta) {
    const step = (120 * delta) / 1000;
    const groups = new Map();

    for (const monster of this.activeMonsters) {
      if (!monster || monster.hp <= 0 || !monster.sprite || monster.sprite.destroyed) continue;
      if (!groups.has(monster.groupIndex)) groups.set(monster.groupIndex, []);
      groups.get(monster.groupIndex).push(monster);
    }

    for (const groupMonsters of groups.values()) {
      const frontMonster = groupMonsters
        .slice()
        .sort((left, right) => left.laneIndex - right.laneIndex)[0];
      if (frontMonster.isMoving) continue;

      const distance = Math.abs(this.player.x - frontMonster.sprite.x);
      const attackRange = getPlayerAttackRange(frontMonster.isBoss);
      if (distance > attackRange) {
        const targetX = this.player.x + attackRange;
        const nextX = Math.max(targetX, frontMonster.sprite.x - step);
        this.setMonsterRenderPosition(frontMonster, nextX, this.player.y);
      } else {
        this.setMonsterRenderPosition(frontMonster, frontMonster.sprite.x, this.player.y);
      }
    }
  }

  setMonsterRenderPosition(monster, x, y) {
    monster.sprite.setPosition(x, y);
    monster.hpText?.setPosition(x, y - 20);
  }

  moveMonsterToLane(monster, duration) {
    monster.motionTween?.stop();
    monster.isMoving = true;
    monster.motionTween = this.tweens.add({
      targets: [monster.sprite, monster.hpText],
      x: monster.targetX,
      duration,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        monster.hpText?.setPosition(monster.sprite.x, monster.sprite.y - 20);
      },
      onComplete: () => {
        this.setMonsterRenderPosition(monster, monster.targetX, this.player.y);
        monster.isMoving = false;
        monster.motionTween = null;
      }
    });
  }

  reflowMonsterFormation() {
    const groups = new Map();

    for (const monster of this.activeMonsters) {
      if (!monster) continue;
      const groupIndex = Number.isFinite(monster.groupIndex) ? monster.groupIndex : 0;
      if (!groups.has(groupIndex)) groups.set(groupIndex, []);
      groups.get(groupIndex).push(monster);
    }

    const orderedGroups = [...groups.keys()].sort((left, right) => left - right);
    orderedGroups.forEach((groupIndex) => {
      const groupMonsters = groups.get(groupIndex);
      const isBossGroup = groupMonsters[0]?.isBoss ?? false;
      const assignments = getMonsterFormationAssignments(groupMonsters, isBossGroup);
      assignments.forEach(({ monster, laneIndex, x }) => {
        monster.groupIndex = groupIndex;
        monster.laneIndex = laneIndex;
        monster.targetX = x;
        if (monster.sprite.x !== monster.targetX || monster.sprite.y !== this.player.y) {
          this.moveMonsterToLane(monster, MONSTER_FORMATION_SHIFT_DURATION);
        }
      });
    });
  }

  startStage() {
    this.spawnTimer?.remove(false);
    this.spawnTimer = null;
    this.destroyCurrentMonster();
    gameState.playerState = 'WALKING';
    this.spawnMonsterWithApproach();
    this.updateUI();
  }

  executeRebirth() {
    if (!gameState.rebirthUnlocked) {
      alert('5라운드 보스를 처치하면 환생할 수 있습니다!');
      return;
    }
    if (!confirm('환생하시겠습니까?\n\n환생 후 공법을 하나 선택해야 진행할 수 있습니다. 스테이지, 라운드, 영력 강화와 경지는 초기화되고 업, 선석, 법보와 영구 강화는 유지됩니다.')) return;

    this.rebirthSelectionPending = true;
    this.pendingAutomaticRebirth = false;
    this.pauseCombatForRebirthSelection();
    gameState.currentTab = 'technique';
    this.updateUI();
  }

  pauseCombatForRebirthSelection() {
    for (const timer of [this.attackTimer, this.monsterAttackTimer, this.spawnTimer]) {
      if (timer) timer.paused = true;
    }
    for (const monster of this.activeMonsters) monster.motionTween?.pause();
    this.rebirthPausedCombat = true;
  }

  resumeCombatAfterRebirthCancellation() {
    if (!this.rebirthPausedCombat) return;
    for (const timer of [this.attackTimer, this.monsterAttackTimer, this.spawnTimer]) {
      if (timer) timer.paused = false;
    }
    for (const monster of this.activeMonsters) monster.motionTween?.resume();
    this.rebirthPausedCombat = false;
  }

  chooseTechniqueForRebirth(techniqueId, button) {
    if (!this.rebirthSelectionPending) return false;
    const technique = getTechnique(techniqueId);
    if (gameState.karma < technique.cost) return false;

    Object.assign(gameState, getRebirthResetState(gameState));
    gameState.karma -= technique.cost;
    gameState.technique = techniqueId;
    gameState.techniqueChosenThisRebirth = true;
    gameState.techniqueLevel = 0;
    gameState.techniqueEvolution = getTechniqueEvolutionForRealm(gameState.realmIndex);
    this.rebirthSelectionPending = false;
    this.pendingAutomaticRebirth = false;
    this.rebirthPausedCombat = false;
    this.destroyCurrentMonster();
    this.startAutoAttackTimer();
    this.startStage();
    if (button) this.playBtnTween(button);
    return true;
  }

  cancelRebirthSelection() {
    if (!this.rebirthSelectionPending || this.pendingAutomaticRebirth) return;
    this.rebirthSelectionPending = false;
    this.resumeCombatAfterRebirthCancellation();
    gameState.currentTab = 'rebirth';
    this.updateUI();
  }

  syncCurrentMonster() {
    const aliveMonsters = this.activeMonsters.filter((monster) => monster && monster.hp > 0 && monster.sprite && monster.sprite.active);
    if (!aliveMonsters.length) {
      this.currentMonster = null;
      return null;
    }

    this.currentMonster = aliveMonsters.reduce((best, monster) => {
      const distance = Math.abs(this.player.x - monster.sprite.x);
      if (!best || distance < best.distance) return { monster, distance };
      return best;
    }, null).monster;
    return this.currentMonster;
  }

  destroyCurrentMonster() {
    for (const timer of this.monsterAttackTimers) {
      timer?.remove(false);
    }
    this.monsterAttackTimers = [];
    this.monsterAttackTimer = null;
    for (const monster of this.activeMonsters) {
      monster?.motionTween?.stop();
      monster?.sprite?.destroy();
      monster?.hpText?.destroy();
    }
    this.activeMonsters = [];
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
    if (!gameState.isPlayerAlive || this.activeMonsters.length > 0) return;
    gameState.playerState = 'WALKING';
    const isBoss = gameState.isBossStage;
    const isFinalBoss = isBoss && gameState.round === 25;
    const hp = getMonsterMaxHp(gameState.stage, gameState.round, isBoss, gameState.realmIndex);
    const size = isBoss ? (isFinalBoss ? 72 : 60) : 40;
    const color = isBoss ? (isFinalBoss ? 0x6a040f : 0x9d0208) : 0xef233c;

    const highestExistingGroupIndex = this.activeMonsters.reduce(
      (maxIndex, monster) => Math.max(maxIndex, Number.isFinite(monster?.groupIndex) ? monster.groupIndex : 0),
      -1
    );
    const groupIndex = highestExistingGroupIndex + 1;
    const spawnLaneIndexes = getMonsterFormationLaneIndexes(
      isBoss ? BOSS_SPAWN_COUNT : MONSTER_SPAWN_COUNT
    );

    spawnLaneIndexes.forEach((laneIndex, spawnIndex) => {
      const laneX = getMonsterLaneX(laneIndex);
      const spriteX = laneX + MONSTER_GROUP_ENTRY_OFFSET;
      const spriteY = this.player.y;
      const sprite = this.add.rectangle(spriteX, spriteY, size, size, color);
      const hpText = this.add.text(spriteX, spriteY - 20, `HP: ${hp}`, { fontSize: '12px', fill: '#ff8a80' }).setOrigin(0.5);
      const monster = {
        sprite, hp, maxHp: hp, hpText,
        isBoss, isApproaching: false, spawnIndex,
        groupIndex,
        laneIndex,
        targetX: laneX,
        targetY: spriteY,
        isMoving: true,
        motionTween: null,
        attackTimer: null,
        attackRange: isBoss ? BOSS_MONSTER_ATTACK_RANGE : MONSTER_ATTACK_RANGE
      };
      this.activeMonsters.push(monster);

      monster.attackTimer = this.time.addEvent({
        delay: 1000,
        callback: () => {
          if (
            !gameState.isPlayerAlive
            || !this.activeMonsters.includes(monster)
            || monster.hp <= 0
            || monster.sprite.destroyed
          ) return;
          const nearestMonster = this.activeMonsters
            .filter((candidate) => candidate && candidate.hp > 0 && candidate.sprite && !candidate.sprite.destroyed)
            .sort((left, right) => Math.abs(this.player.x - left.sprite.x) - Math.abs(this.player.x - right.sprite.x))[0];
          if (!nearestMonster || nearestMonster !== monster) return;
          const distance = Math.abs(this.player.x - monster.sprite.x);
          if (distance <= monster.attackRange) {
            this.damagePlayer(getMonsterAttackDamage(gameState.stage, gameState.round, isBoss));
          }
        },
        callbackScope: this,
        loop: true
      });
      this.monsterAttackTimers.push(monster.attackTimer);
      this.moveMonsterToLane(monster, MONSTER_GROUP_ENTRY_DURATION);
    });
    this.spawnGroupOffset = groupIndex;
    this.reflowMonsterFormation();
    this.currentMonster = this.syncCurrentMonster();
  }

  autoAttack() {
    if (this.devPanelOpen || !gameState.isPlayerAlive) return;
    const attackOriginX = this.player.x + 28;
    const inRangeMonster = this.activeMonsters
      .filter((monster) => monster && monster.hp > 0 && monster.sprite && !monster.sprite.destroyed)
      .sort((left, right) => Math.abs(this.player.x - left.sprite.x) - Math.abs(this.player.x - right.sprite.x))[0];

    if (
      !inRangeMonster
      || Math.abs(this.player.x - inRangeMonster.sprite.x) > getPlayerAttackRange(inRangeMonster.isBoss)
    ) {
      this.currentMonster = this.syncCurrentMonster();
      return;
    }

    this.currentMonster = inRangeMonster;
    const isCrit = Math.random() * 100 < getFinalCritRate(gameState);
    let damage = getFinalAtk(gameState);
    if (isCrit) damage = Math.floor(damage * (getFinalCritDamage(gameState) / 100));
    const slash = this.add.rectangle(attackOriginX, this.player.y, 20, 6, isCrit ? 0xffea00 : 0x00e5ff);
    this.tweens.add({
      targets: slash, x: inRangeMonster.sprite.x, duration: 100,
      onComplete: () => { slash.destroy(); this.damageMonster(inRangeMonster, damage, isCrit); }
    });
  }

  damageMonster(monster, amount, isCrit) {
    if (this.devPanelOpen || !monster || monster.hp <= 0 || !gameState.isPlayerAlive) return;
    monster.hp -= amount;
    gameState.currentHealth = Math.min(
      getFinalMaxHealth(gameState),
      gameState.currentHealth + getRecoveryAmount(gameState)
    );
    const dmgText = this.add.text(
      monster.sprite.x + Math.floor(Math.random() * 20 - 10), 170,
      isCrit ? `💥 ${amount}!` : `-${amount}`,
      { fontSize: isCrit ? '22px' : '16px', fill: isCrit ? '#ff1744' : '#ffeb3b', fontStyle: 'bold' }
    ).setOrigin(0.5);
    this.tweens.add({ targets: dmgText, y: 90, alpha: 0, duration: isCrit ? 600 : 400, onComplete: () => dmgText.destroy() });
    if (monster.hp > 0) monster.hpText.setText(`HP: ${monster.hp}`);
    else this.killMonster(monster);
    this.updateUI();
  }

  damagePlayer(amount) {
    if (this.devPanelOpen || !gameState.isPlayerAlive) return;
    gameState.currentHealth = Math.max(0, gameState.currentHealth - amount);
    this.updateUI();
    if (gameState.currentHealth === 0) this.handlePlayerDeath();
  }

  handlePlayerDeath() {
    if (!gameState.isPlayerAlive) return;
    gameState.isPlayerAlive = false;
    gameState.playerState = 'DEAD';
    this.attackTimer?.remove(false);
    this.attackTimer = null;
    this.spawnTimer?.remove(false);
    this.spawnTimer = null;
    for (const timer of this.monsterAttackTimers) {
      timer?.remove(false);
    }
    this.monsterAttackTimers = [];
    this.destroyCurrentMonster();
    const rebirthed = gameState.rebirthUnlocked;
    if (rebirthed) {
      this.rebirthSelectionPending = true;
      this.pendingAutomaticRebirth = true;
      gameState.currentTab = 'technique';
      this.showCombatNotice('공법을 선택하면 자동 환생합니다.');
      this.updateUI();
      return;
    }
    Object.assign(gameState, getDeathRecoveryState(gameState));
    this.showCombatNotice(`사망: ${gameState.stage}스테이지 1라운드로 복귀`);
    this.startAutoAttackTimer();
    this.startStage();
  }

  showCombatNotice(message) {
    const notice = this.add.text(200, 180, message, {
      fontSize: '14px',
      fill: '#ff8a80',
      fontStyle: 'bold',
      backgroundColor: '#000000'
    }).setOrigin(0.5);
    this.tweens.add({ targets: notice, y: 155, alpha: 0, duration: 1800, onComplete: () => notice.destroy() });
  }

  killMonster(monster) {
    if (!monster || !this.activeMonsters.includes(monster)) return;
    monster.attackTimer?.remove(false);
    this.monsterAttackTimers = this.monsterAttackTimers.filter((timer) => timer !== monster.attackTimer);
    monster.attackTimer = null;
    monster.motionTween?.stop();
    monster.sprite?.destroy();
    monster.hpText?.destroy();
    this.activeMonsters = this.activeMonsters.filter((activeMonster) => activeMonster !== monster);
    this.reflowMonsterFormation();
    gameState.spiritPower += getSpiritPowerReward(
      gameState.stage,
      gameState.round,
      monster.isBoss,
      gameState.permSpiritPowerLevel
    );
    const droppedArtifact = getArtifactDrop(monster.isBoss);
    if (droppedArtifact) {
      gameState.artifacts.push(droppedArtifact);
      this.showCombatNotice(`법보 획득: ${getArtifact(droppedArtifact).name}`);
    }
    Object.assign(gameState, getProgressAfterMonsterDefeat(gameState));
    this.currentMonster = this.syncCurrentMonster();
    if (gameState.isBossStage || monster.isBoss) {
      this.startStage();
    } else {
      this.updateUI();
      if (!this.activeMonsters.length) {
        this.spawnTimer = this.time.delayedCall(200, () => {
          this.spawnTimer = null;
          if (gameState.isPlayerAlive && this.activeMonsters.length === 0) {
            this.spawnMonsterWithApproach();
          }
        });
      }
    }
  }

  updateUI() {
    if (gameState.isBossStage) {
      const bossTitle = gameState.round === 25 ? 'FINAL BOSS' : 'ROUND BOSS';
      this.stageText.setText(`STAGE ${gameState.stage} · ROUND ${gameState.round}/25 [${bossTitle}]`);
    } else {
      this.stageText.setText(`STAGE ${gameState.stage} · ROUND ${gameState.round}/25 (${gameState.roundMonsterKills}/${ROUND_MONSTER_COUNT})`);
    }
    this.spiritPowerText.setText(`영력: ${formatNumberShort(gameState.spiritPower)}`);
    this.karmaText.setText(`업: ${formatNumberShort(gameState.karma)}`);
    this.atkText.setText(`공격력: ${getFinalAtk(gameState)} (일반 Lv.${gameState.atkLevel} / 영구 +${gameState.permAtkLevel * 10}%)`);
    this.critText.setText(`치명타: ${getFinalCritRate(gameState)}% (Lv.${gameState.critRateLevel})`);
    this.spdText.setText(`공격속도: ${(1000 / getFinalAtkSpeed(gameState)).toFixed(2)}회/초 (Lv.${gameState.atkSpeedLevel})`);
    const maxHealth = getFinalMaxHealth(gameState);
    const healthRatio = gameState.currentHealth / maxHealth;
    this.playerHealthText.setText(`체력: ${gameState.currentHealth}/${maxHealth}`);
    this.playerHealthBar.width = 225 * healthRatio;
    this.playerHealthBar.setFillStyle(healthRatio <= 0.25 ? 0xf44336 : 0x4caf50);

    const selectedTab = this.tabButtons.find((tab) => tab.id === gameState.currentTab) ?? this.tabButtons[0];
    gameState.currentTab = selectedTab.id;
    for (const tab of this.tabButtons) {
      tab.button.setFillStyle(tab.id === selectedTab.id ? 0x4cc9f0 : 0x3d405b);
    }

    const isStatsTab = selectedTab.id === 'stats';
    const isRebirthTab = selectedTab.id === 'rebirth';
    const isTechniqueTab = selectedTab.id === 'technique';
    const isArtifactTab = selectedTab.id === 'artifact';
    const isConstitutionTab = isRebirthTab && this.rebirthSubTab === 'constitution';
    const isRealmTab = selectedTab.id === 'realm';
    this.panelTitle.setText(selectedTab.label);
    this.panelPlaceholder.setVisible(!isStatsTab && !isRebirthTab && !isRealmTab && !isTechniqueTab && !isArtifactTab);
    this.realmInfo.setVisible(isRealmTab);
    if (isRealmTab) this.updateRealmInfo();
    this.artifactInfo.setVisible(isArtifactTab);
    if (isArtifactTab) this.updateArtifactInfo();
    this.techniqueInfo.setVisible(isTechniqueTab);
    for (const option of this.techniqueChoiceButtons) {
      this.setButtonVisible(option.button, isTechniqueTab && this.rebirthSelectionPending);
    }
    this.setButtonVisible(this.btnTechniqueUpgrade, isTechniqueTab && !this.rebirthSelectionPending && Boolean(gameState.technique));
    this.setButtonVisible(this.btnCancelRebirth, isTechniqueTab && this.rebirthSelectionPending && !this.pendingAutomaticRebirth);
    this.updateTechniqueLabels();
    this.panelPlaceholder.setText(
      selectedTab.id === 'shop'
        ? '상점은 추후 구현 예정입니다.'
        : '이 기능은 다음 구현 단계에서 추가됩니다.'
    );
    this.statsScrollHint.setVisible(isStatsTab);
    this.statsScrollTrack.setVisible(isStatsTab);
    this.statsScrollThumb.setVisible(isStatsTab);
    this.statsPanel.setVisible(isStatsTab);
    this.setStatsScrollOffset(this.statsScrollOffset ?? 0);
    this.setButtonVisible(this.btnPermAtkUpgrade, isRebirthTab);
    this.setButtonVisible(this.btnPermGoldUpgrade, isRebirthTab);
    this.setButtonVisible(this.btnRebirth, isRebirthTab);
    this.setButtonVisible(this.btnRebirthUpgradesTab, isRebirthTab);
    this.setButtonVisible(this.btnConstitutionTab, isRebirthTab);
    this.constitutionInfo.setVisible(isConstitutionTab);
    for (const constitution of this.constitutionButtons) {
      this.setButtonVisible(constitution.button, isConstitutionTab);
    }
    this.btnPermAtkUpgrade.setVisible(isRebirthTab && !isConstitutionTab);
    this.btnPermAtkUpgrade.label.setVisible(isRebirthTab && !isConstitutionTab);
    this.btnPermGoldUpgrade.setVisible(isRebirthTab && !isConstitutionTab);
    this.btnPermGoldUpgrade.label.setVisible(isRebirthTab && !isConstitutionTab);
    this.btnRebirth.setVisible(isRebirthTab && !isConstitutionTab);
    this.btnRebirth.label.setVisible(isRebirthTab && !isConstitutionTab);
    this.btnRebirthUpgradesTab.setFillStyle(isRebirthTab && !isConstitutionTab ? 0x4cc9f0 : 0x3d405b);
    this.btnConstitutionTab.setFillStyle(isConstitutionTab ? 0x4cc9f0 : 0x3d405b);
    this.updateStatUpgradeLabels();
    this.btnPermAtkUpgrade.label.setText(`영구 공격력 (+10%) - ${formatNumberShort(getPermAtkCost(gameState))} 업 (Lv.${gameState.permAtkLevel})`);
    this.btnPermGoldUpgrade.label.setText(`영구 영력 획득량 (+15%) - ${formatNumberShort(getPermSpiritPowerCost(gameState))} 업 (Lv.${gameState.permSpiritPowerLevel})`);
    this.updateConstitutionLabels();

    this.btnRebirth.label.setText(gameState.rebirthUnlocked ? '🌀 환생하기' : '🌀 5라운드 보스 처치 후 환생 가능');
    this.btnRebirth.setFillStyle(gameState.rebirthUnlocked ? 0xaa00ff : 0x555555);
    this.updateDeveloperPanel();
  }

  updateConstitutionLabels() {
    const selected = gameState.constitution ? getConstitution(gameState.constitution) : null;
    this.constitutionInfo.setText(
      selected
        ? `이번 환생 체질: ${selected.name} · 다음 환생 전까지 변경 불가`
        : `이번 환생에서 하나를 구매할 수 있습니다.\n현재 업: ${formatNumberShort(gameState.karma)}`
    );

    for (const constitution of this.constitutionButtons) {
      const isSelected = gameState.constitution === constitution.id;
      const canPurchase = !gameState.constitution && gameState.karma >= constitution.cost;
      const effect = [];
      if (constitution.atkMultiplier > 1) effect.push(`공격력 +${Math.round((constitution.atkMultiplier - 1) * 100)}%`);
      if (constitution.healthMultiplier > 1) effect.push(`최대 체력 +${Math.round((constitution.healthMultiplier - 1) * 100)}%`);
      const label = `${constitution.name} · ${effect.join(' · ')} · ${constitution.cost}업`;
      constitution.button.label.setText(isSelected ? `${label} · 선택됨` : label);
      constitution.button.setFillStyle(isSelected ? 0x43a047 : canPurchase ? 0x7209b7 : 0x555555);
    }
  }

  updateTechniqueLabels() {
    for (const option of this.techniqueChoiceButtons) {
      const effects = [];
      if (option.atkPerLevel) effects.push(`공격력 +${option.atkPerLevel * 100}%/레벨`);
      if (option.healthPerLevel) effects.push(`최대 체력 +${option.healthPerLevel * 100}%/레벨`);
      const affordable = gameState.karma >= option.cost;
      option.button.label.setText(`${option.name} · ${effects.join(' · ')} · ${option.cost}업`);
      option.button.setFillStyle(affordable ? 0x7209b7 : 0x555555);
    }

    if (this.rebirthSelectionPending) {
      this.techniqueInfo.setText(
        `환생 공법을 선택하세요. 선택하면 환생이 완료됩니다.\n` +
        `보유 업: ${formatNumberShort(gameState.karma)}${this.pendingAutomaticRebirth ? '\n자동 환생 대기 중' : ''}`
      );
      return;
    }

    if (!gameState.technique) {
      this.techniqueInfo.setText('공법은 환생할 때 선택할 수 있습니다.');
      return;
    }

    const technique = getTechnique(gameState.technique);
    const evolutionMultiplier = getTechniqueEffectMultiplier(gameState.techniqueEvolution);
    const effect = [];
    if (technique.atkPerLevel) {
      effect.push(`공격력 +${(technique.atkPerLevel * gameState.techniqueLevel * evolutionMultiplier * 100).toFixed(0)}%`);
    }
    if (technique.healthPerLevel) {
      effect.push(`최대 체력 +${(technique.healthPerLevel * gameState.techniqueLevel * evolutionMultiplier * 100).toFixed(0)}%`);
    }
    const evolutionNames = ['결단기', '사축기', '진선'];
    const nextEvolution = evolutionNames[gameState.techniqueEvolution];
    this.techniqueInfo.setText(
      `현재 공법: ${technique.name} · Lv.${gameState.techniqueLevel}/${MAX_TECHNIQUE_LEVEL}\n` +
      `효과: ${effect.length ? effect.join(' · ') : '강화 필요'} · 진화 ${gameState.techniqueEvolution}/3\n` +
      (nextEvolution ? `다음 진화: ${nextEvolution} 진입 시 자동` : '최종 진화 완료')
    );

    const isMaxed = gameState.techniqueLevel >= MAX_TECHNIQUE_LEVEL;
    const cost = getTechniqueUpgradeCost(gameState);
    this.btnTechniqueUpgrade.label.setText(
      isMaxed ? '공법 최대 레벨' : `공법 강화 · ${formatNumberShort(cost)} 영력`
    );
    this.btnTechniqueUpgrade.setFillStyle(!isMaxed && gameState.spiritPower >= cost ? 0x7209b7 : 0x555555);
  }

  updateArtifactInfo() {
    const bonuses = getArtifactBonuses(gameState.artifacts);
    const inventoryLines = ARTIFACTS.map((artifact) => {
      const count = gameState.artifacts.filter((artifactId) => artifactId === artifact.id).length;
      const tierName = ARTIFACT_TIERS.find((tier) => tier.id === artifact.tier).name;
      return `${tierName} · ${artifact.name} ×${count}`;
    });
    const effects = [];
    if (bonuses.atkBonus) effects.push(`공격력 +${bonuses.atkBonus * 100}%`);
    if (bonuses.healthBonus) effects.push(`최대 체력 +${bonuses.healthBonus * 100}%`);
    if (bonuses.critRateBonus) effects.push(`치명타 확률 +${bonuses.critRateBonus}%p`);

    this.artifactInfo.setText(
      `보유 법보는 모두 자동 적용됩니다.\n` +
      `드랍률: 일반 ${(getArtifactDropRate(false) * 100).toFixed(1)}% · 보스 ${(getArtifactDropRate(true) * 100).toFixed(0)}%\n\n` +
      `${inventoryLines.join('\n')}\n\n` +
      `누적 효과: ${effects.length ? effects.join(' · ') : '없음'}`
    );
  }

  updateStatUpgradeLabels() {
    const labels = {
      atkLevel: `공격력 Lv.${gameState.atkLevel} · +2`,
      healthLevel: `체력 Lv.${gameState.healthLevel} · 최대 체력 +20`,
      recoveryLevel: `회복 Lv.${gameState.recoveryLevel} · 적중 시 +${getRecoveryAmount(gameState)} 체력`,
      critRateLevel: `치명타 확률 ${getFinalCritRate(gameState)}% · +0.1%p`,
      critDamageLevel: `치명타 피해 ${getFinalCritDamage(gameState)}% · +1%p`,
      atkSpeedLevel: `공격속도 Lv.${gameState.atkSpeedLevel} · 간격 ${getFinalAtkSpeed(gameState)}ms`,
      moveSpeedLevel: `이동속도 Lv.${gameState.moveSpeedLevel} · 접근 ${getMonsterApproachDuration(gameState)}ms`
    };

    for (const stat of this.statsUpgradeButtons) {
      const maxed = this.isStatMaxed(stat.key);
      const label = maxed
        ? `${labels[stat.key]} · MAX`
        : `${labels[stat.key]} · ${formatNumberShort(stat.cost(gameState))} 영력`;
      stat.button.label.setText(label).setFontSize('11px');
      stat.button.setFillStyle(maxed ? 0x555555 : stat.color);
    }
  }

  updateRealmInfo() {
    const realmIndex = gameState.realmIndex;
    const promotionRound = getRealmPromotionRound(realmIndex);
    const currentRealm = REALM_NAMES[realmIndex];
    const multiplier = REALM_MULTIPLIERS[realmIndex];

    if (promotionRound === null) {
      this.realmInfo.setText(
        `현재 경지: ${currentRealm}\n공격력·최대 체력 배율: ×${multiplier.toLocaleString()}\n최고 경지에 도달했습니다.`
      );
      return;
    }

    this.realmInfo.setText(
      `현재 경지: ${currentRealm}\n공격력·최대 체력 배율: ×${multiplier.toLocaleString()}\n` +
      `다음 경지: ${REALM_NAMES[realmIndex + 1]}\n${promotionRound}라운드 보스 처치 시 자동 승급`
    );
  }

  setButtonVisible(button, visible) {
    button.setVisible(visible);
    button.label.setVisible(visible);
  }
}