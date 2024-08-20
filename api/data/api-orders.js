const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
const dateNow = currentDatetime.format('YYYY-MM-DD');
router.post("/create", function (req, res) {
    const { product_id_fk, price_buy, price_sale, patternPrice, order_qty,qty_grams,buy_add, qty_add, zone_id_fk, staff_id_fk, user_id_fk } = req.body;
   let grams_add=buy_add;
    if(!buy_add || buy_add==='' ){
        grams_add=0;
    }
    const table = 'tbl_cart_order';
    const fields = 'product_id_fk, zone_id_fk,price_buy,price_sale,price_pattern,order_qty,qty_grams,grams_add,qty_add,staff_id_fk,user_id_fk,orderDate';
    const data = [product_id_fk, zone_id_fk, price_buy, price_sale, patternPrice, order_qty,qty_grams,grams_add, qty_add, staff_id_fk, user_id_fk, dateTime];
    const wheres = `product_id_fk='${product_id_fk}' AND staff_id_fk='${staff_id_fk}' AND zone_id_fk='${zone_id_fk}'`;
    db.selectWhere(table, '*', wheres, (err, ress) => {
        if (!ress || ress.length === 0) {
            db.insertData(table, fields, data, (err, results) => {
                if (err) {
                    return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດ` });
                }
                res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
            });
        } else {
            if(grams_add > 0){
                db.insertData(table, fields, data, (err, results) => {
                    if (err) {
                        return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດ` });
                    }
                    res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
                });
            }else{
            const fieldNew = `order_qty = order_qty + ${order_qty}`;
            const condition = `product_id_fk='${product_id_fk}' AND staff_id_fk='${staff_id_fk}' AND zone_id_fk='${zone_id_fk}'`;
            db.updateField(table, fieldNew, condition, (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການດຳເນີນງານ' });
                }
                res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ' });
            });
        }
        }
    });
});





router.get('/itemcart/:id', function (req, res) {
    const staff_id_fk = req.params.id;
    const tables = `tbl_cart_order 
    LEFT JOIN tbl_product ON tbl_cart_order.product_id_fk=tbl_product.product_uuid
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
    LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
    LEFT JOIN tbl_zone_sale ON tbl_cart_order.zone_id_fk=tbl_zone_sale.zone_Id
    LEFT JOIN tbl_type_gold ON tbl_product_tile.type_id_fk=tbl_type_gold.type_Id`;
    const fields = `cart_id,product_uuid,file_image,qty_baht,
    price_buy,
    price_sale,
    price_pattern,
    qty_grams,
    (qty_baht*tbl_options.grams) as grams,
    option_name,
    tile_name,
    unite_name,
     order_qty,
     grams_add,
     qty_add,
     code_id,
     zone_name,
     zone_id_fk,
     staff_id_fk,
     user_id_fk`;
    const where = `staff_id_fk='${staff_id_fk}'`;
    db.selectWhere(tables, fields, where, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});
router.get('/pluscart/:id', function (req, res) {
    const cart_id = req.params.id;
    const fieldNew = `order_qty = order_qty + 1`;
    const condition = `cart_id='${cart_id}'`;
    db.updateField('tbl_cart_order', fieldNew, condition, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'ການດຳເນີນງານລົມເຫລວ' });
        }
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ' });
    })
});


router.get('/delcart/:id', function (req, res) {
    const cart_id = req.params.id;
    const condition = `cart_id='${cart_id}'`;
    db.deleteData('tbl_cart_order', condition, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'ການດຳເນີນງານລົມເຫລວ' });
        }
        res.status(200).json({ message: 'ການລົບລາຍການສຳເລັດແລ້ວ' });
    })
});
router.get('/minuscart/:id', function (req, res) {
    const cart_id = req.params.id;
    const tables = 'tbl_cart_order';
    const fieldNew = `order_qty = order_qty - 1`;
    const condition = `cart_id='${cart_id}'`;
    db.fetchSingle(tables, 'order_qty', condition, (err, result) => {
        if (result && result.order_qty === 1) {
            db.deleteData(tables, condition, (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
                }
                res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ' });
            });
        } else {
            db.updateField(tables, fieldNew, condition, (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'ການດຳເນີນງານລົມເຫລວ' });
                }
                res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ' });
            })
        }
    });
});

//=======================
router.post("/payment", function (req, res) {
    const { items, branch_id_fk, user_id_fk, staff_id_fk, sale_remark, customId, cus_fname, cus_lname, cus_tel, cus_address, cus_remark, bill_shop, balance_total,currency_id_fk,rate_price, total_grams, balance_cash, balance_transfer, balance_payment, balance_return,balance_totalpay } = req.body;
    const sale_uuid = uuidv4();
    let cus_uuid = uuidv4();
    const tableCut = 'tbl_customer';
    const tableSale = 'tbl_sale_gold';
    const tableList = 'tbl_sale_detail';
    if (customId || customId !== '') {
        cus_uuid = customId;
    }
    let balanceCash = balance_cash;
    if (typeof balance_cash === 'string') {
        balanceCash = parseFloat(balance_cash.replace(/,/g, ''));
    }
    let balanceTransfer = balance_transfer;
    if (typeof balance_transfer === 'string') {
        balanceTransfer = parseFloat(balance_transfer.replace(/,/g, ''));
    }
    let balanceReturn = balance_return;
    if (typeof balance_return === 'string') {
        balanceReturn = parseFloat(balance_return.replace(/,/g, ''));
    }
    let balanceTotalpay = balance_totalpay;
    if (typeof balance_totalpay === 'string') {
        balanceTotalpay = parseFloat(balance_totalpay.replace(/,/g, ''));
    }
    // const balance_totalpay = parseFloat(req.body.balance_totalpay.replace(/,/g, ''));

    if (customId === '') {
        const fieldCus = `cus_uuid,cus_fname,cus_lname,cus_tel,cus_address,cus_remark,cus_status,cus_reate_date`;
        const dataCus = [cus_uuid, cus_fname, cus_lname, cus_tel, cus_address, cus_remark, '1', dateTime]
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
                        (item.qty_add > 0 ? (item.price_sale * item.grams_add) : (item.price_sale * item.qty_grams) * item.order_qty) +
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


router.post("/bill", function (req, res) {
    const { billNo_number } = req.body;
    const tables = `tbl_sale_gold
	LEFT JOIN tbl_staff ON tbl_sale_gold.staff_id_fk = tbl_staff.staff_uuid
	LEFT JOIN tbl_customer ON tbl_sale_gold.customer_id_fk = tbl_customer.cus_uuid
	LEFT JOIN tbl_user_acount ON  tbl_sale_gold.user_id_fk = tbl_user_acount.user_uuid`;
    const field = `tbl_sale_gold.sale_uuid, 
	tbl_sale_gold.sale_billNo, 
    tbl_sale_gold.bill_shop,
	tbl_sale_gold.balance_total, 
	tbl_sale_gold.status_payment, 
	tbl_sale_gold.balance_cash, 
	tbl_sale_gold.balance_transfer, 
	tbl_sale_gold.balance_payment, 
	tbl_sale_gold.balance_return,  
	tbl_sale_gold.sale_remark, 
	tbl_sale_gold.sale_date, 
	tbl_sale_gold.sale_status, 
	tbl_sale_gold.sale_can_date, 
	tbl_staff.first_name, 
	tbl_staff.last_name, 
    concat(cus_fname,' ',cus_lname) as customeName,
	tbl_customer.cus_tel, 
	tbl_user_acount.userName,status_off_sale,date_off_sale`;
    const condition =`sale_billNo='${billNo_number}' OR bill_shop='${billNo_number}'`;
    //=================
    const fieldList = `
   tbl_sale_detail.price_sale, 
   tbl_sale_detail.price_grams,
   tbl_sale_detail.order_qty, 
   tbl_sale_detail.qty_grams, 
   tbl_sale_detail.price_pattern, 
   (qty_grams*price_sale*order_qty + order_qty*price_pattern) as balance_total,
   tbl_sale_detail.create_date, 
   tbl_product.code_id, 
   tbl_product.qty_baht,  
   tbl_product_tile.tile_name, 
   tbl_options.option_name, 
   tbl_zone_sale.zone_name,
   tbl_unite.unite_name `;
    const tableList = `tbl_sale_detail
   LEFT JOIN tbl_product ON tbl_sale_detail.product_id_fk=tbl_product.product_uuid
   LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
   LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
   LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
   LEFT JOIN tbl_zone_sale ON tbl_sale_detail.zone_id_fk=tbl_zone_sale.zone_Id`;
    db.fetchSingle(tables, field, condition, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'ການດຳເນີນງານເກີດຂໍຜິພາດ' });
        }
        const whereList = `sale_bill_fk='${result.sale_uuid}'`;
        db.selectWhere(tableList, fieldList, whereList, (err, dataList) => {
            if (err) {
                return res.status(500).json({ message: 'ການດຳເນີນງານເກີດຂໍຜິພາດ' });
            }

            res.status(200).json({ itemdata: result, itemlist: dataList });
        });
    })
});


router.post("/cancel", function (req, res) {
    // const saleId = req.params.id;
    const { sale_uuid, sale_remark, userId_fk } = req.body;
    const fieldUp = `sale_remark='${sale_remark}',sale_status='2',user_cancle_fk='${userId_fk}', sale_can_date='${dateTime}'`;
    const whereUp = `sale_uuid='${sale_uuid}'`;
    try {
        db.updateField('tbl_sale_gold', fieldUp, whereUp, (err, mainResults) => {
            if (err) {
                throw new Error('Failed to update main sale order');
            }
            const fieldList = `status_cancle='2',cancle_date='${dateTime}'`;
            const whereList = `sale_bill_fk='${sale_uuid}'`;
            db.updateField('tbl_sale_detail', fieldList, whereList, (err, detailResults) => {
                if (err) {
                    throw new Error('Failed to update sale details');
                }

                res.status(200).json({ message: 'ການຍົກເລີກບິນຂາຍໄດ້ສຳເລັດແລ້ວ' });
            });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.post("/offBalance", async function (req, res) {
    const { branchId, userId } = req.body;
    const tableOff = `tbl_off_balance`;
    try {
        const results = await new Promise((resolve, reject) => {
            const wherest = `product_id_fk !=''`;
            db.selectWhere('tbl_stock_sale', '*', wherest, (err, results) => {
                if (err) {
                    reject(err);
                }
                resolve(results);
            });
        });

        for (let i = 0; i < results.length; i++) {
            const balance_Id = uuidv4();
            const fieldSale = 'COALESCE(SUM(order_qty), 0) AS qty_sale';
            const whereSale = `product_id_fk='${results[i].product_id_fk}' AND zone_id_fk='${results[i].zone_id_fk}' AND status_cancle='1' AND DATE(create_date)='${dateNow}' `;
            const reSale = await new Promise((resolve, reject) => {
                db.fetchSingle('tbl_sale_detail', fieldSale, whereSale, (err, reSale) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(reSale);
                });
            });
            //==========================

            const fieldImport = 'COALESCE(SUM(received_qty), 0) AS qty_import';
            const whereImport = `product_id_fk='${results[i].product_id_fk}' AND zone_id_fk='${results[i].zone_id_fk}' AND  DATE(received_date) = '${dateNow}'`;
            const resImport = await new Promise((resolve, reject) => {
                db.fetchSingle('tbl_received', fieldImport, whereImport, (err, resImport) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(resImport);
                });
            });

            // results[i].qty_sale = reSale.qty_sale;

            const where = `branch_id_fk ='${branchId}' AND DATE(balance_date)='${dateNow}' AND product_id_fk='${results[i].product_id_fk}' AND zone_id_fk='${results[i].zone_id_fk}'`;
            db.selectWhere('tbl_off_balance', '*', where, async (err, balanceRes) => {
                if (!balanceRes || balanceRes.length === 0) {
                    const fieldOff = 'balance_Id,branch_id_fk,balance_date,product_id_fk,zone_id_fk,qty_import,qty_sale,qty_stock,statsu_off,user_off';
                    const dataOff = [balance_Id, branchId, dateTime, results[i].product_id_fk, results[i].zone_id_fk, resImport.qty_import, reSale.qty_sale, results[i].quantity, 1, userId];
                    db.insertData(tableOff, fieldOff, dataOff, (err, results) => {
                        if (err) {
                            return res.status(500).json({ message: 'ການດຳເນີນງານເກີດຂໍຜິພາດ' });
                        }
                    });
                } else {
                    const fieldoff = `qty_import='${resImport.qty_import}',qty_sale='${reSale.qty_sale}',qty_stock='${results[i].quantity}'`;
                    db.updateField('tbl_off_balance', fieldoff, where, (err, Results) => {
                        if (err) {
                            return res.status(500).json({ message: 'ການດຳເນີນງານເກີດຂໍຜິພາດ' });
                        }
                    });
                }
            });
        }
        const fieldSl = `status_off_sale='2',date_off_sale='${dateTime}'`;
        const whereSl = `DATE(sale_date)='${dateNow}' AND sale_status='1' AND branch_id_fk='${branchId}'`;
        db.updateField('tbl_sale_gold', fieldSl, whereSl, (err, slResults) => {

            const fieldUp = `sale_off='2',date_off='${dateTime}'`;
            const whereUp = `DATE(create_date)='${dateNow}' AND status_cancle='1'`;
            db.updateField('tbl_sale_detail', fieldUp, whereUp, (err, upResults) => {

                res.status(200).json({ message: 'ການດຳເນິນງານສຳເລັດ ' });
            });
        });

    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }

});

module.exports = router;
