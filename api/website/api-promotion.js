const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');

router.post("/create", async function (req, res) {
    let imageName = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/promotion');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            imageName = `${Date.now()}${ext}`;
            cb(null, imageName);
        }
    });
    const table = 'tbl_promotion';
    const upload = multer({ storage }).single('pro_image');
    upload(req, res, function (err) {

        const { promotionId, promotion_title, promotion_detail,start_date,end_date} = req.body;
        const startDate=moment(start_date).format('YYYY-MM-DD')
        const endDate=moment(end_date).format('YYYY-MM-DD')
        if (!promotionId) {
            db.autoId(table, 'promotion_id', (err, promotion_id) => {
            const fields = 'promotion_id,promotion_title,promotion_detail,pro_image,start_date,end_date';
            const data = [promotion_id, promotion_title, promotion_detail, imageName,startDate,endDate];
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
            const where = `promotion_id='${promotionId}'`;
            db.selectWhere(table, '*', where, (err, results) => {
                if (results[0].pro_image && results[0].pro_image !== '' && imageName !== '') {
                    const filePath = path.join('assets/promotion', results[0].pro_image);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting the existing file:', err);
                        }
                    });
                }
                let fileName = results[0].pro_image;
                if (imageName !== '') {
                    fileName = imageName;
                }

                const field = 'promotion_title,promotion_detail,pro_image,start_date,end_date';
                const newData = [promotion_title, promotion_detail, fileName,startDate,endDate, promotionId];
                const condition = 'promotion_id=?';
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
    const promotion_id = req.params.id;
    const where = `promotion_id=${promotion_id}`;

    db.fetchSingle('tbl_promotion', '*', where, (fetchError, fetchResult) => {
        if (fetchError) {
            return res.status(500).json({ error: 'Error fetching pattern data' });
        }
        if (fetchResult && fetchResult.pro_image) {
            const filePath = path.join('assets/promotion/', fetchResult.pro_image);
            fs.unlink(filePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error deleting the existing file:', unlinkError);
                }
            });
        }

        db.deleteData('tbl_promotion', where, (deleteError, deleteResults) => {
            if (deleteError) {
                return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
            }

            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: deleteResults });
        });
    });
});



router.get("/", function (req, res) {
    const tables = `tbl_promotion`;
    const wheres = `promotion_id !=''`;
    db.selectWhere(tables, '*', wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

module.exports = router;
