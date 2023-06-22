import bodyParser from "body-parser";
import express from "express";

import CrowdinRouter from "./modules/crowdin/router";
import DockerRouter from "./modules/docker/router";

const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Hello world!");
});

app.use("/crowdin", CrowdinRouter);
app.use("/docker", DockerRouter);

app.listen(port, () => {
    console.info(`App V${process.env.npm_package_version} is running on http://localhost:${port} !`);
});
