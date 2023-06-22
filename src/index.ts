import express from 'express';
import bodyParser from 'body-parser';
import CrowdinRouter from './modules/crowdin/router';

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("Hello world!");
});

app.use('/crowdin', CrowdinRouter);

app.listen(3000, () => {
    console.info(`App V${process.env.npm_package_version} is running on http://localhost:3000 !`);
});
