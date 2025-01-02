const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
router.post("/create", async function (req, res) {
    let imageName = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/logo');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            imageName = `${Date.now()}${ext}`;
            cb(null, imageName);
        }
    });
    const table = 'tbl_bank';
    const upload = multer({ storage }).single('back_qr');
    upload(req, res, function (err) {

        const { bankId, bank_name, acount_name,acount_number} = req.body;
        if (!bankId) {
            db.autoId(table, 'bank_id', (err, bank_id) => {
            const fields = 'bank_id,bank_name,acount_name,acount_number,back_qr';
            const data = [bank_id, bank_name, acount_name,acount_number, imageName];
                db.insertData(table, fields, data, (err, results) => {
                    if (err) {
                        console.error('Error inserting data:', err);
                        return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດaa` });
                    }
                    console.log('Data inserted successfully:', results);
                    res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ' });
                });
            });
        } else {
            const where = `bank_id='${bankId}'`;
            db.selectWhere(table, '*', where, (err, results) => {
                if (results[0].back_qr && results[0].back_qr !== '' && imageName !== '') {
                    const filePath = path.join('assets/logo', results[0].back_qr);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting the existing file:', err);
                        }
                    });
                }
                let fileName = results[0].back_qr;
                if (imageName !== '') {
                    fileName = imageName;
                }

                const field = 'bank_name,acount_name,acount_number,back_qr';
                const newData = [bank_name, acount_name,acount_number, fileName, bankId];
                const condition = 'bank_id=?';
                db.updateData(table, field, newData, condition, (err, results) => {
                    if (err) {
                        console.error('Error updating data:', err);
                        return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
                    }
                    console.log('Data updated successfully:', results);
                    res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
                });
            });
        }
    });
});


router.delete("/:id", function (req, res) {
    const bank_id = req.params.id;
    const where = `bank_id=${bank_id}`;
    db.fetchSingle('tbl_bank', '*', where, (fetchError, fetchResult) => {
        if (fetchError) {
            return res.status(500).json({ error: 'Error fetching pattern data' });
        }
        if (fetchResult && fetchResult.back_qr) {
            const filePath = path.join('assets/logo/', fetchResult.back_qr);
            fs.unlink(filePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error deleting the existing file:', unlinkError);
                }
            });
        }

        db.deleteData('tbl_bank', where, (deleteError, deleteResults) => {
            if (deleteError) {
                return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
            }
            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: deleteResults });
        });
    });
});

router.get("/", function (req, res) {
    const tables = `tbl_bank`;
    const wheres = `bank_id !=''`;
    db.selectWhere(tables, '*', wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

module.exports = router;
