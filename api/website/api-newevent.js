const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { param } = require('./api-apply-job');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/potstnew/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `news-${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });
router.post('/create', upload.array('fileList'), async (req, res) => {
    try {
        const table = 'tbl_newevent';
        const { event_id, titleName, newText } = req.body;
        const files = req.files;
        if (!event_id) {
            db.autoId(table, 'event_id', (err, newEventId) => {
                if (err) {
                    console.error('Error generating event_id:', err);
                    return res.status(500).json({ error: 'Error generating event_id' });
                }
                const fields = 'event_id, titleName, newText,status_news, newDate';
                const data = [newEventId, titleName, newText,1, dateTime];
                db.insertData(table, fields, data, (err, results) => {
                    if (err) {
                        console.error('Error inserting data:', err);
                        return res.status(500).json({ error: 'Error inserting data' });
                    }

                    if (files && files.length > 0) {
                        const tableFile = 'tbl_newlist';
                        const fieldList = 'new_id_fk, img_list';
                        let fileInsertPromises = [];

                        files.forEach(file => {
                            const dataList = [newEventId, file.filename];
                            fileInsertPromises.push(
                                new Promise((resolve, reject) => {
                                    db.insertData(tableFile, fieldList, dataList, (err, results) => {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            resolve(results);
                                        }
                                    });
                                })
                            );
                        });

                        Promise.all(fileInsertPromises)
                            .then(results => {
                                console.log('All files inserted successfully:', results);
                                res.status(200).json({ message: 'Data inserted successfully' });
                            })
                            .catch(err => {
                                console.error('Error inserting file data:', err);
                                res.status(500).json({ error: 'Error inserting file data' });
                            });
                    } else {
                        res.status(200).json({ message: 'Data inserted successfully without files' });
                    }
                });
            });
        }
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({ error: 'Error processing request' });
    }
});




router.post("/editList", async function (req, res) {
    let imageName = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/potstnew');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            imageName = `news-${Date.now()}${ext}`;
            cb(null, imageName);
        }
    });
    const upload = multer({ storage }).single('img_list');
    upload(req, res, function (err) {

        const { detail_id, newText } = req.body;
        const where = `detail_id='${detail_id}'`;
        db.selectWhere('tbl_newlist', '*', where, (err, results) => {
            if (results[0].img_list && results[0].img_list !== '' && imageName !== '') {
                const filePath = path.join('assets/potstnew', results[0].img_list);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting the existing file:', err);
                    }
                });
            }
            let fileName = results[0].img_list;
            if (imageName !== '') {
                fileName = imageName;
            }

            const field = 'img_list,newText';
            const newData = [fileName, newText, detail_id];
            const condition = 'detail_id=?';
            db.updateData('tbl_newlist', field, newData, condition, (err, results) => {
                if (err) {
                    console.error('Error updating data:', err);
                    return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
                }
                console.log('Data updated successfully:', results);
                res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
            });
        });
    })
})



router.delete("/deleteList/:id", async function (req, res) {
    const detail_id = req.params.id;
    const where = `detail_id='${detail_id}'`;
    db.selectWhere('tbl_newlist', '*', where, (err, results) => {
        if (results[0].img_list && results[0].img_list !== '') {
            const filePath = path.join('assets/potstnew', results[0].img_list);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting the existing file:', err);
                }
            });
        }
        db.deleteData('tbl_newlist', where, (err, results) => {
            if (err) {
                console.error('Error updating data:', err);
                return res.status(500).json({ error: 'ລົບຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
            }
            console.log('Data updated successfully:', results);
            res.status(200).json({ message: 'ການລົບຂໍ້ມູນສຳເລັດ', data: results });
        });
    });
});


router.get("/", function (req, res) {
    const tables = `tbl_newevent WHERE status_news=1 ORDER BY event_id DESC`;
    db.selectAll(tables, (err, results) => {
        if (err) {
            return res.status(400).send();
        }

        const promises = results.map(contract => {
            const wheres = `new_id_fk = '${contract.event_id}'`;
            return new Promise((resolve, reject) => {
                db.selectWhere('tbl_newlist', '*', wheres, (err, resultsList) => {
                    if (err) {
                        return reject(err);
                    }
                    contract.img_list = resultsList;
                    resolve(contract);
                });
            });
        });
        Promise.all(promises)
            .then(updatedResults => {
                res.status(200).json(updatedResults);
            })
            .catch(error => {
                res.status(400).send();
            });

    });
});


router.get("/view/:id", function (req, res) {
    const event_id = req.params.id;
    const wheresEvent = `event_id=${event_id}`;
    const tablesEvent = `tbl_newevent`;
    db.fetchSingleAll(tablesEvent, wheresEvent, (err, eventResults) => {
        if (err) {
            return res.status(400).send({ error: 'Error fetching event details' });
        }
        if (!eventResults) {
            return res.status(404).send({ error: 'Event not found' });
        }
        const wheresList = `new_id_fk = '${eventResults.event_id}'`;
        db.selectWhere('tbl_newlist', '*', wheresList, (err, listResults) => {
            if (err) {
                return res.status(400).send({ error: 'Error fetching list details' });
            }
            const response = {
                event: eventResults,
                list: listResults
            };
            res.status(200).json(response);
        });
    });
});



module.exports = router;