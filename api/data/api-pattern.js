const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');

router.post("/create", async function (req, res) {
    let imageName = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/pattern');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            imageName = `${Date.now()}${ext}`;
            cb(null, imageName);
        }
    });
    const table = 'tbl_pattern';
    const upload = multer({ storage }).single('pattern_img');
    upload(req, res, function (err) {

        const { patternId, title_id_fk, option_id_fk, pattern_name, pattern_pirce,pattern_remart } = req.body;
        const patternPirce = parseFloat(pattern_pirce.replace(/,/g, ''));
        if (!patternId) {
            db.maxCode(table, 'pattern_id', (err, pattern_id) => {
                const fields = 'pattern_id,title_id_fk,option_id_fk,pattern_img, pattern_name,pattern_pirce,pattern_remart';
                const data = [pattern_id, title_id_fk, option_id_fk, imageName, pattern_name, patternPirce,pattern_remart];

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
            const where = `pattern_id='${patternId}'`;
            db.selectWhere(table, '*', where, (err, results) => {
                if (results[0].pattern_img && results[0].pattern_img !== '' && imageName !== '') {

                    const filePath = path.join('assets/pattern', results[0].pattern_img);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting the existing file:', err);
                        }
                    });
                }
                let fileName = results[0].pattern_img;
                if (imageName !== '') {
                    fileName = imageName;
                }

                const field = 'title_id_fk,option_id_fk,pattern_img, pattern_name,pattern_pirce,pattern_remart';
                const newData = [title_id_fk, option_id_fk, fileName, pattern_name, patternPirce,pattern_remart, patternId];
                const condition = 'pattern_id=?';
                db.updateData(table, field, newData, condition, (err, results) => {
                    if (err) {
                        // console.error('Error updating data:', err);
                        return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
                    }
                    // console.log('Data updated successfully:', results);
                    res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ33', data: results });
                });
            });
        }
    });

});


router.delete("/:id", function (req, res) {
    const pattern_id = req.params.id;
    const where = `pattern_id='${pattern_id}'`;

    db.fetchSingle('tbl_pattern', '*', where, (error, res) => {
        if (error) {
            return res.status(500).json({ error: 'Error fetching pattern data' });
        }
        if (res && res.pattern_img ) {
            const filePath = path.join('assets/pattern/', res.pattern_img);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting the existing file:', err);
                }
            });
        }
        db.deleteData('tbl_pattern', where, (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
            }
            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
        });
    })
});

router.post("/", function (req, res) {
    const { type_id_fk, title_id_fk, option_id_fk } = req.body;
    let typeId_fk = '';
    if (type_id_fk) {
        typeId_fk = `AND type_id_fk='${type_id_fk}'`;
    }
    let titleId_fk = '';
    if (title_id_fk) {
        titleId_fk = `AND title_id_fk='${title_id_fk}'`;
    }
    let optionId_fk = '';
    if (option_id_fk) {
        optionId_fk = `AND option_id_fk='${option_id_fk}'`;
    }
    const tables = `tbl_pattern
    LEFT JOIN tbl_product_tile ON tbl_pattern.title_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_options ON tbl_pattern.option_id_fk=tbl_options.option_id`;
    const field = `pattern_id,title_id_fk,option_id_fk,pattern_img,pattern_name,pattern_pirce,option_name,tile_name,pattern_remart`;
    const wheres = `pattern_id !='' ${typeId_fk} ${titleId_fk} ${optionId_fk}`;
    db.selectWhere(tables, field, wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

module.exports = router;
