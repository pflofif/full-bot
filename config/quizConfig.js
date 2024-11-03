/* eslint-disable linebreak-style */
const {FieldValue} = require("firebase-admin/firestore");

const newPollQuiz = {
  name: "NewPollQuiz",
  is_required: false,
  questions: [
    {
      name: "poll_name",
      message: "Введи назву голосування",
      input_type: "text",
      allow_user_input: true,
      correct_answer_message: "Прогрес - 1/4",
      wrong_answer_message: "Неправильний ввід, спробуй ще раз",
    },
    {
      name: "question",
      message: "Введи саме питання, за що голосувати будемо?",
      input_type: "text",
      allow_user_input: true,
      correct_answer_message: "Прогрес - 2/4",
      wrong_answer_message: "Неправильний ввід, спробуй ще раз",
    },
    {
      name: "answer_options",
      message: "Введи варіанти, які будуть присутні на голосуванні.<i>Наприклад:\nЗа\nПроти </i>\n\n<b>*Бланк ставиться автоматично!</b>",
      input_type: "text",
      allow_user_input: true,
      correct_answer_message: "Прогрес - 3/4",
      wrong_answer_message: "Неправильний ввід, спробуй ще раз",
    },
    {
      name: "poll_members",
      // eslint-disable-next-line max-len
      message: "Введи нікнейми фулів які будуть присутні на голосуванні в стовпчик.\n<i>Наприклад:\n@Heav1kkk\n@vovaleha\n@cristina_sodzak</i>\n\n<b>*Себе також потрібно ввести!</b>",
      input_type: "text",
      allow_user_input: true,
      correct_answer_message: "Голосування успішно додано!",
      wrong_answer_message: "Неправильний ввід, спробуй ще раз",
    },
  ],
  timestamp: FieldValue.serverTimestamp(),
};


module.exports = {newPollQuiz};
