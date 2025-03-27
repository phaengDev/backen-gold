const express=require('express');
const router=express.Router();
const db = require('../db');

router.patch("/", function (req, res) {
    db.selectAll('tbl_district',(err, results) => {
        if (err) {
            return res.status(400).send('ການສະແດງຂໍ້ມູນລົມເຫຼວ');
        }
        res.status(200).json(results);
    });
});
router.get("/:id", function (req, res) {
    const id= req.params.id;
    const where=`district_id=${id}`;
    db.fetchSingleAll('tbl_district', where,(err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});
router.get("/pv/:id", function (req, res) {
    const pvid = req.params.id;
    const wheres=`province_id_fk=${pvid}`;
    db.selectWhere('tbl_district','*', wheres,(err, results) => {
        if (err) {
            return res.status(400).send(err);
        }
        res.status(200).json(results);
    });
});
module.exports=router

