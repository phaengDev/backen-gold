const express=require('express');
const router=express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid')
router.post("/create", function (req, res) {
    const type_Id=uuidv4();
    const {typeName} = req.body;
    const table = 'tbl_type_gold';
    const fields = 'type_Id,typeName';
    const data = [type_Id,typeName];
    db.insertData(table, fields, data, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        console.log('Data inserted successfully:', results);
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
});


router.post("/edit", function (req, res) {
    const {type_Id,typeName} = req.body;
    const table = 'tbl_type_gold';
    const field = 'type_Id,typeName';
    const newData = [typeName,type_Id]; 
    const condition = 'type_Id=?'; 
    db.updateData(table, field, newData, condition, (err, results) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ error: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາກວອສອນແລ້ວລອງໃໝ່ອິກຄັ້ງ' });
        }
        console.log('Data updated successfully:', results);
        res.status(200).json({ message: 'ການແກ້ໄຂຂໍ້ມູນສຳເລັດ', data: results });
    });
});

router.delete("/:id", async (req, res)=> {
    const type_Id= req.params.id;
    const table = 'tbl_type_gold';
    const where = `type_Id='${type_Id}'`;
    db.deleteData(table, where, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        console.log('Data inserted successfully:', results);
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
});

router.get("/", function (req, res) {
    db.selectAll('tbl_type_gold',(err, results) => {
        if (err) {
            return res.status(400).send('ການສະແດງຂໍ້ມູນລົມເຫຼວ');
        }
        res.status(200).json(results);
    });

});


router.patch("/:id", function (req, res) {
  const type_Id= req.params.id;
  const where=`type_Id='${type_Id}'`;
  const fields=`*`;
    db.fetchSingle(`tbl_type_gold`,fields, where,(err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});
//=================================

router.get('/option',function(req,res){
    db.selectAll('tbl_options',(err, results) => {
        if (err) {
            return res.status(400).send('ການສະແດງຂໍ້ມູນລົມເຫຼວ');
        }
        res.status(200).json(results);
    });
})

module.exports=router