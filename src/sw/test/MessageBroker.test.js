import { describe, expect, it, vi } from 'vitest';

import { MessageBroker } from '../MessageBroker.js';

const nextTick = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 10);
  });

const createBroadcastChannel = () => ({
  postMessage: vi.fn(),
  close: vi.fn(),
});

const createMessageBrokers = () => {
  const { port1, port2 } = new MessageChannel();

  return {
    broker: new MessageBroker({ broadcastChannel: port2 }),
    client: new MessageBroker({ broadcastChannel: port1 }),
  };
};

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

    expect(broadcastChannel.close).toBeCalled();
  });

  it('should be able to send a message to enable a scenario', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.enableScenario('test');

    expect(broadcastChannel.postMessage).toBeCalledWith({
      type: 'enable-scenario',
      scenario: 'test',
    });
  });

  it('should call the enable scenario listener when an enable scenario message is sent', async () => {
    const { client, broker } = createMessageBrokers();

    try {
      const listener = vi.fn();
      client.addEnableScenarioListener(listener);

      broker.enableScenario('test');

      await nextTick();

      expect(listener).toBeCalledWith({ scenario: 'test' });
    } finally {
      broker.close();
    }
  });

  it('should be able to send a message to disable a scenario', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.disableScenario('test');

    expect(broadcastChannel.postMessage).toBeCalledWith({
      type: 'disable-scenario',
      scenario: 'test',
    });
  });

  it('should call the disable scenario listener when a disable scenario message is sent', async () => {
    const { client, broker } = createMessageBrokers();

    try {
      const listener = vi.fn();
      client.addDisableScenarioListener(listener);

      broker.disableScenario('test');

      await nextTick();

      expect(listener).toBeCalledWith({ scenario: 'test' });
    } finally {
      broker.close();
    }
  });

  it('should be able to send a message to set a cookie', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.setCookie('test', 'test-value');

    expect(broadcastChannel.postMessage).toBeCalledWith({
      type: 'set-cookie',
      name: 'test',
      value: 'test-value',
    });
  });

  it('should call the set cookie listener when a set cookie message is sent', async () => {
    const { client, broker } = createMessageBrokers();

    try {
      const listener = vi.fn();
      client.addSetCookieListener(listener);

      broker.setCookie('test', 'test-value');

      await nextTick();

      expect(listener).toBeCalledWith({
        name: 'test',
        value: 'test-value',
      });
    } finally {
      broker.close();
    }
  });

  it('should be able to send a message to remove a cookie', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.removeCookie('test');

    expect(broadcastChannel.postMessage).toBeCalledWith({
      type: 'remove-cookie',
      name: 'test',
    });
  });

  it('should call the remove cookie listener when a remove cookie message is sent', async () => {
    const { client, broker } = createMessageBrokers();

    try {
      const listener = vi.fn();
      client.addRemoveCookieListener(listener);

      broker.removeCookie('test');

      await nextTick();

      expect(listener).toBeCalledWith({
        name: 'test',
      });
    } finally {
      broker.close();
    }
  });

  it('should be able to send a message to ask for service-worker config', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.askForConfig();

    expect(broadcastChannel.postMessage).toBeCalledWith({
      type: 'ask-for-config',
    });
  });

  it('should call the ask for service-worker listener when an ask for service-worker message is sent', async () => {
    const { client, broker } = createMessageBrokers();

    try {
      const listener = vi.fn();
      client.addAskForConfigListener(listener);

      broker.askForConfig();

      await nextTick();

      expect(listener).toBeCalledWith({});
    } finally {
      broker.close();
    }
  });

  it('should be able to send a message to send service-worker config', async () => {
    const broadcastChannel = createBroadcastChannel();
    const broker = new MessageBroker({ broadcastChannel });

    broker.sendConfig({});

    expect(broadcastChannel.postMessage).toBeCalledWith({
      type: 'send-config',
      config: {},
    });
  });

  it('should call the send service-worker listener when a send service-worker message is sent', async () => {
    const { client, broker } = createMessageBrokers();

    try {
      const listener = vi.fn();
      client.addSendConfigListener(listener);

      broker.sendConfig({});

      await nextTick();

      expect(listener).toBeCalledWith({
        config: {},
      });
    } finally {
      broker.close();
    }
  });
});
