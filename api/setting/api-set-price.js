const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid')
const moment = require('moment');
const currentDatetime = moment();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
router.post("/create", function (req, res) {
    let imageName = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/promotion');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            imageName = `price-${Date.now()}${ext}`;
            cb(null, imageName);
        }
    });
    const upload = multer({ storage }).single('price_img');
    upload(req, res, function (err) {
        const { type_id_fk, prices_id, price_buy, price_sale,Decrease, price_buy_old, price_sale_old } = req.body;

        const update_id = uuidv4();
        // const priceBuy = parseInt(price_buy.replace(/,/g, ''));
        const priceSale = parseInt(price_sale.replace(/,/g, ''));
        const decrease_sale = parseInt(Decrease.replace(/,/g, ''));
        const priceBuy=(priceSale-decrease_sale);
        const table = 'tbl_update_price';
        const fields = 'update_id,price_id_fk,type_id_fk,price_buy_old,price_sale_old,price_buy_new,price_sale_new,update_date,price_img';

        const dataup = [update_id, prices_id, type_id_fk, price_buy_old, price_sale_old, priceBuy, priceSale, dateTime, imageName];
        db.insertData(table, fields, dataup, (err, results) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
            }
            const fieldUp = 'price_buy,price_sale,decrease';
            const newData = [priceBuy, priceSale,decrease_sale, prices_id];
            const condition = 'prices_id=? ';
            db.updateData('tbl_price_gold', fieldUp, newData, condition, (err, resultsUp) => {
                if (err) {
                    console.error('Error updating data:', err);
                    return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
                }
                res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: resultsUp });
            });
        });
    });
});
router.post("/", function (req, res) {
    const { typeId, optionId } = req.body;
    let type_Id_fk = '';
    if (typeId) {
        type_Id_fk = `AND type_id_fk='${typeId}'`
    }
    const wheres = `prices_id !=''  ${type_Id_fk}`;
    const tables = ` tbl_price_gold
    LEFT JOIN tbl_type_gold ON tbl_price_gold.type_id_fk=tbl_type_gold.type_Id`;
    db.selectWhere(tables, '*', wheres, (err, results) => {
        if (err) {
            return res.status(400).send('ການສະແດງຂໍ້ມູນລົມເຫຼວ');
        }
        res.status(200).json(results);
    });
});

router.post("/history", function (req, res) {
    const { startDate, endDate, type_id_fk } = req.body;
    const start_date = startDate.substring(0, 10);
    const end_date = endDate.substring(0, 10);
    let typeId_fk = '';
    if (type_id_fk) {
        typeId_fk = `AND type_id_fk='${type_id_fk}'`;
    }
    const wheres = `DATE(update_date) BETWEEN '${start_date}' AND '${end_date}' ${typeId_fk}`;
    const tables = `tbl_update_price
    LEFT JOIN tbl_type_gold ON tbl_update_price.type_id_fk=tbl_type_gold.type_Id`;
    db.selectWhere(tables, '*', wheres, (err, results) => {
        if (err) {
            return res.status(400).send('ການສະແດງຂໍ້ມູນລົມເຫຼວ');
        }
        res.status(200).json(results);
    });
});


router.get("/uprice/:id", function (req, res) {
    const typeId_fk = req.params.id;
    const wheres = `DATE(update_date) BETWEEN CURRENT_DATE - INTERVAL 30 DAY AND CURRENT_DATE AND type_id_fk='${typeId_fk}'`;
    const fields = `update_id,
                price_id_fk,
                type_id_fk,
                price_buy_old,
                price_sale_old,
                price_buy_new,
                (price_buy_new-price_buy_old) as buy,
                price_sale_new,
                (price_sale_new-price_sale_old) as sale,
                update_date,
                price_img,
                typeName,
                (SELECT grams FROM tbl_options WHERE option_id=1)AS grams
                `;
    const tables = `tbl_update_price
    LEFT JOIN tbl_type_gold ON tbl_update_price.type_id_fk=tbl_type_gold.type_Id`;
    db.selectWhere(tables, fields, wheres, (err, results) => {
        if (err) {
            return res.status(400).send('ການສະແດງຂໍ້ມູນລົມເຫຼວ');
        }
        res.status(200).json(results);
    });
});


module.exports = router


