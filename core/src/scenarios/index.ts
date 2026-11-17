import type { AnyScenario, ScenarioId } from '../types';
import { s2Summary } from './s2-summary';

export const scenarios: AnyScenario[] = [s2Summary];

export function findScenario(id: ScenarioId): AnyScenario {
  const found = scenarios.find((scenario) => scenario.id === id);
  if (!found) throw new Error(`unknown scenario: ${id}`);
  return found;
}
