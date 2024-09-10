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

router.post('/payment', function (req, res) {
    let file_Name = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/document/paysale');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            file_Name = `pay-${Date.now()}${ext}`;
            cb(null, file_Name);
        }
    });

    const pay_saleuuid = uuidv4();
    const tablePaysale = 'tbl_paysale_online';
    const upload = multer({ storage }).single('file_transfer');
    upload(req, res, function (err) {

        const { pay_sale_uuid,
            custom_id_fk,
            cardholder_name,
            transfer_number,
            date_transfer,
            balance_gold,
            balance_discount,
            pays_remark,
            status_pays,
            confrim_user_id,
            confrim_barnce_id
        } = req.body;
        const detailPays = Array.isArray(req.body.detailPays) ? req.body.detailPays : [];
        const dateTransfer = moment(date_transfer).format('YYYY-MM-DD HH:mm:ss')
        if (pay_sale_uuid === '') {
            const customCode = ` CASE 
        WHEN MAX(CAST(SUBSTRING_INDEX(pay_sale_code, '-', -1) AS UNSIGNED)) IS NULL THEN CONCAT('VK-', YEAR(NOW()), '-000001')
        ELSE CONCAT('VK-', YEAR(NOW()), '-', LPAD(MAX(CAST(SUBSTRING_INDEX(pay_sale_code, '-', -1) AS UNSIGNED)) + 1, 6, '0'))
        END AS pay_sale_code`;
            const wheres = `pay_sale_code LIKE CONCAT('VK-', YEAR(NOW()), '-%')`;
            db.selectWhere(tablePaysale, customCode, wheres, (err, ress) => {
                if (err) {
                    console.error('Error fetching custom code:', err);
                    return res.status(500).json({ error: 'Error generating custom code' });
                }
                const pay_saleCode = ress[0].pay_sale_code;
                const fieldPay = `
                    pay_sale_uuid,
                    pay_sale_code,
                    custom_id_fk,
                    cardholder_name,
                    transfer_number,
                    date_transfer,
                    balance_gold,
                    balance_discount,
                    file_transfer,
                    pays_remark,
                    status_pays,
                    confrim_user_id,
                    confrim_barnce_id,
                    paysale_date`;
                const dataPay = [
                    pay_saleuuid,
                    pay_saleCode,
                    custom_id_fk,
                    cardholder_name,
                    transfer_number,
                    dateTransfer,
                    balance_gold,
                    balance_discount,
                    file_Name,
                    pays_remark,
                    status_pays,
                    confrim_user_id,
                    confrim_barnce_id,
                    dateTime]
                db.insertData(tablePaysale, fieldPay, dataPay, (err, results) => {
                    if (err) {
                        console.error('Error updating data:', err);
                        return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
                    }
                    // new Promise((resolve, reject) => {
                    const fieldList = `pay_online_fk,product_id_fk,option_id_fk,qty_baht,qty_grams,qty_order,price_sale,create_date`;
                    const fileInsertPromises = detailPays.map(item => {
                        return new Promise((resolve, reject) => {
                            const dataList = [
                                pay_saleuuid,
                                item.product_id_fk,
                                item.option_id_fk,
                                item.qty_baht,
                                item.qty_grams,
                                item.qty_order,
                                item.price_sale,
                                dateTime
                            ];
                            db.insertData('tb_payonline_list', fieldList, dataList, (err, results) => {
                                if (err) {
                                    return reject(err);
                                } else {
                                    resolve(results);
                                }
                            });
                        });
                    });

                    Promise.all(fileInsertPromises)
                        .then(results => {
                            console.log('All files inserted successfully:', results);
                            res.status(200).json({ message: 'Operation completed successfully', id: pay_saleuuid });
                        })
                        .catch(err => {
                            console.error('Error inserting file data:', err);
                            res.status(500).json({ error: 'Error inserting file data' });
                        });

                })
            });
        };
    });
});


router.get('/invoice/:id', function (req, res) {
    const paysaleId = req.params.id;
    const condition = `pay_sale_code = '${paysaleId}'`;
    const tables = `tbl_paysale_online
    LEFT JOIN tbl_customer ON tbl_paysale_online.custom_id_fk=tbl_customer.cus_uuid`;
    db.fetchSingle(tables, '*', condition, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
        }
        res.status(200).json(results);
    });
});

module.exports = router;