import * as dotenv from 'dotenv';
import {
    Client, 
    Events, 
    GatewayIntentBits, 
    REST, 
    Routes,
    ChatInputCommandInteraction,
    ButtonInteraction,
    ModalSubmitInteraction
} from "discord.js";
import { commands, handleInteraction } from './commands/CommandHandler';
import * as path from 'path';
import { startRedisKeyExpiredHandler } from './handler/RedisKeyExpiredHandler';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Looking for .env file at:', envPath);

dotenv.config({ path: envPath });

// トークンの読み込み確認
if (!process.env.DISCORD_TOKEN) {
    console.error('DISCORD_TOKENが設定されていません！');
    console.error('Current working directory:', process.cwd());
    process.exit(1);
}
if (!process.env.CLIENT_ID) {
    console.error('CLIENT_IDが設定されていません！');
    process.exit(1);
}
if (!process.env.QUIZ_CHANNEL_ID) {
    console.error('QUIZ_CHANNEL_IDが設定されていません！');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

client.once(Events.ClientReady, async () => {
    console.log('✅Bot is ready!');
    try {
        console.log('スラッシュコマンドを登録中...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: commands }
        );
        console.log('スラッシュコマンドの登録が完了しました！');
    } catch (error) {
        console.error('スラッシュコマンドの登録に失敗しました:', error);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isChatInputCommand() || 
            interaction.isButton() || 
            interaction.isModalSubmit()) {
            await handleInteraction(interaction);
        }
    } catch (error) {
        console.error('インタラクションの処理中にエラーが発生しました:', error);
        if (interaction.isRepliable()) {
            await interaction.reply({ 
                content: 'コマンドの実行中にエラーが発生しました。', 
                flags: 'Ephemeral' 
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
(async () => {await startRedisKeyExpiredHandler(client);})();