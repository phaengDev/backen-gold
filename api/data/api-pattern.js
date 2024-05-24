const express = require('express');
const router = express.Router();
const db = require('../db');
router.post("/create", function (req, res) {
    const { pattern_id, title_id_fk,option_id_fk, pattern_name, pattern_pirce } = req.body;
    const patternPirce = parseFloat(pattern_pirce.replace(/,/g, ''));
    const table = 'tbl_pattern';
    if (pattern_id === '') {
        const where = `pattern_id='${pattern_id}'`;
        db.selectWhere(table, '*', where, (err, ress) => {
            if (!ress || ress.length === 0) {

                db.autoId(table, 'pattern_id', (err, pattern_id) => {
                    const fields = 'pattern_id,title_id_fk,option_id_fk, pattern_name,pattern_pirce';
                    const data = [pattern_id, title_id_fk,option_id_fk, pattern_name, patternPirce];
                   
                    db.insertData(table, fields, data, (err, results) => {
                        if (err) {
                            console.error('Error inserting data:', err);
                            return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດaa` });
                        }
                        console.log('Data inserted successfully:', results);
                        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
                    });
                });
            } else {
                res.status(400).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ' });
            }
        });
    } else {
        const field = 'title_id_fk,option_id_fk, pattern_name,pattern_pirce';
        const newData = [title_id_fk,option_id_fk, pattern_name, patternPirce, pattern_id];
        const condition = 'pattern_id=?';
        db.updateData(table, field, newData, condition, (err, results) => {
            if (err) {
                // console.error('Error updating data:', err);
                return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
            }
            // console.log('Data updated successfully:', results);
            res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ33', data: results });
        });
    }
});



router.delete("/:id", function (req, res, next) {
    const pattern_id = req.params.id;
    const where = `pattern_id='${pattern_id}'`;
            db.deleteData('tbl_pattern', where, (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
                }
                res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
            });
    });

router.post("/", function (req, res, next) {
    const { type_id_fk, title_id_fk,option_id_fk } = req.body;
    let typeId_fk='';
if(type_id_fk){
    typeId_fk=`AND type_id_fk='${type_id_fk}'`;
}
let titleId_fk='';
if(title_id_fk){
    titleId_fk=`AND title_id_fk='${title_id_fk}'`;
}
let optionId_fk='';
if(option_id_fk){
    optionId_fk=`AND option_id_fk='${option_id_fk}'`;
}
    const tables = `tbl_pattern
    LEFT JOIN tbl_product_tile ON tbl_pattern.title_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_options ON tbl_pattern.option_id_fk=tbl_options.option_id`;
    const field = `pattern_id,title_id_fk,option_id_fk,pattern_name,pattern_pirce,option_name,tile_name`;
    const wheres=`pattern_id !='' ${typeId_fk} ${titleId_fk} ${optionId_fk}`;
    db.selectWhere(tables, field,wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

module.exports = router;
