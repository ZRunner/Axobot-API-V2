import bodyParser from "body-parser";
import ConsoleStamp from "console-stamp";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan"; // console log every request

import AuthRouter from "./modules/auth/router";
import CrowdinRouter from "./modules/crowdin/router";
import DockerRouter from "./modules/docker/router";
import { formatDate } from "./utils/date_formatter";
import { checkEnvironmentVariables } from "./utils/env_checks";

const app = express();

dotenv.config();
const port = process.env.PORT || 3000;

if (!checkEnvironmentVariables()) {
    process.exit(1);
}

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

app.use(bodyParser.json());

// Middleware to return a clean error message when the body is not a valid JSON
app.use(function(error: Error, req: Request, res: Response, next: NextFunction) {
    if (error instanceof SyntaxError) {
        res.status(400).send("Invalid JSON body");
    } else {
        next();
    }
});

// log every request to the console
morgan.token("date", (req) => formatDate(req._startTime));
morgan.token("err", (req, res) => (res._err ? ` - [${res._err}]` : "\u200b"));
app.use(morgan("\x1b[94m[:date]\x1b[0m :method :status :url:err - :response-time ms"));


app.get("/", (req, res) => {
    res.send("Hello world!");
});

app.use("/auth", AuthRouter);
app.use("/crowdin", CrowdinRouter);
app.use("/docker", DockerRouter);

app.listen(port, () => {
    console.info(`App V${process.env.npm_package_version} is running on http://localhost:${port} !`);
});
