import { describe, it } from 'mocha';
import { expect } from 'chai';
import { getValidationMiddleware } from './index';
import sinon from 'sinon';
import Joi from '@hapi/joi';

describe('validation/index', () => {

  describe('getValidationMiddleware', () => {

    it('validate valid body', () => {

      const req: any = { body: { x: 1 }, headers: {}, params: {}, query: {} };
      const res: any = {};
      const next: any = sinon.spy();

      getValidationMiddleware({ body: Joi.object({ x: Joi.number() }).required() }, { allowUnknown: true })(req, res, next);

      expect(next.calledOnce).to.be.equal(true);
    });

  });

  it('validate invalid body', () => {

    const req: any = { body: { x: 1 }, headers: {}, params: {}, query: {} };
    const res: any = { status: () => ({ json: () => true }) };
    const next: any = {};
    const jsonStatus = sinon.spy(res, 'status');

    getValidationMiddleware({ body: Joi.object({ x: Joi.boolean() }).required() }, { allowUnknown: true })(req, res, next);

    expect(jsonStatus.withArgs(400).calledOnce).to.be.equal(true);
  });

});
