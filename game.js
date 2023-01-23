import { capitalize } from './utils.js';
import AgentChoices from './agents.js';

export function getResult(agent1, agent2) {
  let result;
  if (AgentChoices[agent1.name] && AgentChoices[agent1.name][agent2.name]) {
    result = {
      winner: agent1,
      loser: agent2,
      verbs: AgentChoices[agent1.name][agent2.name],
    }
  } else if (AgentChoices[agent2.name] && AgentChoices[agent2.name][agent1.name]) {
    result = {
      winner: agent2,
      loser: agent1,
      verbs: AgentChoices[agent2.name][agent1.name],
    }
  } else {
    result = {
      winner: agent1,
      loser: agent2,
      tie: true,
      verbs: ['tie']
    }
  }

  return formatResult(result);
};

function formatResult(result) {
  const { winner, loser, verbs, tie } = result;
  if (tie) {
    return `<@${winner.id}> and <@${loser.id}> draw with **${capitalize(winner.name)}**`;
  }

  return `<@${winner.id}>'s **${capitalize(winner.name)}** ${verbs[0]} <@${loser.id}>'s **${capitalize(loser.name)}**${verbs[1] ? ' ' + verbs[1] : ''}`;
};

export function getAgentChoices() {
  return Object.keys(AgentChoices);
};

export function getShuffledOptions() {
  const allChoices = getAgentChoices();
  const options = allChoices.map(agent => ({
    label: capitalize(agent),
    value: agent.toLowerCase(),
    description: AgentChoices[agent].description,
  }));

  return options.sort(() => Math.random() - 0.5);
};
