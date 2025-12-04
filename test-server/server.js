const express = require('express');
const cors = require('cors');
const utils = require('./utils');
const app = express();

app.use(cors('*'));

const port = 3000;
const delay = 1;
/**
 * Generate a random number between min and max (inclusive)
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let storage = [];
let scatterReels = [
    [1, 2, 3, 4, 5, 1],
    [6, 7, 8, 9, 10, 2],
    [11, 12, 1, 8, 3, 4],
    [4, 5, 8, 7, 8, 6],
    [4, 7, 9, 8, 8, 2],
];

let winReels = [
    [1, 4, 2, 2, 5, 2],
    [8, 1, 3, 2, 1, 4],
    [2, 9, 6, 7, 2, 5],
    [1, 2, 2, 2, 2, 11],
    [1, 1, 1, 1, 2, 2],
];

let grandReels = [
    [11, 4, 2, 2, 5, 2],
    [9, 9, 2, 12, 10, 4],
    [1, 11, 12, 12, 9, 6],
    [12, 12, 12, 9, 12, 7],
    [11, 11, 12, 2, 12, 8],
];

app.get('/spin', async (req, res) => {
    await utils.waitFor(delay); // 1 sec

    // Generate 5 reels, each with 5 random symbols from the symbols array
    let symbols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14];
    const reels = Array.from({ length: 5 }, () =>
        Array.from({ length: 6 }, () => symbols[Math.floor(Math.random() * symbols.length)]),
    );

    console.log('Reels', reels);

    res.json({
        reels: reels,
    });
});

app.get('/collect', async (req, res) => {
    res.json({
        balance: 100000,
    });
});

app.listen(port, () => {
    console.log(`Express server listening at http://localhost:${port}`);
});
