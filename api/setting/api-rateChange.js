const express = require('express');
const router = express.Router();
const db = require('../db');
router.post("/create", function (req, res) {
    const { currencyId, currency_name, genus, genus_laos } = req.body;
    const reate_price = parseFloat(req.body.reate_price.replace(/,/g, ''));
    const table = 'oac_currency';
    if (!currencyId) {
        db.autoId(table, 'currency_id', (err, currency_id) => {
            const fields = 'currency_id, currency_name,genus,genus_laos,reate_price';
            const data = [currency_id, currency_name, genus, genus_laos, reate_price];
            db.insertData(table, fields, data, (err, results) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດ` });
                }
                console.log('Data inserted successfully:', results);
                res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
            });
        });
    } else {
        const field = 'currency_name,genus,genus_laos,reate_price';
        const newData = [currency_name, genus, genus_laos, reate_price, currencyId];
        const condition = 'currency_id=?';
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
    const currency_id = req.params.id;
    if(currency_id==='22001'){
        return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
    }else{
    const where = `currency_id=${currency_id}`;
    db.deleteData('oac_currency', where, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
}
});

router.get("/", function (req, res, next) {
    const tables = `oac_currency`;
    db.selectAll(tables, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

module.exports = router;