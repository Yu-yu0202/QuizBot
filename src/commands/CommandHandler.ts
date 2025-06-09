import { SlashCommandBuilder, ApplicationCommandDataResolvable, ChatInputCommandInteraction } from "discord.js";
import { ping } from "./ping";

export const commands: ApplicationCommandDataResolvable[] = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botのpingを表示します')
    .toJSON(),
  new SlashCommandBuilder()
]
export async function handleInteraction(interaction: ChatInputCommandInteraction) {
  if (interaction.isChatInputCommand()) {
    switch ( interaction.commandName ) {
      case 'ping':
        await ping(interaction);
        break;
    }
  } else {
  
  }
}