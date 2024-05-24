const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
const dateNow = currentDatetime.format('YYYY-MM-DD');
const tables='tbl_off_balance';
const wheres=`DATE(balance_date)='${dateNow}'`;
db.selectWhere(tables,'*',wheres,(err,result)=>{
if(result && result.length <=0 ){


    const results =  new Promise((resolve, reject) => {
        const wherest=`product_id_fk !=''`;
        db.selectWhere('tbl_stock_sale','*', wherest, (err, results) => {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });

    for (let i = 0; i < results.length; i++) {
    const balance_Id = uuidv4();
    const fieldOff = 'balance_Id,branch_id_fk,balance_date,product_id_fk,zone_id_fk,qty_import,qty_sale,qty_stock,statsu_off,user_off';
    const dataOff = [balance_Id, '',dateTime,results[i].product_id_fk,results[i].zone_id_fk,0,0,results[i].quantity,1,''];
    db.insertData(tableOff, fieldOff, dataOff, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'ການດຳເນີນງານເກີດຂໍຜິພາດ' });
        }
    });
}
}
})