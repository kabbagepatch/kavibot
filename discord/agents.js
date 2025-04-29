const AgentChoices = {
  brimstone: {
    description: "Boomer",
    raze: "**Brim**'s smoke obscured all the places  could throw her grenade from",
  },
  viper: {
    description: "Almost as toxic as Flow",
    brimstone: "**Viper** threw her toxins right in the smoke where Brim thought he was so sage",
    viper: "",
    omen: "**Viper** threw her toxins right where Omen teleported",
    killjoy: "**Viper**'s toxin wall stood in the way between her and KJ's turret",
    cypher: "**Viper**'s toxin wall meant Cypher saw nothing but green on his camera",
    sova: "**Viper** ignored all the arrows around her and threw her toxins straight at Sova",
    sage: "**Viper** covered the radianite crystals with her snake bite, poisoning Sage",
    phoenix: "**Viper** long toxin wall meant Phoenix didn't know where to flash, and ran right into her bullets",
    // jett: "**Viper**",
    // reyna: "**Viper**'s grenade's explosions destroy the soul orb <agent> before gets a chance to consume it",
    raze: "**Viper**'s toxic screen made it impossible for Raze to aim her grenade correctly, and it blew up in her hand",
    // breach: "**Viper**'s Boom Bot was not affected by the seismic blast and hunts down",
    // skye: "**Viper** saw <agent>'s Tasmanian tiger as it was sent out and threw her grenade right where it came from",
    // yoru: "**Viper** heard <agent> teleport and threw her grenade right where he landed",
    // astra: "**Viper** sent out her Boom Bot through the Nebula smoke cloud and blew up",
    // kayo: "**Viper** deployed her Boom Bot right before <agent> threw his knife. Not suppressed",
    // chamber: "**Viper** left blast packs at <agent>'s teleport anchor. Right as he teleported to safety, he was launched back in danger",
    neon: "**Viper** created her large chemical cloud, leaving nowhere to run for Neon",
    // fade: "**Viper** used her blast packs to quickly get out of <agent>'s seize and took her down",
    harbor: "**Viper** deployed her toxic screen, which poisoned **Harbor**'s high tide",
  },
  omen: {
    description: "Shadow",
    raze: "**Omen** teleported away from <agent>'s grenade",
  },
  killjoy: {
    description: "Bot Queen",
    raze: "Killjoy and <agent> go for a coffee date instead of fighting",
  },
  cypher: {
    description: "Baldy",
    raze: "Cypher triggered his cage which meant <agent> had no idea where to throw her grenade",
  },
  sova: {
    description: "Hawkeye",
    viper: "Sova shot a recon arrow through the toxic screen finding the exact location of",
    raze: "Sova bounced his shock bolt around the corner <agent>'s Boom Bot was deployed from. Direct hit",
    fade: "Sova screamed 'I, am the hunter!' at",
    harbor: "Sova shot his shock dart at all the water, electrocuting",
  },
  sage: {
    description: "Healing Queen",
    sova: "Sage deployed her barrier, blocking all the arrows from",
    raze: "Sage deployed her barrier, blocking both,  <agent>'s Boom Bot and Grenade",
    neon: "Sage threw a slow orb, nullifying the speed boost of",
    fade: "Sage healed instantly after the decay afflicted by",
  },
  phoenix: {
    description: "Fire boi",
    raze: "Phoenix used his flash, leaving <agent> and her Boom Bot blind and confused",
  },
  jett: {
    description: "Fast and annoying",
    raze: "Jett dodged the grenade. She dodged the rocket launcher. And threw a knife at",
  },
  reyna: {
    description: "Empress",
    raze: "Reyna threw her eye near <agent>, leaving her blinded with nowhere to throw her grenade",
  },
  raze: {
    description: "Explosive",
    brimstone: "**Raze** sent out her Boom Bot through **Brim**'s smoke cloud and blew him up",
    viper: "**Raze** sent out her Boom Bot through **Viper**'s toxic screen and blew her up",
    omen: "**Raze** threw her grenade right where **Omen** teleported",
    killjoy: "**Raze** and Killjoy go for a coffee date instead of fighting",
    cypher: "**Raze**'s Boom Bot went right under Cypher's trap wire and blew up in his face",
    sova: "**Raze** ignored all the arrows around her and threw her grenade straight at Sova",
    sage: "**Raze** jumped over the wall with her blast packs, pulled out her rocket launcher and blew up Sage",
    phoenix: "**Raze** jumped over Phoenix's fire zone with her blast pack and took him down",
    jett: "**Raze** shot her rocket launcher right where Jett jumped up to. No dodging that",
    reyna: "**Raze**'s grenade's explosions destroy the soul orb before Reyna gets a chance to consume it",
    raze: "",
    breach: "**Raze**'s Boom Bot was not affected by Breach's seismic blast and hunts him down",
    skye: "**Raze** saw Skye's Tasmanian tiger as it was sent out and threw her grenade right where it came from",
    yoru: "**Raze** heard Yoru teleport and threw her grenade right where he landed",
    astra: "**Raze** sent out her Boom Bot through Astra's Nebula smoke cloud and blew her up",
    kayo: "**Raze** deployed her Boom Bot right before KAY/O threw his knife. Not suppressed",
    chamber: "**Raze** left blast packs at Chamber's teleport anchor. Right as he teleported to safety, he was launched back in danger",
    neon: "**Raze**'s Boom Bot went right between Neon's energy lines and blew in her face",
    fade: "**Raze** used her blast packs to quickly get out of Fade's seize and took her down",
    harbor: "**Raze**'s bullets didn't go through Harbor's water sphere. But her grenade did. He thought he was safe in there",
    gekko: "**Raze**'s Boombot and **Gekko**'s Wingman started playing instead of fighting"
  },
  breach: {
    description: "Daddy Breach",
    raze: "Breach used his blinding charge, leaving **Raze** and her Boom Bot blind and confused",
  },
  skye: {
    description: "Bird Lady",
    raze: "Skye used her hawks, leaving **Raze** and her Boom Bot blind and confused",
  },
  yoru: {
    description: "Dimension Traveller",
    raze: "Yoru teleported away from **Raze**'s grenade",
  },
  astra: {
    description: "Asstral Queen",
    raze: "Astra's Gravity well pulled **Raze** and her Boom bot in before it could go anywhere",
  },
  kayo: {
    description: "Loud Robot",
    raze: "KAY/O deployed his knife right before **Raze** deployed her Boom Bot. Suppressed",
  },
  chamber: {
    description: "Charming Bastard",
    raze: "Chamber teleported away from **Raze**'s grenade",
  },
  neon: {
    description: "Fast and electrifying",
    sova: "Neon absorbed the shock bolt enhancing her bioelectricity, and shocked Sova",
    raze: "Neon was too fast for the rocket launcher, and beamed down **Raze**",
    harbor: "Neon shot her relay dart at all the water, electrocuting Harbor",
  },
  fade: {
    description: "Nightmare inducing",
    viper: "Fade threw her watcher through the toxic screen finding the exact location of **Viper**",
    raze: "Fade sent out a prowler before the boom bot could be deployed, and took down **Raze**",
    neon: "Fade threw her knot of fear, siezing the usually fast Neon",
  },
  harbor: {
    description: "Water God",
    sage: "Harbor threw his high tide at the barrier, and soaked Sage",
    raze: "Harbor extinguished all the explosives, and soaked **Raze**",
    fade: "Harbor was too cheerful to be paranoid, and soaked Fade",
  },
  gekko: {
    description: "Pokemon Master",
    raze: "**Gekko**'s Wingman and **Raze**'s Boombot started playing instead of fighting"
  }
};

export default AgentChoices;