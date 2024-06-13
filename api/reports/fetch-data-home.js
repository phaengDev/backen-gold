const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
const dateNow = currentDatetime.format('YYYY-MM-DD');
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');

router.get("/total", async function (req, res) {
    const tables = `tbl_sale_detail
    LEFT JOIN tbl_product ON tbl_sale_detail.product_id_fk =tbl_product.product_uuid
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid`;
    const fields = `COALESCE(SUM(total_balance),0) as total_balance`;

    const tabeList = `tbl_sale_detail
   LEFT JOIN tbl_product ON tbl_sale_detail.product_id_fk =tbl_product.product_uuid
   LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
   LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id`;
    // try {
    const results = await new Promise((resolve, reject) => {
        db.selectAll('tbl_type_gold', (err, results) => {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });

    for (let i = 0; i < results.length; i++) {
        const where = `status_cancle='1' AND DATE(tbl_sale_detail.create_date)='${dateNow}' AND type_id_fk='${results[i].type_Id}'`;
        const reSale = await new Promise((resolve, reject) => {
            db.selectWhere(tables, fields, where, (err, restotal) => {
                if (err) {
                    reject(err);
                }
                resolve(restotal[0]);
            });
        });
        results[i].totalSale = reSale.total_balance;
        // =================== sum option 
        const fieldList = 'COALESCE(SUM(total_balance), 0) AS balance_pt,option_name';
        const whereList = `status_cancle='1' AND DATE(tbl_sale_detail.create_date)='${dateNow}' AND type_id_fk='${results[i].type_Id}' GROUP BY option_id_fk`;
        const resList = await new Promise((resolve, reject) => {
            db.selectWhere(tabeList, fieldList, whereList, (err, resList) => {
                if (err) {
                    reject(err);
                }
                resolve(resList);
            });
        });
        results[i].bsOption = resList;
    }
    res.status(200).json(results);
    // } catch (error) {
    //     res.status(500).json({ message: 'Internal Server Error' });
    // }

});
router.get("/stock", async function (req, res) {
    try {
        const tableZ = `tbl_stock_sale
            LEFT JOIN tbl_zone_sale ON tbl_stock_sale.zone_id_fk = tbl_zone_sale.zone_Id`;

        const fieldsZ = 'zone_id_fk, zone_name';
        const whereZ = `quantity <='5' GROUP BY zone_id_fk ORDER BY tbl_zone_sale.id`;
        const tablePs = `tbl_stock_sale
            LEFT JOIN tbl_product ON tbl_stock_sale.product_id_fk = tbl_product.product_uuid
            LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk = tbl_product_tile.tile_uuid
            LEFT JOIN tbl_options ON tbl_product.option_id_fk = tbl_options.option_id
            LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid`;
        const fieldPs = `tbl_stock_sale.quantity, 
            tbl_product.code_id, 
            tbl_product.file_image, 
            tbl_product.qty_baht, 
            tbl_product_tile.tile_name, 
            tbl_options.option_name, 
            tbl_options.grams,
            tbl_unite.unite_name `;

        const reszone = await new Promise((resolve, reject) => {
            db.selectWhere(tableZ, fieldsZ, whereZ, (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results);
            });
        });
        // Fetch stock data for each zone
        for (let i = 0; i < reszone.length; i++) {
            // const zone = resZone[i];
            const wherePs = `zone_id_fk='${reszone[i].zone_id_fk}' AND quantity <='5'`;

            const salestock = await new Promise((resolve, reject) => {
                db.selectWhere(tablePs, fieldPs, wherePs, (err, resStock) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(resStock);
                });
            });

            // Add salestock data to the current zone
            reszone[i].stock = salestock;
        }
        res.status(200).json(reszone);
    } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get("/price/:id", async function (req, res) {
   const type=req.params.id;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-based

    // const qtyDays = getDaysInMonth(year, month);
    // const dates = [];
    // const results = [];

    // for (let day = 1; day <= qtyDays; day++) {
    //     const dayStr = String(day).padStart(2, '0'); // Zero-pad the day
    //     const date = `${year}-${month}-${dayStr}`;

    //     dates.push(`${dayStr}/${month}`);
    // }
// function getDaysInMonth(year, month) {
//     return new Date(year, month, 0).getDate();
// }

const fields = `price_sale_new, price_buy_new,(SELECT grams FROM tbl_options WHERE option_id='1') as grams,DATE_FORMAT(update_date, '%d/%m') AS update_date`;
const wheres = `type_id_fk='${type}' GROUP BY update_date ORDER BY _id ASC LIMIT 30`;
        try {
            const results = await new Promise((resolve, reject) => {
              db.selectWhere('tbl_update_price', fields, wheres, (err, results) => {
                if (err) {
                  return reject(err);
                }
                resolve(results);
              });
            });
        
            res.status(200).json({ data: results});
          } catch (error) {
            res.status(500).json({ message: 'Internal Server Error', error: error.message });
          }
});


module.exports = router;

