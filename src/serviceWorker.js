import { Matcher } from './Matcher.js';

const BROADCAST_CHANNEL = 'mockme';
const GET_SCENARIOS_MESSAGE_TYPE = 'get:scenarios';
const SET_SCENARIO_MESSAGE_TYPE = 'set:scenario';
export const SCENARIOS_MESSAGE_TYPE = 'scenarios';

export const channel = new BroadcastChannel(BROADCAST_CHANNEL);

export function changeScenario(value) {
  channel.postMessage({ type: SET_SCENARIO_MESSAGE_TYPE, value });
}

export function getScenarios() {
  channel.postMessage({ type: GET_SCENARIOS_MESSAGE_TYPE });
}

export default function serviceWorker(sw, mocks) {
  const matcher = new Matcher(mocks);

  sw.addEventListener('fetch', async (event) => {
    const { request } = event;
    const path = new URL(request.url).pathname;

    if (request.headers.get('accept').indexOf('application/json') === -1) return;

    if (path.indexOf('.') === -1 && path !== '/') {
      event.respondWith(
        (async function matchRequest() {
          const match = await matcher.match(request);
          if (match) {
            return match.delayedResponse();
          }
          return undefined;
        })(),
      );
    }
  });

  channel.addEventListener('message', (event) => {
    if (event.data && event.data.type === GET_SCENARIOS_MESSAGE_TYPE) {
      channel.postMessage({
        type: SCENARIOS_MESSAGE_TYPE,
        scenarios: matcher.scenarios,
      });
    }

    if (event.data && event.data.type === SET_SCENARIO_MESSAGE_TYPE) {
      matcher.scenario = event.data.value;
    }
  });
}
