const express=require('express');
const router=express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid')
router.post("/create", function (req, res) {
    const  tile_uuid=uuidv4();
    const {tile_id,type_id_fk,tile_name,unite_id_fk} = req.body;
    const table = 'tbl_product_tile';
    if(tile_id ===''){ 
    db.maxCode(table, 'tile_code', (err, tile_code) => {
    const fields = 'tile_uuid,tile_code, type_id_fk,tile_name,unite_id_fk';
    const data = [tile_uuid,tile_code, type_id_fk,tile_name,unite_id_fk];
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
        const field = 'type_id_fk,tile_name,unite_id_fk';
        const newData = [type_id_fk,tile_name,unite_id_fk,tile_id]; 
        const condition = 'tile_uuid=?'; 
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

// router.post("/edit", function (req, res) {
//     const {tile_uuid,type_id_fk,tile_name,unite_id_fk} = req.body;
//     const table = 'tbl_product_tile';
//     const field = 'type_id_fk,tile_name,unite_id_fk';
//     const newData = [type_id_fk,tile_name,unite_id_fk,tile_uuid]; 
//     const condition = 'tile_uuid=?'; 
//     db.updateData(table, field, newData, condition, (err, results) => {
//         if (err) {
//             console.error('Error updating data:', err);
//             return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
//         }
//         console.log('Data updated successfully:', results);
//         res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
//     });
// });

router.delete("/:id", function (req, res, next) {
    const tile_uuid= req.params.id;
    const where=`tile_uuid='${tile_uuid}'`;
    const whereck=`tiles_id_fk='${tile_uuid}'`;
    db.selectWhere('tbl_product', '*',  whereck, (err, ress) => {
    if (!ress || ress.length === 0) {
    db.deleteData('tbl_product_tile', where, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
}else{
    res.status(400).json({ message: 'ຂໍ້ມູນນີ້ກຳລັງໃຊ້ງານຢູ່ບໍ່ສາມາດລົບອອກໄດ້' });
}
});
    });

    router.get("/", function (req, res, next) {
        const tables=`tbl_product_tile
        LEFT JOIN tbl_type_gold ON tbl_product_tile.type_id_fk=tbl_type_gold.type_Id
        LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid`;
        const field=`tile_uuid,tile_code,type_id_fk,tile_name,unite_id_fk,unite_name,typeName,
        (SELECT COUNT(*) FROM tbl_product WHERE tiles_id_fk = tbl_product_tile.tile_uuid) AS qty_stock`
        db.selectData(tables,field, (err, results) => {
            if (err) {
                return res.status(400).send();
            }
            res.status(200).json(results);
        });
        });

module.exports = router;
