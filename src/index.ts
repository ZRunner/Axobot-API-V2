import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send("Hello world!");
});

app.listen(3000, () => {
    console.info(`App V${process.env.npm_package_version} is running on http://localhost:3000 !`);
});
