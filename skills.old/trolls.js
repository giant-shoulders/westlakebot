import { arrayFind, arrayRandom, arrayRemove } from '../../utils';

const SEND_DELAY = 35000;
const RESET_DELAY = 7500;
const TROLLS = [
  `Watcha typing <@{user}>? :kappa:`,
  `Hey <@{user}>, why not share that thought with the rest of us? :kappa:`,
  `Go ahead and share, <@{user}>, I'm sure your message is perfect. :kappa:`,
  `<@{user}>, I bet you're making a great point. :kappa:`,
  `You really have me on the edge of my seat, <@{user}>. :kappa:`,
  `Oh <@{user}>... the suspense is killing me. :kappa:`,
  `Take the stage, <@{user}>, everyone is waiting. :kappa:`,
  `<@{user}>, still working on that novel? :stewie:`,
];

const typists = [];

const timers = [];
const resetTimers = [];

const trollEm = (bot, message, user) => function troll() {
  const trollage = arrayRandom(TROLLS).format({ user });
  bot.reply(message, trollage);
};

const clearTimer = (timersList, timer) => {
  clearTimeout(timer.timer);
  arrayRemove(timersList, timer);
};

const resetTimer = (bot, message, user, typistEntry, timeout) => {
  let userResetTimer = arrayFind(resetTimers, 'user', user);

  // Decrement count and restart timer if count > 0
  const decrementCount = () => {
    typistEntry.count = (typistEntry.count > 0) ? typistEntry.count - 1 : 0;

    if (typistEntry.count > 0) {
      userResetTimer.timer = setTimeout(decrementCount, timeout);
    }
  };

  // Create or update timer
  if (!userResetTimer) {
    userResetTimer = {
      user,
      timer: setTimeout(decrementCount, timeout),
    };
    resetTimers.push(userResetTimer);
  } else {
    clearTimeout(userResetTimer.timer);
    userResetTimer.timer = setTimeout(decrementCount, timeout);
  }

  return userResetTimer;
};

const setTimer = (bot, message, user, timeout) => {
  // Clear reset timer if exists
  const userResetTimer = arrayFind(resetTimers, 'user', user);
  if (userResetTimer) {
    clearTimer(resetTimers, userResetTimer);
  }

  // Ignore if already set
  const userTimer = arrayFind(timers, 'user', user);
  if (userTimer) { return; }

  timers.push({
    user,
    timer: setTimeout(trollEm(bot, message, user), timeout),
  });
};

const skill = ({ controller }) => {
  // Check if user typing
  controller.on('message_received', (bot, message) => {
    if (message.type !== 'user_typing') { return; }

    const { user } = message;
    const delay = (Math.random() > 0.985) ? 0 : SEND_DELAY;

    let typistEntry = arrayFind(typists, 'user', user);

    // Already triggered, ignore
    if (typistEntry && typistEntry.triggered) { return; }

    // Increment count (and optionally make entry)
    if (!typistEntry) {
      typistEntry = { user, delay, count: 1 };
      typists.push(typistEntry);
    } else {
      typistEntry.count = (typistEntry.count < 3) ? typistEntry.count + 1 : 3;
    }

    // Check that user has typed three times, or insta-troll
    if (typistEntry.count > 2 || typistEntry.delay === 0) {
      typistEntry.triggered = true;
      setTimer(bot, message, user, typistEntry.delay);

    // Lower user count if they stop typing before reaching threshold
    } else {
      resetTimer(bot, message, user, typistEntry, RESET_DELAY);
    }
  });

  // Check if user sent message
  controller.on('ambient', (bot, message) => {
    if (message.type !== 'message') { return; }

    const { user } = message;

    // Reset user entry
    const typistEntry = arrayFind(typists, 'user', user);
    if (typistEntry) {
      typistEntry.count = 0;
      typistEntry.triggered = false;
    }

    // Reset user timer if exists
    const userTimer = arrayFind(timers, 'user', user);
    if (userTimer) { clearTimer(timers, userTimer); }

    // Reset reset timer if exists
    const userResetTimer = arrayFind(resetTimers, 'user', user);
    if (userResetTimer) { clearTimer(resetTimers, userResetTimer); }
  });
};

export default skill;
