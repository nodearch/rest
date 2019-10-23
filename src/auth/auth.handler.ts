import { GuardInfo, IGuard } from '@nodearch/core';
import * as metadata from '../metadata';

export function getGuardsMiddleware(guards: GuardInfo[]): any[] {
  const guardsMiddleware: any[] = [];

  guards.forEach((guard: GuardInfo) => {
    const isAuthGuard = metadata.guard.getAuthGuard(guard.classDef);

    if (isAuthGuard && guard.classInstance) {
      const guardInstance: IGuard = guard.classInstance;
      guardsMiddleware.push(guardInstance.guard);
    }
  });

  return guardsMiddleware;
}
