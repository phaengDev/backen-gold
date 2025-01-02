const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');

router.post("/create", async function (req, res) {
    let imageName = '';
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './assets/pos');
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            imageName = `rec-${Date.now()}${ext}`;
            cb(null, imageName);
        }
    });
    const table = 'tbl_recommended';
    const upload = multer({ storage }).single('recd_image');
    upload(req, res, function (err) {
        const { recomendedId, title_id_fk, recomennde_name, optoin_id_fk, qty_baht, recd_remark } = req.body;
        if (!recomendedId) {
            db.autoId(table, 'recomended_id', (err, recomended_id) => {
                const fields = 'recomended_id,title_id_fk,recomennde_name,optoin_id_fk,qty_baht,recd_remark,recd_image';
                const data = [recomended_id, title_id_fk, recomennde_name, optoin_id_fk, qty_baht,  recd_remark, imageName];
                db.insertData(table, fields, data, (err, results) => {
                    if (err) {
                        console.error('Error inserting data:', err);
                        return res.status(500).json({ error: `ການບັນທຶກຂໍ້ມູນບໍ່ສ້ຳເລັດaa` });
                    }
                    console.log('Data inserted successfully:', results);
                    res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ' });
                });
            });
        } else {
            const where = `recomended_id='${recomendedId}'`;
            db.selectWhere(table, '*', where, (err, results) => {
                if (results[0].recd_image && results[0].recd_image !== '' && imageName !== '') {
                    const filePath = path.join('assets/promotion', results[0].recd_image);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting the existing file:', err);
                        }
                    });
                }
                let fileName = results[0].recd_image;
                if (imageName !== '') {
                    fileName = imageName;
                }

                const field = 'title_id_fk,recomennde_name,optoin_id_fk,qty_baht,recd_remark,recd_image';
                const newData = [title_id_fk, recomennde_name, optoin_id_fk, qty_baht,  recd_remark, fileName, recomendedId];
                const condition = 'recomended_id=?';
                db.updateData(table, field, newData, condition, (err, results) => {
                    if (err) {
                        console.error('Error updating data:', err);
                        return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
                    }
                    console.log('Data updated successfully:', results);
                    res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
                });
            });
        }
    });
});


router.delete("/:id", function (req, res) {
    const recomended_id = req.params.id;
    const where = `recomended_id=${recomended_id}`;
    db.fetchSingle('tbl_recommended', '*', where, (fetchError, fetchResult) => {
        if (fetchError) {
            return res.status(500).json({ error: 'Error fetching pattern data' });
        }
        if (fetchResult && fetchResult.recd_image) {
            const filePath = path.join('assets/pos/', fetchResult.recd_image);
            fs.unlink(filePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error deleting the existing file:', unlinkError);
                }
            });
        }

        db.deleteData('tbl_recommended', where, (deleteError, deleteResults) => {
            if (deleteError) {
                return res.status(500).json({ error: 'ຂໍອະໄພການລືບຂໍ້ມູນບໍ່ສຳເລັດ' });
            }
            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: deleteResults });
        });
    });
});



router.get("/", function (req, res) {
    const tables = `tbl_recommended
        LEFT JOIN tbl_product_tile ON tbl_recommended.title_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_options ON tbl_recommended.optoin_id_fk=tbl_options.option_id ORDER BY recomended_id DESC`;
    const fields = `recomended_id,
                title_id_fk,
                recomennde_name,
                optoin_id_fk,
                qty_baht,
                recd_remark,
                recd_image,
                tile_name,
                option_name,
                grams,
              (SELECT (price_sale*grams) FROM tbl_price_gold WHERE type_id_fk=1) AS price_sale`;
    db.selectData(tables, fields, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});



router.get("/title/:typeId", function (req, res) {
    const title_id_fk = req.params.typeId;

    const tables = `tbl_recommended
        LEFT JOIN tbl_product_tile ON tbl_recommended.title_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_options ON tbl_recommended.optoin_id_fk=tbl_options.option_id`;
    const fields = `recomended_id,
                title_id_fk,
                recomennde_name,
                optoin_id_fk,
                qty_baht,
                recd_remark,
                recd_image,
                tile_name,
                option_name,
                grams,
              (SELECT (price_sale*grams) FROM tbl_price_gold WHERE type_id_fk=1) AS price_sale`;
              const wheres = `title_id_fk = '${title_id_fk}' ORDER BY optoin_id_fk,qty_baht ASC`;
    db.selectWhere(tables, fields,wheres, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});


router.get("/limit/:qty", function (req, res) {
    const qty=params.qty;
    const tables = `tbl_recommended
        LEFT JOIN tbl_product_tile ON tbl_recommended.title_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_options ON tbl_recommended.optoin_id_fk=tbl_options.option_id ORDER BY recomended_id DESC LIMIT ${qty}`;
    const fields = `recomended_id,
                title_id_fk,
                recomennde_name,
                optoin_id_fk,
                qty_baht,
                recd_remark,
                recd_image,
                tile_name,
                option_name,
                grams,
              (SELECT (price_sale*grams) FROM tbl_price_gold WHERE type_id_fk=1) AS price_sale`;
    db.selectData(tables, fields, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});



router.get("/g-recom", function (req, res) {
    const tables = `tbl_recommended
        LEFT JOIN tbl_product_tile ON tbl_recommended.title_id_fk=tbl_product_tile.tile_uuid  GROUP BY title_id_fk`;
    const fieldTitle = `title_id_fk, tile_name`;

    const fieldsLis = `recomended_id,
	title_id_fk,
	recomennde_name,
	optoin_id_fk,
	qty_baht,
	recd_remark,
	recd_image,
	tile_name,
	option_name,
	grams,
    (SELECT (price_sale*grams) FROM tbl_price_gold WHERE type_id_fk=1) AS price_sale`;
    const tableLis = `tbl_recommended
        LEFT JOIN tbl_product_tile ON tbl_recommended.title_id_fk=tbl_product_tile.tile_uuid
        LEFT JOIN tbl_options ON tbl_recommended.optoin_id_fk=tbl_options.option_id`;
    db.selectData(tables, fieldTitle, (err, results) => {
        if (err) {
            return res.status(400).send();
        }
        const promises = results.map(contract => {
            const wheres = `title_id_fk = '${contract.title_id_fk}' ORDER BY optoin_id_fk,qty_baht ASC`;
            return new Promise((resolve, reject) => {
                db.selectWhere(tableLis, fieldsLis, wheres, (err, resultsList) => {
                    if (err) {
                        return reject(err);
                    }
                    contract.recommended = resultsList;
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


module.exports = router;
