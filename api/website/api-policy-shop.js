const express = require('express');
const router = express.Router();
const db = require('../db');
router.post("/create", function (req, res) {
    const { policy_id, policy_name, policy_detail } = req.body;
    const table = 'tbl_policy_shop';
    if (policy_id === '') {
        const fields = 'policy_name,policy_detail';
        const data = [policy_name, policy_detail];
        db.insertData(table, fields, data, (err, results) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດ` });
            }
            console.log('Data inserted successfully:', results);
            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
        });
    } else {
        const field = 'policy_name';
        const newData = [policy_name, policy_detail, policy_id];
        const condition = 'policy_id=?';
        db.updateData(table, field, newData, condition, (err, results) => {
            if (err) {
                console.error('Error updating data:', err);
                return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
            }
            console.log('Data updated successfully:', results);
            res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
        });
    }
});



router.delete("/:id", function (req, res, next) {
    const policy_id = req.params.id;
    const where = `policy_id='${policy_id}'`;
    db.deleteData('tbl_policy_shop', where, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
});

router.get("/", function (req, res) {
    db.selectAll('tbl_policy_shop', (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

module.exports = router;