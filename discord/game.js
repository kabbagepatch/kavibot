import { capitalize, getRandomBoolean } from './utils.js';
import AgentChoices from './agents.js';

export function getResult(agent1, agent2) {
  let result;
  if (agent1.name === agent2.name) {
    result = {
      winner: agent1,
      loser: agent2,
      tie: true,
      agentResult: ['tie']
    }
  } else if (getRandomBoolean()) {
    result = {
      winner: agent1,
      loser: agent2,
      agentResult: AgentChoices[agent1.name][agent2.name],
    }
  } else {
    result = {
      winner: agent2,
      loser: agent1,
      agentResult: AgentChoices[agent2.name][agent1.name],
    }
  }

  return formatResult(result);
};

function formatResult(result) {
  const { winner, loser, agentResult, tie } = result;

  let resultLine = `**${capitalize(winner.name)}** beats **${capitalize(loser.name)}**. <@${winner.id}> beats <@${loser.id}>`;
  if (tie) {
    resultLine = `<@${winner.id}> and <@${loser.id}> draw with **${capitalize(winner.name)}**`;
  } else if (agentResult) {
    resultLine = `${agentResult}. <@${winner.id}> beats <@${loser.id}>`;
  }
  if (winner.name.toLowerCase() === 'raze' && (loser.name.toLowerCase() === 'killjoy' || loser.name.toLowerCase() === 'gekko')
    || loser.name.toLowerCase() === 'raze' && (winner.name.toLowerCase() === 'killjoy' || winner.name.toLowerCase() === 'gekko')) {
    resultLine = `${agentResult}. As should <@${winner.id}> and <@${loser.id}>`;
  }

  return resultLine;
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
