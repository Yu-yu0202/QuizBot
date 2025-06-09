import { ChatInputCommandInteraction } from "discord.js";

export async function ping(interaction: ChatInputCommandInteraction): Promise<void> {
  const ping: number = interaction.client.ws.ping ;
  await interaction.reply({
    content: `🏓 Pong! ping: ${ping}ms`
  });
}