import { 
  SlashCommandBuilder, 
  ApplicationCommandDataResolvable, 
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  ChannelType
} from "discord.js";
import { ping } from "./ping";
import { CreateQuiz, handleCreateQuizModal, handleQuizAnswer } from "./CreateQuiz";
import { execute as Setting } from "./Setting";

export const commands: ApplicationCommandDataResolvable[] = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botのpingを表示します')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('create-quiz')
    .setDescription('クイズを作成します'),
  new SlashCommandBuilder()
    .setName('setting')
    .setDescription('ボットの設定を行います')
    .addSubcommand(subcommand =>
      subcommand
        .setName('quiz-channel')
        .setDescription('クイズを送信するチャンネルを設定します')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('クイズを送信するチャンネル')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

export async function handleInteraction(interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction) {
  if (interaction.isChatInputCommand()) {
    switch ( interaction.commandName ) {
      case 'ping':
        await ping(interaction);
        break;
      case 'create-quiz':
        await CreateQuiz(interaction);
        break;
      case 'setting':
        await Setting(interaction);
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