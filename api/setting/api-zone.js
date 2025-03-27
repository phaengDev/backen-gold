const express=require('express');
const router=express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid')
router.post("/create", function (req, res) {
    const  zone_Id=uuidv4();
    const {zoneId,zoneName,bg_color,zone_status} = req.body;
    const table = 'tbl_zone_sale';
    if(zoneId===''){
    const dataCode=`CONCAT('Z-', LPAD(MAX(CAST(SUBSTRING(zone_code, 4) AS UNSIGNED)) + 1, 4, '0')) AS zonecode`;
    // db.maxCode(table, zone_code, (err, zone_code) => {
    db.selectData(table,dataCode,(req,ress)=>{
            const zone_code=ress[0].zonecode

    const fields = 'zone_Id,zone_code, zone_name,bg_color,zone_status';
    const data = [zone_Id,zone_code, zoneName,bg_color,zone_status];
    db.insertData(table, fields, data, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດ`  });
        }
        console.log('Data inserted successfully:', results);
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
});
}else{
    const field = 'zone_name,bg_color,zone_status';
    const newData = [zoneName,bg_color,zone_status,zoneId]; 
    const condition = 'zone_Id=?'; 
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
    const {zoneId, zoneName,bg_color,zone_status} = req.body;
    const table = 'tbl_zone_sale';
    const field = 'zone_Id,zone_name,bg_color,zone_status';
    const newData = [zoneName,bg_color,zone_status,zoneId]; 
    const condition = 'zone_Id=?'; 
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
    const zone_Id= req.params.id;
    const where=`zone_Id='${zone_Id}'`;
    const whereck=`zone_id_fk='${zone_Id}'`;
    db.selectWhere('tbl_stock_sale', '*',  whereck, (err, ress) => {
    if (!ress || ress.length === 0) {
    db.deleteData('tbl_zone_sale', where, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        return res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
    }else{
        return res.status(400).json({ message: 'ຂໍອະໄພໂຊນນີ້ມີສິນຄ້າທຳກຳລັງໃຊ້ງານຢູ່ ບໍ່ສາມາດລົບໄດ້' });
    }
    });
});

 
    router.get("/", function (req, res) {
        const tables = `tbl_zone_sale`;
        const field=`id,zone_Id,zone_code,zone_name,bg_color,zone_status,
        (SELECT COUNT(*) FROM tbl_stock_sale WHERE zone_id_fk = tbl_zone_sale.zone_Id) AS qty_stock`;
        db.selectData(tables,field, (err, results) => {
            if (err) {
                return res.status(400).send();
            }
            res.status(200).json(results);
          
        });
    });

module.exports = router;
