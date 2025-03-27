const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');

router.post("/create", function (req, res) {
    const { items, branch_id_fk, user_id_fk, staff_id_fk, sale_remark, bill_shop, balance_total, currency_id_fk, rate_price, total_grams, balance_cash, balance_transfer, balance_return, balance_totalpay } = req.body;
    const sale_uuid = uuidv4();
    const tableSale = 'tbl_sale_gold';
    const tableList = 'tbl_sale_detail';

    let balanceCash = balance_cash;
    if (typeof balance_cash === 'string') {
        balanceCash = Math.round(parseFloat(balance_cash.replace(/,/g, '')));
    }
    let balanceTransfer = balance_transfer;
    if (typeof balance_transfer === 'string') {
        balanceTransfer = Math.round(parseFloat(balance_transfer.replace(/,/g, '')));
    }
    let balanceReturn = balance_return;
    if (typeof balance_return === 'string') {
        balanceReturn = Math.round(parseFloat(balance_return.replace(/,/g, '')));
    }
    let balanceTotalpay = balance_totalpay;
    if (typeof balance_totalpay === 'string') {
        balanceTotalpay = Math.round(parseFloat(balance_totalpay.replace(/,/g, '')));
    }
    const balance_payment = (balanceCash + balanceTransfer);

    const billNo = `CASE 
    WHEN MAX(CAST(SUBSTRING(sale_billNo, 5) AS UNSIGNED)) IS NULL THEN 'VK-00001'
    ELSE CONCAT('VK-', LPAD(MAX(CAST(SUBSTRING(sale_billNo, 5) AS UNSIGNED)) + 1, 5, '0')) END AS sale_billNo`;
    db.selectData(tableSale, billNo, (req, ress) => {
        const sale_billNo = ress[0].sale_billNo;
        const fieldSale = 'sale_uuid,sale_billNo,bill_shop,total_grams,balance_vat,balance_total,currency_id_fk,rate_price,balance_totalpay,status_payment,balance_cash,balance_transfer,balance_payment,balance_return,branch_id_fk,user_id_fk,staff_id_fk,sale_remark,sale_date,sale_status,status_off_sale,status_gets';
        const dataSale = [sale_uuid, sale_billNo, bill_shop, total_grams, '0', balance_total, currency_id_fk, rate_price, balanceTotalpay, 1, balanceCash, balanceTransfer, balance_payment, balanceReturn, branch_id_fk, user_id_fk, staff_id_fk, sale_remark, dateTime, '1', '1', '1'];
        db.insertData(tableSale, fieldSale, dataSale, (err, resultstl) => {
            if (err) {
                return res.status(500).json({ message: 'ການດຳເນີນງານເກີດຂໍຜິພາດ' });
            }
            const fieldList = 'detail_uuid,sale_bill_fk,product_id_fk,price_buy,price_grams,price_sale,price_pattern,order_qty,qty_grams,qty_sale_add,qty_gram_add,total_balance,zone_id_fk,user_id_fk,staff_id_fk,create_date,status_cancle';
            items.forEach(item => {
                const detail_uuid = uuidv4();
                let total_balance = parseFloat(
                    (item.qty_add > 0 ? (item.price_sale * item.grams_add) : (item.price_sale * item.qty_grams)) +
                    (item.order_qty * item.price_pattern)
                );
                let price_sale = (parseFloat(item.price_sale * item.qty_grams));
                const dataList = [detail_uuid, sale_uuid, item.product_id_fk, item.price_buy, item.price_sale, price_sale, item.price_pattern, item.order_qty, item.qty_grams, item.qty_add, item.grams_add, total_balance, item.zone_id_fk, item.user_id_fk, item.staff_id_fk, dateTime, 1];
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
            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', id: sale_uuid });
        });
    });
});

router.post("/update", async function (req, res) {
    const  data  = req.body; 
    const field = 'status_gets, date_gets';
    const updates = data.map(item => {
        const newData = ['2', dateTime, item.saleId]; // Prepare data for each item
        const condition = 'sale_uuid=?'; // Condition for update
        return new Promise((resolve, reject) => {
            db.updateData('tbl_sale_gold', field, newData, condition, (err, results) => {
                if (err) {
                    return reject(new Error('Failed to update sale order for saleId: ' + item.saleId));
                }
                resolve(results);
            });
        });
    });

    try {
        await Promise.all(updates); 
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update sales orders', error: error.message });
    }
});

router.post("/balance", function (req, res) {
    const { startDate, endDate, staffId, status_gets } = req.body;
    let staff_id_fk = '';
    if (staffId) {
        staff_id_fk = `AND staff_id_fk='${staffId}'`;
    }
    let statusGets = '';
    if (status_gets) {
        statusGets = `AND status_gets='${status_gets}'`;
    }
    const start_date = startDate.substring(0, 10);
    const end_date = endDate.substring(0, 10);
    const fields = `SUM(balance_total) AS balanceSale,
    SUM(CASE WHEN status_gets = '1' AND sale_status='1' ${statusGets} THEN balance_total ELSE 0 END) AS balance_arrears,
    SUM(CASE WHEN status_gets = '2' AND sale_status='1' ${statusGets} THEN balance_total ELSE 0 END) AS balance_get_paid`;
    const where = `tbl_sale_gold.sale_status='1' AND  DATE(sale_date) BETWEEN '${start_date}' AND '${end_date}' ${staff_id_fk} ${statusGets} ${staff_id_fk}`;
    db.fetchSingle('tbl_sale_gold', fields, where, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'An error occurred while fetching data.' });
        }
        res.status(200).json({ data: results });
    });
});

module.exports = router;