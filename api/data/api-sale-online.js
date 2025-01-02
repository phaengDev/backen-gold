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
const dateNow = currentDatetime.format('YYYY-MM-DD');
router.post("/create", function (req, res) {
    const { cus_fname, cus_lname, cus_dob, villageName, district_id_fk, cus_tel, email, card_number, status_register, cus_remark,cardholder_name, transfer_number, date_transfer, pays_remark,status_pays,qty_baht, qty_grams, balance_gold, price_gram} = req.body;
    const sale_uuid = uuidv4();
    let cus_uuid = uuidv4();
    const tableCut = 'tbl_customer';
    const tableSale = 'tbl_sale_online';
   
    let pricegram = price_gram;
    if (typeof price_gram === 'string') {
        pricegram = Math.round(parseFloat(price_gram.replace(/,/g, '')));
    }
    let balancegold = balance_gold;
    if (typeof balance_gold === 'string') {
        balancegold = Math.round(parseFloat(balance_gold.replace(/,/g, '')));
    }
    const balance_payment=(balanceCash+balanceTransfer);

    if (customId === '') {
        const fieldCus = `cus_uuid,cus_fname,cus_lname,cus_tel,district_id_fk,villageName,cus_remark,cus_status,cus_reate_date`;
        const dataCus = [cus_uuid, cus_fname, cus_lname, cus_tel,district_id_fk, villageName, cus_remark, '1', dateTime]
        db.insertData(tableCut, fieldCus, dataCus, (err, resct) => { resct })
    }

    const billNo = `CASE 
    WHEN MAX(CAST(SUBSTRING(sale_billNo, 4) AS UNSIGNED)) IS NULL THEN 'VK-0001'
    ELSE CONCAT('VK-', LPAD(MAX(CAST(SUBSTRING(sale_billNo, 4) AS UNSIGNED)) + 1, 4, '0')) END AS sale_billNo`;
    db.selectData(tableSale, billNo, (req, ress) => {
        const sale_billNo = ress[0].sale_billNo;
        const fieldSale = 'sale_uuid,sale_billNo,bill_shop,total_grams,balance_vat,balance_total,currency_id_fk,rate_price,balance_totalpay,status_payment,balance_cash,balance_transfer,balance_payment,balance_return,branch_id_fk,user_id_fk,staff_id_fk,customer_id_fk,sale_remark,sale_date,sale_status,status_off_sale';
        const dataSale = [sale_uuid, sale_billNo, bill_shop, total_grams,0, balance_total,currency_id_fk,rate_price,balanceTotalpay, 1, balanceCash, balanceTransfer, balance_payment, balanceReturn, branch_id_fk, user_id_fk, staff_id_fk, cus_uuid, sale_remark, dateTime, '1', '1'];
        db.insertData(tableSale, fieldSale, dataSale, (err, resultstl) => {
            if (err) {
                return res.status(500).json({ message: 'ການດຳເນີນງານເກີດຂໍຜິພາດ' });
            }
            const fieldList = 'detail_uuid,sale_bill_fk,product_id_fk,price_buy,price_grams,price_sale,price_pattern,order_qty,qty_grams,qty_sale_add,qty_gram_add,total_balance,zone_id_fk,user_id_fk,staff_id_fk,create_date,status_cancle';
            items.forEach(item => {
                    const detail_uuid = uuidv4()
                    let total_balance = parseFloat(
                        (item.qty_add > 0 ? (item.price_sale * item.grams_add) : (item.price_sale * item.qty_grams)) +
                        (item.order_qty * item.price_pattern)
                      );
                    let price_sale = (parseFloat(item.price_sale * item.qty_grams));
                    const dataList = [detail_uuid, sale_uuid, item.product_id_fk, item.price_buy, item.price_sale, price_sale, item.price_pattern, item.order_qty, item.qty_grams,item.qty_add,item.grams_add, total_balance, item.zone_id_fk, item.user_id_fk, item.staff_id_fk, dateTime, 1];
                    db.insertData(tableList, fieldList, dataList, (err, resultsList) => {
                        if (err) {
                            console.error('Error inserting item:', err);
                            return reject(err);
                        }
                        const fieldNew = `quantity=quantity - '${item.order_qty}'`;
                        const whereStock = `product_id_fk='${item.product_id_fk}' AND zone_id_fk='${item.zone_id_fk}'`;
                        db.updateField('tbl_stock_sale', fieldNew, whereStock, (err, results) => {
                            if (err) {
                                return res.status(500).json({ message: 'ການດຳເນີນງານລົມເຫ້ລວ' });
                            }
                            const condition = `cart_id='${item.cart_id}'`;
                            db.deleteData('tbl_cart_order', condition, (err, results) => {
                                if (err) {
                                    console.error('Error inserting item:', err);
                                }
                                console.log('Item inserted successfully:', results);
                            })
                        });
                    });
                });
            res.status(200).json({message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', id:sale_uuid });

        });
    });
});
 