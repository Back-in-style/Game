export const STAGE_ROUND_COUNT = 25;
export const ROUND_MONSTER_COUNT = 50;
export const REBIRTH_UNLOCK_ROUND = 5;
export const REALM_NAMES = [
  '범인', '연기기', '축기기', '결단기', '원영기', '천인기',
  '사축기', '합체기', '성반기', '개열기', '진선'
];
export const REALM_MULTIPLIERS = [1, 2, 4, 10, 25, 60, 160, 500, 1500, 5000, 10000];

export function getAtkCost(state) {
  return Math.floor(10 * Math.pow(1.12, state.atkLevel - 1));
}

export function getCritCost(state) {
  return Math.floor(20 * Math.pow(1.6, state.critRateLevel));
}

export function getSpdCost(state) {
  return Math.floor(30 * Math.pow(1.7, state.atkSpeedLevel));
}

export function getPermAtkCost(state) {
  return Math.floor(1 * Math.pow(1.5, state.permAtkLevel));
}

export function getPermSpiritPowerCost(state) {
  return Math.floor(1 * Math.pow(1.5, state.permSpiritPowerLevel));
}

export function getFinalAtk(state) {
  const normalAtk = state.baseAtk + (state.atkLevel - 1) * 2;
  const permBuff = 1 + state.permAtkLevel * 0.1;
  return Math.floor(normalAtk * permBuff);
}

export function getFinalCritRate(state) {
  return Math.min(100, state.baseCritRate + state.critRateLevel);
}

export function getFinalAtkSpeed(state) {
  return Math.max(100, state.baseAtkSpeed - state.atkSpeedLevel * 30);
}

export function getMonsterMaxHp(stage, isBoss) {
  const baseHp = Math.floor(15 * Math.pow(1.15, stage - 1));
  return isBoss ? baseHp * 5 : baseHp;
}

export function getSpiritPowerReward(stage, isBoss, permSpiritPowerLevel) {
  const baseReward = stage * 8;
  const bossMultiplier = isBoss ? 5 : 1;
  const permBuff = 1 + permSpiritPowerLevel * 0.15;
  return Math.floor(baseReward * bossMultiplier * permBuff);
}

export function getKarmaForRoundBoss() {
  return 1;
}

export function getArtifactDropRate(isBoss) {
  return isBoss ? 0.05 : 0.001;
}

export function getRebirthReward(stage) {
  if (stage < 10) return 0;
  return Math.floor(Math.pow(stage / 10, 1.5));
}

export function getRealmMultiplier(realmIndex) {
  if (!Number.isInteger(realmIndex) || realmIndex < 0 || realmIndex >= REALM_MULTIPLIERS.length) {
    throw new RangeError(`Invalid realm index: ${realmIndex}`);
  }
  return REALM_MULTIPLIERS[realmIndex];
}

export function getRebirthResetState(state) {
  return {
    ...state,
    isPlayerAlive: true,
    spiritPower: 0,
    atkLevel: 1,
    healthLevel: 0,
    critRateLevel: 0,
    critDamageLevel: 0,
    atkSpeedLevel: 0,
    moveSpeedLevel: 0,
    stage: 1,
    round: 1,
    roundMonsterKills: 0,
    killCount: 0,
    isBossStage: false,
    isBossFailed: false,
    rebirthUnlocked: false,
    rebirthCount: state.rebirthCount + 1,
    realmIndex: 0,
    constitution: null,
    technique: null,
    techniqueChosenThisRebirth: false,
    techniqueEvolution: 0,
    artifacts: [...state.artifacts]
  };
}