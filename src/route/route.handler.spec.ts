import { describe, it } from 'mocha';
import { expect } from 'chai';
import { stub, SinonStub } from 'sinon';
import { RouteHandler } from './route.handler';
import { Controller, Module, Guard, GuardProvider, ControllerInfo } from '@nodearch/core';
import * as metadata from '../metadata';
import { HttpMethod } from '../enums';

describe('route/route.handler', () => {

  describe('RouteHandler', () => {

    let getControllerMiddlewares: SinonStub, getControllerMethodMiddlewares: SinonStub,
    getMethodHTTPMethod: SinonStub, getMethodHTTPPath: SinonStub, getMethodValidationSchema: SinonStub;

    beforeEach(() => {
      getControllerMiddlewares = stub(metadata.controller, 'getControllerMiddlewares').returns([]);
      getControllerMethodMiddlewares = stub(metadata.controller, 'getControllerMethodMiddlewares').returns([]);
      getMethodHTTPMethod = stub(metadata.controller, 'getMethodHTTPMethod').returns(HttpMethod.GET);
      getMethodHTTPPath = stub(metadata.controller, 'getMethodHTTPPath').returns('/');
      getMethodValidationSchema = stub(metadata.controller, 'getMethodValidationSchema').returns({});
    });

    afterEach(() => {
      getControllerMiddlewares.restore();
      getControllerMethodMiddlewares.restore();
      getMethodHTTPMethod.restore();
      getMethodHTTPPath.restore();
      getMethodValidationSchema.restore();
    });

    @Controller('controller1')
    class Controller1 {

      private readonly s1: number;
      private readonly s2: number;
      constructor() {
        this.s1 = 1;
        this.s2 = 2;
      }

      public findAll(): number[] {
        return [this.s1, this.s2];
      }
    }

    @Module({
      imports: [],
      controllers: [Controller1],
      providers: [],
      exports: []
    })
    class Module1 {}

    @Controller('controller2/')
    @Guard(['guard1', 'guard2'])
    class Controller2 {

      private readonly s1: string;
      constructor() {
        this.s1 = 'test';
      }

      public find(): string {
        return this.s1;
      }

      public create(): string {
        return this.s1;
      }

      public findAll(): string[] {
        return [this.s1];
      }
    }

    @Module({
      imports: [Module1],
      controllers: [Controller2],
      providers: [],
      exports: []
    })
    class Module2 {}

    @GuardProvider('guard1')
    class Guard1 {
      constructor() {}
      public validate() { }
    }

    @GuardProvider('guard2')
    class Guard2 {
      constructor() {}
      public auth() { }
    }

    describe('getRoutes', () => {

      it('get routes for controllers have no middlewares', () => {

        const controller1 = new ControllerInfo(Controller1);
        controller1.classInstance = new Controller1();
        const controller2 = new ControllerInfo(Controller2);
        controller2.classInstance = new Controller2();
        const routeHandler = new RouteHandler([controller1, controller2]);

        const routes = routeHandler.getRoutes();

        expect(routes).to.have.lengthOf(4);
        expect(routes[0]).to.deep.nested.include({ method: 'get',  path: '/controller1/' });
        expect(routes[0].middlewares).to.have.lengthOf(2);
        expect(routes[1]).to.deep.nested.include({ method: 'get',  path: '/controller2/' });
        expect(routes[1].middlewares).to.have.lengthOf(2);
      });

    });

  });

});
