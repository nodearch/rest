import { METADATA_KEY } from '../constants';
import { getClassMetadata, setClassMetadata } from './common.metadata';

export function getAuthGuard(guardClass: any): boolean {
  return getClassMetadata(METADATA_KEY.AUTH_GUARD, guardClass) || false;
}

export function setAuthGuard(guardClass: any): void {
  setClassMetadata(METADATA_KEY.AUTH_GUARD, guardClass, true);
}
