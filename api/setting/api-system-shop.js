const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
const timeNow = currentDatetime.format('HH:mm:ss');
router.post("/create", async function (req, res) {

	let nyLogo='';
	const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/logo');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            nyLogo = `${Date.now()}${ext}`;
            cb(null, nyLogo);
        }
    });

	
const table = 'tbl_branch';
const field = 'branch_name,branch_tel,branch_email,branch_logo,province_id_fk,district_id_fk,village_name,branch_detail,branch_status';
const upload = multer({ storage }).single('file');
upload(req, res, function (err) {
const {branch_uuid,branch_name,branch_tel,branch_email,province_id_fk,district_id_fk,village_name,branch_detail,branch_status}=req.body;
// if(branch_uuid ===''){

	const newData = [branch_name, branch_tel, branch_email,nyLogo, province_id_fk,district_id_fk,village_name,branch_detail,branch_status, branch_uuid];
	const condition = 'branch_uuid=?';
	db.updateData(table, field, newData, condition, (err, results) => {
		if (err) {
			return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
		}
		res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
	});
// }
});
});


router.get("/", function (req, res) {
    const tables=`tbl_branch`;
    db.selectAll(tables,(err,results)=>{
        if (err) {
            return res.status(400).send(err);
        }
        res.status(200).json(results);
    })
});

router.get("/:id", function (req, res) {
    const branchId = req.params.id;
    const tables=`tbl_branch
	LEFT JOIN tbl_province ON tbl_branch.province_id_fk = tbl_province.province_id
	LEFT JOIN tbl_district ON tbl_branch.district_id_fk = tbl_district.district_id`;
    const fields=`tbl_branch.branch_uuid, 
	tbl_branch.branch_name, 
	tbl_branch.branch_tel, 
	tbl_branch.province_id_fk, 
	tbl_branch.district_id_fk, 
	tbl_branch.village_name, 
	tbl_branch.branch_email, 
	tbl_branch.branch_logo, 
	tbl_branch.branch_create, 
	tbl_branch.branch_detail, 
	tbl_branch.branch_status, 
	tbl_province.province_name, 
	tbl_district.district_name`;
    const wheres=`branch_uuid='${branchId}'`;
    db.fetchSingle(tables,fields,wheres,(err,results)=>{
        if (err) {
            return res.status(400).send(err);
        }
        res.status(200).json(results);
    })
});
module.exports = router
