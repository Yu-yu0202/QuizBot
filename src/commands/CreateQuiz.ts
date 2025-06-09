import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalActionRowComponentBuilder,
  ModalSubmitInteraction,
  Client,
  TextChannel
} from "discord.js";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();
const redis = new Redis();
const QUIZ_CHANNEL_ID = process.env.QUIZ_CHANNEL_ID;

interface QuizData {
  id: string;
  title: string;
  description: string;
  choices: string[];
  answer: string;
}

function parseTTL(ttlString: string): number {
  const regex = /(\d+)([smhdw])/g;
  let match: RegExpExecArray | null;
  let seconds = 0;
  
  while ((match = regex.exec(ttlString)) !== null) {
    const value = parseInt(match[1]);
    switch (match[2]) {
      case 'm': seconds += value * 60; break;
      case 'h': seconds += value * 3600; break;
      case 'd': seconds += value * 86400; break;
      case 'w': seconds += value * 604800; break;
    }
  }
  return seconds;
}
async function saveToRedis(data: QuizData, ttlStr: string): Promise<void> {
  const ttl = parseTTL(ttlStr);
  const key = `quiz:${data.id}`;
  
  await redis.hmset(key, {
    title: data.title,
    description: data.description,
    answer: data.answer,
    choices: JSON.stringify(data.choices)
  });
  
  await redis.expire(key, ttl);
  await redis.expire(`${key}:answered`, ttl);
}

export async function CreateQuiz(interaction: ChatInputCommandInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('create-quiz-modal')
    .setTitle('クイズ作成');

  const titleInput = new TextInputBuilder()
    .setCustomId('title')
    .setLabel('タイトル')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('description')
    .setLabel('説明')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const choicesInput = new TextInputBuilder()
    .setCustomId('choices')
    .setLabel('選択肢（カンマ区切り）')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('選択肢1,選択肢2,選択肢3,選択肢4');

  const answerInput = new TextInputBuilder()
    .setCustomId('answer')
    .setLabel('正解の選択肢')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const ttlInput = new TextInputBuilder()
    .setCustomId('ttl')
    .setLabel('期限（例: 1h30m）')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('1h30m');

  const rows = [
    titleInput,
    descriptionInput,
    choicesInput,
    answerInput,
    ttlInput
  ].map(input => new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input));

  modal.addComponents(rows);
  await interaction.showModal(modal);
}

export async function handleCreateQuizModal(interaction: ModalSubmitInteraction, client: Client): Promise<void> {
  const title = interaction.fields.getTextInputValue('title');
  const description = interaction.fields.getTextInputValue('description');
  const choicesStr = interaction.fields.getTextInputValue('choices');
  const answer = interaction.fields.getTextInputValue('answer');
  const ttl = interaction.fields.getTextInputValue('ttl');

  const choices = choicesStr.split(',').map(choice => choice.trim());
  if (choices.length < 2) {
    await interaction.reply({ content: '選択肢は2つ以上必要です。', ephemeral: true });
    return;
  }

  if (!choices.includes(answer)) {
    await interaction.reply({ content: '正解の選択肢は選択肢リストに含まれている必要があります。', ephemeral: true });
    return;
  }

  if (!/^\d+[smhdw](\d+[smhdw])*$/.test(ttl)) {
    await interaction.reply({ content: '期限の形式が正しくありません。例: 1h30m', ephemeral: true });
    return;
  }

  const quizData: QuizData = {
    id: uuidv4(),
    title,
    description,
    choices,
    answer
  };

  try {
    await saveToRedis(quizData, ttl);
    
    const quizChannel = await client.channels.fetch(QUIZ_CHANNEL_ID!);
    if (!quizChannel?.isTextBased() || !(quizChannel instanceof TextChannel)) {
      throw new Error('クイズチャンネルが見つからないか、テキストチャンネルではありません。');
    }

    const quizEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: `作成者: ${interaction.user.tag} | 期限: ${ttl} | ID: ${quizData.id}` })
      .setColor('#0099ff')
      .setTimestamp();

    const buttons = choices.map((choice, index) => 
      new ButtonBuilder()
        .setCustomId(`quiz:${quizData.id}:answer:${index}:${choice}`)
        .setLabel(choice)
        .setStyle(ButtonStyle.Primary)
    );

    const rows: Array<ActionRowBuilder<ButtonBuilder>> = [];
    for (let i = 0; i < buttons.length; i += 2) {
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(buttons.slice(i, i + 2));
      rows.push(row);
    }

    await quizChannel.send({
      embeds: [quizEmbed],
      components: rows
    });

    const successEmbed = new EmbedBuilder()
      .setTitle('クイズ作成完了')
      .setDescription('クイズが正常に作成されました。')
      .setFields([
        { name: 'タイトル', value: title },
        { name: '説明', value: description },
        { name: '選択肢', value: choices.join('\n') },
        { name: '正解', value: answer },
        { name: '期限', value: ttl }
      ])
      .setColor('#00ff00')
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
  } catch (error) {
    console.error('クイズ作成エラー:', error);
    await interaction.reply({ content: 'クイズの作成中にエラーが発生しました。', ephemeral: true });
  }
}

export async function handleQuizAnswer(interaction: ButtonInteraction): Promise<void> {
  const [_, quizId, __, choiceIndex, choice] = interaction.customId.split(':');
  const key = `quiz:${quizId}`;
  const answeredKey = `${key}:answered`;
  const userId = interaction.user.id;
  
  const alreadyAnswered = await redis.sismember(answeredKey, userId);
  if (alreadyAnswered) {
    await interaction.reply({ content: "既に回答済みです。", flags: 'Ephemeral' });
    return;
  }
  
  const quizData = await redis.hgetall(key);
  if (!quizData || Object.keys(quizData).length === 0) {
    await interaction.reply({ content: "このクイズは存在しません。", flags: 'Ephemeral' });
    return;
  }
  
  const isCorrect = quizData.answer === choice;
  if (isCorrect) await redis.sadd(answeredKey, userId);
  
  await interaction.reply({
    content: isCorrect ? "✅ 正解です！" : "❌ 不正解です。",
    flags: 'Ephemeral'
  });
}
