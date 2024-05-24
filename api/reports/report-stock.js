const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
const dateNow = currentDatetime.format('YYYY-MM-DD');

router.post("/check", async function (req, res) {
    const { startDate, endDate, titleId, productId, zoneId,branchId } = req.body;
    const start_date = startDate.substring(0, 10);
    const end_date = endDate.substring(0, 10);

    let zone_id_fk = '';
    if (zoneId) {
        zone_id_fk = `AND zone_id_fk='${zoneId}'`;
    }
    let tile_name = '';
    if (titleId) {
        tile_name = `AND tiles_id_fk='${titleId}'`;
    }
    let productId_fk = '';
    if (productId) {
        productId_fk = `AND product_id_fk='${productId}'`;
    }

if(startDate && end_date === dateNow){

    const tables = `tbl_stock_sale
    LEFT JOIN tbl_product ON tbl_stock_sale.product_id_fk=tbl_product.product_uuid
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
    LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
    LEFT JOIN tbl_zone_sale ON tbl_stock_sale.zone_id_fk=tbl_zone_sale.zone_Id`;
    const fields = `product_uuid,file_image,qty_baht,option_name,tile_name, code_id,quantity,unite_name,zone_name,zone_id_fk,'${dateTime}' as balance_date`;
    const where = `tbl_stock_sale.branch_id_fk='${branchId}' AND zone_status='1' ${tile_name} ${zone_id_fk} ${productId_fk} ORDER BY tbl_zone_sale.id ASC`;
    try {
        const results = await new Promise((resolve, reject) => {
            db.selectWhere(tables, fields, where, (err, results) => {
                if (err) {
                    reject(err);
                }
                resolve(results);
            });
        });

        for (let i = 0; i < results.length; i++) {
            const fieldSale = 'COALESCE(SUM(order_qty), 0) AS qty_sale';
            const whereSale = `product_id_fk='${results[i].product_uuid}' AND zone_id_fk='${results[i].zone_id_fk}' AND status_cancle='1'AND  DATE(tbl_sale_detail.create_date) BETWEEN '${start_date}' AND '${end_date}'`;

            const reSale = await new Promise((resolve, reject) => {
                db.fetchSingle('tbl_sale_detail', fieldSale, whereSale, (err, reSale) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(reSale);
                });
            });
            results[i].qty_sale = reSale.qty_sale;
            //===================
            const fieldImport = 'COALESCE(SUM(received_qty), 0) AS qty_import';
            const whereImport = `product_id_fk='${results[i].product_uuid}' AND zone_id_fk='${results[i].zone_id_fk}' AND  DATE(received_date) BETWEEN '${start_date}' AND '${end_date}'`;

            const resImport = await new Promise((resolve, reject) => {
                db.fetchSingle('tbl_received', fieldImport, whereImport, (err, resImport) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(resImport);
                });
            });
            results[i].qty_import = resImport.qty_import;
        }
        
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
}else{
    const tables = `tbl_off_balance
    LEFT JOIN tbl_product ON tbl_off_balance.product_id_fk=tbl_product.product_uuid
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
    LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
    LEFT JOIN tbl_zone_sale ON tbl_off_balance.zone_id_fk=tbl_zone_sale.zone_Id`;
    const fields = `product_uuid,file_image,qty_baht,option_name,tile_name, code_id,qty_stock as quantity,qty_import,qty_sale,unite_name,zone_name,balance_date`;
    const where = `tbl_off_balance.branch_id_fk='${branchId}' AND  zone_status='1' ${tile_name} ${zone_id_fk} ${productId_fk} ORDER BY tbl_zone_sale.id ASC`;
    db.selectWhere(tables, fields, where, (err, results) => {
        if (err) {
            reject(err);
        }
    })
}
});



module.exports = router;