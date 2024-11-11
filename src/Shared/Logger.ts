import { WebhookClient, EmbedBuilder, ColorResolvable, time, TimestampStyles } from "discord.js";
import { logging, devmode } from '../../storage/config.json';


export class Logger {
    //private static webhook:WebhookClient = new WebhookClient({id: logging.id, token: logging.token});
    private static webhook:WebhookClient;
    
    public static rawlog(message:any) {
        console.log(message);
        this.sendWebhookLog(message);
    }

    public static log(message:any, moduleName?:string) {
        console.log(`[BNS${moduleName ? ` ${moduleName}` : ``}] ${new Date(Date.now()).toLocaleString()} > ${message}`);
        this.sendWebhookLog(`[BNS${moduleName ? ` ${moduleName}` : ``}] ${time(new Date(Date.now()), TimestampStyles.LongTime)} > ${message}`);
    }

    public static warn(message:any, source?:string) {
        console.warn(`[WARN] ${new Date(Date.now()).toLocaleString()} > ${message}`);
        this.sendWebhookEmbed(`Warning`, message, 0xFF9900, source);
    }

    public static error(message:any, source?:string) {
        console.error(`[ERROR] ${new Date(Date.now()).toLocaleString()} > ${message}`);
        this.sendWebhookEmbed(`Error`, message, 0xFF0000, source);
    }

    //compatibility
    public log(message:any, moduleName?:string) {
        Logger.log(message, moduleName);
    }

    public warn(message:any, source?:string) {
        Logger.warn(message, source);
    }

    public error(message:any, source?:string) {
        Logger.error(message, source);
    }
    
    
    private static sendWebhookEmbed(title:string, message:any, color:ColorResolvable, source:string) {
        let loggingEmbed:EmbedBuilder = new EmbedBuilder()
            .setTitle(title)
            .setDescription(message.toString())
            .setColor(color)
            .setFooter({
                text: `BNS - ${source}`,
            })
            .setTimestamp();

        if (!devmode) {
            if (!Logger.webhook) { Logger.webhook = new WebhookClient({url: logging.webhookUrl}); }
            Logger.webhook.send({embeds: [loggingEmbed], allowedMentions: { users: [`213074932458979330`], roles: []}});
        }
    }
    private static sendWebhookLog(message:any) {
        if (!devmode) {
            if (!Logger.webhook) { Logger.webhook = new WebhookClient({url: logging.webhookUrl}); }
            Logger.webhook.send({content: message, allowedMentions: { users: [], roles: []}}).catch(console.error);
        }
    }
}