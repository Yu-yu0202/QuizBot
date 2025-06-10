import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { Redis } from 'ioredis';

const redis = new Redis();

export const data = new SlashCommandBuilder()
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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
        await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', ephemeral: true });
        return;
    }

    const subcommand = interaction.options.getSubcommand();

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