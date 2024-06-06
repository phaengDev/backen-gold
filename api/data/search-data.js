const express=require('express');
const router=express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
router.get("/:id", async function (req, res) {
    const bill = req.params.id;
    try {
    const condition =`sale_billNo='${bill}' OR bill_shop='${bill}'`;
    db.fetchSingle('tbl_sale_gold', '*', condition, (err, result) => {
        if (err) {
            console.error('Error fetching stock data:', err);
            return res.status(500).json({ message: 'ການດຳເນີນງານເກີດຂໍຜິພາດ' });
        }
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ message: 'ບໍ່ພົບເລກບິນທີ່ທ່ານຊອກຫານ' });
        }
    });
} catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'ບໍ່ພົບເລກບິນທີ່ທ່ານຊອກຫານ' });
}
});



    router.get('/bill/:id', async (req, res) => {
    const sale_uuid= req.params.id;
    const wheres = `sale_uuid='${sale_uuid}'`;
    const tables = `tbl_sale_gold
      LEFT JOIN tbl_staff ON tbl_sale_gold.staff_id_fk = tbl_staff.staff_uuid
      LEFT JOIN tbl_customer ON tbl_sale_gold.customer_id_fk = tbl_customer.cus_uuid
      LEFT JOIN tbl_user_acount ON tbl_sale_gold.user_id_fk = tbl_user_acount.user_uuid
      LEFT JOIN tbl_branch ON tbl_sale_gold.branch_id_fk = tbl_branch.branch_uuid
      LEFT JOIN tbl_province ON tbl_branch.province_id_fk = tbl_province.province_id
      LEFT JOIN tbl_district ON tbl_branch.district_id_fk = tbl_district.district_id`;
    const fields = `tbl_sale_gold.sale_uuid, 
      tbl_sale_gold.sale_billNo, 
      tbl_sale_gold.bill_shop,
      tbl_sale_gold.balance_total, 
      tbl_sale_gold.balance_vat,
      tbl_sale_gold.status_payment, 
      tbl_sale_gold.balance_cash, 
      tbl_sale_gold.balance_transfer, 
      tbl_sale_gold.balance_payment, 
      tbl_sale_gold.balance_return, 
      tbl_sale_gold.sale_remark, 
      tbl_sale_gold.sale_date, 
      tbl_sale_gold.sale_status, 
      concat(tbl_staff.first_name,' ', tbl_staff.last_name) as staffName, 
      tbl_customer.cus_fname, 
      tbl_customer.cus_lname, 
      tbl_customer.cus_tel, 
      tbl_user_acount.userName,
      tbl_branch.branch_name,
      tbl_branch.branch_tel,
      tbl_branch.branch_email,
      tbl_branch.branch_detail,
      tbl_branch.village_name,
      district_name,
      province_name`;
      
    const results = await new Promise((resolve, reject) => {
      db.fetchSingle(tables, fields, wheres, (err, results) => {
        if (err) {
          console.error('Error fetching sales data:', err);
          reject(err);
        }else{
            resolve(results);
        }
        
      });
    });


    // Fetching sale item details
    const tableList = `tbl_sale_detail 
    LEFT JOIN tbl_product ON tbl_sale_detail.product_id_fk = tbl_product.product_uuid
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk = tbl_product_tile.tile_uuid
    LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk = tbl_unite.unite_uuid
    LEFT JOIN tbl_options ON tbl_product.option_id_fk = tbl_options.option_id
    LEFT JOIN tbl_zone_sale ON tbl_sale_detail.zone_id_fk = tbl_zone_sale.zone_Id`;
    const fieldList = `tbl_sale_detail.detail_uuid, 
      tbl_sale_detail.price_grams,
      tbl_sale_detail.price_sale, 
      tbl_sale_detail.order_qty, 
      tbl_sale_detail.qty_grams, 
      tbl_sale_detail.price_pattern,
      tbl_sale_detail.create_date, 
      tbl_product.code_id, 
      tbl_product.qty_baht, 
      tbl_product.file_image, 
      tbl_product_tile.tile_name, 
      tbl_options.option_name, 
      tbl_zone_sale.zone_name,
      tbl_unite.unite_name`;
    const whereList = `tbl_sale_detail.sale_bill_fk='${sale_uuid}'`;
    const saleList = await new Promise((resolve, reject) => {
      db.selectWhere(tableList, fieldList, whereList, (err, saleList) => {
        if (err) {
          reject(err);
        } else {
          resolve(saleList);
        }
      });
    });
    results.dataList=saleList;

    res.status(200).json(results);
  
});

module.exports = router;