const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid')
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
router.post("/create", function (req, res) {
    const { option_id, option_name, grams} = req.body;
    const fieldUp = 'option_name,grams';
    const newData = [option_name, grams,option_id];
    const condition = 'option_id=?';
    db.updateData('tbl_options',fieldUp, newData, condition, (err, resultsUp) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: resultsUp });
    });
});
router.get("/", function (req, res) {
    db.selectAll('tbl_options', (err, results) => {
        if (err) {
            return res.status(400).send('ການສະແດງຂໍ້ມູນລົມເຫຼວ');
        }
        res.status(200).json(results);
    });
});

router.get("/:id", function (req, res) {
    const id = req.params.id;
    const where = `option_id=${id}`;
    db.fetchSingleAll('tbl_options', where, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});
module.exports = router
