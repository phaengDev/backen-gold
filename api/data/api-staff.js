const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
router.post("/create", function (req, res) {
    const staff_uuid = uuidv4();

    let nyPorfile = '';
    const storage = multer.diskStorage({
        destination: function (req, profile, cb) {
            cb(null, './assets/porfile');
        },
        filename: function (req, profile, cb) {
            const ext = path.extname(profile.originalname);
            nyPorfile = `${Date.now()}${ext}`;
            cb(null, nyPorfile);
        }
    });
    const upload = multer({ storage }).single('profile');
    upload(req, res, function (err) {
        const { first_name, last_name, birthday, gender, staff_tel, staff_email, province_id_fk, district_id_fk, village_name, staff_remark, branch_id_fk, register_date } = req.body;
        const table = 'tbl_staff';
        db.autoId(table, 'id', (err, id) => {
            const id_code = 'VK-' + id;
            const fields = 'id,staff_uuid, id_code,profile,gender,first_name,last_name,birthday,staff_tel,staff_email,province_id_fk,district_id_fk,village_name,staff_remark,branch_id_fk,register_date,status_inout,create_date';
            const dataValue = [id, staff_uuid, id_code, nyPorfile, gender, first_name, last_name, birthday, staff_tel, staff_email, province_id_fk, district_id_fk, village_name, staff_remark, branch_id_fk, register_date, '1', dateTime];
            db.insertData(table, fields, dataValue, (err, results) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດ` });
                }
                console.log('Data inserted successfully:', results);
                res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
            });
        });
    });
});


router.post("/edit", function (req, res) {
    let nyPorfile = '';
    const storage = multer.diskStorage({
        destination: function (req, profile, cb) {
            cb(null, './assets/porfile');
        },
        filename: function (req, profile, cb) {
            const ext = path.extname(profile.originalname);
            nyPorfile = `${Date.now()}${ext}`;
            cb(null, nyPorfile);
        }
    });
    const upload = multer({ storage }).single('profile');
    upload(req, res, function (err) {

        const { staff_uuid, first_name, last_name, birthday, gender, staff_tel, staff_email, province_id_fk, district_id_fk, village_name, staff_remark, branch_id_fk, register_date } = req.body;
        const table = 'tbl_staff';

        const where = `staff_uuid='${staff_uuid}'`;
        db.selectWhere(table, '*', where, (err, results) => {
            if (results[0].profile && results[0].profile !== '' && nyPorfile !== '') {
                const filePath = path.join('assets/porfile', results[0].profile);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting the existing file:', err);
                    }
                });
            }
            let profileName = results[0].profile;
            if (nyPorfile !== '') {
                profileName = nyPorfile;
            }


            const field = 'profile,gender,first_name,last_name,birthday,staff_tel,staff_email,province_id_fk,district_id_fk,village_name,staff_remark,branch_id_fk,register_date';
            const newData = [profileName, gender, first_name, last_name, birthday, staff_tel, staff_email, province_id_fk, district_id_fk, village_name, staff_remark, branch_id_fk, register_date, staff_uuid];
            const condition = 'staff_uuid=?';
            db.updateData(table, field, newData, condition, (err, results) => {
                if (err) {
                    console.error('Error updating data:', err);
                    return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
                }
                console.log('Data updated successfully:', results);
                res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
            });
        });
    });
});



router.delete("/:id", function (req, res, next) {
    const staff_uuid = req.params.id;
    const where = `staff_uuid='${staff_uuid}'`;
    db.deleteData('tbl_staff', where, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
});
router.get("/single/:id", function (req, res, next) {
    const staff_uuid = req.params.id;
    const where = `staff_uuid='${staff_uuid}'`;
    const tables = `tbl_staff`;
    db.fetchSingleAll(tables, where, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});
router.get("/", function (req, res, next) {
    const tables = `tbl_staff
        LEFT JOIN tbl_province ON tbl_staff.province_id_fk=tbl_province.province_id
        LEFT JOIN tbl_district ON tbl_staff.district_id_fk=tbl_district.district_id
         LEFT JOIN tbl_branch ON tbl_staff.branch_id_fk=tbl_branch.branch_uuid`;
    const fields = `
        staff_uuid,
        id_code,
        profile,
        gender,
        first_name,
        last_name,
        birthday,
        staff_tel,
        staff_email,
        tbl_staff.province_id_fk,
        tbl_staff.district_id_fk,
        tbl_staff.village_name,
        staff_remark,
        branch_id_fk,
        depart_id_fk,
        userloing_id_fk,
        register_date,
        status_inout,
        tbl_staff.create_date,
        district_name,
        province_name,
        branch_name`;
    db.selectData(tables, fields, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});


router.post("/search", function (req, res) {
    const id_code = req.body.userSale_id;
    const where = `id_code='${id_code}'`;

    db.fetchSingleAll('tbl_staff', where, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'ຂໍ້ມູນມີຄວາມຜິດພາດ' });
        }
        if (!results || results.length === 0) {
            return res.status(400).json({ status: 400, message: 'ລະຫັດພະນັກງານບໍ່ຖຶກຕ້ອງ' });
        }
        res.status(200).json(results);
    });
});
module.exports = router;

