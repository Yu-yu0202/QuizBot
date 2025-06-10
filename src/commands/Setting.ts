import { ChatInputCommandInteraction } from 'discord.js';
import { Redis } from 'ioredis';

const redis = new Redis();

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
        await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', ephemeral: true });
        return;
    }

    const subcommand = interaction.options.getSubcommand();
    if (!subcommand) {
        await interaction.reply({ 
            content: 'サブコマンドを指定してください。\n使用可能なサブコマンド:\n- `quiz-channel`: クイズを送信するチャンネルを設定', 
            ephemeral: true 
        });
        return;
    }

    if (subcommand === 'quiz-channel') {
        const channel = interaction.options.getChannel('channel');
        if (!channel) {
            await interaction.reply({ content: 'チャンネルを指定してください。', ephemeral: true });
            return;
        }

        await redis.set(`quiz_channel:${interaction.guildId}`, channel.id);
        await interaction.reply({ 
            content: `クイズチャンネルを ${channel} に設定しました。`,
            ephemeral: true 
        });
    }
} 