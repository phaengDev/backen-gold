const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
const dateNow = currentDatetime.format('YYYY-MM-DD');
router.post("/report", function (req, res) {
	const { startDate, endDate, staffId, statusOff } = req.body;
	let staff_id_fk = '';
	if (staffId) {
		staff_id_fk = `AND staff_id_fk='${staffId}'`;
	}
	let status_off_sale = '';
	if (statusOff) {
		status_off_sale = `AND status_off_sale='${statusOff}'`;
	}
	const start_date = startDate.substring(0, 10);
	const end_date = endDate.substring(0, 10);
	const tables = `tbl_sale_gold
	LEFT JOIN tbl_staff ON tbl_sale_gold.staff_id_fk = tbl_staff.staff_uuid
	LEFT JOIN tbl_customer ON tbl_sale_gold.customer_id_fk = tbl_customer.cus_uuid
	LEFT JOIN tbl_user_acount ON  tbl_sale_gold.user_id_fk = tbl_user_acount.user_uuid`;
	const fields = `
    tbl_sale_gold.sale_uuid, 
	tbl_sale_gold.sale_billNo, 
	tbl_sale_gold.bill_shop,
	tbl_sale_gold.balance_total, 
	tbl_sale_gold.status_payment, 
	tbl_sale_gold.balance_cash, 
	tbl_sale_gold.balance_transfer, 
	tbl_sale_gold.balance_payment, 
	tbl_sale_gold.balance_return, 
	tbl_sale_gold.branch_id_fk, 
	tbl_sale_gold.user_id_fk, 
	tbl_sale_gold.staff_id_fk, 
	tbl_sale_gold.customer_id_fk, 
	tbl_sale_gold.sale_remark, 
	tbl_sale_gold.sale_date, 
	tbl_sale_gold.sale_status, 
	tbl_sale_gold.sale_can_date, 
	tbl_staff.first_name, 
	tbl_staff.last_name, 
	tbl_customer.cus_fname, 
	tbl_customer.cus_lname, 
	tbl_customer.cus_tel, 
	tbl_user_acount.userName,status_off_sale,date_off_sale`;
	const where = `tbl_sale_gold.sale_status='1' AND  DATE(sale_date) BETWEEN '${start_date}' AND '${end_date}' ${staff_id_fk} ${status_off_sale} ORDER BY sale_id ASC`;
	db.selectWhere(tables, fields, where, (err, results) => {
		if (err) {
			return res.status(500).json({ message: 'An error occurred while fetching data.' });
		}
		res.status(200).json(results);
	});
});

//=====================
router.post("/r-cancle", function (req, res) {
	const { startDate, endDate, staffId, statusOff } = req.body;
	let staff_id_fk = '';
	if (staffId) {
		staff_id_fk = `AND staff_id_fk='${staffId}'`;
	}
	let status_off_sale = '';
	if (statusOff) {
		status_off_sale = `AND status_off_sale='${statusOff}'`;
	}
	const start_date = startDate.substring(0, 10);
	const end_date = endDate.substring(0, 10);
	const tables = `tbl_sale_gold
	LEFT JOIN tbl_staff ON tbl_sale_gold.staff_id_fk = tbl_staff.staff_uuid
	LEFT JOIN tbl_customer ON tbl_sale_gold.customer_id_fk = tbl_customer.cus_uuid
	LEFT JOIN tbl_user_acount AS A ON  tbl_sale_gold.user_id_fk = A.user_uuid
	LEFT JOIN tbl_user_acount AS C ON  tbl_sale_gold.user_cancle_fk = C.user_uuid`;
	const fields = `
    tbl_sale_gold.sale_uuid, 
	tbl_sale_gold.sale_billNo, 
	tbl_sale_gold.bill_shop,
	tbl_sale_gold.balance_total, 
	tbl_sale_gold.status_payment, 
	tbl_sale_gold.balance_cash, 
	tbl_sale_gold.balance_transfer, 
	tbl_sale_gold.balance_payment, 
	tbl_sale_gold.balance_return, 
	tbl_sale_gold.branch_id_fk, 
	tbl_sale_gold.user_id_fk, 
	tbl_sale_gold.staff_id_fk, 
	tbl_sale_gold.customer_id_fk, 
	tbl_sale_gold.sale_remark, 
	tbl_sale_gold.sale_date, 
	tbl_sale_gold.sale_status, 
	tbl_sale_gold.sale_can_date, 
	tbl_staff.first_name, 
	tbl_staff.last_name, 
	tbl_customer.cus_fname, 
	tbl_customer.cus_lname, 
	tbl_customer.cus_tel, 
	A.userName,
	B.userName as userCancle,
	status_off_sale,
	date_off_sale`;
	const where = `tbl_sale_gold.sale_status='2' AND  DATE(sale_can_date) BETWEEN '${start_date}' AND '${end_date}' ${staff_id_fk} ${status_off_sale} ORDER BY sale_id ASC`;
	db.selectWhere(tables, fields, where, (err, results) => {
		if (err) {
			return res.status(500).json({ message: 'An error occurred while fetching data.' });
		}
		res.status(200).json(results);
	});
});

//================\\

router.post("/veiw/:id", function (req, res) {
	const sale_id_fk = req.params.id;
	const tables = `tbl_sale_detail 
		LEFT JOIN tbl_product ON tbl_sale_detail.product_id_fk=tbl_product.product_uuid
		LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
		LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
		LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
		LEFT JOIN tbl_zone_sale ON tbl_sale_detail.zone_id_fk=tbl_zone_sale.zone_Id
		LEFT JOIN tbl_staff ON tbl_sale_detail.staff_id_fk = tbl_staff.staff_uuid`;
	const fields = `
    tbl_sale_detail.detail_uuid, 
	tbl_sale_detail.sale_bill_fk, 
	tbl_sale_detail.product_id_fk, 
	tbl_sale_detail.price_grams,
	tbl_sale_detail.price_sale, 
	tbl_sale_detail.order_qty, 
	tbl_sale_detail.qty_grams, 
	tbl_sale_detail.qty_sale_add,
	tbl_sale_detail.qty_gram_add,
	tbl_sale_detail.total_balance,
	tbl_sale_detail.price_pattern, 
	tbl_sale_detail.zone_id_fk, 
	tbl_sale_detail.user_id_fk, 
	tbl_sale_detail.create_date, 
	tbl_product.code_id, 
	tbl_product.qty_baht, 
	tbl_product.file_image, 
	tbl_product_tile.tile_name, 
	tbl_options.option_name, 
	tbl_zone_sale.zone_name,
	tbl_unite.unite_name,
	concat(tbl_staff.first_name,' ',tbl_staff.last_name) as staff_name `;
	const where = `sale_bill_fk='${sale_id_fk}' `;
	db.selectWhere(tables, fields, where, (err, results) => {
		if (err) {
			return res.status(500).json({ message: 'An error occurred while fetching data.' });
		}
		res.status(200).json(results);
	});

});

router.post("/list", function (req, res) {
	const { startDate, endDate, tilesId_fk, zone_id_fk, product_id_fk } = req.body;
	let tiles_id_fk = '';
	if (tilesId_fk) {
		tiles_id_fk = `AND tiles_id_fk='${tilesId_fk}'`;
	}
	let zoneId_fk = '';
	if (zone_id_fk) {
		zoneId_fk = `AND zone_id_fk='${zone_id_fk}'`;
	}
	let productId_fk = '';
	if (product_id_fk) {
		productId_fk = `AND product_id_fk='${product_id_fk}'`;
	}


	const start_date = startDate.substring(0, 10);
	const end_date = endDate.substring(0, 10);
	const tables = `tbl_sale_detail 
	LEFT JOIN tbl_product ON tbl_sale_detail.product_id_fk=tbl_product.product_uuid
	LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
	LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
	LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
	LEFT JOIN tbl_zone_sale ON tbl_sale_detail.zone_id_fk=tbl_zone_sale.zone_Id
	LEFT JOIN tbl_staff ON tbl_sale_detail.staff_id_fk = tbl_staff.staff_uuid`;
	const fields = `
tbl_sale_detail.detail_uuid, 
tbl_sale_detail.sale_bill_fk, 
tbl_sale_detail.product_id_fk, 
tbl_sale_detail.price_grams,
tbl_sale_detail.price_sale, 
tbl_sale_detail.order_qty, 
tbl_sale_detail.qty_grams, 
tbl_sale_detail.qty_sale_add,
tbl_sale_detail.qty_gram_add,
tbl_sale_detail.total_balance,
tbl_sale_detail.price_pattern, 
tbl_sale_detail.zone_id_fk, 
tbl_sale_detail.user_id_fk, 
tbl_sale_detail.create_date, 
tbl_product.code_id, 
tbl_product.qty_baht, 
tbl_product.file_image, 
tbl_product_tile.tile_name, 
tbl_options.option_name, 
tbl_zone_sale.zone_name,
tbl_unite.unite_name,
concat(tbl_staff.first_name,' ',tbl_staff.last_name) as staff_name `;
	const where = `status_cancle='1' AND  DATE(tbl_sale_detail.create_date) BETWEEN '${start_date}' AND '${end_date}' ${productId_fk} ${tiles_id_fk}  ${zoneId_fk} ORDER BY tbl_sale_detail.id ASC`;
	db.selectWhere(tables, fields, where, (err, results) => {
		if (err) {
			return res.status(500).json({ message: 'An error occurred while fetching data.' });
		}
		res.status(200).json(results);
	});
});


router.post("/list-cl", function (req, res) {
	const { startDate, endDate, tilesId_fk, zone_id_fk, product_id_fk } = req.body;
	let tiles_id_fk = '';
	if (tilesId_fk) {
		tiles_id_fk = `AND tiles_id_fk='${tilesId_fk}'`;
	}
	let zoneId_fk = '';
	if (zone_id_fk) {
		zoneId_fk = `AND zone_id_fk='${zone_id_fk}'`;
	}
	let productId_fk = '';
	if (product_id_fk) {
		productId_fk = `AND product_id_fk='${product_id_fk}'`;
	}


	const start_date = startDate.substring(0, 10);
	const end_date = endDate.substring(0, 10);
	const tables = `tbl_sale_detail 
	LEFT JOIN tbl_product ON tbl_sale_detail.product_id_fk=tbl_product.product_uuid
	LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
	LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
	LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
	LEFT JOIN tbl_zone_sale ON tbl_sale_detail.zone_id_fk=tbl_zone_sale.zone_Id
	LEFT JOIN tbl_staff ON tbl_sale_detail.staff_id_fk = tbl_staff.staff_uuid`;
	const fields = `
	tbl_sale_detail.detail_uuid, 
	tbl_sale_detail.sale_bill_fk, 
	tbl_sale_detail.product_id_fk, 
	tbl_sale_detail.price_grams,
	tbl_sale_detail.price_sale, 
	tbl_sale_detail.order_qty, 
	tbl_sale_detail.qty_grams, 
	tbl_sale_detail.qty_sale_add,
	tbl_sale_detail.qty_gram_add,
	tbl_sale_detail.total_balance,
	tbl_sale_detail.price_pattern, 
	tbl_sale_detail.zone_id_fk, 
	tbl_sale_detail.user_id_fk, 
	tbl_sale_detail.create_date, 
	tbl_product.code_id, 
	tbl_product.qty_baht, 
	tbl_product.file_image, 
	tbl_product_tile.tile_name, 
	tbl_options.option_name, 
	tbl_zone_sale.zone_name,
	tbl_unite.unite_name,
	concat(tbl_staff.first_name,' ',tbl_staff.last_name) as staff_name `;
	const where = `status_cancle='2' AND  DATE(tbl_sale_detail.cancle_date) BETWEEN '${start_date}' AND '${end_date}' ${productId_fk} ${tiles_id_fk}  ${zoneId_fk} ORDER BY tbl_sale_detail.id ASC`;
	db.selectWhere(tables, fields, where, (err, results) => {
		if (err) {
			return res.status(500).json({ message: 'An error occurred while fetching data.' });
		}
		res.status(200).json(results);
	});
});

//====================

router.get("/saledays/:id", function (req, res) {
	const branceId = req.params.id
	// Fetch sales data
	const tableSale = `tbl_sale_detail 
        LEFT JOIN tbl_product ON tbl_sale_detail.product_id_fk = tbl_product.product_uuid
        LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk = tbl_product_tile.tile_uuid
        LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk = tbl_unite.unite_uuid
        LEFT JOIN tbl_options ON tbl_product.option_id_fk = tbl_options.option_id
		LEFT JOIN tbl_stock_sale ON tbl_sale_detail.product_id_fk=tbl_stock_sale.product_id_fk`;
	const fieldsSale = `
        SUM(order_qty) AS qtySale, 
        qty_baht, 
		quantity,
        tile_name, 
        option_name, 
        unite_name,
		code_id,
        tbl_sale_detail.product_id_fk`;
	const whereSale = `status_cancle = '1' AND DATE(tbl_sale_detail.create_date) = '${dateNow}' AND branch_id_fk='${branceId}' GROUP BY tbl_sale_detail.product_id_fk`;
	db.selectWhere(tableSale, fieldsSale, whereSale, (err, saleResults) => {
		if (err) {
			console.error('Error fetching sales data:', err);
			return res.status(500).json({ message: 'An error occurred while fetching sales data.' });
		}
		res.status(200).json(saleResults);
	});
});

router.get('/reques/:id', async (req, res) => {
	// try {
	  const sale_uuid = req.params.id;
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
		tbl_branch.village_name,
		district_name,
		province_name`;
	  const results = await new Promise((resolve, reject) => {
		db.fetchSingle(tables, fields, wheres, (err, results) => {
		  if (err) {
			console.error('Error fetching sales data:', err);
			reject(err);
		  } else {
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
		qty_sale_add,
		qty_gram_add,
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
