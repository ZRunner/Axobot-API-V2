import { Request, Response } from "express";

import { MapWithDefault } from "../../utils/defaut_map";
import { AnyCrowdinEvent, CrowdinBatchEvents, CrowdinFileEvent, CrowdinStringEvent, isFileEvent } from "./types";
import { CrowdinFileAddedEvent, CrowdinFileFullyTranslatedEvent, CrowdinFileUpdatedEvent, CrowdinSourceStringAddedEvent, CrowdinSourceStringDeletedEvent, CrowdinSourceStringUpdatedEvent } from "./types/events";
import { authorFromProject, footerFromUser, sendToDiscord } from "./utils";

const EMBED_COLOR = 0x66bb6a;

export async function postWebhookNotification(req: Request<{ webhook_id: string, webhook_token: string }, unknown, AnyCrowdinEvent | CrowdinBatchEvents>, res: Response) {
    const webhook_path = req.params.webhook_id + "/" + req.params.webhook_token;
    // assign events to our lists
    const string_events: CrowdinStringEvent[] = [];
    const file_events: CrowdinFileEvent[] = [];
    if ("events" in req.body) {
        for (const event of req.body.events) {
            if (isFileEvent(event)) {
                file_events.push(event);
            } else {
                string_events.push(event);
            }
        }
    } else if (isFileEvent(req.body)) {
        file_events.push(req.body);
    } else {
        string_events.push(req.body);
    }
    // handle string events
    if (string_events.length > 0) {
        await handleBatchStringsUpdate(webhook_path, string_events);
    }
    // handle file events
    for (const event of file_events) {
        switch (event.event) {
            case "file.added":
                await handleFileAddedEvent(webhook_path, event);
                break;
            case "file.translated":
                await handleFileTranslatedEvent(webhook_path, event);
                break;
            case "file.updated":
                await handleFileUpdatedEvent(webhook_path, event);
                break;
        }
    }
    res.send("ok");
}


async function handleFileAddedEvent(webhook_path: string, event: CrowdinFileAddedEvent) {
    const project_url = event.file.project.url;
    const embed = {
        title: "New file added",
        description: `File: ${event.file.path}\n\n[Go to project](${project_url})`,
        color: EMBED_COLOR,
        footer: footerFromUser(event.user),
        author: authorFromProject(event.file.project),
    };
    await sendToDiscord(webhook_path, { embeds: [embed] });
}

async function handleFileTranslatedEvent(webhook_path: string, event: CrowdinFileFullyTranslatedEvent) {
    const project_url = event.file.project.url;
    const embed = {
        title: "File fully translated",
        description: `File: ${event.file.path}\nLanguage: ${event.targetLanguage.name}\n\n[Go to project](${project_url})`,
        color: EMBED_COLOR,
        author: authorFromProject(event.file.project),
    };
    await sendToDiscord(webhook_path, { embeds: [embed] });
}

async function handleFileUpdatedEvent(webhook_path: string, event: CrowdinFileUpdatedEvent) {
    const project_url = event.file.project.url;
    const embed = {
        title: "File updated",
        description: `File: ${event.file.path}\n\n[Go to project](${project_url})`,
        color: EMBED_COLOR,
        footer: footerFromUser(event.user),
        author: authorFromProject(event.file.project),
    };
    await sendToDiscord(webhook_path, { embeds: [embed] });
}


async function handleBatchStringsUpdate(webhook_path: string, events: CrowdinStringEvent[]) {
    if (events.length === 1) {
        const event = events[0];
        switch (event.event) {
            case "string.added":
                await handleStringAdded(webhook_path, event);
                break;
            case "string.updated":
                await handleStringUpdated(webhook_path, event);
                break;
            case "string.deleted":
                await handleStringDeleted(webhook_path, event);
                break;
        }
        return;
    }
    const project = events[0].string.project;
    // assign each string to its event category
    const events_map = new MapWithDefault<["added"|"updated"|"deleted", string], Set<string>>(() => new Set());
    for (const event of events) {
        const file = event.string.file.path;
        const string_id = event.string.identifier;
        switch (event.event) {
            case "string.added":
                // if the string has been marked as deleted, mark it as updated
                if (events_map.get(["deleted", file]).has(string_id)) {
                    events_map.get(["deleted", file]).delete(string_id);
                    events_map.get(["updated", file]).add(string_id);
                } else {
                    events_map.get(["added", file]).add(string_id);
                }
                break;
            case "string.updated":
                events_map.get(["updated", file]).add(string_id);
                break;
            case "string.deleted":
                // if the string has been marked as added, mark it as updated
                if (events_map.get(["added", file]).has(string_id)) {
                    events_map.get(["added", file]).delete(string_id);
                    events_map.get(["updated", file]).add(string_id);
                } else {
                    events_map.get(["deleted", file]).add(string_id);
                }
                break;
        }
    }
    let text = "";
    for (const [event_type, file] of events_map.keys()) {
        const strings = [...events_map.get([event_type, file])];
        const _strings = strings.length === 1 ? "string" : "strings";
        text += `${strings.length} ${_strings} ${event_type} in ${file}\n`;
    }
    text += `\n[Go to project](${project.url})`;
    const _strings = events.length === 1 ? "string" : "strings";
    const embed = {
        title: `${events.length} ${_strings} edited`,
        description: text,
        color: EMBED_COLOR,
        footer: footerFromUser(events[0].user),
        author: authorFromProject(project),
    };
    await sendToDiscord(webhook_path, { embeds: [embed] });
}

async function handleStringAdded(webhook_path: string, event: CrowdinSourceStringAddedEvent) {
    const string_text = event.string.text.length < 200 ? event.string.text : event.string.text.substring(0, 200) + "...";
    const embed = {
        title: "Source string added",
        description: `File: ${event.string.file.path}\nKey: ${event.string.key}\n\n[Go to project](${event.string.url})`,
        fields: [
            { name: "Text", value: string_text },
        ],
        color: EMBED_COLOR,
        footer: footerFromUser(event.user),
        author: authorFromProject(event.string.project),
    };
    await sendToDiscord(webhook_path, { embeds: [embed] });
}

async function handleStringUpdated(webhook_path: string, event: CrowdinSourceStringUpdatedEvent) {
    const string_text = event.string.text.length < 200 ? event.string.text : event.string.text.substring(0, 200) + "...";
    const embed = {
        title: "Source string updated",
        description: `File: ${event.string.file.path}\nKey: ${event.string.key}\n\n[Go to project](${event.string.url})`,
        fields: [
            { name: "Text", value: string_text },
        ],
        color: EMBED_COLOR,
        footer: footerFromUser(event.user),
        author: authorFromProject(event.string.project),
    };
    await sendToDiscord(webhook_path, { embeds: [embed] });
}

async function handleStringDeleted(webhook_path: string, event: CrowdinSourceStringDeletedEvent) {
    const string_text = event.string.text.length < 200 ? event.string.text : event.string.text.substring(0, 200) + "...";
    const embed = {
        title: "Source string deleted",
        description: `File: ${event.string.file.path}\nKey: ${event.string.key}\n\n[Go to project](${event.string.url})`,
        fields: [
            { name: "Text", value: string_text },
        ],
        color: EMBED_COLOR,
        footer: footerFromUser(event.user),
        author: authorFromProject(event.string.project),
    };
    await sendToDiscord(webhook_path, { embeds: [embed] });
}

