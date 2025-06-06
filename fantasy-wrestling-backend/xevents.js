// routes/events.js
const express = require('express');
const db = require('../db');  // Import the database connection
const router = express.Router();

// Function to calculate event points based on match details
function calculateEventPoints(event) {
    let points = 0;

    if (event.outcome === 'win') {
        points += 5;
        if (event.isTitleMatch) points += 2;
    } else if (event.outcome === 'loss') {
        points -= 2;
    } else if (event.outcome === 'draw') {
        points += 2;
    }

    if (event.eliminations) points += event.eliminations * 3;
    if (event.signatureMoves) points += event.signatureMoves * 2;
    if (event.pinfalls) points += event.pinfalls * 3;
    if (event.specialAppearance) points += 5;
    if (event.titleChange) points += 10;

    return points;
}

// API route to update wrestler scores
router.post('/update-score', (req, res) => {
    const { wrestlerId, events } = req.body;

    let totalPoints = 0;

    // Calculate points for each event and insert into the database
    events.forEach((event) => {
        totalPoints += calculateEventPoints(event);

        const query = `
            INSERT INTO events (wrestler_id, outcome, is_title_match, eliminations, signature_moves, pinfalls, special_appearance, title_change)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            wrestlerId, 
            event.outcome, 
            event.isTitleMatch, 
            event.eliminations, 
            event.signatureMoves, 
            event.pinfalls, 
            event.specialAppearance, 
            event.titleChange
        ];

        db.query(query, values, (err) => {
            if (err) {
                console.error('Error inserting event data:', err);
                res.status(500).send('Error inserting event data');
                return;
            }
        });
    });

    // Update the wrestler's score
    const updateQuery = `
        UPDATE wrestlers
        SET score = score + ?
        WHERE id = ?`;

    db.query(updateQuery, [totalPoints, wrestlerId], (err) => {
        if (err) {
            console.error('Error updating wrestler score:', err);
            res.status(500).send('Error updating score');
            return;
        }

        res.status(200).json({ message: 'Score updated successfully', totalPoints });
    });
});

module.exports = router;