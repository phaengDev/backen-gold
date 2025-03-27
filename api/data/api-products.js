const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');

router.post("/create", async function (req, res) {
    let myFileName = '';
    const productuuid = uuidv4();
    const storage = multer.diskStorage({
        destination: function (req, file_image, cb) {
            cb(null, './assets/pos');
        },
        filename: function (req, file_image, cb) {
            const ext = path.extname(file_image.originalname);
            myFileName = `${Date.now()}${ext}`;
            cb(null, myFileName);
        }
    });
    const table = 'tbl_product';
    const upload = multer({ storage }).single('file_image');
    upload(req, res, function (err) {

        const { product_uuid, tiles_id_fk, qty_baht, option_id_fk, porduct_detail } = req.body;
        if (!product_uuid && product_uuid === '') {

            const where = `tiles_id_fk='${tiles_id_fk}' AND qty_baht='${qty_baht}' AND option_id_fk='${option_id_fk}'`;
            db.selectWhere(table, '*', where, (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'ເກີດຄວາມຜິດພາດຂຶ້ນໃນລະຫວ່າງການສອບຖາມຖານຂໍ້ມູນ' });
                }
                if (results && results.length >= 1) {
                    return res.status(400).json({ message: 'ມີການບັນທຶກຂໍ້ມູນຊຳກັນ ກະລຸນາປ້ອນຂໍ້ມູນສ່ວນຕ່າງ' });
                } else {

                    db.maxCode(table, 'code_id', (err, code_id) => {
                        let barcode = '';
                        const fields = 'product_uuid,code_id,barcode, tiles_id_fk,file_image,qty_baht,option_id_fk,quantity_all,porduct_detail,create_date';
                        const data = [productuuid, code_id, '', tiles_id_fk, myFileName, qty_baht, option_id_fk, 0, porduct_detail, dateTime];
                        db.insertData(table, fields, data, (err, results) => {
                            if (err) {
                                return res.status(500).json({ message: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດ` });
                            }
                            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
                        });
                    });
                }
            });

        } else {
            const where = `product_uuid='${product_uuid}'`;
            db.selectWhere(table, '*', where, (err, results) => {
                if (results[0].file_image && results[0].file_image !== '' && myFileName !== '') {

                    const filePath = path.join('assets/pos', results[0].file_image);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting the existing file:', err);
                        }
                    });
                }
                let fileName = results[0].file_image;
                if (myFileName !== '') {
                    fileName = myFileName;
                }
                const field = 'tiles_id_fk,file_image,qty_baht,option_id_fk';
                const newData = [tiles_id_fk, fileName, qty_baht, option_id_fk, product_uuid];
                const condition = 'product_uuid=?';
                db.updateData(table, field, newData, condition, (err, results) => {
                    if (err) {
                        return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
                    }
                    res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
                });
            });
        }
    });
});

router.post("/edit", function (req, res) {
    let myFileName = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "./assets/pos")
        },
        filename: function (req, file, cb) {
            myFileName = `${Date.now()}_${file.originalname}`
            cb(null, myFileName)
        }
    });

    const upload = multer({ storage }).single('file');
    upload(req, res, function (err) {
        const { product_uuid, tiles_id_fk, qty_baht, option_id_fk } = req.body;
        const table = 'tbl_product';
        const field = 'tiles_id_fk,file_image,qty_baht,option_id_fk';
        const newData = [tiles_id_fk, myFileName, qty_baht, option_id_fk, product_uuid];
        const condition = 'product_uuid=?';
        db.updateData(table, field, newData, condition, (err, results) => {
            if (err) {
                // console.error('Error updating data:', err);
                return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
            }
            // console.log('Data updated successfully:', results);
            res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
        });
    });
});
// ============ update image


router.post("/editimg/:id", function (req, res) {
    const productId = req.params.id;
    let myFileName = '';

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/pos');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            myFileName = `${productId}${ext}`;
            cb(null, myFileName);
        }
    });
    const upload = multer({ storage }).single('file');
    const wheres = `product_uuid='${productId}'`;
    db.selectWhere('tbl_product', 'file_image', wheres, (err, resImg) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }
        if (resImg.length > 0 && resImg[0].file_image && resImg[0].file_image !== '') {
            const filePath = path.join('assets/pos', resImg[0].file_image);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting the existing file:', err);
                }
            });
        }
        upload(req, res, function (err) {
            if (err) {
                return res.status(500).json({ error: 'File upload error' });
            }
            const table = 'tbl_product';
            const field = 'file_image';
            const newData = [myFileName, productId];
            const condition = 'product_uuid=?';
            db.updateData(table, field, newData, condition, (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update data. Please try again.' });
                }
                res.status(200).json({ message: `Data updated successfully - ${productId}` });
            });
        });
    });
});

router.delete("/:id", function (req, res, next) {
    const product_uuid = req.params.id;
    // const folderPath = './assets/pos';
    const condition = `product_id_fk='${product_uuid}'`;
    db.selectWhere('tbl_stock_sale', '*', condition, (err, results) => {
        if (err) {
            return res.status(500).json({ status: 500, error: 'An error occurred while checking data.' });
        }
        if (!results || results.length > 0) {
            return res.status(500).json({ status: 400, error: 'ຂໍອະໄພບໍ່ສາມາດລືບຂໍ້ມູນນີ້ໄດ້' });
        } else {
            const where = `product_uuid='${product_uuid}'`;
            db.deleteData('tbl_product', where, (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
                }
                res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
            });
        }
    });
});


router.post("/", function (req, res, next) {
    const { type_id_fk, tiles_id_fk, option_id_fk } = req.body;
    let type_idfk = '';
    if (type_id_fk && type_id_fk !== 'null') {
        type_idfk = `AND type_id_fk='${type_id_fk}'`;
    }
    let option_idfk = '';
    if (option_id_fk && option_id_fk !== 'null') {
        option_idfk = `AND option_id_fk='${option_id_fk}'`;
    }
    let tiles_idfk = '';
    if (tiles_id_fk && tiles_id_fk !== 'null') {
        tiles_idfk = `AND tiles_id_fk='${tiles_id_fk}'`;
    }
    const tables = `tbl_product
        LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
        LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
        LEFT JOIN tbl_type_gold ON tbl_product_tile.type_id_fk=tbl_type_gold.type_Id
        LEFT JOIN tbl_price_gold ON tbl_type_gold.type_Id=tbl_price_gold.type_id_fk `;
    const fields = `product_uuid,
    tbl_product_tile.tile_code,
    code_id,
    CONCAT(tile_code,'-',code_id) as code_gold,
    barcode,
    option_id_fk,
    tiles_id_fk,
    qty_baht,
    quantity_all,
    typeName,
    unite_name,
    option_name,
    tbl_product_tile.tile_name,
    tbl_product_tile.title_image,
    create_date,
    file_image,
     tbl_price_gold.price_buy,
    tbl_price_gold.price_sale,
    (qty_baht*tbl_options.grams) as grams,
     COALESCE((SELECT SUM(quantity) FROM tbl_stock_sale  WHERE tbl_stock_sale.product_id_fk = tbl_product.product_uuid), 0) AS qty_all`;
    const where = `product_uuid !='' ${type_idfk} ${option_idfk} ${tiles_idfk}`;
    db.selectWhere(tables, fields, where, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});


router.get("/type/:id", function (req, res, next) {
    const type_id_fk = req.params.id;
    const tables = `tbl_product
        LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
        LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
        LEFT JOIN tbl_type_gold ON tbl_product_tile.type_id_fk=tbl_type_gold.type_Id
        LEFT JOIN tbl_price_gold ON tbl_type_gold.type_Id=tbl_price_gold.type_id_fk `;
    const fields = `product_uuid,
    tbl_product_tile.tile_code,
    code_id,
    CONCAT(tile_code,'-',code_id) as code_gold,
    barcode,
    option_id_fk,
    tiles_id_fk,
    qty_baht,
    quantity_all,
    typeName,
    unite_name,
    option_name,
    tbl_product_tile.tile_name,
    tbl_product_tile.title_image,
    create_date,
    file_image,
     tbl_price_gold.price_buy,
    tbl_price_gold.price_sale,
    (qty_baht*tbl_options.grams) as grams`;
    const where = `tiles_id_fk ='${type_id_fk}'`;
    db.selectWhere(tables, fields, where, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});



router.get("/single/:id", function (req, res, next) {
    const product_uuid = req.params.id;
    const tables = `tbl_product
        LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
        LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
        LEFT JOIN tbl_type_gold ON tbl_product_tile.type_id_fk=tbl_type_gold.type_Id
        LEFT JOIN tbl_price_gold ON tbl_type_gold.type_Id=tbl_price_gold.type_id_fk `;
    const fields = `product_uuid,code_id,
    option_id_fk,
    tiles_id_fk,
    qty_baht,
    quantity_all,
    typeName,
    unite_name,
    option_name,
    tbl_product_tile.tile_name,
    tbl_product_tile.title_image,
    tbl_product_tile.title_detail,
    create_date,file_image,
     tbl_price_gold.price_buy,
    tbl_price_gold.price_sale,
    (qty_baht*tbl_options.grams) as grams`;
    const where = `product_uuid ='${product_uuid}'`;
    db.fetchSingle(tables, fields, where, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        const wheresList = `tiles_id_fk = '${results.tiles_id_fk}' AND product_uuid !='${product_uuid}'`;
        db.selectWhere(tables, fields, wheresList, (err, listResults) => {
            if (err) {
                return res.status(400).send({ error: 'Error fetching list details' });
            }
            const response = {
                dataps: results,
                list: listResults
            };
            res.status(200).json(response);
        });
        // res.status(200).json(results);
    });
});




router.post("/option", function (req, res, next) {
    const { tiles_id_fk, option_id_fk } = req.body;
    let option_idfk = '';
    if (option_id_fk && option_id_fk !== 'null') {
        option_idfk = `AND option_id_fk=${option_id_fk}`;
    }
    const tables = `tbl_product
        LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id`;
    const fields = `product_uuid,qty_baht,option_name,tile_name`;
    const where = `tiles_id_fk='${tiles_id_fk}' ${option_idfk} `;
    db.selectWhere(tables, fields, where, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});


router.post("/pdAll", function (req, res, next) {
    const {tiles_id_fk, option_id_fk } = req.body;
    let tiles_idfk = '';
    if(tiles_id_fk && tiles_id_fk !== 'null'){
        tiles_idfk = `AND tbl_product.tiles_id_fk='${tiles_id_fk}'`;
    }
    let option_idfk = '';
    if(option_id_fk && option_id_fk !== 'null'){
        option_idfk = `AND tbl_product.option_id_fk='${option_id_fk}'`;
    }

    const tables = `tbl_product
        LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id`;
    const fields = `tbl_product.*, 
	tbl_product_tile.tile_uuid, 
	tbl_product_tile.tile_code, 
	tbl_product_tile.type_id_fk, 
	tbl_product_tile.tile_name, 
	tbl_options.option_name`;
    const wheres=`product_uuid !='' ${tiles_idfk} ${option_idfk}`;
    db.selectWhere(tables, fields,wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});


router.get("/option/:id", function (req, res, next) {
    const tiles_id_fk = req.params.id;

    const tables = `tbl_product
        LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id`;
    const fields = `product_uuid,qty_baht,option_name,tile_name`;
    const where = `tiles_id_fk='${tiles_id_fk}' `;
    db.selectWhere(tables, fields, where, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});


router.post("/stock", function (req, res) {
    const { type_id_fk, zone_id_fk, tiles_id_fk, option_id_fk, qty_baht } = req.body;
    let typeId_fk = '';
    if (type_id_fk && type_id_fk !== '') {
        typeId_fk = `AND type_id_fk='${type_id_fk}'`;
    }
    let zoneId_fk = '';
    if (zone_id_fk && zone_id_fk !== '') {
        zoneId_fk = `AND zone_id_fk='${zone_id_fk}'`;
    }
    let tilesId_fk = '';
    if (tiles_id_fk && tiles_id_fk !== '') {
        tilesId_fk = `AND tiles_id_fk='${tiles_id_fk}'`;
    }

    let option_idfk = '';
    if (option_id_fk && option_id_fk !== '') {
        option_idfk = `AND option_id_fk='${option_id_fk}'`;
    }
    let qtybaht = '';
    if (qty_baht && qty_baht !== '') {
        qtybaht = `AND qty_baht='${qty_baht}'`;
    }
    const tables = `tbl_stock_sale
    LEFT JOIN tbl_product ON tbl_stock_sale.product_id_fk=tbl_product.product_uuid
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
    LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
    LEFT JOIN tbl_zone_sale ON tbl_stock_sale.zone_id_fk=tbl_zone_sale.zone_Id
    LEFT JOIN tbl_type_gold ON tbl_product_tile.type_id_fk=tbl_type_gold.type_Id
    LEFT JOIN tbl_price_gold ON tbl_type_gold.type_Id=tbl_price_gold.type_id_fk`;
    const fields = `stock_sale_Id,product_uuid,
    CONCAT(tile_code,'-',code_id) as code_gold,
    file_image,title_image,qty_baht,
    tbl_price_gold.price_buy,
    tbl_price_gold.price_sale,
    (qty_baht*tbl_options.grams) as grams,
    option_name,tile_name, code_id,quantity, unite_name,zone_name,typeName`;
    const where = `product_uuid !='' ${typeId_fk} ${zoneId_fk} ${tilesId_fk} ${option_idfk} ${qtybaht}`;
    db.selectWhere(tables, fields, where, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});

router.post('/itemsale', function (req, res) {
    const { zoneId, posductName } = req.body;

    let zone_id_fk = '';
    if (zoneId && zoneId !== 'null') {
        zone_id_fk = `AND zone_id_fk='${zoneId}'`;
    }
    let tile_name = '';
    if (posductName && posductName !== 'null') {
        tile_name = `AND tile_name='${posductName}' OR code_id='${posductName}'`;
    }


    const tables = `tbl_stock_sale
    LEFT JOIN tbl_product ON tbl_stock_sale.product_id_fk=tbl_product.product_uuid
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
    LEFT JOIN tbl_zone_sale ON tbl_stock_sale.zone_id_fk=tbl_zone_sale.zone_Id
    LEFT JOIN tbl_type_gold ON tbl_product_tile.type_id_fk=tbl_type_gold.type_Id
    LEFT JOIN tbl_price_gold ON tbl_type_gold.type_Id=tbl_price_gold.type_id_fk`;
    const fields = `product_uuid,option_id_fk,tiles_id_fk,file_image,title_image,qty_baht,tbl_price_gold.price_buy,
    tbl_price_gold.price_sale,
    (qty_baht*tbl_options.grams) as grams,
    tbl_options.grams as kilogram,
    option_name,tile_name, code_id,quantity,zone_name,bg_color,zone_id_fk`;

    const where = `zone_status='1' ${tile_name} ${zone_id_fk}`;
    db.selectWhere(tables, fields, where, (err, results) => {
        if (err) {
            return res.status(400).send();
        }

        const promises = results.map(contract => {
            const wheres = `title_id_fk = '${contract.tiles_id_fk}' AND option_id_fk='${contract.option_id_fk}'`;
            return new Promise((resolve, reject) => {
                db.selectWhere('tbl_pattern', '*', wheres, (err, resultsList) => {
                    if (err) {
                        return reject(err);
                    }
                    contract.patternList = resultsList;
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
        // res.status(200).json(results);
    });
});


router.get("/group", function (req, res) {
    const tables = `tbl_product_tile
    LEFT JOIN tbl_type_gold ON tbl_product_tile.type_id_fk=tbl_type_gold.type_Id
    LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
    LEFT JOIN tbl_price_gold ON tbl_type_gold.type_Id=tbl_price_gold.type_id_fk`;
    const fieldTitle = `tile_uuid,tile_code,
    tbl_price_gold.type_id_fk,
    tile_name,
    unite_id_fk,
    unite_name,
    typeName,
    title_detail,
    title_image, 
    price_buy,
    tbl_price_gold.price_sale`;

    const fieldsLis = `product_uuid, 
    code_id,
    barcode, 
    tiles_id_fk, 
    file_image, 
    qty_baht, 
    porduct_detail, 
    option_name,
    (qty_baht*tbl_options.grams) as grams`;
    const tableLis = `tbl_product
    LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id`;
    db.selectData(tables, fieldTitle, (err, results) => {
        if (err) {
            return res.status(400).send();
        }

        const promises = results.map(contract => {
            const wheres = `tiles_id_fk = '${contract.tile_uuid}' ORDER BY option_id_fk,qty_baht ASC`;
            return new Promise((resolve, reject) => {
                db.selectWhere(tableLis, fieldsLis, wheres, (err, resultsList) => {
                    if (err) {
                        return reject(err);
                    }
                    contract.product = resultsList;
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

router.get('/st-group', function (req, res) {
    const tables = `tbl_stock_sale
    LEFT JOIN tbl_product ON tbl_stock_sale.product_id_fk=tbl_product.product_uuid
    LEFT JOIN tbl_product_tile ON tbl_product.tiles_id_fk=tbl_product_tile.tile_uuid
    LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
    LEFT JOIN tbl_unite ON tbl_product_tile.unite_id_fk=tbl_unite.unite_uuid
    GROUP BY product_id_fk ,stock_sale_Id,product_uuid,file_image,title_image,qty_baht
     ORDER BY option_id_fk,tiles_id_fk ASC`;
    const fields = `stock_sale_Id,product_uuid,file_image,title_image,qty_baht,
    (qty_baht*tbl_options.grams) as grams,
    option_name,tile_name, code_id,sum(quantity) as quantity , unite_name `;
    db.selectData(tables, fields, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});



router.get('/groupby', function (req, res) {
    const tables = `tbl_product  
LEFT JOIN tbl_options ON tbl_product.option_id_fk=tbl_options.option_id
GROUP BY option_id_fk,qty_baht,option_name ORDER BY option_id_fk,qty_baht ASC`;
    const fields = `option_id_fk,qty_baht,option_name`;
    db.selectData(tables, fields, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});
module.exports = router;

