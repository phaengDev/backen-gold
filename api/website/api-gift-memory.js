const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
router.post("/create", async function (req, res) {
    let imageName = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/gift');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            imageName = `${Date.now()}${ext}`;
            cb(null, imageName);
        }
    });
    const table = 'tbl_gift_memory';
    const upload = multer({ storage }).single('gift_img');
    upload(req, res, function (err) {

        const { giftId, gift_name, gift_text} = req.body;
        if (!giftId) {
            db.autoId(table, 'gift_id', (err, gift_id) => {
            const fields = 'gift_id,gift_name,gift_text,gift_img';
            const data = [gift_id, gift_name, gift_text, imageName];
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
            const where = `gift_id='${giftId}'`;
            db.selectWhere(table, '*', where, (err, results) => {
                if (results[0].gift_img && results[0].gift_img !== '' && imageName !== '') {
                    const filePath = path.join('assets/gift', results[0].gift_img);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting the existing file:', err);
                        }
                    });
                }
                let fileName = results[0].gift_img;
                if (imageName !== '') {
                    fileName = imageName;
                }

                const field = 'gift_name,gift_text,gift_img';
                const newData = [gift_name, gift_text, fileName, giftId];
                const condition = 'gift_id=?';
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
    const gift_id = req.params.id;
    const where = `gift_id=${gift_id}`;
    db.fetchSingle('tbl_gift_memory', '*', where, (fetchError, fetchResult) => {
        if (fetchError) {
            return res.status(500).json({ error: 'Error fetching pattern data' });
        }
        if (fetchResult && fetchResult.gift_img) {
            const filePath = path.join('assets/gift/', fetchResult.gift_img);
            fs.unlink(filePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error deleting the existing file:', unlinkError);
                }
            });
        }

        db.deleteData('tbl_gift_memory', where, (deleteError, deleteResults) => {
            if (deleteError) {
                return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
            }
            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: deleteResults });
        });
    });
});



router.get("/", function (req, res) {
    const tables = `tbl_gift_memory`;
    db.selectAll(tables, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

module.exports = router;
