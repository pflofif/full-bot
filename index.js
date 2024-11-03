/* eslint-disable no-unused-vars */
/* eslint-disable require-jsdoc */
const TelegramBot = require("node-telegram-bot-api");
const botToken = "6927036922:AAH0b0XNhcl1ZrGRDgW1czOhWLZ7kyInf-A"; // or 6536016874:AAHP3iZIqHgD7ls-nzscCe90isXsxgIKpe4
const bot = new TelegramBot(botToken, { polling: true });
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("./firebase/firebase");
const { newPollQuiz } = require("./config/quizConfig");
const { fullsCollection, configCollection, pollsCollection,
  fullsIdentifyCollection, quizCollection } = require("./config/collections");
const htmpParse = { parse_mode: "HTML" };

bot.on("polling_error", (error) => {
  console.log("Polling error code: ", error.code);
  console.log("Error Message: ", error.message);
  console.log("Stack trace: ", error.stack);
});

// helpers
async function isSecreatry(username) {
  const quizRef = db.collection(configCollection);
  const snapshot = await quizRef.get();
  let isSecretary = false;

  snapshot.forEach((doc) => {
    if (username == doc.data().secretary_user_name) {
      isSecretary = true;
    }
  });

  return isSecretary;
}

async function isCanRegister(username) {
  const fullsIdentifiesRef = db.collection(fullsIdentifyCollection);
  const snapshot = await fullsIdentifiesRef.get();
  let isFull = false;

  snapshot.forEach((doc) => {
    if (username == doc.data().name) {
      isFull = true;
    }
  });

  return isFull;
}

async function isFull(username) {
  const fullsRef = db.collection(fullsCollection);
  const snapshot = await fullsRef.get();
  let isFull = false;

  snapshot.forEach((doc) => {
    if (username == doc.data().username) {
      isFull = true;
    }
  });

  return isFull;
}

// config
bot.onText(/\/super_secret_secretary_create (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const newSecretary = match[1].trim();

  const data = {
    secretary_user_name: newSecretary,
    timestamp: FieldValue.serverTimestamp(),
  };

  await db.collection(configCollection).doc("secretary").set(data);
  bot.sendMessage(chatId, `Тепер новий секретар це ${newSecretary}`);
});

bot.onText(/\/config/, async (msg) => {
  const chatId = msg.chat.id;
  const quizRef = db.collection(quizCollection);
  const snapshot = await quizRef.get();
  if (snapshot.size === 0) {
    await db.collection(quizCollection).doc("newPollQuiz").set(newPollQuiz);
    bot.sendMessage(chatId, `Додав питання для створення нових голосувань`);
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  if (await isSecreatry(msg.chat.username)) {
    bot.sendMessage(chatId, "Привіт, це секретарська панель, тут ти можеш!:" +
      "\n/addFulls [тут перелік фулів через \",\"] : Додати нових фулів" +
      "\n/deleteFulls [тут перелік фулів через \",\"] : Видалити фулів" +
      "\n/newPoll: Створити нове голосування" +
      "\n/upAll: Написати повідомлення яке прийде всіх фулам" +
      "\n/activePolls: Подивитись всі активні голосування" +
      "\n/inactivePolls: Подивитись всі голосування які ще не розпочаті" +
      "\n/showFulls: Показати всіх фулів які приєднані до бота " +
      //  "\n/completedPolls: Подивитись всі завершені голосування" +
      //  "\n/allActivePollsResult: Подивитись результати всіх активних голосувань" +
      "\n/fullStatuses: Подивитись хто з фулів ще не приєднався до бота",
    );

    return;
  }

  if (await isFull(msg.chat.username)) {
    bot.sendMessage(chatId, "Привіт, це фулівська, тут ти можеш!:" +
      "\n/activePolls: Подивитись всі активні голосування",
    );

    return;
  }

  bot.sendMessage(chatId, "Ти не секретар і не фул, нічо не можеш");
});

// Secretary
bot.onText(/\/upAll (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (await isSecreatry(msg.chat.username) === false) {
    bot.sendMessage(chatId, `Ти не секретар!`);
    return;
  }

  const text = match[1].trim();
  const fullsRef = db.collection(fullsCollection);
  const snapshot = await fullsRef.get();
  const arrayOfNoticed = [];
  snapshot.forEach((full) => {
    bot.sendMessage(full.data().chatId, text);
    arrayOfNoticed.push(full.data().username);
  });

  const responseMessage = arrayOfNoticed.join(", ");
  bot.sendMessage(chatId, `Успішно проапано наступних фулів: ${responseMessage}`);
});

bot.onText(/\/showFulls/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (await isSecreatry(msg.chat.username) === false) {
    bot.sendMessage(chatId, `Ти не секретар!`);
    return;
  }
  const fullsRef = db.collection(fullsCollection);
  const snapshot = await fullsRef.get();
  const arrayOfNoticed = [];
  snapshot.forEach((full) => {
    arrayOfNoticed.push(full.data().username);
  });

  const responseMessage = arrayOfNoticed.join(", ");
  bot.sendMessage(chatId, `Список всіх фулів: ${responseMessage}`);
})

bot.onText(/\/deleteFulls (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (await isSecreatry(msg.chat.username) === false) {
    bot.sendMessage(chatId, `Ти не секретар!`);
    return;
  }
  const fullsUsernames = match[1].split(",");

  fullsUsernames.forEach(async (full) => {
    await db.collection(fullsIdentifyCollection).doc(full.trim()).delete();
    await db.collection(fullsCollection).doc(full.trim()).delete();
    bot.sendMessage(chatId, `Видалено ${full.trim()}`);
  });

  bot.sendMessage(chatId, `Фініш`);
});

bot.onText(/\/addFulls (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (await isSecreatry(msg.chat.username) === false) {
    bot.sendMessage(chatId, `Ти не секретар!`);
    return;
  }

  const fullsUsernames = match[1].split(",");

  fullsUsernames.forEach(async (full) => {
    const data = {
      name: full.trim(),
      timestamp: FieldValue.serverTimestamp(),
    };

    await db.collection(fullsIdentifyCollection).doc(full.trim()).set(data);
    bot.sendMessage(chatId, `Додано ${full.trim()}`);
  });

  bot.sendMessage(chatId, `Фініш`);
});
bot.onText(/\/fullStatuses/, async (msg) => {
  const chatId = msg.chat.id;

  const configRef = db.collection(configCollection);
  const configsnapshot = await configRef.get();

  let secretary;
  configsnapshot.forEach((f) => secretary = f.data().secretary_user_name);

  const fullsIdentifiesRef = db.collection(fullsIdentifyCollection);
  const fullsIdentifiessnapshot = await fullsIdentifiesRef.get();

  const fullsIdentifies = [];
  fullsIdentifiessnapshot.forEach((f) => fullsIdentifies.push(f.data().name));
  fullsIdentifies.push(secretary);

  const fullsRef = db.collection(fullsCollection);
  const fullsRefSnapshot = await fullsRef.get();
  const fulls = [];
  fullsRefSnapshot.forEach((f) => fulls.push(f.data().username));

  fullsIdentifies.forEach((fi) => {
    if (!fulls.includes(fi)) {
      bot.sendMessage(chatId, `@${fi} Досі не приєднався до бота!`);
    }
  });
});
// add new polls
bot.onText(/\/newPoll/, async (msg) => {
  const chatId = msg.chat.id;

  if (await isSecreatry(msg.chat.username) === false) {
    bot.sendMessage(chatId, `Ти не секретар!`);
    return;
  }

  await startPollCreation(chatId, newPollQuiz);
});
async function startPollCreation(chatId, quiz) {
  const quizIterator = quiz.questions[Symbol.iterator]();
  await askQuestion(chatId, quizIterator, {});
}
async function askQuestion(chatId, quizIterator, container) {
  const next = quizIterator.next();
  if (next.done) {
    await finalizePoll(chatId, container);
    return;
  }

  const question = next.value;
  bot.sendMessage(chatId, question.message, htmpParse).then(() => {
    bot.once("message", (msg) => {
      if (msg.chat.id === chatId) {
        handleResponse(chatId, msg, question, quizIterator, container);
      }
    });
  });
}
async function handleResponse(chatId, msg, question, quizIterator, container) {
  if (msg.text) {
    container[question.name] = msg.text;
    bot.sendMessage(chatId, question.correct_answer_message, htmpParse);
    await askQuestion(chatId, quizIterator, container);
  } else {
    bot.sendMessage(chatId, question.wrong_answer_message, htmpParse)
        .then(async () => {
          await askQuestion(chatId, quizIterator, container);
        });
  }
}
async function finalizePoll(chatId, container) {
  const members = container.poll_members.split("\n");
  const notRegisterdFulls = await Promise.all(members.map(async (p) => {
    return { username: p, isRegister: await isFull(p) };
  }));
  const filtered = notRegisterdFulls.filter((p) => p.isRegister === false);
  if (filtered.length !== 0) {
    const listNonReg = filtered.map((p) => `@${p.username}`).join(", ");
    bot.sendMessage(chatId, `<b>Повідомлення зверху обман</b>\n\n` +
      `Голосування не створено, ось список людей які досі не зареєстровані - ${listNonReg}`, htmpParse);
    return;
  }

  const answerOptions = container.answer_options.split("\n");
  answerOptions.push("БЛАНК");
  const data = {
    name: container.poll_name,
    question: container.question,
    is_completed: false,
    is_active: false,
    answers: [],
    voted: [],
    start_data: FieldValue.serverTimestamp(),
    completed_data: FieldValue.serverTimestamp(),
    answer_options: answerOptions,
    poll_members: members,
  };

  await db.collection(pollsCollection).add(data);
}

async function sendPolls(chatId, field, value, errMsg, validMsg) {
  const pollsRef = db.collection(pollsCollection);
  const pollsQuery = await pollsRef.where(field, "==", value).where("is_completed", "==", false).get();

  if (pollsQuery.empty) {
    bot.sendMessage(chatId, errMsg);
    return;
  }

  const inlineKeyboard = [];

  pollsQuery.forEach((doc) => {
    const poll = doc.data();
    inlineKeyboard.push([{
      text: poll.name,
      callback_data: `d_${doc.id}`,
    }]);
  });

  const options = {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  };

  bot.sendMessage(chatId, validMsg, options);
}

async function endPoll(pollName, chatId) {
  try {
    const pollRef = db.collection(pollsCollection).doc(pollName);
    const pollDoc = await pollRef.get();

    if (!pollDoc.exists) {
      bot.sendMessage(chatId, "Poll not found.");
      return;
    }

    await pollRef.update({
      is_completed: true,
      is_active: false,
      completed_data: admin.firestore.FieldValue.serverTimestamp(),
    });

    const poll = pollDoc.data();
    const results = Object.entries(poll.answers).map((answear) => {
      const index = answear[0];
      return `${poll.answer_options[index]} - ${answear[1].length}`;
    }).join("\n");

    bot.sendMessage(chatId, `Голосування '${poll.name}' було закінчено.\n\nРезультати:\n${results}`);
  } catch (error) {
    console.error("Error ending the poll:", error);
    bot.sendMessage(chatId, "Failed to end the poll.");
  }
}

bot.onText(/\/activePolls/, async (msg) => {
  await sendPolls(msg.chat.id, "is_active", true, "Зараз немає активних голосувань", "Активні голосування:");
});

bot.onText(/\/inactivePolls/, async (msg) => {
  const chatId = msg.chat.id;

  if (await isSecreatry(msg.chat.username) === false) {
    bot.sendMessage(chatId, `Ти не секретар!`);
    return;
  }

  await sendPolls(msg.chat.id, "is_active", false, "Зараз немає непройдених голосувань", "Непройдені голосування:");
});

bot.on("callback_query", async (callbackQuery) => {
  const action = callbackQuery.data;
  const fromId = callbackQuery.from.id;
  const chatId = callbackQuery.message.chat.id;
  const username = callbackQuery.from.username;

  if (action.startsWith("d_")) {
    const pollName = action.split("_")[1];
    const pollRef = db.collection(pollsCollection).doc(pollName);
    const pollDoc = await pollRef.get();

    if (!pollDoc.exists) {
      bot.sendMessage(chatId, "Poll details not found.");
      return;
    }
    const poll = pollDoc.data();
    const startDate = new Date(poll.start_data.seconds * 1000);
    const answerOptions = poll.answer_options.map((currEl, index) => `${index + 1}. ${currEl}`).join("\n\n");

    let detailsMessage = `<b>${poll.name}</b>\n<i>${poll.question}</i>\n\n` +
      `Варіанти відповідей:\n${answerOptions} \n\n` +
      `Фули які беруть участь у голосуванні:\n${poll.poll_members.map((f) => `@${f}`).join(", ")} \n\n` +
      `Дата створення голосування - ${startDate}\n\n`;

    if (poll.is_active) {
      const voted = poll.voted;
      const maped = poll.poll_members.map((v) => {
        if (voted.includes(v)) {
          return `@${v} - ✅`;
        } else {
          return `@${v} - ❌`;
        }
      }).join("\n");
      detailsMessage += `Голосування:\n${maped}`;
    }
    const replyMarkup = {
      inline_keyboard: [],
    };

    if (await isSecreatry(username)) {
      replyMarkup.inline_keyboard.push([{ text: "Видалити голосування", callback_data: `delete_${pollName}` }]);
      replyMarkup.inline_keyboard.push([{ text: "Закінчити голосування", callback_data: `end_${pollName}` }]);

      if (!poll.is_active) {
        replyMarkup.inline_keyboard.push([{ text: "Почати голосування", callback_data: `start_${pollName}` }]);
      }
    }
    bot.sendMessage(chatId, detailsMessage, { ...htmpParse, reply_markup: replyMarkup });
  } else if (action.startsWith("delete_")) {
    const pollName = action.split("_")[1];
    try {
      await db.collection(pollsCollection).doc(pollName).delete();
      bot.sendMessage(chatId, `Голосування ${pollName} успішно видалено.`);
    } catch (error) {
      console.error("Failed to delete poll:", error);
      bot.sendMessage(chatId, "Failed to delete poll.");
    }
  } else if (action.startsWith("start_")) {
    const pollName = action.split("_")[1];
    await startPoll(pollName, chatId);
  } else if (action.startsWith("vote_")) {
    // eslint-disable-next-line no-unused-vars
    const [_, pollName, optionIndex] = action.split("_");

    try {
      const pollRef = db.collection(pollsCollection).doc(pollName);
      const pollDoc = await pollRef.get();
      if (!pollDoc.exists) {
        bot.answerCallbackQuery(callbackQuery.id, { text: "Poll not found." });
        return;
      }

      const poll = pollDoc.data();
      if (poll.voted.includes(username)) {
        bot.answerCallbackQuery(callbackQuery.id, { text: "Притримай коней, ти вже голосував" });
        return;
      }
      const answerOption = poll.answer_options[optionIndex];
      const confirmMessage = `Ти дійсно хочеш проголосувати за "${answerOption}"?`;
      const confirmOptions = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Так", callback_data: `confirm_${pollName}_${optionIndex}` },
              { text: "Ні", callback_data: `cancel_${pollName}` },
            ],
          ],
        },
      };

      bot.sendMessage(callbackQuery.message.chat.id, confirmMessage, confirmOptions);
    } catch (error) {
      console.error("Error processing vote:", error);
      bot.answerCallbackQuery(callbackQuery.id, { text: "Failed to record your vote." });
    }
  } else if (action.startsWith("confirm_")) {
    const [_, pollName, optionIndex] = action.split("_");

    try {
      const pollRef = db.collection(pollsCollection).doc(pollName);
      const pollDoc = await pollRef.get();
      if (!pollDoc.exists) {
        bot.answerCallbackQuery(callbackQuery.id, { text: "Poll not found." });
        return;
      }

      const poll = pollDoc.data();
      const username = callbackQuery.from.username;
      if (poll.voted.includes(username)) {
        bot.answerCallbackQuery(callbackQuery.id, { text: "Притримай коней, ти вже голосував" });
        return;
      }

      const updates = {
        voted: admin.firestore.FieldValue.arrayUnion(username),
        [`answers.${optionIndex}`]: admin.firestore.FieldValue.arrayUnion(callbackQuery.from.id),
      };

      await pollRef.update(updates);
      bot.answerCallbackQuery(callbackQuery.id, { text: "Твій голос успішно зараховано" });
    } catch (error) {
      console.error("Error recording vote:", error);
      bot.answerCallbackQuery(callbackQuery.id, { text: "Failed to record your vote." });
    }
  } else if (action.startsWith("cancel_")) {
    bot.answerCallbackQuery(callbackQuery.id, { text: "Голос не зараховано" });
  } else if (action.startsWith("end_")) {
    const pollName = action.split("_")[1];
    endPoll(pollName, chatId);
  }

  return;
});

async function startPoll(pollName, chatId) {
  try {
    const pollRef = db.collection(pollsCollection).doc(pollName);
    const pollDoc = await pollRef.get();
    if (!pollDoc.exists) {
      bot.sendMessage(chatId, "Poll not found.");
      return;
    }

    const poll = pollDoc.data();
    if (poll.is_active) {
      bot.sendMessage(chatId, "This poll is already active.");
      return;
    }

    await pollRef.update({ is_active: true });

    const messageText = `<b>${poll.name}</b>\n` +
      `<i>${poll.question}</i>`;

    const options = {
      ...htmpParse,
      reply_markup: {
        inline_keyboard: poll.answer_options.map((option, index) =>
          [{ text: option, callback_data: `vote_${pollName}_${index}` }]),
      },
    };

    const memberChatIds = await Promise.all(poll.poll_members.map(async (member) => {
      const memberDoc = await db.collection(fullsCollection).where("username", "==", member).get();
      if (!memberDoc.empty) {
        return memberDoc.docs[0].data().chatId;
      }
      return null;
    }));

    memberChatIds
        .filter((id) => id !== null)
        .forEach(async (chatId) => {
          try {
            await bot.sendMessage(chatId, messageText, options);
          } catch (error) {
            console.error(`Failed to send poll to chat ID ${chatId}:`, error);
          }
        });
  } catch (error) {
    console.error("Failed to start poll:", error);
    bot.sendMessage(chatId, "Failed to start poll.");
  }
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.chat.username;

  if (await isCanRegister(username) ||
    await isSecreatry(username)) {
    bot.sendMessage(chatId, "Привіт ФУЛ!");

    const fullData = {
      chatId: chatId,
      username: username,
      timestamp: FieldValue.serverTimestamp(),
      polls_participated: 0,
    };

    await db.collection(fullsCollection).doc(username).set(fullData);
    return;
  }

  bot.sendMessage(chatId, `Привіт не фул хаха`);
});
