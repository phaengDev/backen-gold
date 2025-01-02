const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
const timeNow = currentDatetime.format('HH:mm:ss');
const fs = require('fs');
const xlsx = require('xlsx');
const mysql = require('mysql');


router.post("/create", function (req, res) {
    const received_id = uuidv4();
    const { receivedId, product_id_fk, zone_id_fk, quantity, quantityEd, branch_id_fk, received_date, received_byid } = req.body;
    const createDate = received_date.substring(0, 10) + ' ' + timeNow;
    const table = 'tbl_received';

    //============
    const stock_sale_Id = uuidv4();
    const tableStock = 'tbl_stock_sale';
    const dataStock = [stock_sale_Id, branch_id_fk, product_id_fk, zone_id_fk, quantity, dateTime];
    const fieldStok = 'stock_sale_Id,branch_id_fk,product_id_fk,zone_id_fk,quantity,createDate';
    if (receivedId === '') {
        let old_quantity = '0'
        const wheres = `product_id_fk='${product_id_fk}' AND zone_id_fk='${zone_id_fk}'`;
        db.fetchSingle(tableStock, 'quantity', wheres, (err, resSt) => {
            if (resSt && resSt.quantity !== null) {
                old_quantity = resSt.quantity;
            }
            const data = [received_id, branch_id_fk, product_id_fk, zone_id_fk, old_quantity, quantity, createDate, received_byid, dateTime, 1];
            const fields = 'received_id,branch_id_fk,product_id_fk,zone_id_fk,old_quantity,received_qty,received_date,received_byid,create_date,status_use';
            db.insertData(table, fields, data, (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ ' });
                }

                db.selectWhere(tableStock, '*', wheres, (err, ress) => {
                    if (!ress || ress.length === 0) {
                        db.insertData(tableStock, fieldStok, dataStock, (err, results) => {
                            if (err) {
                                return res.status(500).json({ message: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
                            }
                            return res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
                        });
                    } else {
                        const fieldNew = `quantity = quantity + ${quantity} `;
                        const condition = `product_id_fk='${product_id_fk}' AND zone_id_fk='${zone_id_fk}'`;
                        db.updateField(tableStock, fieldNew, condition, (err, results) => {
                            if (err) {
                                return res.status(500).json({ message: 'ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການດຳເນີນງານ' });
                            }
                            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
                        })
                    }
                });
            });
        });
    } else {
        const fieldEdit = `product_id_fk,zone_id_fk,received_qty,received_date`;
        const newData = [product_id_fk, zone_id_fk, quantity, createDate, receivedId];
        const condition = 'received_id=?';
        db.updateData(table, fieldEdit, newData, condition, (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການດຳເນີນງານ' });
            }
            const fieldQty = `quantity = quantity - ${quantityEd} + ${quantity}`;
            const whereQty = `product_id_fk='${product_id_fk}' AND zone_id_fk='${zone_id_fk}'`;
            db.updateField('tbl_stock_sale', fieldQty, whereQty, (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການດຳເນີນງານ' });
                }
                return res.status(200).json({ message: 'ການແກ້ໄຂດຳເນີນງານສຳເລັດແລ້ວ' });
            })

            // res.status(200).json({ message: 'ການແກ້ໄຂດຳເນີນງານສຳເລັດແລ້ວ', data: results });
        })
    }
});

router.post("/createMt", function (req, res) {
    const { zone_id_fk, branch_id_fk, received_byid, dataList } = req.body;
    const table = 'tbl_received';
    let old_quantity = '0';
    let successCount = 0;
    let errorOccurred = false;
    const promises = dataList.map(async (element) => {
        const { product_uuid, received_qty } = element;
        const received_id = uuidv4();
        const wheres = `product_id_fk='${product_uuid}' AND zone_id_fk='${zone_id_fk}'`;
        const fieldStok = 'stock_sale_Id,branch_id_fk,product_id_fk,zone_id_fk,quantity,createDate';
        const dataStock = [uuidv4(), branch_id_fk, product_uuid, zone_id_fk, received_qty, dateTime];
      
        db.selectWhere('tbl_stock_sale', '*', wheres, (err, ress) => {
            if (err) {
                errorOccurred = true;
                return res.status(500).json({ message: 'Error checking stock sale records.' });
            }
            if (!ress || ress.length === 0) {
                db.insertData('tbl_stock_sale', fieldStok, dataStock, (err, results) => {
                    if (err) {
                        errorOccurred = true;
                        return res.status(500).json({ message: 'Error inserting stock sale data.' });
                    }
                    const data = [received_id, branch_id_fk, product_uuid, zone_id_fk, old_quantity, received_qty, dateTime, received_byid, dateTime, 1];
                    const field = 'received_id,branch_id_fk,product_id_fk,zone_id_fk,old_quantity,received_qty,received_date,received_byid,create_date,status_use';
                    db.insertData(table, field, data, (err, results) => {
                        if (err) {
                            errorOccurred = true;
                            return res.status(500).json({ message: 'Error inserting received data.' });
                        }
                        successCount += 1; // Track successful inserts
                    });
                });
            } else {
                old_quantity = ress[0].quantity;
                const fieldNew = `quantity = quantity + ${received_qty} `;
                const condition = `product_id_fk='${product_uuid}' AND zone_id_fk='${zone_id_fk}'`;
                db.updateField('tbl_stock_sale', fieldNew, condition, (err, results) => {
                    if (err) {
                        errorOccurred = true;
                        return res.status(500).json({ message: 'Error updating stock sale data.' });
                    }
                    const data = [received_id, branch_id_fk, product_uuid, zone_id_fk, old_quantity, received_qty, dateTime, received_byid, dateTime, 1];
                    const field = 'received_id,branch_id_fk,product_id_fk,zone_id_fk,old_quantity,received_qty,received_date,received_byid,create_date,status_use';
                    db.insertData(table, field, data, (err, results) => {
                        if (err) {
                            errorOccurred = true;
                            return res.status(500).json({ message: 'Error inserting received data.' });
                        }
                        successCount += 1; // Track successful inserts
                    });
                });
            }
        });
    });
    try {
         Promise.all(promises);
        if (errorOccurred) {
            return res.status(500).json({ message: 'Error occurred during the process.' });
        }
        return res.status(200).json({ message: 'ການບັນທຶກຂໍ້ມູນສຳເລັດແລ້ວ' });
    } catch (err) {
        return res.status(500).json({ message: 'Error processing the request.' });
    }
});


    //======================
    router.post("/", function (req, res) {
        const { startDate, endDate, title_id_fk, option_id_fk, zone_id_fk } = req.body;
        let tilesId_fk = '';
        if (title_id_fk) {
            tilesId_fk = `AND tiles_id_fk='${title_id_fk}'`;
        }

        let optionId_fk = '';
        if (option_id_fk) {
            optionId_fk = `AND option_id_fk='${option_id_fk}'`;
        }
        let zoneId_fk = '';
        if (zone_id_fk) {
            zoneId_fk = `AND zone_id_fk='${zone_id_fk}'`;
        }
        const start_date = startDate.substring(0, 10);
        const end_date = endDate.substring(0, 10);

        const tables = `tbl_received
            LEFT JOIN tbl_product ON tbl_received.product_id_fk=tbl_product.product_uuid
            LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
            LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
            LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
            LEFT JOIN tbl_zone_sale ON tbl_received.zone_id_fk=tbl_zone_sale.zone_Id`;
        const fields = 'received_id, product_id_fk, zone_id_fk,old_quantity, received_qty, received_date, tile_name, code_id, unite_name, tiles_id_fk, qty_baht, zone_name, option_name,tbl_received.create_date,tbl_received.status_use';
        const where = `DATE(received_date) BETWEEN '${start_date}' AND '${end_date}' ${tilesId_fk} ${optionId_fk} ${zoneId_fk}`;
        db.selectWhere(tables, fields, where, (err, results) => {
            if (err) {
                console.error('Error fetching data:', err);
                return res.status(500).json({ message: 'An error occurred while fetching data.' });
            }
            res.status(200).json(results);
        });
    });

    router.post("/r-port", async function (req, res) {
        const { startDate, endDate, title_id_fk, option_id_fk, zone_id_fk } = req.body;
        let tilesId_fk = '';
        if (title_id_fk) {
            tilesId_fk = `AND tiles_id_fk='${title_id_fk}'`;
        }

        let optionId_fk = '';
        if (option_id_fk) {
            optionId_fk = `AND option_id_fk='${option_id_fk}'`;
        }
        let zoneId_fk = '';
        if (zone_id_fk) {
            zoneId_fk = `AND tbl_received.zone_id_fk='${zone_id_fk}'`;
        }
        const start_date = startDate.substring(0, 10);
        const end_date = endDate.substring(0, 10);

        const tableList = `tbl_received
    LEFT JOIN tbl_product ON tbl_received.product_id_fk=tbl_product.product_uuid
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid`;
        const fieldList = `received_date,unite_name,old_quantity,received_qty`;
        const tables = `tbl_received
    LEFT JOIN tbl_product ON tbl_received.product_id_fk=tbl_product.product_uuid
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
    LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
    LEFT JOIN tbl_zone_sale ON tbl_received.zone_id_fk=tbl_zone_sale.zone_Id`;
        const fields = 'product_id_fk, zone_id_fk, count(received_qty) as received_qty, DATE(received_date) as received_date, tile_name, code_id, unite_name, tiles_id_fk, qty_baht, zone_name, option_name';
        const where = `DATE(received_date) BETWEEN '${start_date}' AND '${end_date}' ${tilesId_fk} ${optionId_fk} ${zoneId_fk} GROUP BY product_id_fk,zone_id_fk,DATE(received_date)`;
        const results = await new Promise((resolve, reject) => {
            db.selectWhere(tables, fields, where, (err, results) => {
                if (err) {
                    reject(err);
                }
                resolve(results);
            })
        });
        for (let i = 0; i < results.length; i++) {
            const data = results[i];
            const createDate = moment(results[i].received_date).format('YYYY-MM-DD')
            const wherelist = `product_id_fk='${data.product_id_fk}' AND zone_id_fk='${data.zone_id_fk}' AND DATE(received_date)='${createDate}'`;
            const reDetail = await new Promise((resolve, reject) => {
                db.selectWhere(tableList, fieldList, wherelist, (err, reDetail) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(reDetail);
                });
            });
            data.detail = reDetail;
        }
        res.status(200).json(results);
    });

    router.post("/upload", function (req, res) {
        const workbook = xlsx.readFile('data.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData = xlsx.utils.sheet_to_json(worksheet);
        const { branch_id_fk, received_byid } = req.body;
        const table = 'tbl_received';
        const tableStock = 'tbl_stock_sale';
        const fieldStok = 'stock_sale_Id,branch_id_fk,product_id_fk,zone_id_fk,quantity,createDate';
        let productId_fk = '';
        excelData.forEach(row => {
            const stock_sale_Id = uuidv4();
            const received_id = uuidv4();

            let product_id_fk = row[1];
            let zone_id_fk = row[2];
            let quantity = row[3];
            let old_quantity = 0;

            // const dataStock = [stock_sale_Id, branch_id_fk, product_id_fk, zone_id_fk, quantity, dateTime];
            const wheresps = `code_id='${product_id_fk}'`;
            db.fetchSingle('tbl_product', 'product_uuid', wheresps, (err, resps) => {
                if (err) {
                    return res.status(500).json({ message: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ ' });
                }
                if (resps) {
                    productId_fk = resps.product_uuid;
                }
                const data = [received_id, branch_id_fk, productId_fk, zone_id_fk, old_quantity, quantity, dateTime, received_byid, dateTime];
                const fields = 'received_id,branch_id_fk,product_id_fk,zone_id_fk,old_quantity,received_qty,received_date,received_byid,create_date';
                db.insertData(table, fields, data, (err, results) => {
                    if (err) {
                        return res.status(500).json({ message: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ ' });
                    }
                    res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
                    // db.selectWhere(tableStock, '*', wheres, (err, ress) => {
                    //     if (!ress || ress.length === 0) {
                    //         db.insertData(tableStock, fieldStok, dataStock, (err, results) => {
                    //             if (err) {
                    //                 return res.status(500).json({ message: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
                    //             }
                    //             return res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ333', data: results });
                    //         });
                    //     } else {
                    //         const fieldNew = `quantity = quantity + ${quantity} `;
                    //         const condition = `product_id_fk='${product_id_fk}' AND zone_id_fk='${zone_id_fk}'`;
                    //         db.updateField(tableStock, fieldNew, condition, (err, results) => {
                    //             if (err) {
                    //                 return res.status(500).json({ message: 'ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການດຳເນີນງານ' });
                    //             }
                    //             res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ2222', data: results });
                    //         })
                    //     }
                    // });
                });
            });
        });
    })

    // });
    module.exports = router