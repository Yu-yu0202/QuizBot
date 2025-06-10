import { 
  SlashCommandBuilder, 
  ApplicationCommandDataResolvable, 
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction
} from "discord.js";
import { ping } from "./ping";
import { CreateQuiz, handleCreateQuizModal, handleQuizAnswer } from "./CreateQuiz";

export const commands: ApplicationCommandDataResolvable[] = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botのpingを表示します')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('createquiz')
    .setDescription('新しいクイズを作成します')
    .toJSON()
];

export async function handleInteraction(interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction) {
  if (interaction.isChatInputCommand()) {
    switch ( interaction.commandName ) {
      case 'ping':
        await ping(interaction);
        break;
      case 'createquiz':
        await CreateQuiz(interaction);
        break;
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'create-quiz-modal') {
      await handleCreateQuizModal(interaction, interaction.client);
    }
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith('quiz:')) {
      await handleQuizAnswer(interaction);
    }
  }
}