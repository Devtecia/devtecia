export type ClaimBasis = 'fact' | 'owner_input' | 'assumption' | 'hypothesis';
export type ProposalClaim = { value: string; basis: ClaimBasis; factIds?: string[] };
export type ProposalFormat = 'short_video' | 'carousel' | 'static_or_story';

export type MarketingProposalContent = {
  briefRecap: { factsUsed: string[]; assumptionsUsed: string[]; missingInformation: string[] };
  audienceInsight: { operationalProblem: ProposalClaim; desiredOutcome: ProposalClaim; likelyObjection: ProposalClaim; messageAngle: ProposalClaim };
  positioning: { promise: ProposalClaim; supportingProof: ProposalClaim[]; wordingToAvoid: string[] };
  campaignConcept: {
    goal: string;
    targetAudience: string;
    coreMessage: ProposalClaim;
    offerOrCta: ProposalClaim;
    channelRoles: { channel: 'instagram' | 'facebook'; role: string }[];
    recommendedDurationWeeks: number;
  };
  contentPlan: { week: number; purpose: string; format: ProposalFormat; topic: string; hook: string; cta: string; requiredAsset: string }[];
  creativeBriefs: { format: ProposalFormat; concept: ProposalClaim; visualDirection: string; onScreenText: string; captionDraft: string; productionChecklist: string[] }[];
  paidPromotion: { objective: string; audienceHypothesis: ProposalClaim; creativeToTest: string[]; budgetRange: { min: number; max: number; currency: string } | null; humanChecklist: string[] };
  measurementPlan: { baselineNeeded: string[]; reachIndicators: string[]; qualifiedInterestIndicators: string[]; reviewCadence: string; metricDecisions: { metric: string; decisionInformed: string }[] };
  risksAndOpenQuestions: { unsupportedClaims: string[]; missingAssets: string[]; unclearTargeting: string[]; assumptionsToConfirm: string[] };
};

export type ProposalValidation = { ok: true; value: MarketingProposalContent } | { ok: false; errors: string[] };
type JsonObject = Record<string, unknown>;
const bases = new Set<ClaimBasis>(['fact', 'owner_input', 'assumption', 'hypothesis']);
const formats = new Set<ProposalFormat>(['short_video', 'carousel', 'static_or_story']);
const channels = new Set(['instagram', 'facebook']);

function object(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown, path: string, errors: string[], max = 2000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    errors.push(`${path} must be a nonempty string of at most ${max} characters.`);
    return '';
  }
  return value.trim();
}

function readList(value: unknown, path: string, errors: string[], maxItems = 20): string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    errors.push(`${path} must be a list with at most ${maxItems} items.`);
    return [];
  }
  return value.map((item, index) => readText(item, `${path}[${index}]`, errors, 500));
}

function readClaim(value: unknown, path: string, errors: string[]): ProposalClaim {
  if (!object(value)) {
    errors.push(`${path} must be a claim object.`);
    return { value: '', basis: 'hypothesis' };
  }
  const basis = value.basis;
  if (typeof basis !== 'string' || !bases.has(basis as ClaimBasis)) errors.push(`${path}.basis is not supported.`);
  let factIds: string[] | undefined;
  if (value.factIds !== undefined) factIds = readList(value.factIds, `${path}.factIds`, errors);
  return { value: readText(value.value, `${path}.value`, errors), basis: bases.has(basis as ClaimBasis) ? basis as ClaimBasis : 'hypothesis', ...(factIds ? { factIds } : {}) };
}

function readClaims(value: unknown, path: string, errors: string[]): ProposalClaim[] {
  if (!Array.isArray(value) || value.length > 20) {
    errors.push(`${path} must be a list of at most 20 claims.`);
    return [];
  }
  return value.map((item, index) => readClaim(item, `${path}[${index}]`, errors));
}

export function validateProposalContent(raw: unknown): ProposalValidation {
  const errors: string[] = [];
  if (!object(raw)) return { ok: false, errors: ['Proposal content must be an object.'] };
  const briefRecap = object(raw.briefRecap) ? raw.briefRecap : {};
  const insight = object(raw.audienceInsight) ? raw.audienceInsight : {};
  const positioning = object(raw.positioning) ? raw.positioning : {};
  const concept = object(raw.campaignConcept) ? raw.campaignConcept : {};
  const paid = object(raw.paidPromotion) ? raw.paidPromotion : {};
  const measurement = object(raw.measurementPlan) ? raw.measurementPlan : {};
  const risks = object(raw.risksAndOpenQuestions) ? raw.risksAndOpenQuestions : {};
  const contentPlan = Array.isArray(raw.contentPlan) ? raw.contentPlan : [];
  const creativeBriefs = Array.isArray(raw.creativeBriefs) ? raw.creativeBriefs : [];
  for (const key of ['briefRecap', 'audienceInsight', 'positioning', 'campaignConcept', 'paidPromotion', 'measurementPlan', 'risksAndOpenQuestions']) if (!object(raw[key])) errors.push(`${key} is required.`);
  if (!Array.isArray(raw.contentPlan)) errors.push('contentPlan must be a list.');
  if (!Array.isArray(raw.creativeBriefs)) errors.push('creativeBriefs must be a list.');

  const validatedContentPlan = contentPlan.slice(0, 40).map((item, index) => {
    const path = `contentPlan[${index}]`;
    if (!object(item)) {
      errors.push(`${path} must be an object.`);
      return { week: 1, purpose: '', format: 'short_video' as const, topic: '', hook: '', cta: '', requiredAsset: '' };
    }
    const week = item.week;
    if (!Number.isInteger(week) || Number(week) < 1 || Number(week) > 4) errors.push(`${path}.week must be an integer from 1 to 4.`);
    if (typeof item.format !== 'string' || !formats.has(item.format as ProposalFormat)) errors.push(`${path}.format is not supported.`);
    return {
      week: Number.isInteger(week) ? Number(week) : 1,
      purpose: readText(item.purpose, `${path}.purpose`, errors),
      format: formats.has(item.format as ProposalFormat) ? item.format as ProposalFormat : 'short_video',
      topic: readText(item.topic, `${path}.topic`, errors),
      hook: readText(item.hook, `${path}.hook`, errors),
      cta: readText(item.cta, `${path}.cta`, errors),
      requiredAsset: readText(item.requiredAsset, `${path}.requiredAsset`, errors),
    };
  });
  if (contentPlan.length < 4 || contentPlan.length > 40 || [1, 2, 3, 4].some(week => !validatedContentPlan.some(item => item.week === week))) errors.push('contentPlan must cover all four campaign weeks.');

  const validatedCreativeBriefs = creativeBriefs.slice(0, 20).map((item, index) => {
    const path = `creativeBriefs[${index}]`;
    if (!object(item)) {
      errors.push(`${path} must be an object.`);
      return { format: 'short_video' as const, concept: { value: '', basis: 'hypothesis' as const }, visualDirection: '', onScreenText: '', captionDraft: '', productionChecklist: [] };
    }
    if (typeof item.format !== 'string' || !formats.has(item.format as ProposalFormat)) errors.push(`${path}.format is not supported.`);
    const checklist = readList(item.productionChecklist, `${path}.productionChecklist`, errors);
    if (checklist.length < 1) errors.push(`${path}.productionChecklist requires at least one item.`);
    return {
      format: formats.has(item.format as ProposalFormat) ? item.format as ProposalFormat : 'short_video',
      concept: readClaim(item.concept, `${path}.concept`, errors),
      visualDirection: readText(item.visualDirection, `${path}.visualDirection`, errors),
      onScreenText: readText(item.onScreenText, `${path}.onScreenText`, errors),
      captionDraft: readText(item.captionDraft, `${path}.captionDraft`, errors),
      productionChecklist: checklist,
    };
  });
  if (creativeBriefs.length < 3 || creativeBriefs.length > 20 || [...formats].some(format => !validatedCreativeBriefs.some(item => item.format === format))) errors.push('creativeBriefs must include all three supported formats.');

  const channelRoles = Array.isArray(concept.channelRoles) ? concept.channelRoles.slice(0, 10).map((item, index) => {
    if (!object(item) || typeof item.channel !== 'string' || !channels.has(item.channel)) {
      errors.push(`campaignConcept.channelRoles[${index}] is invalid.`);
      return { channel: 'instagram' as const, role: '' };
    }
    return { channel: item.channel as 'instagram' | 'facebook', role: readText(item.role, `campaignConcept.channelRoles[${index}].role`, errors) };
  }) : [];
  if (!Array.isArray(concept.channelRoles) || channelRoles.length === 0) errors.push('campaignConcept.channelRoles requires at least one channel.');
  const duration = concept.recommendedDurationWeeks;
  if (!Number.isInteger(duration) || Number(duration) < 1 || Number(duration) > 52) errors.push('campaignConcept.recommendedDurationWeeks must be an integer from 1 to 52.');

  const budget = paid.budgetRange;
  let budgetRange: MarketingProposalContent['paidPromotion']['budgetRange'] = null;
  if (budget !== null) {
    if (!object(budget) || !Number.isFinite(budget.min) || !Number.isFinite(budget.max) || Number(budget.min) < 0 || Number(budget.max) < Number(budget.min) || typeof budget.currency !== 'string' || !/^[A-Z]{3}$/.test(budget.currency)) {
      errors.push('paidPromotion.budgetRange must be null or an ordered range with a three-letter currency.');
    } else budgetRange = { min: Number(budget.min), max: Number(budget.max), currency: budget.currency };
  }

  const metricDecisions = Array.isArray(measurement.metricDecisions) ? measurement.metricDecisions.slice(0, 20).map((item, index) => {
    if (!object(item)) {
      errors.push(`measurementPlan.metricDecisions[${index}] must be an object.`);
      return { metric: '', decisionInformed: '' };
    }
    return { metric: readText(item.metric, `measurementPlan.metricDecisions[${index}].metric`, errors), decisionInformed: readText(item.decisionInformed, `measurementPlan.metricDecisions[${index}].decisionInformed`, errors) };
  }) : [];
  if (!Array.isArray(measurement.metricDecisions) || metricDecisions.length === 0) errors.push('measurementPlan.metricDecisions requires at least one item.');

  const value: MarketingProposalContent = {
    briefRecap: { factsUsed: readList(briefRecap.factsUsed, 'briefRecap.factsUsed', errors), assumptionsUsed: readList(briefRecap.assumptionsUsed, 'briefRecap.assumptionsUsed', errors), missingInformation: readList(briefRecap.missingInformation, 'briefRecap.missingInformation', errors) },
    audienceInsight: { operationalProblem: readClaim(insight.operationalProblem, 'audienceInsight.operationalProblem', errors), desiredOutcome: readClaim(insight.desiredOutcome, 'audienceInsight.desiredOutcome', errors), likelyObjection: readClaim(insight.likelyObjection, 'audienceInsight.likelyObjection', errors), messageAngle: readClaim(insight.messageAngle, 'audienceInsight.messageAngle', errors) },
    positioning: { promise: readClaim(positioning.promise, 'positioning.promise', errors), supportingProof: readClaims(positioning.supportingProof, 'positioning.supportingProof', errors), wordingToAvoid: readList(positioning.wordingToAvoid, 'positioning.wordingToAvoid', errors) },
    campaignConcept: { goal: readText(concept.goal, 'campaignConcept.goal', errors), targetAudience: readText(concept.targetAudience, 'campaignConcept.targetAudience', errors), coreMessage: readClaim(concept.coreMessage, 'campaignConcept.coreMessage', errors), offerOrCta: readClaim(concept.offerOrCta, 'campaignConcept.offerOrCta', errors), channelRoles, recommendedDurationWeeks: Number.isInteger(duration) ? Number(duration) : 1 },
    contentPlan: validatedContentPlan,
    creativeBriefs: validatedCreativeBriefs,
    paidPromotion: { objective: readText(paid.objective, 'paidPromotion.objective', errors), audienceHypothesis: readClaim(paid.audienceHypothesis, 'paidPromotion.audienceHypothesis', errors), creativeToTest: readList(paid.creativeToTest, 'paidPromotion.creativeToTest', errors), budgetRange, humanChecklist: readList(paid.humanChecklist, 'paidPromotion.humanChecklist', errors) },
    measurementPlan: { baselineNeeded: readList(measurement.baselineNeeded, 'measurementPlan.baselineNeeded', errors), reachIndicators: readList(measurement.reachIndicators, 'measurementPlan.reachIndicators', errors), qualifiedInterestIndicators: readList(measurement.qualifiedInterestIndicators, 'measurementPlan.qualifiedInterestIndicators', errors), reviewCadence: readText(measurement.reviewCadence, 'measurementPlan.reviewCadence', errors), metricDecisions },
    risksAndOpenQuestions: { unsupportedClaims: readList(risks.unsupportedClaims, 'risksAndOpenQuestions.unsupportedClaims', errors), missingAssets: readList(risks.missingAssets, 'risksAndOpenQuestions.missingAssets', errors), unclearTargeting: readList(risks.unclearTargeting, 'risksAndOpenQuestions.unclearTargeting', errors), assumptionsToConfirm: readList(risks.assumptionsToConfirm, 'risksAndOpenQuestions.assumptionsToConfirm', errors) },
  };
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

const textSchema = { type: 'string' };
const stringListSchema = { type: 'array', items: textSchema };
const claimSchema = { type: 'object', properties: { value: textSchema, basis: { type: 'string', enum: [...bases] }, factIds: stringListSchema }, required: ['value', 'basis'] };
const objectSchema = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({ type: 'object', properties, required });
const claimListSchema = { type: 'array', items: claimSchema };

export const proposalContentJsonSchema = objectSchema({
  briefRecap: objectSchema({ factsUsed: stringListSchema, assumptionsUsed: stringListSchema, missingInformation: stringListSchema }),
  audienceInsight: objectSchema({ operationalProblem: claimSchema, desiredOutcome: claimSchema, likelyObjection: claimSchema, messageAngle: claimSchema }),
  positioning: objectSchema({ promise: claimSchema, supportingProof: claimListSchema, wordingToAvoid: stringListSchema }),
  campaignConcept: objectSchema({ goal: textSchema, targetAudience: textSchema, coreMessage: claimSchema, offerOrCta: claimSchema, channelRoles: { type: 'array', items: objectSchema({ channel: { type: 'string', enum: ['instagram', 'facebook'] }, role: textSchema }) }, recommendedDurationWeeks: { type: 'integer', minimum: 1, maximum: 52 } }),
  contentPlan: { type: 'array', items: objectSchema({ week: { type: 'integer', minimum: 1, maximum: 4 }, purpose: textSchema, format: { type: 'string', enum: [...formats] }, topic: textSchema, hook: textSchema, cta: textSchema, requiredAsset: textSchema }) },
  creativeBriefs: { type: 'array', items: objectSchema({ format: { type: 'string', enum: [...formats] }, concept: claimSchema, visualDirection: textSchema, onScreenText: textSchema, captionDraft: textSchema, productionChecklist: stringListSchema }) },
  paidPromotion: objectSchema({ objective: textSchema, audienceHypothesis: claimSchema, creativeToTest: stringListSchema, budgetRange: { anyOf: [objectSchema({ min: { type: 'number', minimum: 0 }, max: { type: 'number', minimum: 0 }, currency: textSchema }), { type: 'null' }] }, humanChecklist: stringListSchema }),
  measurementPlan: objectSchema({ baselineNeeded: stringListSchema, reachIndicators: stringListSchema, qualifiedInterestIndicators: stringListSchema, reviewCadence: textSchema, metricDecisions: { type: 'array', items: objectSchema({ metric: textSchema, decisionInformed: textSchema }) } }),
  risksAndOpenQuestions: objectSchema({ unsupportedClaims: stringListSchema, missingAssets: stringListSchema, unclearTargeting: stringListSchema, assumptionsToConfirm: stringListSchema }),
});
