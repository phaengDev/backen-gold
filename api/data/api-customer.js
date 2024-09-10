const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
router.post('/register', function (req, res) {
    let file_Name = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/document');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            file_Name = `cus-${Date.now()}${ext}`;
            cb(null, file_Name);
        }
    });

    const cus_uuid = uuidv4();
    const tableCut = 'tbl_customer';
    const upload = multer({ storage }).single('file_doc');
    upload(req, res, function (err) {
        const { customId, cus_fname, cus_lname, cus_dob, cus_tel, email, card_number, cus_address, cus_remark, status_register } = req.body;
        let cusdob = 'null';
        if (cus_dob !== null) {
            cusdob = moment(cus_dob).format('YYYY-MM-DD');
        }
        if (customId === '') {
            const customCode = `CASE 
            WHEN MAX(CAST(SUBSTRING(custom_code, 4) AS UNSIGNED)) IS NULL THEN 'VK-100001'
            ELSE CONCAT('VK-', LPAD(MAX(CAST(SUBSTRING(custom_code, 4) AS UNSIGNED)) + 1, 6, '0')) 
            END AS custom_code`;
            db.selectData(tableCut, customCode, (err, ress) => {
                if (err) {
                    console.error('Error fetching custom code:', err);
                    return res.status(500).json({ error: 'Error generating custom code' });
                }
                const custom_code = ress[0].custom_code;
                const fieldCus = `cus_uuid,
                custom_code,
                cus_fname,
                cus_lname,
                cus_dob,
                cus_tel,
                email,
                card_number,
                cus_address,
                cus_remark,
                cus_status,
                file_doc,
                status_register,
                cus_reate_date`;
                const dataCus = [cus_uuid, custom_code, cus_fname, cus_lname, cusdob, cus_tel, email, card_number, cus_address, cus_remark, '1', file_Name, status_register, dateTime]
                db.insertData(tableCut, fieldCus, dataCus, (err, results) => {
                    if (err) {
                        console.error('Error updating data:', err);
                        return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
                    }
                    res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', customId: cus_uuid });
                })
            });
        }else{

            const where = `cus_uuid='${customId}'`;
            db.selectWhere(tableCut, '*', where, (err, results) => {
                if (results[0].file_doc && results[0].file_doc !== '' && file_Name !== '') {

                    const filePath = path.join('assets/document', results[0].file_doc);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting the existing file:', err);
                        }
                    });
                }
                let fileName = results[0].file_doc;
                if (file_Name !== '') {
                    fileName = file_Name;
                }
                const field = `cus_fname,
                cus_lname,
                cus_dob,
                cus_tel,
                email,
                card_number,
                cus_address,
                cus_remark,
                file_doc`;
                const newData = [cus_fname, cus_lname, cus_dob, cus_tel, email, card_number, cus_address, cus_remark,fileName, customId];
                const condition = 'cus_uuid=?';
                db.updateData(tableCut, field, newData, condition, (err, results) => {
                    if (err) {
                        return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
                    }
                    res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
                });
            });



        };
    });
});

router.post("/search", function (req, res) {
    const { cusTel } = req.body;
    const table = 'tbl_customer';
    const condition = `cus_tel LIKE '%${cusTel}%'`;
    db.selectWhere(table, '*', condition, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
        }
        res.status(200).json(results);
    });
});

router.get("/:id", function (req, res) {
    const cus_uuid = req.params.id;
    const condition = `cus_uuid = '${cus_uuid}'`;
    db.fetchSingle('tbl_customer', '*', condition, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
        }
        res.status(200).json(results);
    });
});


module.exports = router;
