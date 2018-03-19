import { arrayRandom, diceRoll } from '../../utils';

const TIE = 'TIE';
const PLAYER = 'PLAYER';
const BOT = 'BOT';
const INVALID = 'INVALID';

const replies = {
  TIE: [
    `Bleh, a tie! Let's play again!`,
    `Well, that was uneventful. Another round?`,
    `Darnit! Another tie! One more?`,
  ],
  BOT: [
    `Hah! I win, n00b! Better luck next time!`,
    `Get rekt, son! Come back when you're less bad.`,
    `:kappa: :pjsalt: REKT BOII! :pjsalt: :kappa:`,
  ],
  PLAYER: [
    `Awwww man... you got me. gg sir.`,
    `Drats, I thought I had you. Well played.`,
    `You cheated! Best two out of three?`,
  ],
  INVALID: [
    `Not.. sure.. what to do here..`,
  ],
};

const generateChoiceMap = (choices) => {
  const choiceMap = {};

  choices.forEach((choice, i) => {
    choiceMap[choice] = {};

    for (let j = 0, half = (choices.length - 1) / 2; j < choices.length; j += 1) {
      const opposition = (i + j) % choices.length;

      if (!j) {
        choiceMap[choice][choice] = TIE;
      } else if (j <= half) {
        choiceMap[choice][choices[opposition]] = PLAYER;
      } else {
        choiceMap[choice][choices[opposition]] = BOT;
      }
    }
  });

  return choiceMap;
};

const defaultChoices = ['rock', 'paper', 'scissors'];
const defaultChoiceMap = generateChoiceMap(defaultChoices);

function compare(choiceMap, choice1, choice2) {
  return (choiceMap[choice1] || {})[choice2] || INVALID;
}

const trigger = '^!rps(?: ([a-zA-Z0-9_:-]+)(?: ([a-zA-Z0-9_,:-]+))?)?$';

const skill = ({ controller }) => {
  controller.hears(trigger, 'ambient', (bot, message) => {
    let choices;
    let choiceMap;

    if (message.match[2]) {
      choices = message.match[2].split(',');
      choiceMap = generateChoiceMap(choices);
    } else {
      choices = defaultChoices;
      choiceMap = defaultChoiceMap;
    }

    if (!message.match[1]) {
      bot.reply(message, `You need to pick something, dewd. (${choices.join(', ')})`);
      return;
    }

    let userChoice = message.match[1].toLowerCase();

    if (!choices.includes(userChoice)) {
      bot.reply(message, 'That is not a valid move. You lose. Good day, sir!');
      return;
    }

    let botChoice = choices[diceRoll({ sides: choices.length })[0] - 1];
    const result = compare(choiceMap, botChoice, userChoice);
    const resultString = (result === TIE) ? ':expressionless: TIE' : (result === BOT) ? ':pensive: LOSS' : ':grin: WIN';

    // Prevent uppercase for emojis that might be linked, ex: :+1::skin-tone-6:
    userChoice = userChoice.includes(':') ? userChoice : userChoice.toUpperCase();
    botChoice = botChoice.includes(':') ? botChoice : botChoice.toUpperCase();

    bot.reply(message, `
*${resultString}* - *${userChoice} (PLAYER)* _vs_ *${botChoice} (BOT)*
<@${message.user}>: ${arrayRandom(replies[result])}
    `);
  });
};

export default skill;
