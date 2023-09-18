import Matcher from "./matcher.js";

const BROADCAST_CHANNEL = "mockme";
const GET_SCENARIOS_MESSAGE_TYPE = "get:scenarios";
const SET_SCENARIO_MESSAGE_TYPE = "set:scenario";
export const SCENARIOS_MESSAGE_TYPE = "scenarios";

export const channel = new BroadcastChannel(BROADCAST_CHANNEL);

export function changeScenario(value) {
  channel.postMessage({ type: SET_SCENARIO_MESSAGE_TYPE, value });
}

export function getScenarios() {
  channel.postMessage({ type: GET_SCENARIOS_MESSAGE_TYPE });
}

export default function serviceWorker(sw, mocks) {
  const matcher = new Matcher(mocks);

  sw.addEventListener("fetch", (event) => {
    const path = new URL(event.request.url).pathname;
    if (path.indexOf(".") === -1 && path !== "/") {
      const match = matcher.match(event.request);
      if (match.response) {
        event.respondWith(match.delayedResponse());
      }
    }
  });

  channel.addEventListener("message", (event) => {
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
