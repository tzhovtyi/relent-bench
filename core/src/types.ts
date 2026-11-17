export enum Form {
  Plain = 'plain',
  Generator = 'generator',
}

export interface ScenarioForms<Input, Result> {
  [Form.Plain]: (input: Input) => Result;
  [Form.Generator]: (input: Input) => Generator<void, Result, void>;
}

export type Implementation<CodeForm extends Form, Input, Result> = ScenarioForms<
  Input,
  Result
>[CodeForm];

export enum ScenarioId {
  S2 = 'S2',
}

export interface Scenario<Input, Result> {
  id: ScenarioId;
  volume: number;
  makeInput(seed: number, volume: number): Input;
  hash(result: Result): string;
  forms: ScenarioForms<Input, Result>;
}

export enum Level {
  Baseline = 0,
  Reference = 1,
  Exhaust = 2,
  ManualChunked = 3,
  Evaluated = 4,
}

export type ScenarioLevel = Exclude<Level, Level.Baseline>;

export interface Executor<CodeForm extends Form> {
  id: string;
  level: ScenarioLevel;
  form: CodeForm;
  run<Input, Result>(
    implementation: Implementation<CodeForm, Input, Result>,
    input: Input,
  ): Promise<Result>;
}

export type AnyScenario = Scenario<any, any>;

export type AnyExecutor = Executor<any>;

export interface RunConfig {
  scenarioIds: ScenarioId[];
  executorIds: string[];
  inputSeed: number;
  orderSeed: number;
}

export interface FrameIntervalProbe {
  medianMs: number;
  interquartileRangeMs: number;
  samples: number;
}

export interface Calibration {
  iterations: number;
  measuredFrameShare: number;
}

export interface FrameMetrics {
  maxBlockingMs: number;
  totalBlockingMs: number;
  framesRendered: number;
  framesSkipped: number;
  framesExpected: number;
}

export interface RepeatMetrics extends FrameMetrics {
  durationMs: number;
}

export type BaselineRepeat = RepeatMetrics;

export interface ScenarioRepeat extends RepeatMetrics {
  hash: string;
}

export enum BlockKind {
  Baseline = 'baseline',
  Scenario = 'scenario',
}

export interface BaselineBlock {
  kind: BlockKind.Baseline;
  scenarioId: ScenarioId;
  repeats: BaselineRepeat[];
}

export interface ScenarioBlock {
  kind: BlockKind.Scenario;
  scenarioId: ScenarioId;
  executorId: string;
  level: ScenarioLevel;
  volume: number;
  repeats: ScenarioRepeat[];
}

export type Block = BaselineBlock | ScenarioBlock;

export interface Environment {
  userAgent: string;
  hardwareConcurrency: number;
  schedulerYieldAvailable: boolean;
}

export interface Protocol {
  schemaVersion: number;
  runId: string;
  startedAt: string;
  config: RunConfig;
  environment: Environment;
  frameInterval: FrameIntervalProbe;
  calibration: Calibration;
  blocks: Block[];
}
