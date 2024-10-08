const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exit } = require('process');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
router.post("/create", async function (req, res) {
    let imageName = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/job');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            imageName = `${Date.now()}${ext}`;
            cb(null, imageName);
        }
    });
    const table = 'tbl_apply_for_job';
    const upload = multer({ storage }).single('job_image');
    upload(req, res, function (err) {

        const { apply_jobId, apply_job_title, apply_job_text, start_date, end_date } = req.body;
        const startDate = moment(start_date).format('YYYY-MM-DD')
        const endDate = moment(end_date).format('YYYY-MM-DD')
        if (!apply_jobId) {
            db.autoId(table, 'apply_job_id', (err, apply_job_id) => {
                const fields = 'apply_job_id,apply_job_title,apply_job_text,start_date,end_date,job_image,statususe';
                const data = [apply_job_id, apply_job_title, apply_job_text, startDate, endDate, imageName, 1];
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
            const where = `apply_job_id='${apply_jobId}'`;
            db.selectWhere(table, '*', where, (err, results) => {
                if (results[0].job_image && results[0].job_image !== '' && imageName !== '') {
                    const filePath = path.join('assets/job', results[0].job_image);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting the existing file:', err);
                        }
                    });
                }
                let fileName = results[0].job_image;
                if (imageName !== '') {
                    fileName = imageName;
                }

                const field = 'apply_job_title,apply_job_text,start_date,end_date,job_image';
                const newData = [apply_job_title, apply_job_text, startDate, endDate, fileName, apply_jobId];
                const condition = 'apply_job_id=?';
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
    const apply_job_id = req.params.id;
    const where = `apply_job_id=${apply_job_id}`;
    db.fetchSingle('tbl_apply_for_job', '*', where, (fetchError, fetchResult) => {
        if (fetchError) {
            return res.status(500).json({ error: 'Error fetching pattern data' });
        }
        if (fetchResult && fetchResult.job_image) {
            const filePath = path.join('assets/job/', fetchResult.job_image);
            fs.unlink(filePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error deleting the existing file:', unlinkError);
                }
            });
        }

        db.deleteData('tbl_apply_for_job', where, (deleteError, deleteResults) => {
            if (deleteError) {
                return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
            }
            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: deleteResults });
        });
    });
});



router.post("/", function (req, res) {
    const { start_date, end_date } = req.body;
    const startDate = moment(start_date).format('YYYY-MM-DD')
    const endDate = moment(end_date).format('YYYY-MM-DD')
    let whereDate = ``;
    if (start_date && end_date) {
        whereDate = `AND start_date BETWEEN '${startDate}' AND '${endDate}'`;
    }
    const tables = `tbl_apply_for_job`;
    const wheres = `apply_job_id !='' ${whereDate}`;
    db.selectWhere(tables, '*', wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});



router.get("/", function (req, res) {
    const tables = `tbl_apply_for_job`;
    const wheres = `apply_job_id !='' ORDER BY apply_job_id DESC`;
    db.selectWhere(tables, '*', wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

router.get("/single/:id", function (req, res) {
    const jboId = req.params.id;
    const tables = `tbl_apply_for_job`;
    const wheres = `apply_job_id ='${jboId}'`;
    db.fetchSingleAll(tables, wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});



// =====================
router.post("/register", async function (req, res) {
    let doctName = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/job');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            doctName = `fileRegist-${Date.now()}${ext}`;
            cb(null, doctName);
        }
    });
    const table = 'tbl_register_applyjob';
    const upload = multer({ storage }).single('staff_doct');
    upload(req, res, function (err) {
        const { apply_job_fk, staff_name, staff_phone, staff_email, staff_address } = req.body;
        const fields = 'registerjob_id,apply_job_fk, staff_name, staff_phone,staff_email,staff_address,staff_doct,status_use,register_date';
        db.autoId(table, 'registerjob_id', (err, registerjob_id) => {
            const data = [registerjob_id, apply_job_fk, staff_name, staff_phone, staff_email, staff_address, doctName, 1, dateTime];
            db.insertData(table, fields, data, (err, results) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດaa` });
                }
                res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ' });
            });
        });
    });
});


router.post("/fetchRegis", function (req, res) {
    const { start_date, end_date, statusUse } = req.body;
    // const startDate = moment(start_date).format('YYYY-MM-DD')
    // const endDate = moment(end_date).format('YYYY-MM-DD')
    const startDate = moment(start_date).isValid() ? moment(start_date).format('YYYY-MM-DD') : null;
    const endDate = moment(end_date).isValid() ? moment(end_date).format('YYYY-MM-DD') : null;

    let whereDate = ``;
    if (start_date && end_date) {
        whereDate = `AND DATE(register_date) BETWEEN '${startDate}' AND '${endDate}'`;
    }
    let status_use = '';
    if (statusUse) {
        status_use = `AND status_use='${statusUse}'`;
    }

    const tables = `tbl_register_applyjob
    LEFT JOIN tbl_apply_for_job ON tbl_register_applyjob.apply_job_fk=tbl_apply_for_job.apply_job_id`;
    const fileds = `tbl_register_applyjob.registerjob_id, 
	tbl_register_applyjob.apply_job_fk, 
	tbl_register_applyjob.staff_name, 
	tbl_register_applyjob.staff_phone, 
	tbl_register_applyjob.staff_email, 
	tbl_register_applyjob.staff_address, 
	tbl_register_applyjob.staff_doct, 
	tbl_register_applyjob.status_use, 
	tbl_register_applyjob.register_date, 
	tbl_apply_for_job.apply_job_title`;
    const wheres = `registerjob_id !='' ${whereDate} ${status_use}`;
    db.selectWhere(tables, '*', wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

router.delete('/del-regist/:id', function (req, res) {
    const registerjob_id = req.params.id;
    const wheres = `registerjob_id='${registerjob_id}'`;
    db.deleteData('tbl_register_applyjob', wheres, (deleteError, deleteResults) => {
        if (deleteError) {
            return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: deleteResults });
    });
});


router.get('/can-regist/:id', function (req, res) {
    const registerjob_id = req.params.id;
    const field = 'status_use';
    const newData = [3, registerjob_id];
    const condition = 'registerjob_id=?';
    db.updateData('tbl_register_applyjob', field, newData, condition, (err, results) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
        }
        console.log('Data updated successfully:', results);
        res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
    });
});


module.exports = router;
