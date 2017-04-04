import path from 'path';
import { expect } from 'chai';
import TasksService from './index';

describe('## TasksService', () => {
  it('should has default id', () => {
    const service = new TasksService();

    expect(service.id).to.equal('tasks');
  });

  it('should load plugins', (done) => {
    const pluginsPath = path.join(__dirname, 'tests');
    const service = new TasksService({ pluginsPath });

    service.loadPlugins(() => {
      expect(service.plugins).to.include.keys('db.test.account');
      expect(service.plugins['db.test.account'][0]).to.be.a('function');

      done();
    });
  });

  it('should run task without options', (done) => {
    const pluginsPath = path.join(__dirname, 'tests');
    const service = new TasksService({ pluginsPath });
    service.subscribe();

    service.loadPlugins(() => {
      expect(service.plugins).to.include.keys('db.test.account');

      service.plugins['db.test.account'][0] = ({ name, options }) => {
        expect(name).to.equal('db.test.account');
        expect(options).to.deep.equal({});

        service.stop();
        done();
      };
      service.runTask('db.test.account');
    });
  });

  it('should run task with options', (done) => {
    const pluginsPath = path.join(__dirname, 'tests');
    const service = new TasksService({ id: 'tasks2', pluginsPath });
    service.subscribe();

    service.loadPlugins(() => {
      expect(service.plugins).to.include.keys('db.test.account');

      service.plugins['db.test.account'][0] = ({ name, options }) => {
        expect(name).to.equal('db.test.account');
        expect(options).to.deep.equal({ test: 1 });

        service.stop();
        done();
      };
      service.runTask('db.test.account', { test: 1 });
    });
  });
});
