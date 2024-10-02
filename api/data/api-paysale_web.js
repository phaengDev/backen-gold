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
            // detailPays = []
        } = req.body;
        const detailPays = JSON.parse(req.body.detailPays);
    //   return  res.status(200).json({ message: 'Operation completed successfully', data: detailPays });

        // const detailPays = Array.isArray(req.body.detailPays) ? req.body.detailPays : [];
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
                    paysale_date,
                    status_delete`;
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
                    dateTime, 1]
                db.insertData(tablePaysale, fieldPay, dataPay, (err, results) => {
                    if (err) {
                        console.error('Error updating data:', err);
                        return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
                    }
                    // new Promise((resolve, reject) => {
                    // const fieldList = `pay_online_fk,product_id_fk,product_name,type_product,option_id_fk,qty_baht,qty_grams,qty_order,price_sale,create_date`;
                    const fieldList = `
                        pay_online_fk,
                        product_id_fk,
                        product_name,
                        type_product,
                        option_id_fk,
                        qty_baht,
                        qty_grams,
                        qty_order,
                        price_sale,
                        create_date`;

                        const fileInsertPromises = detailPays.map((item, index) => {
                        return new Promise((resolve, reject) => {
                            const dataList = [
                                pay_saleuuid,
                                item.product_id_fk || null,  // Ensure valid or fallback data
                                item.tile_name || '',
                                item.type_product || '',
                                item.option_id_fk || null,
                                item.qty_baht || 0,
                                item.qty_grams || 0,
                                item.qty_order || 0,
                                item.price_sale || 0,
                                dateTime
                            ];
                            db.insertData('tb_payonline_list', fieldList, dataList, (err, results) => {
                                if (err) {
                                    return reject(err);
                                }
                                resolve(results);
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


router.post('/report', function (req, res) {
    const { status_pays, startDate, endDate } = req.body;
    const start_date = moment(startDate).format('YYYY-MM-DD');
    const start_end = moment(endDate).format('YYYY-MM-DD');

    let statusPays = ``;
    if (status_pays) {
        statusPays = `AND status_pays=${status_pays}`;
    }
    const condition = `status_delete = 1 AND DATE(paysale_date) BETWEEN '${start_date}' AND  '${start_end}' ${statusPays}`;
   const fileds=`tbl_paysale_online.pay_sale_id, 
	tbl_paysale_online.pay_sale_uuid, 
	tbl_paysale_online.pay_sale_code, 
	tbl_paysale_online.custom_id_fk, 
	tbl_paysale_online.cardholder_name, 
	tbl_paysale_online.transfer_number, 
	tbl_paysale_online.date_transfer, 
	tbl_paysale_online.balance_gold, 
	tbl_paysale_online.balance_discount, 
	tbl_paysale_online.file_transfer, 
	tbl_paysale_online.pays_remark, 
	tbl_paysale_online.status_pays, 
	tbl_paysale_online.confrim_user_id, 
	tbl_paysale_online.confrim_barnce_id, 
	tbl_paysale_online.paysale_date, 
	tbl_paysale_online.status_delete, 
	tbl_customer.cus_uuid, 
	tbl_customer.custom_code, 
	tbl_customer.cus_fname, 
	tbl_customer.cus_lname, 
	tbl_customer.cus_dob, 
	tbl_customer.cus_tel, 
	tbl_customer.email, 
	tbl_customer.card_number, 
	tbl_customer.cus_address, 
	tbl_customer.cus_remark, 
	tbl_customer.file_doc, 
	tbl_customer.cus_status, 
	tbl_customer.status_register, 
	tbl_user_acount.userName`;
    const tables = `tbl_paysale_online
          LEFT JOIN tbl_customer ON tbl_paysale_online.custom_id_fk=tbl_customer.cus_uuid
          LEFT JOIN tbl_user_acount ON tbl_paysale_online.confrim_user_id = tbl_user_acount.user_uuid`;
    db.selectWhere(tables, fileds, condition, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
        }

        // ======================================
        const tableList=`tb_payonline_list
        LEFT JOIN tbl_product ON tb_payonline_list.product_id_fk=tbl_product.product_uuid
        LEFT JOIN tbl_options ON tb_payonline_list.option_id_fk=tbl_options.option_id
        LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid`;
        const fieldList=`tb_payonline_list.qty_baht, 
	tb_payonline_list.qty_grams, 
	tb_payonline_list.qty_order, 
	tb_payonline_list.price_sale, 
	tb_payonline_list.create_date, 
	tb_payonline_list.pay_list_id, 
	tb_payonline_list.pay_online_fk, 
	tb_payonline_list.product_id_fk, 
	tb_payonline_list.option_id_fk, 
	tbl_product.file_image, 
	tbl_options.option_name, 
	tbl_options.grams, 
	tbl_product_tile.tile_name, 
	tbl_product_tile.title_detail, 
	tbl_product_tile.title_image, 
	tbl_unite.unite_name`;
        const promises = results.map(online => {
            const whereList = `pay_online_fk='${online.pay_sale_uuid}'`;
            return new Promise((resolve, reject) => {
                db.selectWhere(tableList, fieldList, whereList, (err, saleList) => {
                    if (err) {
                        return reject(err);
                    }
                    online.dataList = saleList;
                    resolve(online);
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



router.get('/invoice/:id', function (req, res) {
    const paysaleId = req.params.id;
    const condition = `pay_sale_uuid = '${paysaleId}'`;
    
    const tables = `tbl_paysale_online
        LEFT JOIN tbl_customer ON tbl_paysale_online.custom_id_fk = tbl_customer.cus_uuid
        LEFT JOIN tbl_user_acount ON tbl_paysale_online.confrim_user_id = tbl_user_acount.user_uuid`;
    const tableList = `tb_payonline_list
        LEFT JOIN tbl_product ON tb_payonline_list.product_id_fk = tbl_product.product_uuid
        LEFT JOIN tbl_options ON tb_payonline_list.option_id_fk = tbl_options.option_id
        LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk = tbl_product_tile.tile_uuid
        LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk = tbl_unite.unite_uuid`;
    
    const fieldList = `
        tb_payonline_list.qty_baht, 
        tb_payonline_list.qty_grams, 
        tb_payonline_list.qty_order, 
        tb_payonline_list.price_sale, 
        tb_payonline_list.create_date, 
        tb_payonline_list.pay_list_id, 
        tb_payonline_list.pay_online_fk, 
        tb_payonline_list.product_id_fk, 
        tb_payonline_list.option_id_fk, 
        tbl_product.file_image, 
        tbl_options.option_name, 
        tbl_options.grams, 
        tbl_product_tile.tile_name, 
        tbl_product_tile.title_detail, 
        tbl_product_tile.title_image, 
        tbl_unite.unite_name`;

    // Fetch data from the main table `tbl_paysale_online`
    db.fetchSingle(tables, '*', condition, (err, results) => {
        if (err) {
            console.error('Error fetching main data:', err);
            return res.status(500).json({ error: 'Error fetching main data' });
        }
        if (!results || !results.pay_sale_uuid) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        const whereList = `pay_online_fk = '${results.pay_sale_uuid}'`;
        // Fetch related data from the list tables
        db.selectWhere(tableList, fieldList, whereList, (err, saleList) => {
            if (err) {
                console.error('Error fetching sale list:', err);
                return res.status(500).json({ error: 'Error fetching sale list' });
            }

            // Combine the main result and the sale list data
            const contract = { ...results, dataList: saleList };
            res.status(200).json(contract);
        });
    });
});



router.post('/checkorder',function(req,res){
const {statsus,dataSearch}=req.body;
if(statsus===1){
   const condition=`pay_sale_code='${dataSearch}'`;
    const tables = `tbl_paysale_online
LEFT JOIN tbl_customer ON tbl_paysale_online.custom_id_fk=tbl_customer.cus_uuid`;
db.fetchSingle(tables, '*', condition, (err, results) => {
    if (err) {
        console.error('Error inserting data:', err);
    }
    res.status(200).json(results);
})
}else{
   const condition=`cus_status='1' AND cus_tel='${dataSearch}'`;
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
    const condition = `custom_id_fk = '${paysaleId}' AND status_delete=1`;
    const tables = `tbl_paysale_online
    LEFT JOIN tbl_customer ON tbl_paysale_online.custom_id_fk = tbl_customer.cus_uuid`;

    const tableList=`tb_payonline_list
    LEFT JOIN tbl_product ON tb_payonline_list.product_id_fk=tbl_product.product_uuid
    LEFT JOIN tbl_options ON tb_payonline_list.option_id_fk=tbl_options.option_id
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid`;
    const fieldList=`tb_payonline_list.qty_baht, 
	tb_payonline_list.qty_grams, 
	tb_payonline_list.qty_order, 
	tb_payonline_list.price_sale, 
	tb_payonline_list.create_date, 
	tb_payonline_list.pay_list_id, 
	tb_payonline_list.pay_online_fk, 
	tb_payonline_list.product_id_fk, 
	tb_payonline_list.option_id_fk, 
	tbl_product.file_image, 
	tbl_options.option_name, 
	tbl_options.grams, 
	tbl_product_tile.tile_name, 
	tbl_product_tile.title_detail, 
	tbl_product_tile.title_image, 
	tbl_unite.unite_name`;
    db.selectWhere(tables, '*', condition, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
        }

        const promises = results.map(contract => {
            const whereList = `pay_online_fk='${contract.pay_sale_uuid}'`;
            return new Promise((resolve, reject) => {
                db.selectWhere(tableList, fieldList, whereList, (err, saleList) => {
                    if (err) {
                        return reject(err);
                    }
                    contract.dataList = saleList;
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

module.exports = router;