const express=require('express');
const router=express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid')
router.post("/create", function (req, res) {
    const  unite_uuid=uuidv4();
    const {unite_id,unite_name} = req.body;
    const table = 'tbl_unite';
    if(unite_id===''){
    const fields = 'unite_uuid, unite_name';
    const data = [unite_uuid, unite_name];
    db.insertData(table, fields, data, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດ`  });
        }
        console.log('Data inserted successfully:', results);
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
}else{
    const field = 'unite_name';
    const newData = [unite_name,unite_id]; 
    const condition = 'unite_uuid=?'; 
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

router.post("/edit", function (req, res) {
    const {unite_uuid, unite_name} = req.body;
    const table = 'tbl_unite';
    const field = 'unite_uuid,unite_name';
    const newData = [unite_uuid,unite_name]; 
    const condition = 'unite_uuid=?'; 
    db.updateData(table, field, newData, condition, (err, results) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
        }
        console.log('Data updated successfully:', results);
        res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
    });
});

router.delete("/:id", function (req, res, next) {
    const unite_uuid= req.params.id;
    const where=`unite_uuid='${unite_uuid}'`;
    db.deleteData('tbl_unite', where, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
    });

    router.get("/", function (req, res, next) {
        const tables=`tbl_unite`;
        db.selectAll(tables, (err, results) => {
            if (err) {
                return res.status(400).send();
            }
            res.status(200).json(results);
        });
        });

module.exports = router;