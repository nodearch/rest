import * as metadata from '../metadata';

export function AuthGuard(): ClassDecorator {
  return function(target: any) {
    metadata.guard.setAuthGuard(target);
  };
}
