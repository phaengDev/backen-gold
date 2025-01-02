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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destinationMap = {
            file_doc: './assets/document',
            file_transfer: './assets/document/paysale',
        };
        const folder = destinationMap[file.fieldname];
        if (folder) {
            fs.mkdirSync(folder, { recursive: true });
            cb(null, folder);
        } else {
            cb(new Error('Invalid file field'), false);
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `pay-${Date.now()}${ext}`);
    },
});
const upload = multer({ storage }).fields([
    { name: 'file_doc', maxCount: 1 },
    { name: 'file_transfer', maxCount: 1 },
]);

// Utility function for database error handling
const handleDbError = (res, error) => {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Database operation failed' });
};

router.post('/payment', (req, res) => {
    const cus_uuid = uuidv4();
    const pay_saleuuid = uuidv4();
    const tablePaysale = 'tbl_sale_online';
    const tableCut = 'tbl_customer';

    upload(req, res, (err) => {
        if (err) {
            console.error('Error uploading files:', err);
            return res.status(500).json({ error: 'File upload failed' });
        }

        const fileDocument = req.files['file_doc']?.[0].filename || '';
        const filePayment = req.files['file_transfer']?.[0].filename || '';
        
        const {
            cus_fname, cus_lname, villageName, district_id_fk, cus_tel, email,
            card_number, status_register, cus_remark, cardholder_name, transfer_number,
            date_transfer, pays_remark, status_pays, qty_baht, qty_grams, balance_gold, price_gram,
        } = req.body;

        const dateTransfer = moment(date_transfer).format('YYYY-MM-DD HH:mm:ss');

        // Generate customer code
        const customCodeQuery = `
            CASE 
                WHEN MAX(CAST(SUBSTRING(custom_code, 4) AS UNSIGNED)) IS NULL THEN 'VK-100001'
                ELSE CONCAT('VK-', LPAD(MAX(CAST(SUBSTRING(custom_code, 4) AS UNSIGNED)) + 1, 6, '0')) 
            END AS custom_code`;

        db.selectData(tableCut, customCodeQuery, (err, result) => {
            if (err) return handleDbError(res, err);

            const custom_code = result[0]?.custom_code;
            const customerFields = `cus_uuid, custom_code, cus_fname, cus_lname, cus_tel, email, card_number, district_id_fk,
                villageName, cus_remark, cus_status, file_doc, status_register, cus_reate_date`;
            const customerData = [
                cus_uuid, custom_code, cus_fname, cus_lname, cus_tel, email, card_number, district_id_fk,
                villageName, cus_remark, '1', fileDocument, status_register, dateTime,
            ];

            db.insertData(tableCut, customerFields, customerData, (err) => {
                if (err) return handleDbError(res, err);
                const paySaleCodeQuery = `
                    CASE 
                        WHEN MAX(CAST(SUBSTRING_INDEX(pay_sale_code, '-', -1) AS UNSIGNED)) IS NULL THEN CONCAT('VK-', YEAR(NOW()), '-000001')
                        ELSE CONCAT('VK-', YEAR(NOW()), '-', LPAD(MAX(CAST(SUBSTRING_INDEX(pay_sale_code, '-', -1) AS UNSIGNED)) + 1, 6, '0'))
                    END AS pay_sale_code`;
                const paySaleWhere = `pay_sale_code LIKE CONCAT('VK-', YEAR(NOW()), '-%')`;

                db.selectWhere(tablePaysale, paySaleCodeQuery, paySaleWhere, (err, result) => {
                    if (err) return handleDbError(res, err);

                    const pay_saleCode = result[0]?.pay_sale_code;
                    const paySaleFields = `
                        pay_sale_uuid, pay_sale_code, custom_id_fk, cardholder_name, transfer_number, date_transfer, qty_baht,
                        qty_grams, price_gram, balance_gold, balance_discount, file_transfer, pays_remark, status_pays,
                        user_approved_id, barnce_approved_id, paysale_date, status_delete,status_sale_use`;
                    const paySaleData = [
                        pay_saleuuid, pay_saleCode, cus_uuid, cardholder_name, transfer_number, dateTransfer, qty_baht,
                        qty_grams, price_gram, balance_gold, 0, filePayment, pays_remark, status_pays, 1, 1, dateTime, 1, 1];

                    db.insertData(tablePaysale, paySaleFields, paySaleData, (err) => {
                        if (err) return handleDbError(res, err);
                        res.status(200).json({ message: 'Operation completed successfully', id: pay_saleuuid });
                    });
                });
            });
        });
    });
});


router.post('/report', function (req, res) {
    const { status_pays, startDate, endDate } = req.body;
    const start_date = moment(startDate).format('YYYY-MM-DD');
    const start_end = moment(endDate).format('YYYY-MM-DD');

    let statusPays = ``;
    if (status_pays) {
        statusPays = `AND status_pays=${status_pays}`;
    }
    const condition = `status_delete = 1 AND DATE(paysale_date) BETWEEN '${start_date}' AND  '${start_end}' ${statusPays}`;
    const fileds = `tbl_sale_online.pay_sale_id, 
	tbl_sale_online.pay_sale_uuid, 
	tbl_sale_online.pay_sale_code, 
	tbl_sale_online.custom_id_fk, 
	tbl_sale_online.cardholder_name, 
	tbl_sale_online.transfer_number, 
	tbl_sale_online.date_transfer, 
    tbl_sale_online.qty_baht,
    tbl_sale_online.qty_grams, 
    tbl_sale_online.price_gram,
	tbl_sale_online.balance_gold, 
	tbl_sale_online.balance_discount, 
	tbl_sale_online.file_transfer, 
	tbl_sale_online.pays_remark, 
	tbl_sale_online.status_pays, 
    tbl_sale_online.date_check,
	tbl_sale_online.user_approved_id, 
	tbl_sale_online.date_approved,
	tbl_sale_online.barnce_approved_id, 
	tbl_sale_online.paysale_date, 
	tbl_sale_online.status_delete,
    tbl_sale_online.status_sale_use, 
	tbl_customer.cus_uuid, 
	tbl_customer.custom_code, 
	tbl_customer.cus_fname, 
	tbl_customer.cus_lname, 
	tbl_customer.cus_dob, 
	tbl_customer.cus_tel, 
	tbl_customer.email, 
	tbl_customer.card_number, 
	tbl_customer.villageName, 
	tbl_district.district_name,
	tbl_province.province_name,
	tbl_customer.cus_remark, 
	tbl_customer.file_doc, 
	tbl_customer.cus_status, 
	tbl_customer.status_register, 
	A.userName AS user_approved_name,
    C.userName AS check_user_name`;
    const tables = `tbl_sale_online
        LEFT JOIN tbl_customer ON tbl_sale_online.custom_id_fk=tbl_customer.cus_uuid
        LEFT JOIN tbl_user_acount AS C  ON tbl_sale_online.check_user_id = C.user_uuid
	    LEFT JOIN tbl_user_acount AS A ON tbl_sale_online.user_approved_id = A.user_uuid
        LEFT JOIN tbl_district ON tbl_customer.district_id_fk=tbl_district.district_id
        LEFT JOIN tbl_province ON tbl_district.province_id_fk=tbl_province.province_id`;
    db.selectWhere(tables, fileds, condition, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
        }
        res.status(200).json(results);
    });
});



router.get('/invoice/:id', function (req, res) {
    const paysaleId = req.params.id;
    // const checkidInvioce=paysaleId.substring(0, paysaleId.length - 3);
   const checkidInvioce=paysaleId.replace(/-vk$/, '');
   if (paysaleId === checkidInvioce) {
    return res.status(500).json({ error: 'Error fetching main data' });
    } else {
    const condition = `pay_sale_uuid = '${checkidInvioce}' AND status_delete = 1`;
    const tables = `tbl_sale_online
    LEFT JOIN tbl_customer ON tbl_sale_online.custom_id_fk = tbl_customer.cus_uuid
	LEFT JOIN tbl_user_acount AS C  ON tbl_sale_online.check_user_id = C.user_uuid
	LEFT JOIN tbl_user_acount AS A ON tbl_sale_online.user_approved_id = A.user_uuid
    LEFT JOIN tbl_district ON tbl_customer.district_id_fk=tbl_district.district_id
    LEFT JOIN tbl_province ON tbl_district.province_id_fk=tbl_province.province_id`;
        const fileds = `tbl_sale_online.pay_sale_id, 
        tbl_sale_online.pay_sale_uuid, 
        tbl_sale_online.pay_sale_code, 
        tbl_sale_online.custom_id_fk, 
        tbl_sale_online.cardholder_name, 
        tbl_sale_online.transfer_number, 
        tbl_sale_online.date_transfer, 
        tbl_sale_online.qty_baht,
        tbl_sale_online.qty_grams, 
        tbl_sale_online.price_gram,
        tbl_sale_online.balance_gold, 
        tbl_sale_online.balance_discount, 
        tbl_sale_online.file_transfer, 
        tbl_sale_online.pays_remark, 
        tbl_sale_online.date_check,
        tbl_sale_online.status_pays, 
        tbl_sale_online.user_approved_id, 
        tbl_sale_online.date_approved,
        tbl_sale_online.barnce_approved_id, 
        tbl_sale_online.paysale_date, 
        tbl_sale_online.status_delete, 
        tbl_sale_online.status_sale_use, 
        tbl_customer.cus_uuid, 
        tbl_customer.custom_code, 
        tbl_customer.cus_fname, 
        tbl_customer.cus_lname, 
        tbl_customer.cus_dob, 
        tbl_customer.cus_tel, 
        tbl_customer.email, 
        tbl_customer.card_number, 
        tbl_customer.villageName, 
        tbl_district.district_name,
        tbl_province.province_name,
        tbl_customer.cus_remark, 
        tbl_customer.file_doc, 
        tbl_customer.cus_status, 
        tbl_customer.status_register, 
       A.userName AS user_approved_name,
        C.userName AS check_user_name`;
    db.fetchSingle(tables,fileds, condition, (err, results) => {
        if (err) {
            console.error('Error fetching main data:', err);
            return res.status(500).json({ error: 'Error fetching main data' });
        }
        res.status(200).json(results);
    });
}
});



router.post('/checkorder', function (req, res) {
    const { statsus, dataSearch } = req.body;
    if (statsus === 1) {
        const condition = `pay_sale_code='${dataSearch}'`;
        const tables = `tbl_sale_online
                LEFT JOIN tbl_customer ON tbl_sale_online.custom_id_fk=tbl_customer.cus_uuid`;
        db.fetchSingle(tables, '*', condition, (err, results) => {
            if (err) {
                console.error('Error inserting data:', err);
            }
            res.status(200).json(results);
        })
    } else {
        const condition = `cus_status='1' AND cus_tel='${dataSearch}'`;
        const tables = `tbl_customer`;
        db.selectWhere(tables, '*', condition, (err, results) => {
            if (err) {
                console.error('Error inserting data:', err);
            }
            res.status(200).json(results[0]);
        })
    }
})




router.get('/fetchOrder/:id', function (req, res) {
    const paysaleId = req.params.id;
    const fileds = `tbl_sale_online.pay_sale_id, 
        tbl_sale_online.pay_sale_uuid, 
        tbl_sale_online.pay_sale_code, 
        tbl_sale_online.custom_id_fk, 
        tbl_sale_online.cardholder_name, 
        tbl_sale_online.transfer_number, 
        tbl_sale_online.date_transfer, 
        tbl_sale_online.qty_baht,
        tbl_sale_online.qty_grams, 
        tbl_sale_online.price_gram,
        tbl_sale_online.balance_gold, 
        tbl_sale_online.balance_discount, 
        tbl_sale_online.file_transfer, 
        tbl_sale_online.pays_remark, 
        tbl_sale_online.status_pays,  
        tbl_sale_online.date_approved, 
        tbl_sale_online.date_check,
        tbl_sale_online.paysale_date, 
        tbl_sale_online.status_delete,
        tbl_sale_online.status_sale_use, 
        tbl_customer.cus_uuid, 
        tbl_customer.custom_code, 
        tbl_customer.cus_fname, 
        tbl_customer.cus_lname, 
        tbl_customer.cus_dob, 
        tbl_customer.cus_tel, 
        tbl_customer.email, 
        tbl_customer.card_number, 
        tbl_customer.villageName, 
        tbl_district.district_name,
        tbl_province.province_name,
        tbl_customer.cus_remark, 
        tbl_customer.file_doc, 
        tbl_customer.cus_status, 
        tbl_customer.status_register, 
        A.userName AS user_approved_name,
        C.userName AS check_user_name
        `;
    const condition = `custom_id_fk = '${paysaleId}' AND status_delete=1`;
    const tables = `tbl_sale_online
    LEFT JOIN tbl_customer ON tbl_sale_online.custom_id_fk = tbl_customer.cus_uuid
	LEFT JOIN tbl_user_acount AS C  ON tbl_sale_online.check_user_id = C.user_uuid
	LEFT JOIN tbl_user_acount AS A ON tbl_sale_online.user_approved_id = A.user_uuid
    LEFT JOIN tbl_district ON tbl_customer.district_id_fk=tbl_district.district_id
    LEFT JOIN tbl_province ON tbl_district.province_id_fk=tbl_province.province_id`;
    db.selectWhere(tables, fileds, condition, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
        }
        res.status(200).json(results);
    });
});



router.post("/confrim", function (req, res) {
    const { pay_sale_id,user_approved_id } = req.body;
    const field = 'status_pays,user_approved_id,date_approved';
    const newData = [3,user_approved_id,dateTime, pay_sale_id];
    const condition = 'pay_sale_uuid=?';
    db.updateData('tbl_sale_online', field, newData, condition, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
        }
        res.status(200).json({ message: 'ຍົກເລີກການສັ່ງຊື່ຂໍ້ມູນສຳເລັດ', data: results });
    });
});


router.post("/check", function (req, res) {
    const { pay_sale_id, pays_remark,check_user_id } = req.body;
    const field = 'status_pays,pays_remark,check_user_id,date_check';
    const newData = [2,pays_remark,check_user_id,dateTime, pay_sale_id];
    const condition = 'pay_sale_uuid=?';
    db.updateData('tbl_sale_online', field, newData, condition, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'ການຢຶນຢັນຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
        }
        res.status(200).json({ message: 'ການຢຶນຢັນການສັ່ງຊື່ຂໍ້ມູນສຳເລັດ', data: results });
    });
});


router.post("/cancel", function (req, res) {
    const { pay_sale_id, pays_remark,check_user_id } = req.body;
    const field = 'status_sale_use,pays_remark,check_user_id,date_check';
    const newData = [2,pays_remark,check_user_id,dateTime, pay_sale_id];
    const condition = 'pay_sale_uuid=?';
    db.updateData('tbl_sale_online', field, newData, condition, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
        }
        res.status(200).json({ message: 'ຍົກເລີກການສັ່ງຊື່ຂໍ້ມູນສຳເລັດ', data: results });
    });
});


router.get("/delete", function (req, res) {
    const pay_sale_id=req.params.id
    const field = 'date_check,status_delete';
    const newData = [dateTime,2,pay_sale_id];
    const condition = 'pay_sale_uuid=?';
    db.updateData('tbl_sale_online', field, newData, condition, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
        }
        res.status(200).json({ message: 'ຍົກເລີກການສັ່ງຊື່ຂໍ້ມູນສຳເລັດ'});
    });
});


module.exports = router;