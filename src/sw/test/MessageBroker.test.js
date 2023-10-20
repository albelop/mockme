import { expect } from '@esm-bundle/chai';
import { stub } from 'sinon';

import { MessageBroker } from '../MessageBroker.js';

const nextTick = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 10);
  });

const createBroadcastChannel = () => ({
  postMessage: stub(),
  close: stub(),
});

describe('MessageBroker', () => {
  it('should be constructable', async () => {
    const broker = new MessageBroker();

    try {
      expect(broker).to.be.instanceOf(MessageBroker);
    } finally {
      broker.close();
    }
  });

  it('should be able to close the message broker', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.close();

    expect(broadcastChannel.close.calledOnce).to.be.true;
  });

  it('should be able to send a message to enable a scenario', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.enableScenario('test');

    expect(
      broadcastChannel.postMessage.calledOnceWithExactly({
        type: 'enable-scenario',
        scenario: 'test',
      }),
    ).to.be.true;
  });

  it('should call the enable scenario listener when an enable scenario message is sent', async () => {
    // const { client, broker } = createMessageBrokers();
    const broker = new MessageBroker();
    const client = new MessageBroker();

    try {
      const listener = stub();
      client.addEnableScenarioListener(listener);

      broker.enableScenario('test');

      await nextTick();

      expect(listener.calledOnceWithExactly({ scenario: 'test' })).to.be.true;
    } finally {
      client.close();
      broker.close();
    }
  });

  it('should be able to send a message to disable a scenario', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.disableScenario('test');

    expect(
      broadcastChannel.postMessage.calledOnceWithExactly({
        type: 'disable-scenario',
        scenario: 'test',
      }),
    ).to.be.true;
  });

  it('should call the disable scenario listener when a disable scenario message is sent', async () => {
    const broker = new MessageBroker();
    const client = new MessageBroker();

    try {
      const listener = stub();
      client.addDisableScenarioListener(listener);

      broker.disableScenario('test');

      await nextTick();

      expect(listener.calledOnceWithExactly({ scenario: 'test' })).to.be.true;
    } finally {
      client.close();
      broker.close();
    }
  });

  it('should be able to send a message to set a cookie', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.setCookie('test', 'test-value');

    expect(
      broadcastChannel.postMessage.calledOnceWithExactly({
        type: 'set-cookie',
        name: 'test',
        value: 'test-value',
      }),
    ).to.be.true;
  });

  it('should call the set cookie listener when a set cookie message is sent', async () => {
    const broker = new MessageBroker();
    const client = new MessageBroker();

    try {
      const listener = stub();
      client.addSetCookieListener(listener);

      broker.setCookie('test', 'test-value');

      await nextTick();

      expect(
        listener.calledOnceWithExactly({
          name: 'test',
          value: 'test-value',
        }),
      ).to.be.true;
    } finally {
      client.close();
      broker.close();
    }
  });

  it('should be able to send a message to remove a cookie', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.removeCookie('test');

    expect(
      broadcastChannel.postMessage.calledOnceWithExactly({
        type: 'remove-cookie',
        name: 'test',
      }),
    ).to.be.true;
  });

  it('should call the remove cookie listener when a remove cookie message is sent', async () => {
    const broker = new MessageBroker();
    const client = new MessageBroker();

    try {
      const listener = stub();
      client.addRemoveCookieListener(listener);

      broker.removeCookie('test');

      await nextTick();

      expect(
        listener.calledOnceWithExactly({
          name: 'test',
        }),
      ).to.be.true;
    } finally {
      client.close();
      broker.close();
    }
  });

  it('should be able to send a message to ask for service-worker config', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.askForConfig();

    expect(
      broadcastChannel.postMessage.calledOnceWithExactly({
        type: 'ask-for-config',
      }),
    ).to.be.true;
  });

  it('should call the ask for service-worker listener when an ask for service-worker message is sent', async () => {
    const broker = new MessageBroker();
    const client = new MessageBroker();

    try {
      const listener = stub();
      client.addAskForConfigListener(listener);

      broker.askForConfig();

      await nextTick();

      expect(listener.calledOnceWithExactly({})).to.be.true;
    } finally {
      client.close();
      broker.close();
    }
  });

  it('should be able to send a message to send service-worker config', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.sendConfig({});

    expect(
      broadcastChannel.postMessage.calledOnceWithExactly({
        type: 'send-config',
        config: {},
      }),
    ).to.be.true;
  });

  it('should call the send service-worker listener when a send service-worker message is sent', async () => {
    const broker = new MessageBroker();
    const client = new MessageBroker();

    try {
      const listener = stub();
      client.addSendConfigListener(listener);

      broker.sendConfig({});

      await nextTick();

      expect(
        listener.calledOnceWithExactly({
          config: {},
        }),
      ).to.be.true;
    } finally {
      client.close();
      broker.close();
    }
  });
});
