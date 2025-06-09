import * as dotenv from 'dotenv';
dotenv.config();
import {Client, Events, GatewayIntentBits, REST, Routes} from "discord.js";
import { commands, handleCommands } from './commands/CommandHandler';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
})