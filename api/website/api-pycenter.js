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
            cb(null, './assets/slider');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            imageName = `p-${Date.now()}${ext}`;
            cb(null, imageName);
        }
    });


    const table = 'tbl_py_centers';
    const upload = multer({ storage }).single('pcenter_image');
    upload(req, res, function (err) {

        const { pcenterId, pcenter_name, description } = req.body;
        if (!pcenterId) {

            db.autoId(table, 'pcenter_id', (err, pcenter_id) => {
                const fields = 'pcenter_id,pcenter_image,pcenter_name,description';
                const data = [pcenter_id, imageName, pcenter_name, description];
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

            const where = `pcenter_id='${pcenterId}'`;
            db.selectWhere(table, '*', where, (err, results) => {
                if (results[0].pcenter_image && results[0].pcenter_image !== '' && imageName !== '') {
                    const filePath = path.join('assets/slider', results[0].pcenter_image);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting the existing file:', err);
                        }
                    });
                }
                let fileName = results[0].pcenter_image;
                if (imageName !== '') {
                    fileName = imageName;
                }

                const field = 'pcenter_name,description,pcenter_image';
                const newData = [pcenter_name, description, fileName, pcenterId];
                const condition = 'pcenter_id=?';
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
    const pcenter_id = req.params.id;
    const where = `pcenter_id=${pcenter_id}`;

    db.fetchSingle('tbl_py_centers', '*', where, (fetchError, fetchResult) => {
        if (fetchError) {
            return res.status(500).json({ error: 'Error fetching pattern data' });
        }
        if (fetchResult && fetchResult.pcenter_image) {
            const filePath = path.join('assets/slider/', fetchResult.pcenter_image);
            fs.unlink(filePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error deleting the existing file:', unlinkError);
                }
            });
        }

        db.deleteData('tbl_py_centers', where, (deleteError, deleteResults) => {
            if (deleteError) {
                return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
            }
            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: deleteResults });
        });
    });
});



router.get("/", function (req, res) {
    const tables = `tbl_py_centers`;
    const wheres = `pcenter_id !=''`;
    db.selectWhere(tables, '*', wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

module.exports = router;
