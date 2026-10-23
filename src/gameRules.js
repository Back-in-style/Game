export const STAGE_ROUND_COUNT = 25;
export const ROUND_MONSTER_COUNT = 50;
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

export function getAtkCost(state) {
  return Math.floor(10 * Math.pow(1.12, state.atkLevel - 1));
}

export function getCritCost(state) {
  return Math.floor(20 * Math.pow(1.6, state.critRateLevel));
}

export function getHealthCost(state) {
  return Math.floor(20 * Math.pow(1.2, state.healthLevel));
}

export function getCritDamageCost(state) {
  return Math.floor(50 * Math.pow(1.5, state.critDamageLevel));
}

export function getSpdCost(state) {
  return Math.floor(30 * Math.pow(1.7, state.atkSpeedLevel));
}

export function getMoveSpeedCost(state) {
  return Math.floor(25 * Math.pow(1.4, state.moveSpeedLevel));
}

export function getPermAtkCost(state) {
  return Math.floor(1 * Math.pow(1.5, state.permAtkLevel));
}

export function getPermSpiritPowerCost(state) {
  return Math.floor(1 * Math.pow(1.5, state.permSpiritPowerLevel));
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
  return Math.floor(50 * Math.pow(1.5, state.techniqueLevel));
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
  return Math.min(100, state.baseCritRate + state.critRateLevel + getArtifactBonuses(state.artifacts).critRateBonus);
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
  return Math.min(500, state.baseCritDmg + state.critDamageLevel * 10);
}

export function getFinalAtkSpeed(state) {
  return Math.max(100, state.baseAtkSpeed - state.atkSpeedLevel * 30);
}

export function getMonsterApproachDuration(state) {
  return Math.max(
    MIN_MONSTER_APPROACH_DURATION,
    BASE_MONSTER_APPROACH_DURATION - state.moveSpeedLevel * 25
  );
}

export function getMonsterMaxHp(stage, round, isBoss) {
  const baseHp = Math.floor(15 * Math.pow(1.15, stage - 1));
  const roundHp = Math.floor(baseHp * (1 + (round - 1) * 0.05));
  const bossMultiplier = isBoss ? (round === STAGE_ROUND_COUNT ? 10 : 5) : 1;
  return roundHp * bossMultiplier;
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

export function getSpiritPowerReward(stage, isBoss, permSpiritPowerLevel) {
  const baseReward = stage * 8;
  const bossMultiplier = isBoss ? 5 : 1;
  const permBuff = 1 + permSpiritPowerLevel * 0.15;
  return Math.floor(baseReward * bossMultiplier * permBuff);
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