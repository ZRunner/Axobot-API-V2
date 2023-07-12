import bodyParser from "body-parser";
import ConsoleStamp from "console-stamp";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan"; // console log every request

import AuthRouter from "./modules/auth/router";
import CrowdinRouter from "./modules/crowdin/router";
import DiscordRouter from "./modules/discord/router";
import DockerRouter from "./modules/docker/router";
import { formatDate } from "./utils/date_formatter";
import { checkEnvironmentVariables } from "./utils/env_checks";

const app = express();

if (!checkEnvironmentVariables()) {
    process.exit(1);
}

const port = Number(process.env.PORT) || 3000;

// custom console log format
ConsoleStamp(console, {
    format: ":date(dd/mm/yyyy HH:MM:ss).blueBright :label(7)",
    extend: {
        debug: 5,
        fatal: 0,
    },
    include: ["debug", "info", "warn", "error", "fatal"],
    level: "debug",
});

// Set up CORS
app.use(cors({
    origin: "https://axobeta.zrunner.me",
}));

// Allow BigInt in JSON responses
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function() {
    return this.toString();
  };

app.use(bodyParser.json());


// log every request to the console
morgan.token("date", (req) => formatDate(req._startTime));
morgan.token("err", (req, res) => (res._err ? ` - [${res._err}]` : "\u200b"));
app.use(morgan("\x1b[94m[:date]\x1b[0m :method :status :url:err - :response-time ms"));


app.get("/", (req, res) => {
    res.send({ success: true, version: process.env.npm_package_version });
});

app.use("/auth", AuthRouter);
app.use("/crowdin", CrowdinRouter);
app.use("/discord", DiscordRouter);
app.use("/docker", DockerRouter);

// Middleware to return a clean error message when the body is not a valid JSON
app.use(function(error: Error, req: Request, res: Response, next: NextFunction) {
    console.debug("went there");
    if (error instanceof SyntaxError) {
        res.status(400).send("Invalid JSON body");
    } else {
        console.error(error.stack);
        res.status(500).send("Internal server error");
    }
});

app.listen(port, () => {
    console.info(`App V${process.env.npm_package_version} is running on http://localhost:${port} !`);
});
