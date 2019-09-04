import { describe, it } from 'mocha';
import { expect } from 'chai';
import { stub, SinonStub } from 'sinon';
import { getGuardsMiddleware } from './auth.handler';
import { guard } from '../metadata';

describe('auth/auth.handler', () => {

  let getAuthGuard: SinonStub;

  beforeEach(() => {
    getAuthGuard = stub(guard, 'getAuthGuard');
  });

  afterEach(() => {
    getAuthGuard.restore();
  });

  describe('getGuardsMiddleware', () => {

    it('add list of valid guards', () => {

      getAuthGuard.returns(true);

      const guards = [
        { name: 'guard1', moduleName: 'module1', providers: [], accessible: [], classDef: {}, classInstance: { guard: { x: 1 } } },
        { name: 'guard2', moduleName: 'module1', providers: [], accessible: [], classDef: {}, classInstance: { guard: { y: 'ok' } } }
      ];

      const res = getGuardsMiddleware(guards);
      expect(res).to.deep.equals([{ x: 1 }, { y: 'ok' }]);
    });

    it('add list of guards have no auth decorator', () => {

      getAuthGuard.returns(false);

      const guards = [
        { name: 'guard1', moduleName: 'module1', providers: [], accessible: [], classDef: {}, classInstance: {} },
        { name: 'guard2', moduleName: 'module1', providers: [], accessible: [], classDef: {}, classInstance: {} }
      ];

      const res = getGuardsMiddleware(guards);
      expect(res).to.deep.equals([]);
    });
  });

});
