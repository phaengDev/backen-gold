const express=require('express');
const router=express.Router();
const db = require('../db');
const bcrypt=require('bcryptjs');
const { v4: uuidv4 } = require('uuid')
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
router.post("/create", function (req, res) {
    const user_uuid=uuidv4();
    const table = 'tbl_user_acount'; // Table name
    const userPassword = bcrypt.hashSync(req.body.userPassword);
    const {userUuid,branch_Id_fk,userName,userEmail,userStatus,status_offon} = req.body;
    if(userUuid===''){
   db.autoId(table, 'user_Id', (err, user_Id) => {
    const fields = 'user_Id,user_uuid,branch_Id_fk,userName,userEmail,userPassword,userStatus,status_offon,createDate';
    const data = [user_Id,user_uuid,branch_Id_fk,userName,userEmail,userPassword,userStatus,status_offon,dateTime];
    db.insertData(table, fields, data, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        console.log('Data inserted successfully:', results);
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
});
    }else{
        const fields = `userName,userEmail,userStatus,status_offon`;
        const newData = [userName,userEmail,userStatus,status_offon,userUuid];
        const condition = 'user_uuid=?';  
        db.updateData(table, fields,newData, condition, (err, results) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
            }
            console.log('Data inserted successfully:', results);
            res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
        });
    }
});
router.post("/edit", function (req, res) {
    const {userName,userEmail,userPassword,userStatus,status_offon,user_Id} = req.body;
    const table = 'tbl_user_acount';
    const fields = `userName,userEmail,userPassword,userStatus,status_offon`;
    const newData = [userName,userEmail,userPassword,userStatus,status_offon,user_Id];
    const condition = 'user_Id=?';  
    db.updateData(table, fields,newData, condition, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        console.log('Data inserted successfully:', results);
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
});

router.post('/editpass',function(req,res){
    const userPassword = bcrypt.hashSync(req.body.userPassword);
    const user_uuid=req.body.user_uuid
    const newData = [userPassword,user_uuid];
    const condition = 'user_uuid=?';  
    db.updateData('tbl_user_acount', 'userPassword',newData, condition, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'ການແກ້ໄຂລະຫັດຜ່ານບໍ່ສຳເລັດແລ້ວ' });
        }
        res.status(200).json({ message: 'ການແກ້ໄຂລະຫັດຜ່ານສຳເລັດແລ້ວ', data: results });
    });
})
router.delete("/:id", async (req, res)=> {
    const user_Id= req.params.id;
    const table = 'tbl_user_acount';
    const where = `user_Id=${user_Id}`;
    db.deleteData(table, where, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'ການບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
        console.log('Data inserted successfully:', results);
        res.status(200).json({ message: 'ການດຳເນີນງານສຳເລັດແລ້ວ', data: results });
    });
});
router.get("/", function (req, res) {
    const tables=`tbl_user_acount`;
    db.selectAll(tables,(err, results) => {
        if (err) {
            return res.status(400).send('ການສະແດງຂໍ້ມູນລົມເຫຼວ');
        }
        res.status(200).json(results);
    });
});

router.get("/:id", function (req, res) {
  const user_Id= req.params.id;
    const where=`user_Id=${user_Id}`;
    db.fetchSingleAll('tbl_user_acount',fields, where,(err, results) => {
        if (err) {
            return res.status(400).send();
        }
        res.status(200).json(results);
    });
});
module.exports=router

