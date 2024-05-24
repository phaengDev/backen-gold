const express=require('express');
const router=express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
router.post("/search", function (req, res) {
    const {cusTel} = req.body;
    const table = 'tbl_customer';
    const condition = `cus_tel LIKE '%${cusTel}%'`;
    db.selectWhere(table, '*', condition, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
        }
        res.status(200).json(results);
    });

});
module.exports = router;
