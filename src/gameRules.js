export const RESOURCE_SCALE = 100;
export const STAGE_ROUND_COUNT = 25;
export const ROUND_MONSTER_COUNT = 30;
export const MONSTER_SPAWN_COUNT = 3;
export const REBIRTH_UNLOCK_ROUND = 5;
export const BASE_MONSTER_APPROACH_DURATION = 500;
export const MIN_MONSTER_APPROACH_DURATION = 150;
export const REALM_NAMES = [
  '범인', '연기기', '축기기', '결단기', '원영기', '천인기',
  '사축기', '합체기', '성반기', '개열기', '진선'
];
export const REALM_MULTIPLIERS = [1, 2, 4, 10, 25, 60, 160, 500, 1500, 5000, 10000];
export const REALM_PROMOTION_ROUNDS = [2, 3, 4, 5, 7, 9, 12, 15, 19, 23];
export const TECHNIQUE_EVOLUTION_REALM_INDICES = [3, 6, 10];
export const CONSTITUTIONS = [
  { id: 'constitution1', name: '체질1', cost: 5, atkMultiplier: 1.1, healthMultiplier: 1 },
  { id: 'constitution2', name: '체질2', cost: 10, atkMultiplier: 1, healthMultiplier: 1.2 },
  { id: 'constitution3', name: '체질3', cost: 25, atkMultiplier: 1.2, healthMultiplier: 1.2 }
];
export const TECHNIQUES = [
  { id: 'flame', name: '염화공', cost: 0, atkPerLevel: 0.1, healthPerLevel: 0 },
  { id: 'diamond', name: '금강결', cost: 5, atkPerLevel: 0, healthPerLevel: 0.1 },
  { id: 'void', name: '태허록', cost: 10, atkPerLevel: 0.05, healthPerLevel: 0.05 }
];
export const MAX_TECHNIQUE_LEVEL = 10;
export const ARTIFACT_TIERS = [
  { id: 'lower', name: '하계', weight: 0.8 },
  { id: 'upper', name: '상계', weight: 0.19 },
  { id: 'immortal', name: '선보', weight: 0.01 }
];
export const ARTIFACTS = [
  { id: 'azure-sword', name: '청운검', tier: 'lower', atkBonus: 0.05, healthBonus: 0, critRateBonus: 0 },
  { id: 'guardian-jade', name: '수호옥', tier: 'lower', atkBonus: 0, healthBonus: 0.05, critRateBonus: 0 },
  { id: 'thunder-sword', name: '천뢰검', tier: 'upper', atkBonus: 0.15, healthBonus: 0, critRateBonus: 0 },
  { id: 'black-tortoise-armor', name: '현무갑', tier: 'upper', atkBonus: 0, healthBonus: 0.15, critRateBonus: 0 },
  { id: 'time-wheel', name: '시간륜', tier: 'immortal', atkBonus: 0, healthBonus: 0, critRateBonus: 5 }
];
export const NUMBER_SUFFIXES = ['', '만', '억', '조', '경', '해', '자', '양', '구', '간', '정', '재', '극', '항하사', '아승기', '나유타', '불가사의', '무량대수'];

export function formatNumberShort(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';

  const sign = numeric < 0 ? '-' : '';
  const absoluteValue = Math.abs(numeric);

  if (absoluteValue < 1000) return `${sign}${Math.floor(absoluteValue)}`;

  let scale = 1;
  let suffix = '';
  for (let index = 1; index < NUMBER_SUFFIXES.length; index += 1) {
    const nextScale = 10 ** (4 * index);
    if (absoluteValue >= nextScale) {
      scale = nextScale;
      suffix = NUMBER_SUFFIXES[index];
    } else {
      break;
    }
  }

  if (!suffix) {
    return `${sign}${Math.floor(absoluteValue)}`;
  }

  const scaledValue = absoluteValue / scale;
  const limitedValue = Number(scaledValue.toPrecision(4));
  const compactText = String(limitedValue).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  return `${sign}${compactText}${suffix}`;
}

function scaleResource(value) {
  return value * RESOURCE_SCALE;
}

export function getAtkCost(state) {
  return scaleResource(10 * Math.pow(1.08, Math.max(0, state.atkLevel - 1)));
}

export function getCritCost(state) {
  return 100000 * Math.pow(1.0005, state.critRateLevel);
}

export function getHealthCost(state) {
  return scaleResource(10 * Math.pow(1.08, state.healthLevel));
}

export function getCritDamageCost(state) {
  return 5000 * Math.pow(1.005, state.critDamageLevel);
}

export function getSpdCost(state) {
  return 10000 * Math.pow(1.003, state.atkSpeedLevel);
}

export function getMoveSpeedCost(state) {
  return 50000 * Math.pow(1.005, state.moveSpeedLevel);
}

export function getPermAtkCost(state) {
  return scaleResource(1 * Math.pow(1.5, state.permAtkLevel));
}

export function getPermSpiritPowerCost(state) {
  return scaleResource(1 * Math.pow(1.5, state.permSpiritPowerLevel));
}

export function getConstitution(constitutionId) {
  const constitution = CONSTITUTIONS.find((item) => item.id === constitutionId);
  if (!constitution) throw new RangeError(`Invalid constitution: ${constitutionId}`);
  return constitution;
}

export function getConstitutionCost(constitutionId) {
  return getConstitution(constitutionId).cost;
}

export function getTechnique(techniqueId) {
  const technique = TECHNIQUES.find((item) => item.id === techniqueId);
  if (!technique) throw new RangeError(`Invalid technique: ${techniqueId}`);
  return technique;
}

export function getTechniqueUpgradeCost(state) {
  return scaleResource(5 * Math.pow(1.5, state.techniqueLevel));
}

export function getTechniqueEvolutionForRealm(realmIndex) {
  return TECHNIQUE_EVOLUTION_REALM_INDICES.filter((index) => realmIndex >= index).length;
}

export function getTechniqueEffectMultiplier(evolution) {
  return 1 + Math.min(3, evolution) * 0.5;
}

export function getArtifact(artifactId) {
  const artifact = ARTIFACTS.find((item) => item.id === artifactId);
  if (!artifact) throw new RangeError(`Invalid artifact: ${artifactId}`);
  return artifact;
}

export function getArtifactBonuses(artifacts) {
  return artifacts.reduce((bonuses, artifactId) => {
    const artifact = getArtifact(artifactId);
    bonuses.atkBonus += artifact.atkBonus;
    bonuses.healthBonus += artifact.healthBonus;
    bonuses.critRateBonus += artifact.critRateBonus;
    return bonuses;
  }, { atkBonus: 0, healthBonus: 0, critRateBonus: 0 });
}

function getRandomValue(random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError(`Random value must be in [0, 1): ${value}`);
  }
  return value;
}

export function getArtifactDrop(isBoss, random = Math.random) {
  if (getRandomValue(random) >= getArtifactDropRate(isBoss)) return null;

  const tierRoll = getRandomValue(random);
  let cumulativeWeight = 0;
  const tier = ARTIFACT_TIERS.find((item) => {
    cumulativeWeight += item.weight;
    return tierRoll < cumulativeWeight;
  });
  if (!tier) throw new Error('Artifact tier weights must sum to 1.');

  const tierArtifacts = ARTIFACTS.filter((artifact) => artifact.tier === tier.id);
  const artifactIndex = Math.floor(getRandomValue(random) * tierArtifacts.length);
  return tierArtifacts[artifactIndex].id;
}

export function getFinalAtk(state) {
  const normalAtk = state.baseAtk + (state.atkLevel - 1) * 2;
  const permBuff = 1 + state.permAtkLevel * 0.1;
  const constitutionBuff = state.constitution ? getConstitution(state.constitution).atkMultiplier : 1;
  const technique = state.technique ? getTechnique(state.technique) : null;
  const techniqueBuff = technique
    ? 1 + technique.atkPerLevel * state.techniqueLevel * getTechniqueEffectMultiplier(state.techniqueEvolution)
    : 1;
  const artifactBuff = 1 + getArtifactBonuses(state.artifacts).atkBonus;
  return Math.floor(normalAtk * permBuff * constitutionBuff * techniqueBuff * artifactBuff * getRealmMultiplier(state.realmIndex));
}

export function getFinalCritRate(state) {
  const upgradeValue = Math.min(60, state.critRateLevel * 0.1);
  return Math.min(100, state.baseCritRate + upgradeValue + getArtifactBonuses(state.artifacts).critRateBonus);
}

export function getFinalMaxHealth(state) {
  const constitutionBuff = state.constitution ? getConstitution(state.constitution).healthMultiplier : 1;
  const technique = state.technique ? getTechnique(state.technique) : null;
  const techniqueBuff = technique
    ? 1 + technique.healthPerLevel * state.techniqueLevel * getTechniqueEffectMultiplier(state.techniqueEvolution)
    : 1;
  const artifactBuff = 1 + getArtifactBonuses(state.artifacts).healthBonus;
  return Math.floor(
    (state.baseHealth + state.healthLevel * 20) * constitutionBuff * techniqueBuff * artifactBuff * getRealmMultiplier(state.realmIndex)
  );
}

export function getFinalCritDamage(state) {
  return Math.min(500, state.baseCritDmg + state.critDamageLevel);
}

export function getFinalAtkSpeed(state) {
  const speedMultiplier = 1 + state.atkSpeedLevel * 0.01;
  return Math.max(100, Math.floor(state.baseAtkSpeed / speedMultiplier));
}

export function getMonsterApproachDuration(state) {
  const speedMultiplier = 1 + state.moveSpeedLevel * 0.01;
  return Math.max(
    MIN_MONSTER_APPROACH_DURATION,
    Math.floor(BASE_MONSTER_APPROACH_DURATION / speedMultiplier)
  );
}

export function getMonsterMaxHp(stage, round, isBoss, realmIndex = 0) {
  const realmMultiplier = getRealmMultiplier(realmIndex);
  const stageGrowth = Math.pow(1.005, stage - 1);
  const roundGrowth = Math.pow(1.005, round - 1);
  const baseHp = Math.floor(10 * realmMultiplier * stageGrowth * roundGrowth);
  const bossMultiplier = isBoss ? (round === STAGE_ROUND_COUNT ? 15 : 10) : 1;
  return baseHp * bossMultiplier;
}

export function getMonsterAttackDamage(stage, round, isBoss) {
  const baseDamage = 10 + (stage - 1) * 2 + round - 1;
  if (!isBoss) return baseDamage;
  return baseDamage * (round === STAGE_ROUND_COUNT ? 5 : 3);
}

export function getRealmPromotionRound(realmIndex) {
  if (!Number.isInteger(realmIndex) || realmIndex < 0 || realmIndex >= REALM_NAMES.length) {
    throw new RangeError(`Invalid realm index: ${realmIndex}`);
  }
  return REALM_PROMOTION_ROUNDS[realmIndex] ?? null;
}

export function getSpiritPowerReward(stage, round, isBoss, permSpiritPowerLevel) {
  const stageGrowth = Math.pow(1.1, stage - 1);
  const roundGrowth = Math.pow(1.02, Math.floor((round - 1) / 5));
  const baseReward = 10 * stageGrowth * roundGrowth;
  const bossMultiplier = isBoss ? 5 : 1;
  const permBuff = 1 + permSpiritPowerLevel * 0.15;
  return scaleResource(baseReward * bossMultiplier * permBuff);
}

export function getKarmaForRoundBoss() {
  return 1;
}

export function getProgressAfterMonsterDefeat(state) {
  if (!state.isBossStage) {
    const roundMonsterKills = state.roundMonsterKills + 1;
    return {
      ...state,
      roundMonsterKills,
      isBossStage: roundMonsterKills >= ROUND_MONSTER_COUNT
    };
  }

  const isFinalRound = state.round === STAGE_ROUND_COUNT;
  const nextRealmIndex = state.realmIndex + 1;
  const promotionRound = REALM_PROMOTION_ROUNDS[state.realmIndex];
  const didPromote = promotionRound !== undefined && state.round >= promotionRound;
  const nextState = {
    ...state,
    stage: isFinalRound ? state.stage + 1 : state.stage,
    round: isFinalRound ? 1 : state.round + 1,
    roundMonsterKills: 0,
    isBossStage: false,
    rebirthUnlocked: state.rebirthUnlocked || state.round >= REBIRTH_UNLOCK_ROUND,
    karma: state.karma + getKarmaForRoundBoss(),
    realmIndex: didPromote ? nextRealmIndex : state.realmIndex,
    techniqueEvolution: state.technique && didPromote
      ? Math.max(state.techniqueEvolution, getTechniqueEvolutionForRealm(nextRealmIndex))
      : state.techniqueEvolution
  };
  if (didPromote) nextState.currentHealth = getFinalMaxHealth(nextState);
  return nextState;
}

export function getArtifactDropRate(isBoss) {
  return isBoss ? 0.05 : 0.001;
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
    playerState: 'WALKING',
    currentHealth: state.baseHealth,
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
    isBossStage: false,
    rebirthUnlocked: false,
    rebirthCount: state.rebirthCount + 1,
    realmIndex: 0,
    constitution: null,
    technique: null,
    techniqueChosenThisRebirth: false,
    techniqueLevel: 0,
    techniqueEvolution: 0,
    artifacts: [...state.artifacts]
  };
}

export function getDeathRecoveryState(state) {
  if (state.rebirthUnlocked) return getRebirthResetState(state);
  return {
    ...state,
    isPlayerAlive: true,
    playerState: 'WALKING',
    currentHealth: state.baseHealth,
    round: 1,
    roundMonsterKills: 0,
    isBossStage: false
  };
}