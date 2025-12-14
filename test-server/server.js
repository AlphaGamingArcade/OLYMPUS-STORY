const express = require('express');
const cors = require('cors');
const utils = require('./utils');
const app = express();

// Body parser middleware - ADD THESE LINES
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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
    [4, 5, 10, 7, 10, 6],
    [4, 7, 9, 10, 10, 2],
];

let winReels = [
    [1, 12, 2, 2, 5, 2],
    [8, 1, 13, 14, 1, 4],
    [2, 11, 6, 7, 2, 5],
    [1, 11, 2, 2, 2, 11],
    [1, 1, 1, 1, 2, 2],
];

let grandReels = [
    [11, 4, 2, 2, 5, 2],
    [9, 9, 2, 12, 10, 4],
    [1, 11, 12, 12, 9, 6],
    [12, 12, 12, 9, 12, 7],
    [11, 11, 12, 2, 12, 8],
];

function hasAtLeastNSymbols(reels, symbol, minCount) {
    let count = 0;

    for (const reel of reels) {
        for (const sym of reel) {
            if (sym === symbol) {
                count++;
                if (count >= minCount) {
                    return true; // Early exit optimization
                }
            }
        }
    }

    return false;
}

/**
 * feature
 * 0 - normal
 * 1 - buy feature (if available)
 * 2 - buy feature v2 (if available)
 * 3 - buy feature v3 (if available)
 *
 * bet - amount user bet for spin
 *
 * */

let balance = 10000000;

app.post('/spin', async (req, res) => {
    await utils.waitFor(delay); // 1 sec

    // buy feature
    if (req.body && req.body.feature && req.body.feature == 1) {
        balance = balance - req.body.bet * 100;

        return res.json({
            reels: scatterReels,
            freeSpins: 25,
        });
    }

    balance = balance - req.body.bet;

    // Generate 5 reels, each with 5 random symbols from the symbols array
    let symbolsByReel = [
        [1, 2, 9, 9, 4, 9, 9, 2, 4, 3, 4, 5, 6, 7, 8, 9], // Reel 0 symbols
        [1, 2, 2, 9, 4, 8, 9, 2, 3, 9, 9, 2, 5, 6, 7, 8, 9, 11, 13, 14], // Reel 1 symbols
        [1, 2, 8, 8, 4, 8, 8, 3, 4, 2, 5, 6, 7, 8, 9, 10, 11, 13, 14], // Reel 2 symbols
        [2, 3, 4, 5, 2, 2, 8, 8, 9, 9, 4, 6, 7, 8, 9, 10, 11], // Reel 3 symbols
        [3, 4, 5, 2, 6, 7, 8, 9, 11, 12], // Reel 4 symbols
    ];

    // let symbolsByReel = [
    //     [1, 2, 9, 9, 4, 9, 9, 2, 4, 3, 4, 5, 6, 7, 8, 9], // Reel 0 symbols
    //     [1, 2, 2, 9, 4, 8, 9, 2, 3, 9, 9, 2, 5, 6, 7, 8, 9], // Reel 1 symbols
    //     [1, 2, 8, 8, 4, 8, 8, 3, 4, 2, 5, 6, 7, 8, 9], // Reel 2 symbols
    //     [2, 3, 4, 5, 2, 2, 8, 8, 9, 9, 4, 6, 7, 8, 9], // Reel 3 symbols
    //     [3, 4, 5, 2, 6, 7, 8, 9], // Reel 4 symbols
    // ];

    const reels = Array.from({ length: 5 }, (_, reelIndex) =>
        Array.from({ length: 6 }, () => {
            const availableSymbols = symbolsByReel[reelIndex];
            return availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
        }),
    );

    res.json({
        reels: reels,
        freeSpins: hasAtLeastNSymbols(reels, 10, 4) ? 12 : undefined,
    });
});

app.get('/collect', async (req, res) => {
    res.json({
        balance,
    });
});

app.listen(port, () => {
    console.log(`Express server listening at http://localhost:${port}`);
});
