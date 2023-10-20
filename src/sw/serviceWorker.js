import { Matcher } from './Matcher.js';
import { MessageBroker } from './MessageBroker.js';

export default function serviceWorker(sw, mocks) {
  const matcher = new Matcher(mocks);
  const broker = new MessageBroker();

  const sendConfig = () =>
    broker.sendConfig({
      scenarios: matcher.scenarios,
      cookies: matcher.cookies,
    });

  broker.addAskForConfigListener(() => sendConfig());

  broker.addEnableScenarioListener(({ scenario }) => {
    matcher.enableScenario(scenario);
    sendConfig();
  });

  broker.addDisableScenarioListener(({ scenario }) => {
    matcher.disableScenario(scenario);
    sendConfig();
  });

  broker.addSetCookieListener(({ name, value }) => {
    matcher.setCookie(name, value);
    sendConfig();
  });

  broker.addRemoveCookieListener(({ name }) => {
    matcher.removeCookie(name);
    sendConfig();
  });

  sw.addEventListener('fetch', async (event) => {
    const { request } = event;
    const path = new URL(request.url).pathname;

    if (path.indexOf('.') === -1 && path !== '/') {
      event.respondWith(
        (async function matchRequest() {
          const match = await matcher.match(request);

          return match?.getResponse({ request });
        })(),
      );
    }
  });
}
